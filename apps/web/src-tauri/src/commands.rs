use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub struct Asset {
    pub id: String,
    pub tag: String,
    pub name: Option<String>,
    pub category: String,
    pub status: String,
    pub make: String,
    pub model: String,
    pub serial_number: Option<String>,
    pub mac_address: Option<String>,
    pub ip_address: Option<String>,
    pub location_id: Option<String>,
    pub assignee_id: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct InventoryItem {
    pub id: String,
    pub sku: String,
    pub name: String,
    pub category: String,
    pub quantity: i32,
    pub min_stock: i32,
    pub max_stock: i32,
    pub bin_location: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Repair {
    pub id: String,
    pub description: String,
    pub status: String,
    pub hardware_id: String,
    pub technician_id: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct Employee {
    pub id: String,
    pub name: String,
    pub email: String,
    pub department: Option<String>,
    pub position: Option<String>,
    pub role: String,
}

#[derive(Serialize, Deserialize)]
pub struct Location {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub parent_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ConnectedDevice {
    pub id: String,
    pub hostname: String,
    pub mac_address: String,
    pub ip_address: String,
    pub os: Option<String>,
    pub device_type: Option<String>,
    pub connection_status: Option<String>,
    pub last_seen: String,
}

#[derive(Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_assets: i64,
    pub total_employees: i64,
    pub total_locations: i64,
    pub assets_in_repair: i64,
    pub devices_online: i64,
    pub low_stock_items: i64,
}

#[derive(Serialize)]
pub struct SetupCheck {
    pub is_setup_complete: bool,
}

// ── Setup ──────────────────────────────────────────
#[tauri::command]
pub fn check_setup(db: State<Database>) -> Result<SetupCheck, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let setting: Result<String, _> = conn.query_row(
        "SELECT value FROM settings WHERE key = 'setup_complete'",
        [],
        |row| row.get(0),
    );
    match setting {
        Ok(v) => Ok(SetupCheck { is_setup_complete: v == "true" }),
        Err(_) => Ok(SetupCheck { is_setup_complete: false }),
    }
}

#[tauri::command]
pub fn initialize_setup(db: State<Database>, name: String, email: String, password: String) -> Result<bool, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let hash = bcrypt::hash(&password, 10).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO employees (id, name, email, password_hash, role) VALUES (?1, ?2, ?3, ?4, 'ADMIN')",
        params![id, name, email, hash],
    ).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('setup_complete', 'true')",
        [],
    ).map_err(|e| e.to_string())?;
    Ok(true)
}

// ── Dashboard ──────────────────────────────────────
#[tauri::command]
pub fn get_dashboard_stats(db: State<Database>) -> Result<DashboardStats, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let total_assets: i64 = conn.query_row("SELECT COUNT(*) FROM hardware_assets", [], |r| r.get(0)).unwrap_or(0);
    let total_employees: i64 = conn.query_row("SELECT COUNT(*) FROM employees", [], |r| r.get(0)).unwrap_or(0);
    let total_locations: i64 = conn.query_row("SELECT COUNT(*) FROM locations", [], |r| r.get(0)).unwrap_or(0);
    let assets_in_repair: i64 = conn.query_row(
        "SELECT COUNT(*) FROM hardware_assets WHERE status = 'UNDER_REPAIR'", [], |r| r.get(0)
    ).unwrap_or(0);
    let devices_online: i64 = conn.query_row(
        "SELECT COUNT(*) FROM connected_devices WHERE connection_status = 'CONNECTED'", [], |r| r.get(0)
    ).unwrap_or(0);
    let low_stock_items: i64 = conn.query_row(
        "SELECT COUNT(*) FROM inventory_items WHERE quantity <= min_stock", [], |r| r.get(0)
    ).unwrap_or(0);

    Ok(DashboardStats { total_assets, total_employees, total_locations, assets_in_repair, devices_online, low_stock_items })
}

