import random
from django.core.management.base import BaseCommand
from core.models import (
    Location, Employee, Asset, NetworkDevice, Connection, 
    Ticket, GeneralStatus, TicketStatus
)
from faker import Faker

class Command(BaseCommand):
    help = 'Seeds the database with fake data for demonstration purposes.'

    def handle(self, *args, **options):
        fake = Faker()
        
        self.stdout.write(self.style.WARNING('Wiping existing data...'))
        
        # In SQLite/Postgres we can just delete from the bottom up, 
        # or rely on CASCADE where applicable.
        models_to_wipe = [
            Connection, Ticket, Asset, NetworkDevice, Employee, Location
        ]
        
        for model in models_to_wipe:
            # Bypass soft delete if it exists on the queryset
            qs = getattr(model, 'all_objects', model.objects).all()
            qs.delete() 

        self.stdout.write(self.style.SUCCESS('Data wiped. Generating new data...'))

        # 1. Locations
        locations = []
        for i in range(5):
            loc = Location.objects.create(
                name=f"{fake.city()} Branch",
                type="Building"
            )
            locations.append(loc)
        self.stdout.write(f'Created {len(locations)} Locations.')

        # 2. Employees
        departments = ['IT', 'HR', 'Engineering', 'Sales', 'Marketing', 'Finance']
        employees = []
        for i in range(20):
            emp = Employee.objects.create(
                name=f"{fake.first_name()} {fake.last_name()}",
                email=fake.unique.company_email(),
                department=random.choice(departments),
                location=random.choice(locations)
            )
            employees.append(emp)
        self.stdout.write(f'Created {len(employees)} Employees.')

        # 3. Assets
        categories = ['Laptop', 'Desktop', 'Monitor', 'Server', 'Printer']
        assets = []
        for i in range(50):
            cat = random.choice(categories)
            asset = Asset.objects.create(
                name=f"{cat}-{fake.bothify(text='???-####').upper()}",
                category=cat,
                assigned_to=random.choice(employees) if cat in ['Laptop', 'Desktop', 'Monitor'] else None,
                status=random.choice([GeneralStatus.ACTIVE, GeneralStatus.OFFLINE, GeneralStatus.MAINTENANCE]),
                location=random.choice(locations),
                ip_address=fake.ipv4_private() if cat in ['Laptop', 'Desktop', 'Server', 'Printer'] else None,
                mac_address=fake.mac_address().replace(':', '-') if cat in ['Laptop', 'Desktop', 'Server', 'Printer'] else None
            )
            assets.append(asset)
        self.stdout.write(f'Created {len(assets)} Assets.')

        # 4. Network Devices
        network_devices = []
        
        # Let's guarantee one core switch
        core_switch = NetworkDevice.objects.create(
            hostname="SW-CORE-01",
            ip_address="10.0.0.1",
            mac_address=fake.mac_address().replace(':', '-'),
            status=GeneralStatus.ACTIVE
        )
        network_devices.append(core_switch)

        for i in range(4):
            nd = NetworkDevice.objects.create(
                hostname=f"{random.choice(['SW', 'RT', 'FW', 'AP'])}-{fake.bothify(text='###')}",
                ip_address=fake.ipv4_private(),
                mac_address=fake.mac_address().replace(':', '-'),
                status=GeneralStatus.ACTIVE
            )
            network_devices.append(nd)
        self.stdout.write(f'Created {len(network_devices)} Network Devices.')

        # 5. Connections (Map some devices to the core switch)
        connected_assets = [a for a in assets if a.category in ['Server', 'Desktop', 'Printer']][:10]
        port_counter = 1
        for asset in connected_assets:
            # Create a network interface device for the asset
            asset_nic = NetworkDevice.objects.create(
                hostname=f"NIC-{asset.name}",
                ip_address=asset.ip_address,
                mac_address=asset.mac_address,
                status=asset.status,
                mapped_asset=asset
            )
            Connection.objects.create(
                source_device=core_switch,
                target_device=asset_nic,
                port=str(port_counter),
                speed="1 Gbps",
                status=GeneralStatus.ACTIVE
            )
            port_counter += 1

        # Also connect some actual network switches to the core switch
        for other_switch in network_devices[1:]:
            Connection.objects.create(
                source_device=core_switch,
                target_device=other_switch,
                port=str(port_counter),
                speed="10 Gbps",
                status=GeneralStatus.ACTIVE
            )
            port_counter += 1
            
        self.stdout.write(f'Created {port_counter - 1} Connections on SW-CORE-01.')

        # 6. Tickets
        for i in range(15):
            Ticket.objects.create(
                title=fake.sentence(nb_words=6),
                description=fake.paragraph(nb_sentences=3),
                status=random.choice([TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED]),
                requester=random.choice(employees)
            )
        self.stdout.write('Created 15 Tickets.')

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
