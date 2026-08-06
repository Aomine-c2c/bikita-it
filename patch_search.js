const fs = require('fs');
let cmd = fs.readFileSync('apps/web/src-tauri/src/commands.rs', 'utf8');

const searchImpl = `#[tauri::command]
pub fn global_search(db: tauri::State<crate::Database>, query: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    let q = format!("%{}%", query);

    // Search employees
    let mut emp_stmt = conn.prepare("SELECT id, name, email FROM employees WHERE name LIKE ? OR email LIKE ? LIMIT 5").map_err(|e| e.to_string())?;
    let emp_rows: Vec<serde_json::Value> = emp_stmt.query_map(rusqlite::params![q, q], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "name": row.get::<_, String>(1)?,
            "email": row.get::<_, String>(2)?
        }))
    }).map_err(|e| e.to_string())?.filter_map(Result::ok).collect();

    // Search assets
    let mut asst_stmt = conn.prepare("SELECT id, tag, make, model FROM hardware_assets WHERE tag LIKE ? OR make LIKE ? OR model LIKE ? LIMIT 5").map_err(|e| e.to_string())?;
    let asst_rows: Vec<serde_json::Value> = asst_stmt.query_map(rusqlite::params![q, q, q], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "tag": row.get::<_, String>(1)?,
            "make": row.get::<_, String>(2)?,
            "model": row.get::<_, String>(3)?
        }))
    }).map_err(|e| e.to_string())?.filter_map(Result::ok).collect();

    // Search locations
    let mut loc_stmt = conn.prepare("SELECT id, name, type FROM locations WHERE name LIKE ? LIMIT 5").map_err(|e| e.to_string())?;
    let loc_rows: Vec<serde_json::Value> = loc_stmt.query_map(rusqlite::params![q], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "name": row.get::<_, String>(1)?,
            "type": row.get::<_, String>(2)?
        }))
    }).map_err(|e| e.to_string())?.filter_map(Result::ok).collect();

    // Search network devices
    let mut net_stmt = conn.prepare("SELECT id, hostname, ip_address FROM connected_devices WHERE hostname LIKE ? OR ip_address LIKE ? LIMIT 5").map_err(|e| e.to_string())?;
    let net_rows: Vec<serde_json::Value> = net_stmt.query_map(rusqlite::params![q, q], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "hostname": row.get::<_, String>(1)?,
            "ip_address": row.get::<_, String>(2)?
        }))
    }).map_err(|e| e.to_string())?.filter_map(Result::ok).collect();

    // Search inventory
    let mut inv_stmt = conn.prepare("SELECT id, sku, name FROM inventory_items WHERE name LIKE ? OR sku LIKE ? LIMIT 5").map_err(|e| e.to_string())?;
    let inv_rows: Vec<serde_json::Value> = inv_stmt.query_map(rusqlite::params![q, q], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "sku": row.get::<_, String>(1)?,
            "name": row.get::<_, String>(2)?
        }))
    }).map_err(|e| e.to_string())?.filter_map(Result::ok).collect();

    Ok(serde_json::json!({
        "employees": emp_rows,
        "assets": asst_rows,
        "locations": loc_rows,
        "network": net_rows,
        "inventory": inv_rows
    }))
}`;

cmd = cmd.replace(
  '#[tauri::command]\npub fn global_search() -> Result<serde_json::Value, String> { Ok(serde_json::Value::Null) }', 
  searchImpl
);

fs.writeFileSync('apps/web/src-tauri/src/commands.rs', cmd);
