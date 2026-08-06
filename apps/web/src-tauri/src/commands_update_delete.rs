#![allow(unused_variables)]
#![allow(unused_assignments)]
use rusqlite::ToSql;
use tauri::State;
use crate::Database;

fn dynamic_update(
    conn: &rusqlite::Connection,
    table: &str,
    id: &str,
    data: &serde_json::Map<String, serde_json::Value>,
) -> Result<(), String> {
    if data.is_empty() {
        return Ok(());
    }

    let mut set_clauses = Vec::new();
    let mut params: Vec<Box<dyn ToSql>> = Vec::new();
    
    // Keep track of the parameter index, starting at 1
    let mut param_idx = 1;

    for (k, v) in data {
        // Skip protected fields or relations that shouldn't be mapped directly
        if k == "id" || k == "created_at" || k == "updated_at" || k == "hardware" || k == "technician" || k == "employee" || k == "location" || k == "assignedUser" || k == "repairs" {
            continue;
        }

        // Convert camelCase to snake_case for DB columns if necessary
        let db_col = match k.as_str() {
            "macAddress" => "mac_address",
            "ipAddress" => "ip_address",
            "serialNumber" => "serial_number",
            "locationId" => "location_id",
            "assigneeId" => "assignee_id",
            "minStock" => "min_stock",
            "maxStock" => "max_stock",
            "binLocation" => "bin_location",
            "hardwareId" => "hardware_id",
            "technicianId" => "technician_id",
            "deviceType" => "device_type",
            "connectionStatus" => "connection_status",
            "lastSeen" => "last_seen",
            "employeeId" => "employee_id",
            "purchaseDate" => "purchase_date",
            "warrantyExpiry" => "warranty_expiry",
            "purchaseCost" => "purchase_cost",
            "unitCost" => "unit_cost",
            "assetTag" => "tag",
            "manufacturer" => "make",
            _ => k.as_str(),
        };

        set_clauses.push(format!("{} = ?{}", db_col, param_idx));
        param_idx += 1;

        if v.is_null() {
            params.push(Box::new(rusqlite::types::Null));
        } else if let Some(s) = v.as_str() {
            params.push(Box::new(s.to_string()));
        } else if let Some(n) = v.as_i64() {
            params.push(Box::new(n));
        } else if let Some(f) = v.as_f64() {
            params.push(Box::new(f));
        } else if let Some(b) = v.as_bool() {
            params.push(Box::new(b));
        } else {
            params.push(Box::new(v.to_string()));
        }
    }

    if set_clauses.is_empty() {
        return Ok(());
    }

    set_clauses.push(format!("updated_at = ?{}", param_idx));
    params.push(Box::new(chrono::Utc::now().to_rfc3339()));
    param_idx += 1;

    let sql = format!(
        "UPDATE {} SET {} WHERE id = ?{}",
        table,
        set_clauses.join(", "),
        param_idx
    );
    params.push(Box::new(id.to_string()));

    let param_refs: Vec<&dyn ToSql> = params.iter().map(|p| p.as_ref()).collect();

    conn.execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn dynamic_insert(
    conn: &rusqlite::Connection,
    table: &str,
    data: &serde_json::Map<String, serde_json::Value>,
) -> Result<serde_json::Value, String> {
    let mut cols = vec!["id".to_string(), "created_at".to_string(), "updated_at".to_string()];
    let mut placeholders = vec!["?1".to_string(), "?2".to_string(), "?3".to_string()];
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let mut params: Vec<Box<dyn ToSql>> = vec![
        Box::new(id.clone()),
        Box::new(now.clone()),
        Box::new(now.clone())
    ];
    let mut param_idx = 4;

    for (k, v) in data {
        if k == "id" || k == "created_at" || k == "updated_at" || k == "hardware" || k == "technician" || k == "employee" || k == "location" || k == "assignedUser" || k == "repairs" {
            continue;
        }
        let db_col = match k.as_str() {
            "macAddress" => "mac_address",
            "ipAddress" => "ip_address",
            "serialNumber" => "serial_number",
            "locationId" => "location_id",
            "assigneeId" => "assignee_id",
            "minStock" => "min_stock",
            "maxStock" => "max_stock",
            "binLocation" => "bin_location",
            "hardwareId" => "hardware_id",
            "technicianId" => "technician_id",
            "deviceType" => "device_type",
            "connectionStatus" => "connection_status",
            "lastSeen" => "last_seen",
            "employeeId" => "employee_id",
            "purchaseDate" => "purchase_date",
            "warrantyExpiry" => "warranty_expiry",
            "purchaseCost" => "purchase_cost",
            "unitCost" => "unit_cost",
            "assetTag" => "tag",
            "manufacturer" => "make",
            _ => k.as_str(),
        };

        cols.push(db_col.to_string());
        placeholders.push(format!("?{}", param_idx));
        param_idx += 1;

        if v.is_null() {
            params.push(Box::new(rusqlite::types::Null));
        } else if let Some(s) = v.as_str() {
            params.push(Box::new(s.to_string()));
        } else if let Some(n) = v.as_i64() {
            params.push(Box::new(n));
        } else if let Some(f) = v.as_f64() {
            params.push(Box::new(f));
        } else if let Some(b) = v.as_bool() {
            params.push(Box::new(b));
        } else {
            params.push(Box::new(v.to_string()));
        }
    }

    let sql = format!(
        "INSERT INTO {} ({}) VALUES ({})",
        table,
        cols.join(", "),
        placeholders.join(", ")
    );

    let param_refs: Vec<&dyn ToSql> = params.iter().map(|p| p.as_ref()).collect();

    conn.execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;

    let mut result = data.clone();
    result.insert("id".to_string(), serde_json::Value::String(id));
    result.insert("createdAt".to_string(), serde_json::Value::String(now));
    
    Ok(serde_json::Value::Object(result))
}

fn delete_record(conn: &rusqlite::Connection, table: &str, id: &str) -> Result<(), String> {
    let sql = format!("DELETE FROM {} WHERE id = ?1", table);
    conn.execute(&sql, rusqlite::params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ASSETS
pub fn create_asset(db: tauri::State<crate::db::Database>, data: serde_json::Value) -> Result<serde_json::Value, String> {
    create_asset_impl(&db, data)
}

pub fn create_asset_impl(db: &crate::db::Database, data: serde_json::Value) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if let Some(map) = data.as_object() {
        dynamic_insert(&conn, "hardware_assets", map)
    } else {
        Err("Invalid data payload".to_string())
    }
}
pub fn update_asset(db: tauri::State<crate::db::Database>, id: String, data: serde_json::Value) -> Result<(), String> {
    update_asset_impl(&db, id, data)
}

pub fn update_asset_impl(db: &crate::db::Database, id: String, data: serde_json::Value) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if let Some(map) = data.as_object() {
        dynamic_update(&conn, "hardware_assets", &id, map)?;
    }
    Ok(())
}
pub fn delete_asset(db: tauri::State<crate::db::Database>, id: String) -> Result<(), String> {
    delete_asset_impl(&db, id)
}

pub fn delete_asset_impl(db: &crate::db::Database, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    delete_record(&conn, "hardware_assets", &id)
}

// INVENTORY
pub fn create_inventory_item(db: tauri::State<crate::db::Database>, data: serde_json::Value) -> Result<serde_json::Value, String> {
    create_inventory_item_impl(&db, data)
}

pub fn create_inventory_item_impl(db: &crate::db::Database, data: serde_json::Value) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if let Some(map) = data.as_object() {
        dynamic_insert(&conn, "inventory_items", map)
    } else {
        Err("Invalid data payload".to_string())
    }
}
pub fn update_inventory_item(db: tauri::State<crate::db::Database>, id: String, data: serde_json::Value) -> Result<(), String> {
    update_inventory_item_impl(&db, id, data)
}

