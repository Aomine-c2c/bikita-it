use rusqlite::{Connection, Result, params};
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
        ")?;
        Ok(())
    }
}
