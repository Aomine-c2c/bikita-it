const fs = require('fs');

// 1. Add `issue_asset_from_inventory` to main.rs
let main = fs.readFileSync('apps/web/src-tauri/src/main.rs', 'utf8');
if (!main.includes('issue_asset_from_inventory')) {
  main = main.replace('process_ai_query', 'process_ai_query,\n            issue_asset_from_inventory');
  fs.writeFileSync('apps/web/src-tauri/src/main.rs', main);
}

// 2. Add the command to commands.rs
let cmd = fs.readFileSync('apps/web/src-tauri/src/commands.rs', 'utf8');
if (!cmd.includes('pub fn issue_asset_from_inventory')) {
  const lifecycleCmd = `
#[tauri::command]
pub fn issue_asset_from_inventory(db: tauri::State<crate::Database>, inventory_id: String, employee_company_id: String, assignment_type: String, notes: String) -> Result<serde_json::Value, String> {
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
`;
  
  cmd += lifecycleCmd;
  fs.writeFileSync('apps/web/src-tauri/src/commands.rs', cmd);
}