pub fn update_inventory_item_impl(db: &crate::db::Database, id: String, data: serde_json::Value) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if let Some(map) = data.as_object() {
        dynamic_update(&conn, "inventory_items", &id, map)?;
    }
    Ok(())
}
pub fn delete_inventory_item(db: tauri::State<crate::db::Database>, id: String) -> Result<(), String> {
    delete_inventory_item_impl(&db, id)
}

pub fn delete_inventory_item_impl(db: &crate::db::Database, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    delete_record(&conn, "inventory_items", &id)
}

// EMPLOYEES
pub fn create_employee(db: tauri::State<crate::db::Database>, data: serde_json::Value) -> Result<serde_json::Value, String> {
    create_employee_impl(&db, data)
}

pub fn create_employee_impl(db: &crate::db::Database, data: serde_json::Value) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if let Some(map) = data.as_object() {
        dynamic_insert(&conn, "employees", map)
    } else {
        Err("Invalid data payload".to_string())
    }
}
pub fn update_employee(db: tauri::State<crate::db::Database>, id: String, data: serde_json::Value) -> Result<(), String> {
    update_employee_impl(&db, id, data)
}

pub fn update_employee_impl(db: &crate::db::Database, id: String, data: serde_json::Value) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if let Some(map) = data.as_object() {
        dynamic_update(&conn, "employees", &id, map)?;
    }
    Ok(())
}
pub fn delete_employee(db: tauri::State<crate::db::Database>, id: String) -> Result<(), String> {
    delete_employee_impl(&db, id)
}

