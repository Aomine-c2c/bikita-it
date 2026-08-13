from django.test import TestCase, Client
from django.contrib.auth.models import User
from core.models import Employee, Location, Asset, Ticket, Repair
import json

class RepairTicketWorkflowTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='tech', password='pass123')
        self.location = Location.objects.create(name='HQ', type='Building')
        self.employee = Employee.objects.create(
            user=self.user,
            name='Tech User',
            email='tech@example.com',
            department='IT',
            role='TECHNICIAN',
            location=self.location
        )
        self.asset = Asset.objects.create(
            name='Laptop X1',
            category='Laptop',
            status='ACTIVE',
            make='Acme',
            model='X1',
            location=self.location
        )
        self.ticket = Ticket.objects.create(
            title='Screen broken',
            description='Cracked screen',
            status='Open',
            priority='High',
            category='Repair',
            requester_id='emp-1',
            requester_name='John Doe',
            asset_id=str(self.asset.id)
        )
        # Authenticate and set JWT token
        resp = self.client.post('/api/auth/login', json.dumps({'username': 'tech', 'password': 'pass123'}), content_type='application/json')
        token = resp.json()['access_token']
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'

    def test_repair_out_includes_asset_name_and_ticket_id(self):
        resp = self.client.get('/api/repairs')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(len(data) >= 0)  # list endpoint exists
        # After creating a repair, check schema fields
        repair = Repair.objects.create(
            asset=self.asset,
            repair_type='Screen Replacement',
            status='QUEUED',
            cost=150.00
        )
        resp = self.client.get(f'/api/repairs/{repair.id}')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn('asset_name', body)
        self.assertIn('ticket', body)

    def test_create_repair_from_ticket_endpoint(self):
        payload = {
            'repair_type': 'Screen Replacement',
            'status': 'QUEUED',
            'notes': 'Warranty claim',
            'cost': 150.00
        }
        resp = self.client.post(
            f'/api/tickets/{self.ticket.id}/create-repair',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body['asset'], self.asset.id)
        self.assertEqual(body['repair_type'], 'Screen Replacement')
        self.assertIsNotNone(body.get('ticket'))

    def test_link_repair_to_ticket_endpoint(self):
        repair = Repair.objects.create(
            asset=self.asset,
            repair_type='Battery',
            status='QUEUED'
        )
        payload = {'ticket_id': self.ticket.id}
        resp = self.client.post(
            f'/api/repairs/{repair.id}/link-ticket',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body['ticket'], self.ticket.id)

    def test_ticket_out_exposes_repair_ids(self):
        resp = self.client.get(f'/api/tickets/{self.ticket.id}')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn('repairIds', body)
        self.assertIsInstance(body['repairIds'], list)
