from django.test import TestCase, Client
from django.contrib.auth.models import User
from core.models import (
    Employee, Location, Asset, Ticket, Repair, NetworkDevice, 
    Rack, RackMount, PatchPanel, Port, CableLink, EquipmentLoan, KnowledgeArticle, LoanStatus
)
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


class DynamicRBACAndUserProvisioningTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.super_user = User.objects.create_superuser(
            username='superadmin', password='password123', email='superadmin@bikita.test'
        )
        self.student_user = User.objects.create_user(
            username='student1', password='password123', email='student1@bikita.test'
        )
        Employee.objects.create(
            user=self.student_user, name='Test Student', email='student1@bikita.test', role='STUDENT'
        )

        # Login superadmin
        resp = self.client.post(
            '/api/auth/login',
            json.dumps({'username': 'superadmin', 'password': 'password123'}),
            content_type='application/json'
        )
        self.super_token = resp.json()['access_token']

        # Login student
        resp2 = self.client.post(
            '/api/auth/login',
            json.dumps({'username': 'student1', 'password': 'password123'}),
            content_type='application/json'
        )
        self.student_token = resp2.json()['access_token']

    def test_super_admin_can_provision_user_with_role(self):
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.super_token}'
        payload = {
            'username': 'hod_cs',
            'email': 'hod.cs@bikita.test',
            'password': 'StrongPassword123!',
            'name': 'Dr. Tariro Mapfumo',
            'role': 'HOD',
            'department': 'Computer Science',
        }
        resp = self.client.post('/api/system/users', json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body['username'], 'hod_cs')
        self.assertEqual(body['role'], 'HOD')
        self.assertEqual(body['department'], 'Computer Science')
        self.assertTrue(User.objects.filter(username='hod_cs').exists())

    def test_student_cannot_provision_user(self):
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.student_token}'
        payload = {
            'username': 'attacker',
            'email': 'attacker@bikita.test',
            'password': 'Password123!',
            'name': 'Attacker',
            'role': 'SUPER_ADMIN',
        }
        resp = self.client.post('/api/system/users', json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 403)

    def test_get_and_update_permissions_matrix(self):
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.super_token}'
        resp = self.client.get('/api/system/permissions')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn('matrix', body)
        self.assertIn('roles', body)

        # Update a permission
        update_payload = {
            'permissions': [
                {
                    'role': 'STUDENT',
                    'module': 'tickets',
                    'can_read': True,
                    'can_write': True,
                    'can_delete': False,
                    'can_approve': False,
                }
            ]
        }
        update_resp = self.client.put('/api/system/permissions', json.dumps(update_payload), content_type='application/json')
        self.assertEqual(update_resp.status_code, 200)
        self.assertTrue(update_resp.json()['success'])


class PublicAnonymousTicketTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_anonymous_user_can_submit_and_track_ticket(self):
        # Public submit without auth
        payload = {
            'title': 'Projector flickering in Lab 3',
            'description': 'The HDMI projector display cuts out periodically.',
            'category': 'Hardware',
            'priority': 'High',
            'reporter_name': 'Kudzi Moyo',
            'reporter_email': 'kudzi.moyo@student.bikita.ac.zw',
            'reporter_phone': '+263 77 123 4567',
            'location_details': 'Block B, Lab 3',
        }
        resp = self.client.post('/api/tickets/public', json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        tracking_code = body['tracking_code']
        self.assertTrue(tracking_code.startswith('TIK-'))
        self.assertEqual(body['reporter_name'], 'Kudzi Moyo')
        self.assertEqual(body['status'], 'NEW')

        # Track ticket publicly
        track_resp = self.client.get(f'/api/tickets/track/{tracking_code}')
        self.assertEqual(track_resp.status_code, 200)
        track_body = track_resp.json()
        self.assertEqual(track_body['tracking_code'], tracking_code)
        self.assertEqual(track_body['title'], 'Projector flickering in Lab 3')

        # Add comment anonymously
        comment_payload = {
            'content': 'I also tested with a different HDMI cable and the issue persists.',
            'reporter_name': 'Kudzi Moyo'
        }
        comment_resp = self.client.post(
            f'/api/tickets/track/{tracking_code}/comments',
            json.dumps(comment_payload),
            content_type='application/json'
        )
        self.assertEqual(comment_resp.status_code, 200)

        # Re-query track to see public comment
        retrack_resp = self.client.get(f'/api/tickets/{tracking_code}') if False else self.client.get(f'/api/tickets/track/{tracking_code}')
        self.assertEqual(retrack_resp.status_code, 200)
        self.assertEqual(len(retrack_resp.json()['comments']), 1)
        self.assertIn('different HDMI cable', retrack_resp.json()['comments'][0]['content'])


class DatabaseBackupAndIntegrityTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.super_user = User.objects.create_superuser(
            username='admin_backup', password='password123', email='admin_backup@bikita.test'
        )
        resp = self.client.post(
            '/api/auth/login',
            json.dumps({'username': 'admin_backup', 'password': 'password123'}),
            content_type='application/json'
        )
        self.token = resp.json()['access_token']
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.token}'

    def test_database_status_and_integrity_check(self):
        resp = self.client.get('/api/system/database/status')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body['is_healthy'])
        self.assertGreater(body['total_tables'], 0)
        self.assertEqual(len(body['errors']), 0)

    def test_create_and_list_backup_snapshots(self):
        # Create backup
        create_resp = self.client.post(
            '/api/system/database/backups',
            json.dumps({'trigger_reason': 'test_snapshot'}),
            content_type='application/json'
        )
        self.assertEqual(create_resp.status_code, 200)
        body = create_resp.json()
        self.assertIn('filename', body)
        self.assertIn('checksum_sha256', body)
        self.assertEqual(body['trigger_reason'], 'test_snapshot')

        # List backups
        list_resp = self.client.get('/api/system/database/backups')
        self.assertEqual(list_resp.status_code, 200)
        backups = list_resp.json()
        self.assertIsInstance(backups, list)
        self.assertTrue(any(b['filename'] == body['filename'] for b in backups))

    def test_get_system_version(self):
        resp = self.client.get('/api/system/version')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn('version', body)
        self.assertIn('git_commit', body)
        self.assertIn('build_timestamp', body)
        self.assertEqual(body['version'], '0.3.3')


class NetworkScannerAndHealthPollingTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.super_user = User.objects.create_superuser(
            username='net_admin', password='password123', email='net_admin@bikita.test'
        )
        resp = self.client.post(
            '/api/auth/login',
            json.dumps({'username': 'net_admin', 'password': 'password123'}),
            content_type='application/json'
        )
        self.token = resp.json()['access_token']
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.token}'

    def test_subnet_scan_trigger_and_status_tracking(self):
        # Trigger scan on loopback CIDR
        scan_resp = self.client.post(
            '/api/devices/discovery/scan',
            json.dumps({'subnet': '127.0.0.1/32'}),
            content_type='application/json'
        )
        self.assertEqual(scan_resp.status_code, 200)
        body = scan_resp.json()
        self.assertIn('job_id', body)
        job_id = body['job_id']

        # Query job progress
        status_resp = self.client.get(f'/api/devices/discovery/status?job_id={job_id}')
        self.assertEqual(status_resp.status_code, 200)
        status_body = status_resp.json()
        self.assertEqual(status_body['job_id'], job_id)
        self.assertIn('progress_percent', status_body)

    def test_staged_device_promotion_to_hardware_asset(self):
        # Create staged discovery device
        staged_dev = NetworkDevice.objects.create(
            ip_address="192.168.10.45",
            mac_address="00:1A:A0:55:66:77",
            hostname="sw-core-01",
            vendor="Dell Inc.",
            device_type="SWITCH",
            is_staged=True,
            status="ONLINE"
        )
        self.assertTrue(staged_dev.is_staged)
        self.assertIsNone(staged_dev.mapped_asset)

        # Promote device to Asset
        promote_payload = {
            "asset_category": "Network Switch",
            "asset_name": "Main Building Core Switch",
            "asset_tag": "AST-SW-0045"
        }
        promote_resp = self.client.post(
            f'/api/devices/discovery/promote/{staged_dev.id}',
            json.dumps(promote_payload),
            content_type='application/json'
        )
        self.assertEqual(promote_resp.status_code, 200)
        
        # Verify device is now managed
        staged_dev.refresh_from_db()
        self.assertFalse(staged_dev.is_staged)
        self.assertIsNotNone(staged_dev.mapped_asset)
        self.assertEqual(staged_dev.mapped_asset.asset_tag, "AST-SW-0045")
        self.assertEqual(staged_dev.mapped_asset.name, "Main Building Core Switch")
        self.assertEqual(staged_dev.mapped_asset.ip_address, "192.168.10.45")

    def test_health_polling_outage_ticket_automation(self):
        # Create an active managed switch pointing to an unreachable IP
        unreachable_switch = NetworkDevice.objects.create(
            ip_address="198.51.100.99",
            mac_address="00:00:0C:99:88:77",
            hostname="unreachable-core-router",
            vendor="Cisco Systems",
            device_type="ROUTER",
            is_staged=False,
            status="ONLINE",
            consecutive_failures=2, # Next failed poll will be the 3rd strike
            monitoring_enabled=True,
        )

        poll_resp = self.client.post('/api/devices/poll-now')
        self.assertEqual(poll_resp.status_code, 200)
        body = poll_resp.json()
        self.assertTrue(body['success'])

        unreachable_switch.refresh_from_db()
        self.assertEqual(unreachable_switch.consecutive_failures, 3)
        self.assertEqual(unreachable_switch.status, "OFFLINE")

        # Verify automated outage ticket was created in Helpdesk
        outage_ticket = Ticket.objects.filter(title__contains="unreachable-core-router").first()
        self.assertIsNotNone(outage_ticket)
        self.assertEqual(outage_ticket.priority, "CRITICAL")
        self.assertEqual(outage_ticket.category, "NETWORK")
        self.assertEqual(outage_ticket.status, "NEW")

    def test_rack_creation_and_elevation_mapping(self):
        loc = Location.objects.create(name="Primary Datacenter", type="SERVER_ROOM")
        
        # 1. Create Rack
        rack_resp = self.client.post(
            '/api/racks',
            data=json.dumps({
                "location_id": loc.id,
                "name": "RACK-DC1-01",
                "total_u": 42,
                "max_power_watts": 5000,
                "max_weight_kg": 800.0,
                "status": "ONLINE"
            }),
            content_type='application/json'
        )
        self.assertEqual(rack_resp.status_code, 200)
        rack_id = rack_resp.json()["id"]

        # 2. Mount 2U Server at U38 (occupies U38, U39)
        mount_resp = self.client.post(
            f'/api/racks/{rack_id}/mount',
            data=json.dumps({
                "name": "Dell PowerEdge R750",
                "start_u": 38,
                "u_height": 2,
                "orientation": "FRONT",
                "power_draw_watts": 450
            }),
            content_type='application/json'
        )
        self.assertEqual(mount_resp.status_code, 200)

        # 3. Get Elevation
        elev_resp = self.client.get(f'/api/racks/{rack_id}/elevation')
        self.assertEqual(elev_resp.status_code, 200)
        elev_data = elev_resp.json()
        self.assertEqual(elev_data["rack"]["occupied_u"], 2)
        self.assertEqual(elev_data["rack"]["total_power_draw_watts"], 450)
        self.assertEqual(len(elev_data["slots"]), 42)

    def test_rack_mount_collision_prevention(self):
        loc = Location.objects.create(name="Secondary DC", type="SERVER_ROOM")
        rack = Rack.objects.create(location=loc, name="RACK-DC2-01", total_u=42)
        
        # Mount switch at U40 (1U)
        self.client.post(
            f'/api/racks/{rack.id}/mount',
            data=json.dumps({
                "name": "Cisco 9300 Switch",
                "start_u": 40,
                "u_height": 1,
                "power_draw_watts": 200
            }),
            content_type='application/json'
        )

        # Try to mount 2U server at U39 (overlaps with U40: occupies U39, U40) -> Should fail 400
        overlap_resp = self.client.post(
            f'/api/racks/{rack.id}/mount',
            data=json.dumps({
                "name": "Conflicting Server",
                "start_u": 39,
                "u_height": 2,
                "power_draw_watts": 400
            }),
            content_type='application/json'
        )
        self.assertEqual(overlap_resp.status_code, 400)
        self.assertIn("Collision detected", overlap_resp.json()["detail"])

    def test_port_cable_linking_and_telemetry(self):
        loc = Location.objects.create(name="Patch Room", type="SERVER_ROOM")
        rack = Rack.objects.create(location=loc, name="RACK-PATCH-01", total_u=42)
        
        # Create patch panel (generates 24 ports)
        panel_resp = self.client.post(
            f'/api/racks/{rack.id}/patch-panels',
            data=json.dumps({
                "name": "PP-Cat6A-01",
                "start_u": 42,
                "total_ports": 24,
                "category": "Cat6A"
            }),
            content_type='application/json'
        )
        self.assertEqual(panel_resp.status_code, 200)

        # Retrieve ports
        ports_resp = self.client.get(f'/api/racks/{rack.id}/ports')
        self.assertEqual(ports_resp.status_code, 200)
        panels = ports_resp.json()["patch_panels"]
        self.assertEqual(len(panels), 1)
        self.assertEqual(len(panels[0]["ports"]), 24)

        port_1 = panels[0]["ports"][0]
        port_2 = panels[0]["ports"][1]

        # Link Port 1 to Port 2
        link_resp = self.client.post(
            '/api/racks/cables/link',
            data=json.dumps({
                "source_port_id": port_1["id"],
                "target_port_id": port_2["id"],
                "cable_type": "COPPER",
                "color": "BLUE",
                "length_meters": 1.5
            }),
            content_type='application/json'
        )
        self.assertEqual(link_resp.status_code, 200)
        link_id = link_resp.json()["id"]

        # Unlink cable
        unlink_resp = self.client.delete(f'/api/racks/cables/unlink/{link_id}')
        self.assertEqual(unlink_resp.status_code, 200)

    def test_location_tree_route_resolution(self):
        """Verify /api/locations/tree does not get caught by /api/locations/{location_id} with 422."""
        root = Location.objects.create(name="Campus HQ", type="BUILDING")
        child = Location.objects.create(name="Lab 101", type="ROOM", parent=root)
        
        resp = self.client.get('/api/locations/tree')
        self.assertEqual(resp.status_code, 200)
        tree = resp.json()
        self.assertIsInstance(tree, list)
        self.assertGreaterEqual(len(tree), 1)
        root_node = next((n for n in tree if n["name"] == "Campus HQ"), None)
        self.assertIsNotNone(root_node)
        self.assertEqual(len(root_node["children"]), 1)
        self.assertEqual(root_node["children"][0]["name"], "Lab 101")


class OperationsAndTaskAutomationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.super_user = User.objects.create_superuser(
            username='admin_ops', password='password123', email='admin_ops@bikita.test'
        )
        resp = self.client.post(
            '/api/auth/login',
            json.dumps({'username': 'admin_ops', 'password': 'password123'}),
            content_type='application/json'
        )
        self.token = resp.json()['access_token']
        self.auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}

        self.loc = Location.objects.create(name="HQ DataCenter", type="BUILDING")
        self.emp = Employee.objects.create(name="Tinashe Chirwa", email="tinashe@bikita.ac.zw")
        self.asset_1 = Asset.objects.create(name="Latitude 7420", serial_number="LAT-001", status="ACTIVE")
        self.asset_2 = Asset.objects.create(name="ThinkPad T14", serial_number="TP-002", status="ACTIVE")

    def test_operations_presets(self):
        resp = self.client.get('/api/operations/presets', **self.auth_headers)
        self.assertEqual(resp.status_code, 200)
        presets = resp.json()
        self.assertTrue(len(presets) >= 4)
        preset_ids = [p['id'] for p in presets]
        self.assertIn("BULK_REASSIGN_ASSETS", preset_ids)
        self.assertIn("DIAGNOSTIC_SWEEP", preset_ids)

    def test_sync_bulk_reassign_assets(self):
        payload = {
            "operation_type": "BULK_REASSIGN_ASSETS",
            "target_ids": [self.asset_1.id, self.asset_2.id],
            "params": {
                "assignee_id": self.emp.id,
                "notes": "Assigned for remote field operations"
            },
            "is_async": False
        }
        resp = self.client.post('/api/operations/execute', json.dumps(payload), content_type='application/json', **self.auth_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['result']['updated_count'], 2)

        self.asset_1.refresh_from_db()
        self.asset_2.refresh_from_db()
        self.assertEqual(self.asset_1.assigned_to_id, self.emp.id)
        self.assertEqual(self.asset_2.assigned_to_id, self.emp.id)

    def test_sync_bulk_status_change(self):
        payload = {
            "operation_type": "BULK_STATUS_CHANGE",
            "target_ids": [self.asset_1.id, self.asset_2.id],
            "params": {
                "status": "IN_REPAIR",
                "reason": "Scheduled battery recall"
            },
            "is_async": False
        }
        resp = self.client.post('/api/operations/execute', json.dumps(payload), content_type='application/json', **self.auth_headers)
        self.assertEqual(resp.status_code, 200)

        self.asset_1.refresh_from_db()
        self.assertEqual(self.asset_1.status, "IN_REPAIR")

    def test_async_job_execution_and_polling(self):
        payload = {
            "operation_type": "DIAGNOSTIC_SWEEP",
            "target_ids": [],
            "params": {},
            "is_async": True
        }
        resp = self.client.post('/api/operations/execute', json.dumps(payload), content_type='application/json', **self.auth_headers)
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body['is_async'])
        job_id = body['job_id']
        self.assertTrue(job_id.startswith('op-'))

        # Poll job status
        poll_resp = self.client.get(f'/api/operations/jobs/{job_id}', **self.auth_headers)
        self.assertEqual(poll_resp.status_code, 200)
        job_body = poll_resp.json()
        self.assertEqual(job_body['job_id'], job_id)
        self.assertIn(job_body['status'], ['RUNNING', 'COMPLETED'])


class EnterpriseSettingsSuiteTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.super_user = User.objects.create_superuser(
            username='admin_settings', password='password123', email='admin_settings@bikita.test'
        )
        resp = self.client.post(
            '/api/auth/login',
            json.dumps({'username': 'admin_settings', 'password': 'password123'}),
            content_type='application/json'
        )
        self.token = resp.json()['access_token']
        self.auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}

    def test_session_listing_and_revocation(self):
        # List active sessions
        sess_resp = self.client.get('/api/system/sessions', **self.auth_headers)
        self.assertEqual(sess_resp.status_code, 200)
        sessions = sess_resp.json()
        self.assertTrue(len(sessions) >= 1)
        sess_id = sessions[0]['session_id']

        # Revoke session
        revoke_resp = self.client.post(f'/api/system/sessions/{sess_id}/revoke', **self.auth_headers)
        self.assertEqual(revoke_resp.status_code, 200)
        self.assertTrue(revoke_resp.json()['success'])

    def test_taxonomies_persistence(self):
        # Get default taxonomies
        tax_resp = self.client.get('/api/system/taxonomies', **self.auth_headers)
        self.assertEqual(tax_resp.status_code, 200)
        data = tax_resp.json()
        self.assertIn('Laptops', data['categories'])

        # Update taxonomies
        updated_cats = data['categories'] + ['Drones & UAVs']
        patch_resp = self.client.patch(
            '/api/system/taxonomies',
            json.dumps({'categories': updated_cats}),
            content_type='application/json',
            **self.auth_headers
        )
        self.assertEqual(patch_resp.status_code, 200)
        self.assertIn('Drones & UAVs', patch_resp.json()['categories'])

    def test_notification_probes(self):
        # Email probe
        email_payload = {
            "smtp_server": "127.0.0.1",
            "smtp_port": 25,
            "sender_email": "alerts@bikita.ac.zw",
            "recipient_email": "admin@bikita.ac.zw",
            "use_tls": False
        }
        email_resp = self.client.post(
            '/api/settings/notifications/test-email',
            json.dumps(email_payload),
            content_type='application/json',
            **self.auth_headers
        )
        self.assertEqual(email_resp.status_code, 200)
        res = email_resp.json()
        self.assertIn("latency_ms", res)
        self.assertIn("diagnostic_logs", res)


class PortalSuiteTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.technician_user = User.objects.create_superuser(
            username='tech_portal', password='password123', email='tech_portal@bikita.test'
        )
        resp = self.client.post(
            '/api/auth/login',
            json.dumps({'username': 'tech_portal', 'password': 'password123'}),
            content_type='application/json'
        )
        self.token = resp.json()['access_token']
        self.auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}

    def test_equipment_loan_workflow(self):
        # 1. Check available equipment
        avail_resp = self.client.get('/api/portal/loans/available-equipment')
        self.assertEqual(avail_resp.status_code, 200)
        categories = avail_resp.json()
        self.assertTrue(len(categories) >= 1)

        # 2. Submit a loan request (Public)
        loan_payload = {
            "requester_name": "Tariro Mapfumo",
            "requester_email": "tmapfumo@institution.ac.zw",
            "requester_id": "R214982A",
            "requester_phone": "+263771234567",
            "department": "Computer Science",
            "purpose": "Final year AI machine learning project experiments",
            "equipment_category": "Laptops & Mobile Workstations",
            "expected_return_date": "2026-08-25T12:00:00Z"
        }
        submit_resp = self.client.post(
            '/api/portal/loans/request',
            json.dumps(loan_payload),
            content_type='application/json'
        )
        self.assertEqual(submit_resp.status_code, 200)
        loan_data = submit_resp.json()
        tracking_code = loan_data['tracking_code']
        loan_id = loan_data['id']
        self.assertTrue(tracking_code.startswith("LOAN-"))
        self.assertEqual(loan_data['status'], "PENDING_APPROVAL")

        # 3. Track loan publicly
        track_resp = self.client.get(f'/api/portal/loans/track/{tracking_code}')
        self.assertEqual(track_resp.status_code, 200)
        self.assertEqual(track_resp.json()['tracking_code'], tracking_code)

        # 4. Technician approves loan
        status_resp = self.client.post(
            f'/api/portal/loans/{loan_id}/status',
            json.dumps({
                "status": "APPROVED",
                "technician_notes": "Ready for pickup at Main Library Desk A."
            }),
            content_type='application/json',
            **self.auth_headers
        )
        self.assertEqual(status_resp.status_code, 200)
        self.assertEqual(status_resp.json()['status'], "APPROVED")

    def test_diagnostics_ping_endpoint(self):
        resp = self.client.get('/api/portal/diagnostics/ping')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['server_status'], "ONLINE")
        self.assertIn("db_latency_ms", data)
        self.assertTrue(len(data['active_services']) >= 1)

    def test_knowledge_base_search_and_suggester(self):
        # Create knowledge articles
        KnowledgeArticle.objects.create(
            title="How to Connect to Eduroam Campus Wi-Fi",
            content="Use your institutional credentials (username@institution.ac.zw) and download the certificate profile.",
            tags=["wifi", "eduroam", "network"]
        )
        KnowledgeArticle.objects.create(
            title="Lab Printing & Quota Reset",
            content="Send print jobs to print.campus.ac.zw and scan your student ID card at the nearest printer.",
            tags=["printer", "quota", "paper"]
        )

        # Search knowledge base
        search_resp = self.client.get('/api/portal/knowledge/search?q=eduroam')
        self.assertEqual(search_resp.status_code, 200)
        articles = search_resp.json()
        self.assertTrue(len(articles) >= 1)
        self.assertIn("Eduroam", articles[0]['title'])

        # Suggest knowledge based on issue description
        suggest_resp = self.client.get('/api/portal/knowledge/suggest?title=Cannot+connect+to+wifi&desc=Eduroam+fails')
        self.assertEqual(suggest_resp.status_code, 200)
        suggestions = suggest_resp.json()
        self.assertTrue(len(suggestions) >= 1)
        self.assertIn("Wi-Fi", suggestions[0]['title'])


class NOCAndTopologySuiteTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.super_user = User.objects.create_superuser(
            username='admin_noc', password='password123', email='admin_noc@bikita.test'
        )
        resp = self.client.post(
            '/api/auth/login',
            json.dumps({'username': 'admin_noc', 'password': 'password123'}),
            content_type='application/json'
        )
        self.token = resp.json()['access_token']
        self.auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}

        # Create topology hierarchy
        self.router_dev = NetworkDevice.objects.create(
            ip_address="192.168.1.1",
            mac_address="00:00:0C:01:02:03",
            hostname="gw-core-01",
            vendor="Cisco Systems",
            device_type="ROUTER",
            status="ONLINE",
            latency_ms=1.2,
            is_staged=False,
        )
        self.switch_dev = NetworkDevice.objects.create(
            ip_address="192.168.1.2",
            mac_address="24:A4:3C:11:22:33",
            hostname="sw-dist-01",
            vendor="Ubiquiti Inc.",
            device_type="SWITCH",
            status="ONLINE",
            latency_ms=2.5,
            is_staged=False,
        )
        self.server_dev = NetworkDevice.objects.create(
            ip_address="192.168.1.50",
            mac_address="00:1A:A0:44:55:66",
            hostname="srv-datacenter-01",
            vendor="Dell Inc.",
            device_type="SERVER",
            status="ONLINE",
            latency_ms=1.8,
            is_staged=False,
        )
        self.rogue_dev = NetworkDevice.objects.create(
            ip_address="192.168.1.199",
            mac_address="AA:BB:CC:DD:EE:FF",
            hostname="unknown-host",
            vendor="Generic",
            device_type="GENERIC",
            status="ONLINE",
            latency_ms=14.2,
            is_staged=False,
            is_rogue=True,
            quarantined=False,
        )

    def test_topology_graph_generation(self):
        resp = self.client.get('/api/devices/topology', **self.auth_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data['total_nodes'] >= 4)
        self.assertEqual(data['gateway_node_id'], self.router_dev.id)
        
        # Verify node properties
        gw_node = next((n for n in data['nodes'] if n['id'] == self.router_dev.id), None)
        self.assertIsNotNone(gw_node)
        self.assertEqual(gw_node['cluster'], "GATEWAY")
        
        rogue_node = next((n for n in data['nodes'] if n['id'] == self.rogue_dev.id), None)
        self.assertIsNotNone(rogue_node)
        self.assertTrue(rogue_node['is_rogue'])

    def test_noc_summary_kpis(self):
        resp = self.client.get('/api/devices/noc/summary', **self.auth_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreaterEqual(data['total_managed'], 4)
        self.assertGreaterEqual(data['online_count'], 4)
        self.assertEqual(data['rogue_count'], 1)
        self.assertEqual(data['gateway_status'], "ONLINE")

    def test_single_device_probe(self):
        resp = self.client.post(f'/api/devices/{self.server_dev.id}/probe', **self.auth_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['id'], self.server_dev.id)
        self.assertIn("status", data)

    def test_rogue_quarantine_and_auto_ticket(self):
        # 1. Quarantine
        quar_resp = self.client.post(
            f'/api/devices/{self.rogue_dev.id}/quarantine',
            json.dumps({"reason": "Unrecognized MAC on switch port 8"}),
            content_type='application/json',
            **self.auth_headers
        )
        self.assertEqual(quar_resp.status_code, 200)
        self.assertTrue(quar_resp.json()['quarantined'])
        
        self.rogue_dev.refresh_from_db()
        self.assertTrue(self.rogue_dev.quarantined)

        # 2. Auto-ticket
        ticket_resp = self.client.post(
            f'/api/devices/{self.rogue_dev.id}/auto-ticket',
            json.dumps({"priority": "CRITICAL", "notes": "Port isolated."}),
            content_type='application/json',
            **self.auth_headers
        )
        self.assertEqual(ticket_resp.status_code, 200)
        ticket_id = ticket_resp.json()['ticket_id']
        
        ticket = Ticket.objects.get(id=ticket_id)
        self.assertEqual(ticket.priority, "CRITICAL")
        self.assertIn("SECURITY ALERT", ticket.title)