pub fn delete_employee_impl(db: &crate::db::Database, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    delete_record(&conn, "employees", &id)
}

// LOCATIONS
pub fn create_location(db: tauri::State<crate::db::Database>, data: serde_json::Value) -> Result<serde_json::Value, String> {
    create_location_impl(&db, data)
}

pub fn create_location_impl(db: &crate::db::Database, data: serde_json::Value) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if let Some(map) = data.as_object() {
        dynamic_insert(&conn, "locations", map)
    } else {
        Err("Invalid data payload".to_string())
    }
}
pub fn update_location(db: tauri::State<crate::db::Database>, id: String, data: serde_json::Value) -> Result<(), String> {
    update_location_impl(&db, id, data)
}

pub fn update_location_impl(db: &crate::db::Database, id: String, data: serde_json::Value) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if let Some(map) = data.as_object() {
        dynamic_update(&conn, "locations", &id, map)?;
    }
    Ok(())
}
pub fn delete_location(db: tauri::State<crate::db::Database>, id: String) -> Result<(), String> {
    delete_location_impl(&db, id)
}

pub fn delete_location_impl(db: &crate::db::Database, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    delete_record(&conn, "locations", &id)
}

// REPAIRS
pub fn create_repair(db: tauri::State<crate::db::Database>, data: serde_json::Value) -> Result<serde_json::Value, String> {
    create_repair_impl(&db, data)
}

pub fn create_repair_impl(db: &crate::db::Database, data: serde_json::Value) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if let Some(map) = data.as_object() {
        dynamic_insert(&conn, "repairs", map)
    } else {
        Err("Invalid data payload".to_string())
    }
}
pub fn update_repair(db: tauri::State<crate::db::Database>, id: String, data: serde_json::Value) -> Result<(), String> {
    update_repair_impl(&db, id, data)
}

pub fn update_repair_impl(db: &crate::db::Database, id: String, data: serde_json::Value) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if let Some(map) = data.as_object() {
        dynamic_update(&conn, "repairs", &id, map)?;
    }
    Ok(())
}
pub fn delete_repair(db: tauri::State<crate::db::Database>, id: String) -> Result<(), String> {
    delete_repair_impl(&db, id)
}

pub fn delete_repair_impl(db: &crate::db::Database, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    delete_record(&conn, "repairs", &id)
}

// NETWORK DEVICES
pub fn create_connected_device(db: tauri::State<crate::db::Database>, data: serde_json::Value) -> Result<serde_json::Value, String> {
    create_connected_device_impl(&db, data)
}

pub fn create_connected_device_impl(db: &crate::db::Database, data: serde_json::Value) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if let Some(map) = data.as_object() {
        dynamic_insert(&conn, "connected_devices", map)
    } else {
        Err("Invalid data payload".to_string())
    }
}
pub fn update_connected_device(db: tauri::State<crate::db::Database>, id: String, data: serde_json::Value) -> Result<(), String> {
    update_connected_device_impl(&db, id, data)
}

pub fn update_connected_device_impl(db: &crate::db::Database, id: String, data: serde_json::Value) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if let Some(map) = data.as_object() {
        dynamic_update(&conn, "connected_devices", &id, map)?;
    }
    Ok(())
}
pub fn delete_connected_device(db: tauri::State<crate::db::Database>, id: String) -> Result<(), String> {
    delete_connected_device_impl(&db, id)
}

pub fn delete_connected_device_impl(db: &crate::db::Database, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    delete_record(&conn, "connected_devices", &id)
}
