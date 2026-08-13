from django.test import TestCase, Client
from django.contrib.auth.models import User
from core.models import Employee, Location, Asset, Ticket, Repair
import json


class AuthTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_superuser(
            username='admin', password='admin123', email='admin@test.com'
        )

    def test_login_returns_token(self):
        resp = self.client.post(
            '/api/auth/login',
            json.dumps({'username': 'admin', 'password': 'admin123'}),
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn('access_token', body)
        self.assertIn('user', body)

    def test_login_wrong_password_returns_401(self):
        resp = self.client.post(
            '/api/auth/login',
            json.dumps({'username': 'admin', 'password': 'wrong'}),
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 401)

    def test_setup_check_returns_initialized(self):
        resp = self.client.get('/api/setup/check')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body.get('isSetupComplete'))


class SetupInitTests(TestCase):
    def test_setup_initialize(self):
        client = Client()
        payload = {
            "name": "Anesu Gono",
            "email": "admin@bikitaminerals.com",
            "password": "Password123!",
            "orgName": "Bikita Minerals"
        }
        resp = client.post(
            '/api/setup/initialize',
            json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json().get('success'))
        self.assertTrue(User.objects.filter(email="admin@bikitaminerals.com").exists())
        self.assertTrue(Employee.objects.filter(email="admin@bikitaminerals.com").exists())


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
        # Ticket uses requester FK (not string fields — removed in migration 0017)
        self.ticket = Ticket.objects.create(
            title='Screen broken',
            description='Cracked screen',
            status='OPEN',
            priority='High',
            category='Repair',
            requester=self.employee,
            asset_id=str(self.asset.id)
        )
        # Authenticate and get JWT token
        resp = self.client.post(
            '/api/auth/login',
            json.dumps({'username': 'tech', 'password': 'pass123'}),
            content_type='application/json'
        )
        token = resp.json().get('access_token', '')
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'

    def test_repair_list_endpoint_exists(self):
        resp = self.client.get('/api/repairs')
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.json(), list)

    def test_repair_out_includes_asset_name(self):
        repair = Repair.objects.create(
            asset=self.asset,
            repair_type='Screen Replacement',
            status='SCHEDULED',  # Valid RepairStatus choice
        )
        resp = self.client.get(f'/api/repairs/{repair.id}')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn('asset_name', body)
        self.assertIn('ticket', body)

    def test_create_repair_from_ticket_endpoint(self):
        payload = {
            'repair_type': 'Screen Replacement',
            'status': 'SCHEDULED',
            'notes': 'Warranty claim',
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

    def test_link_repair_to_ticket_endpoint(self):
        repair = Repair.objects.create(
            asset=self.asset,
            repair_type='Battery',
            status='SCHEDULED',
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
