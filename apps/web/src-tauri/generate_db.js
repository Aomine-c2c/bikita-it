const fs = require('fs');

const content = `use rusqlite::{Connection, Result};
use std::sync::Mutex;
use std::path::PathBuf;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_dir: PathBuf) -> Result<Self> {
        std::fs::create_dir_all(&app_dir).ok();
        let db_path = app_dir.join("xiphos.db");
        let conn = Connection::open(db_path)?;
        let db = Database { conn: Mutex::new(conn) };
        db.migrate()?;
        Ok(db)
    }

    fn migrate(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch("
            PRAGMA journal_mode=WAL;

            CREATE TABLE IF NOT EXISTS settings (
                key   TEXT PRIMARY KEY NOT NULL,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS employees (
                id            TEXT PRIMARY KEY NOT NULL,
                name          TEXT NOT NULL,
                email         TEXT NOT NULL UNIQUE,
                password_hash TEXT,
                department    TEXT,
                position      TEXT,
                role          TEXT NOT NULL DEFAULT 'EMPLOYEE',
                created_at    TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS locations (
                id        TEXT PRIMARY KEY NOT NULL,
                name      TEXT NOT NULL,
                type      TEXT NOT NULL,
                parent_id TEXT REFERENCES locations(id),
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS hardware_assets (
                id              TEXT PRIMARY KEY NOT NULL,
                tag             TEXT NOT NULL UNIQUE,
                name            TEXT,
                category        TEXT NOT NULL,
                status          TEXT NOT NULL DEFAULT 'IN_STOCK',
                make            TEXT NOT NULL DEFAULT '',
                model           TEXT NOT NULL DEFAULT '',
                serial_number   TEXT UNIQUE,
                mac_address     TEXT,
                ip_address      TEXT,
                specs           TEXT,
                location_id     TEXT REFERENCES locations(id),
                assignee_id     TEXT REFERENCES employees(id),
                created_at      TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS inventory_items (
                id          TEXT PRIMARY KEY NOT NULL,
                sku         TEXT NOT NULL UNIQUE,
                name        TEXT NOT NULL,
                category    TEXT NOT NULL,
                quantity    INTEGER NOT NULL DEFAULT 0,
                min_stock   INTEGER NOT NULL DEFAULT 0,
                max_stock   INTEGER NOT NULL DEFAULT 0,
                bin_location TEXT,
                created_at  TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS repairs (
                id          TEXT PRIMARY KEY NOT NULL,
                description TEXT NOT NULL,
                status      TEXT NOT NULL DEFAULT 'QUEUED',
                condition   TEXT,
                remarks     TEXT,
                hardware_id TEXT NOT NULL REFERENCES hardware_assets(id),
                technician_id TEXT REFERENCES employees(id),
                created_at  TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS connected_devices (
                id                TEXT PRIMARY KEY NOT NULL,
                hostname          TEXT NOT NULL,
                mac_address       TEXT NOT NULL UNIQUE,
                ip_address        TEXT NOT NULL,
                os                TEXT,
                device_type       TEXT,
                connection_status TEXT DEFAULT 'CONNECTED',
                employee_id       TEXT REFERENCES employees(id),
                last_seen         TEXT NOT NULL DEFAULT (datetime('now')),
                created_at        TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS network_services (
                id         TEXT PRIMARY KEY NOT NULL,
                name       TEXT NOT NULL UNIQUE,
                status     TEXT NOT NULL DEFAULT 'online',
                uptime     TEXT,
                latency    TEXT,
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS stock_transactions (
                id                TEXT PRIMARY KEY NOT NULL,
                type              TEXT NOT NULL,
                quantity          INTEGER NOT NULL DEFAULT 1,
                notes             TEXT,
                hardware_asset_id TEXT REFERENCES hardware_assets(id),
                inventory_item_id TEXT REFERENCES inventory_items(id),
                location_id       TEXT REFERENCES locations(id),
                assignee_id       TEXT REFERENCES employees(id),
                created_at        TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT NOT NULL,
                author_id TEXT REFERENCES employees(id),
                tags TEXT,
                related_entity_type TEXT,
                related_entity_id TEXT,
                version TEXT NOT NULL DEFAULT '1.0',
                status TEXT NOT NULL DEFAULT 'DRAFT',
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS helpdesk_tickets (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'OPEN',
                priority TEXT NOT NULL DEFAULT 'MEDIUM',
                category TEXT NOT NULL,
                reporter_id TEXT REFERENCES employees(id),
                assignee_id TEXT REFERENCES employees(id),
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS software_licenses (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                vendor TEXT NOT NULL,
                license_type TEXT NOT NULL,
                seats_total INTEGER NOT NULL DEFAULT 1,
                seats_used INTEGER NOT NULL DEFAULT 0,
                expiry_date TEXT,
                status TEXT NOT NULL DEFAULT 'ACTIVE',
                cost TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS asset_assignments (
                id TEXT PRIMARY KEY NOT NULL,
                asset_id TEXT NOT NULL REFERENCES hardware_assets(id),
                employee_id TEXT NOT NULL REFERENCES employees(id),
                assignment_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'ACTIVE',
                issued_at TEXT NOT NULL DEFAULT (datetime('now')),
                returned_at TEXT,
                notes TEXT
            );

            CREATE TABLE IF NOT EXISTS asset_installations (
                id TEXT PRIMARY KEY NOT NULL,
                asset_id TEXT NOT NULL REFERENCES hardware_assets(id),
                location_id TEXT NOT NULL REFERENCES locations(id),
                technician_id TEXT REFERENCES employees(id),
                status TEXT NOT NULL DEFAULT 'INSTALLED',
                installed_at TEXT NOT NULL DEFAULT (datetime('now')),
                notes TEXT,
                photos TEXT
            );

            CREATE TABLE IF NOT EXISTS timeline_events (
                id TEXT PRIMARY KEY NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                description TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            -- Triggers for ASSET ASSIGNMENTS
            CREATE TRIGGER IF NOT EXISTS assignment_insert_trigger
            AFTER INSERT ON asset_assignments
            BEGIN
              INSERT INTO timeline_events (id, entity_type, entity_id, event_type, description)
              VALUES (lower(hex(randomblob(16))), 'ASSIGNMENT', NEW.asset_id, 'ISSUED', 'Asset issued to employee: ' || NEW.employee_id);
            END;

            CREATE TRIGGER IF NOT EXISTS assignment_update_trigger
            AFTER UPDATE ON asset_assignments
            BEGIN
              INSERT INTO timeline_events (id, entity_type, entity_id, event_type, description)
              VALUES (lower(hex(randomblob(16))), 'ASSIGNMENT', NEW.asset_id, 'RETURNED', 'Asset returned by employee: ' || NEW.employee_id);
            END;

            -- Triggers for ASSET INSTALLATIONS
            CREATE TRIGGER IF NOT EXISTS installation_insert_trigger
            AFTER INSERT ON asset_installations
            BEGIN
              INSERT INTO timeline_events (id, entity_type, entity_id, event_type, description)
              VALUES (lower(hex(randomblob(16))), 'INSTALLATION', NEW.asset_id, 'INSTALLED', 'Asset installed at location: ' || NEW.location_id);
            END;

            CREATE TRIGGER IF NOT EXISTS installation_update_trigger
            AFTER UPDATE ON asset_installations
            BEGIN
              INSERT INTO timeline_events (id, entity_type, entity_id, event_type, description)
              VALUES (lower(hex(randomblob(16))), 'INSTALLATION', NEW.asset_id, 'UPDATED', 'Asset installation status updated to: ' || NEW.status);
            END;

            -- DATA SEEDING
            INSERT OR IGNORE INTO settings (key, value) VALUES ('setup_complete', 'true');

            -- EMPLOYEES
            INSERT OR IGNORE INTO employees (id, name, email, department, position, role)
            VALUES 
                ('emp-001', 'Devine Mutimbire', 'devine.general@bikitaminerals.com', 'Management', 'General Manager', 'ADMIN'),
                ('emp-002', 'Tawanda Ndlovu', 'tawanda.n@bikitaminerals.com', 'IT', 'Lead Network Engineer', 'ADMIN'),
                ('emp-003', 'Grace Shiri', 'grace.s@bikitaminerals.com', 'Finance', 'Finance Manager', 'EMPLOYEE'),
                ('emp-004', 'Tanaka Moyo', 'tanaka.m@bikitaminerals.com', 'Engineering', 'Mining Engineer', 'EMPLOYEE'),
                ('emp-005', 'Farai Chigora', 'farai.c@bikitaminerals.com', 'Logistics', 'Logistics Coordinator', 'EMPLOYEE');

            -- LOCATIONS
            INSERT OR IGNORE INTO locations (id, name, type)
            VALUES 
                ('loc-hq-001', 'HQ Server Room', 'SERVER_ROOM'),
                ('loc-hq-002', 'HQ Admin Building', 'OFFICE'),
                ('loc-mine-001', 'Main Crusher Control Room', 'FIELD_OFFICE'),
                ('loc-mine-002', 'Open Pit Zone A', 'FIELD_SITE'),
                ('loc-log-001', 'Logistics Warehouse', 'WAREHOUSE');

            -- HARDWARE ASSETS
            INSERT OR IGNORE INTO hardware_assets (id, tag, name, category, status, make, model, serial_number, mac_address, ip_address, location_id, assignee_id)
            VALUES
                ('hw-net-001', 'BM-NET-HQ-01', 'Core Switch', 'NETWORK', 'INSTALLED', 'Cisco', 'Catalyst 9300', 'FDO2345KJL', '00:1A:2B:3C:4D:5E', '192.168.1.1', 'loc-hq-001', NULL),
                ('hw-net-002', 'BM-NET-CR-01', 'Field Switch', 'NETWORK', 'INSTALLED', 'Cisco', 'Catalyst 9200L', 'FDO2346KJL', '00:1A:2B:3C:4D:5F', '192.168.10.1', 'loc-mine-001', NULL),
                ('hw-srv-001', 'BM-SRV-01', 'Primary Domain Controller', 'SERVER', 'INSTALLED', 'Dell', 'PowerEdge R740', 'DL349JF', 'F8:B1:56:D9:A2:10', '192.168.1.10', 'loc-hq-001', NULL),
                ('hw-lap-001', 'BM-LAP-001', 'Engineering Laptop', 'LAPTOP', 'IN_USE', 'Dell', 'Latitude 5520', 'DL998AB', 'F8:B1:56:D9:AA:BB', '192.168.2.15', NULL, 'emp-004'),
                ('hw-lap-002', 'BM-LAP-002', 'Management Laptop', 'LAPTOP', 'IN_USE', 'Apple', 'MacBook Pro 14', 'C02HG8QXYZ', '3C:22:FB:4A:9C:12', '192.168.2.10', NULL, 'emp-001'),
                ('hw-sca-001', 'BM-SCA-01', 'Crusher Control Terminal', 'WORKSTATION', 'INSTALLED', 'HP', 'Z2 Mini G9', 'HP987XYZ', '14:B3:1F:02:44:A1', '192.168.10.100', 'loc-mine-001', NULL);

            -- INVENTORY
            INSERT OR IGNORE INTO inventory_items (id, sku, name, category, quantity, min_stock, max_stock, bin_location)
            VALUES
                ('inv-001', 'CAB-CAT6-10M', 'Cat6 Ethernet Cable (10m)', 'CABLES', 45, 10, 100, 'Bin A1'),
                ('inv-002', 'CAB-FIB-LC-5M', 'LC-LC Fiber Patch Cable (5m)', 'CABLES', 12, 5, 50, 'Bin A2'),
                ('inv-003', 'SFP-10G-SR', '10GBASE-SR SFP+ Module', 'NETWORK_PARTS', 4, 5, 20, 'Safe 1'),
                ('inv-004', 'PER-MOUSE-WL', 'Wireless Mouse', 'PERIPHERALS', 15, 10, 50, 'Bin C3'),
                ('inv-005', 'IT-THERMAL', 'Thermal Paste (4g)', 'CONSUMABLES', 8, 2, 10, 'Bin D1');

            -- REPAIRS
            INSERT OR IGNORE INTO repairs (id, description, status, condition, remarks, hardware_id, technician_id)
            VALUES
                ('rep-001', 'Replace failing fan in Core Switch', 'QUEUED', 'Poor', 'Fan 2 reporting 1500 RPM (below threshold)', 'hw-net-001', 'emp-002'),
                ('rep-002', 'Screen flickering on Engineering Laptop', 'IN_PROGRESS', 'Fair', 'Waiting for replacement LCD panel to arrive from supplier', 'hw-lap-001', 'emp-002'),
                ('rep-003', 'Dust cleaning for Crusher Terminal', 'COMPLETED', 'Good', 'Cleaned internal dust, replaced thermal paste, temps down 15C', 'hw-sca-001', 'emp-002');

            -- CONNECTED DEVICES
            INSERT OR IGNORE INTO connected_devices (id, hostname, mac_address, ip_address, os, device_type, connection_status, employee_id)
            VALUES
                ('dev-001', 'BM-LAP-001', 'F8:B1:56:D9:AA:BB', '192.168.2.15', 'Windows 10', 'Laptop', 'CONNECTED', 'emp-004'),
                ('dev-002', 'BM-LAP-002', '3C:22:FB:4A:9C:12', '192.168.2.10', 'macOS 14', 'Laptop', 'CONNECTED', 'emp-001'),
                ('dev-003', 'Devine-iPhone', 'AA:BB:CC:DD:EE:FF', '192.168.2.101', 'iOS 17', 'Mobile', 'DISCONNECTED', 'emp-001');

            -- HELPDESK TICKETS
            INSERT OR IGNORE INTO helpdesk_tickets (id, title, description, status, priority, category, reporter_id, assignee_id, created_at)
            VALUES
                ('tkt-001', 'VPN Access for new contractors', 'Need VPN access configured for 3 new mining contractors starting next week.', 'OPEN', 'HIGH', 'ACCESS', 'emp-004', 'emp-002', datetime('now', '-1 days')),
                ('tkt-002', 'SCADA interface latency', 'Crusher control interface is taking >5s to respond to commands.', 'IN_PROGRESS', 'CRITICAL', 'NETWORK', 'emp-004', 'emp-002', datetime('now', '-4 hours')),
                ('tkt-003', 'Email configuration on mobile', 'Cannot access company email on my new iPhone.', 'RESOLVED', 'LOW', 'SOFTWARE', 'emp-001', 'emp-002', datetime('now', '-2 days'));

            -- SOFTWARE LICENSES
            INSERT OR IGNORE INTO software_licenses (id, name, vendor, license_type, seats_total, seats_used, expiry_date, status, cost)
            VALUES
                ('lic-001', 'Microsoft 365 E3', 'Microsoft', 'SUBSCRIPTION', 150, 142, '2027-01-01', 'ACTIVE', '$32/user/mo'),
                ('lic-002', 'AutoCAD 2024', 'Autodesk', 'PERPETUAL', 10, 8, NULL, 'ACTIVE', '$1800/seat'),
                ('lic-003', 'PRTG Network Monitor', 'Paessler', 'SUBSCRIPTION', 500, 320, '2026-11-15', 'ACTIVE', '$1600/yr');

            -- DOCUMENTS
            INSERT OR IGNORE INTO documents (id, title, content, category, author_id, tags, related_entity_type, related_entity_id, version, status)
            VALUES 
                ('doc-001', 'IT Acceptable Use Policy', 'This policy outlines the acceptable use of IT resources at Bikita Minerals. All employees must adhere to these guidelines to ensure security and compliance.', 'POLICY', 'emp-001', '[\"policy\", \"security\", \"hr\"]', NULL, NULL, '1.2', 'APPROVED'),
                ('doc-002', 'Cisco Catalyst 9300 Configuration Guide', 'Standard configuration template for all new access switches deployed at the HQ or Mine Site.', 'MANUAL', 'emp-002', '[\"network\", \"cisco\", \"switch\"]', 'ASSET', 'hw-net-001', '2.0', 'APPROVED'),
                ('doc-003', 'Emergency Server Shutdown Procedure', 'Procedure for safely shutting down the main server room infrastructure at HQ during power anomalies. 1. Shut down VMs. 2. Shut down hypervisors. 3. Power off SAN.', 'PROCEDURE', 'emp-002', '[\"security\", \"server_room\", \"power\"]', 'LOCATION', 'loc-hq-001', '1.0', 'APPROVED');

            -- TIMELINE EVENTS
            INSERT OR IGNORE INTO timeline_events (id, entity_type, entity_id, event_type, description, created_at)
            VALUES 
                ('evt-001', 'ASSET', 'hw-lap-001', 'ASSIGNED', 'Assigned laptop to Tawanda Ndlovu', datetime('now', '-30 days')),
                ('evt-002', 'ASSET', 'hw-lap-002', 'CREATED', 'New executive laptop added to system', datetime('now', '-10 days')),
                ('evt-003', 'INVENTORY', 'inv-001', 'STOCK_IN', 'Received 45x Cat6 cables', datetime('now', '-5 days')),
                ('evt-004', 'REPAIR', 'rep-001', 'STATUS_CHANGE', 'Repair status changed from QUEUED to IN_PROGRESS', datetime('now', '-2 days')),
                ('evt-005', 'ASSET', 'hw-srv-001', 'MAINTENANCE', 'Routine fan replacement completed', datetime('now', '-1 hours')),
                ('evt-006', 'TICKET', 'tkt-001', 'CREATED', 'Helpdesk ticket opened: VPN Access for new contractors', datetime('now', '-1 days')),
                ('evt-007', 'LICENSE', 'lic-001', 'UPDATED', 'Microsoft 365 E3 seats increased from 100 to 150', datetime('now', '-15 days'));

        ")?;
        Ok(())
    }
}
`;

fs.writeFileSync('c:/Users/armut/404/BikitaIT/apps/web/src-tauri/src/db.rs', content);
