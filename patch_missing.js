const fs = require('fs');
let cmds = fs.readFileSync('apps/web/src-tauri/src/commands.rs', 'utf8');

const additionalCmds = `
#[tauri::command]
pub fn issue_consumable(db: tauri::State<crate::Database>, item_id: String, quantity: i32, employee_id: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE inventory_items SET quantity = quantity - ?1 WHERE id = ?2",
        rusqlite::params![quantity, item_id]
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"success": true}))
}

#[tauri::command]
pub fn return_asset(db: tauri::State<crate::Database>, asset_id: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE hardware_assets SET status = 'IN_STOCK', assignee_id = NULL WHERE id = ?1",
        rusqlite::params![asset_id]
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"success": true}))
}

#[tauri::command]
pub fn log_maintenance_activity(db: tauri::State<crate::Database>, asset_id: String, activity_type: String, description: String, technician_id: Option<String>, new_condition: Option<String>) -> Result<serde_json::Value, String> {
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

#[tauri::command]
pub fn get_asset_maintenance_history(db: tauri::State<crate::Database>, asset_id: String) -> Result<serde_json::Value, String> {
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

#[tauri::command]
pub fn update_asset_condition(db: tauri::State<crate::Database>, asset_id: String, condition: String, notes: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE hardware_assets SET condition = ?1 WHERE id = ?2",
        rusqlite::params![condition, asset_id]
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"success": true}))
}
`;

if (!cmds.includes('pub fn issue_consumable')) {
  fs.writeFileSync('apps/web/src-tauri/src/commands.rs', cmds + additionalCmds);
}

let main = fs.readFileSync('apps/web/src-tauri/src/main.rs', 'utf8');
if (!main.includes('issue_consumable')) {
  main = main.replace('unlink_child_asset', 'unlink_child_asset,\n            issue_consumable,\n            return_asset,\n            log_maintenance_activity,\n            get_asset_maintenance_history,\n            update_asset_condition');
  fs.writeFileSync('apps/web/src-tauri/src/main.rs', main);
}