// ── Assets ──────────────────────────────────────────
#[tauri::command]
pub fn get_assets(db: State<Database>) -> Result<Vec<Asset>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, tag, name, category, status, make, model, serial_number, mac_address, ip_address, location_id, assignee_id, created_at FROM hardware_assets ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let assets = stmt.query_map([], |row| {
        Ok(Asset {
            id: row.get(0)?,
            tag: row.get(1)?,
            name: row.get(2)?,
            category: row.get(3)?,
            status: row.get(4)?,
            make: row.get(5)?,
            model: row.get(6)?,
            serial_number: row.get(7)?,
            mac_address: row.get(8)?,
            ip_address: row.get(9)?,
            location_id: row.get(10)?,
            assignee_id: row.get(11)?,
            created_at: row.get(12)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(assets)
}

#[tauri::command]
pub fn create_asset(db: State<Database>, tag: String, category: String, make: String, model: String) -> Result<Asset, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO hardware_assets (id, tag, category, make, model) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, tag, category, make, model],
    ).map_err(|e| e.to_string())?;

    Ok(Asset {
        id, tag, name: None, category, status: "IN_STOCK".into(),
        make, model, serial_number: None, mac_address: None,
        ip_address: None, location_id: None, assignee_id: None,
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

// ── Inventory ──────────────────────────────────────
#[tauri::command]
pub fn get_inventory(db: State<Database>) -> Result<Vec<InventoryItem>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, sku, name, category, quantity, min_stock, max_stock, bin_location FROM inventory_items ORDER BY name"
    ).map_err(|e| e.to_string())?;

    let items = stmt.query_map([], |row| {
        Ok(InventoryItem {
            id: row.get(0)?,
            sku: row.get(1)?,
            name: row.get(2)?,
            category: row.get(3)?,
            quantity: row.get(4)?,
            min_stock: row.get(5)?,
            max_stock: row.get(6)?,
            bin_location: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(items)
}

// ── Employees ──────────────────────────────────────
#[tauri::command]
pub fn get_employees(db: State<Database>) -> Result<Vec<Employee>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, name, email, department, position, role FROM employees ORDER BY name"
    ).map_err(|e| e.to_string())?;

    let employees = stmt.query_map([], |row| {
        Ok(Employee {
            id: row.get(0)?,
            name: row.get(1)?,
            email: row.get(2)?,
            department: row.get(3)?,
            position: row.get(4)?,
            role: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(employees)
}

// ── Locations ──────────────────────────────────────
#[tauri::command]
pub fn get_locations(db: State<Database>) -> Result<Vec<Location>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, name, type, parent_id FROM locations ORDER BY name"
    ).map_err(|e| e.to_string())?;

    let locations = stmt.query_map([], |row| {
        Ok(Location {
            id: row.get(0)?,
            name: row.get(1)?,
            r#type: row.get(2)?,
            parent_id: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(locations)
}

// ── Repairs ───────────────────────────────────────
#[tauri::command]
pub fn get_repairs(db: State<Database>) -> Result<Vec<Repair>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, description, status, hardware_id, technician_id, created_at FROM repairs ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let repairs = stmt.query_map([], |row| {
        Ok(Repair {
            id: row.get(0)?,
            description: row.get(1)?,
            status: row.get(2)?,
            hardware_id: row.get(3)?,
            technician_id: row.get(4)?,
            created_at: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(repairs)
}

// ── Connected Devices ─────────────────────────────
#[tauri::command]
pub fn get_connected_devices(db: State<Database>) -> Result<Vec<ConnectedDevice>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, hostname, mac_address, ip_address, os, device_type, connection_status, last_seen FROM connected_devices ORDER BY last_seen DESC"
    ).map_err(|e| e.to_string())?;

    let devices = stmt.query_map([], |row| {
        Ok(ConnectedDevice {
            id: row.get(0)?,
            hostname: row.get(1)?,
            mac_address: row.get(2)?,
            ip_address: row.get(3)?,
            os: row.get(4)?,
            device_type: row.get(5)?,
            connection_status: row.get(6)?,
            last_seen: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(devices)
}

// ── Seed Demo Data ────────────────────────────────
#[tauri::command]
pub fn seed_demo_data(db: State<Database>) -> Result<bool, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Locations
    let locs = vec![
        ("MDF-1", "MINE", None),
        ("Server Room A", "ROOM", Some("MDF-1")),
        ("Office Floor 2", "ROOM", None),
    ];
    for (name, typ, parent) in &locs {
        conn.execute(
            "INSERT OR IGNORE INTO locations (id, name, type, parent_id) VALUES (?1, ?2, ?3, ?4)",
            params![Uuid::new_v4().to_string(), name, typ, parent],
        ).ok();
    }

    // Employees
    let emps = vec![
        ("Alice", "alice@bikita.com", "IT", "Network Admin", "IT_SUPPORT"),
        ("Bob", "bob@bikita.com", "Operations", "Field Tech", "EMPLOYEE"),
    ];
    for (name, email, dept, pos, role) in &emps {
        conn.execute(
            "INSERT OR IGNORE INTO employees (id, name, email, department, position, role) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![Uuid::new_v4().to_string(), name, email, dept, pos, role],
        ).ok();
    }

    // Hardware Assets
    let assets = vec![
        ("IT-0001", "Core Switch", "NETWORKING", "Cisco", "Catalyst 9500", "SN-9500-001"),
        ("IT-0002", "Laptop - Dell XPS", "LAPTOP", "Dell", "XPS 15", "SN-XPS-001"),
        ("IT-0003", "Access Point", "NETWORKING", "Ubiquiti", "U6-Pro", "SN-U6-001"),
    ];
    for (tag, name, cat, make, model, sn) in &assets {
        conn.execute(
            "INSERT OR IGNORE INTO hardware_assets (id, tag, name, category, make, model, serial_number) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![Uuid::new_v4().to_string(), tag, name, cat, make, model, sn],
        ).ok();
    }

    // Network services
    let svcs = vec![
        ("Internet Gateway", "online"),
        ("DNS Server", "online"),
        ("DHCP Server", "online"),
    ];
    for (name, status) in &svcs {
        conn.execute(
            "INSERT OR IGNORE INTO network_services (id, name, status) VALUES (?1, ?2, ?3)",
            params![Uuid::new_v4().to_string(), name, status],
        ).ok();
    }

    Ok(true)
}
