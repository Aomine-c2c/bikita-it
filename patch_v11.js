const fs = require('fs');

// --- 1. PATCH db.rs ---
let db = fs.readFileSync('apps/web/src-tauri/src/db.rs', 'utf8');

const newTable = `
            CREATE TABLE IF NOT EXISTS asset_installations (
                id TEXT PRIMARY KEY NOT NULL,
                asset_id TEXT NOT NULL REFERENCES hardware_assets(id),
                location_id TEXT NOT NULL REFERENCES locations(id),
                technician_id TEXT REFERENCES employees(employee_id),
                status TEXT NOT NULL DEFAULT 'INSTALLED',
                installed_at TEXT NOT NULL DEFAULT (datetime('now')),
                removed_at TEXT,
                photos TEXT,
                notes TEXT
            );
`;

const newTriggers = `
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
`;

if (!db.includes('asset_installations')) {
  db = db.replace('CREATE TABLE IF NOT EXISTS timeline_events', newTable + '\n            CREATE TABLE IF NOT EXISTS timeline_events');
}
if (!db.includes('installation_insert_trigger')) {
  db = db.replace('        ")?;', newTriggers + '\n        ")?;');
}

fs.writeFileSync('apps/web/src-tauri/src/db.rs', db);

// --- 2. PATCH commands.rs ---
let cmds = fs.readFileSync('apps/web/src-tauri/src/commands.rs', 'utf8');

const newCmds = `
#[tauri::command]
pub fn install_asset_from_inventory(db: tauri::State<crate::Database>, inventory_id: String, location_id: String, technician_company_id: String, notes: String, photos: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

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
        "INSERT INTO hardware_assets (id, tag, category, status, location_id) 
         SELECT ?1, ?2, category, 'INSTALLED', ?3 FROM inventory_items WHERE id = ?4",
        rusqlite::params![new_asset_id, new_asset_tag, location_id, inventory_id]
    ).map_err(|e| e.to_string())?;

    // Create Installation Record
    let installation_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO asset_installations (id, asset_id, location_id, technician_id, notes, photos) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![installation_id, new_asset_id, location_id, technician_company_id, notes, photos]
    ).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "success": true,
        "asset_id": new_asset_id,
        "installation_id": installation_id
    }))
}

#[tauri::command]
pub fn move_operational_asset(db: tauri::State<crate::Database>, asset_id: String, new_location_id: String, technician_company_id: String, notes: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Update the asset's location
    conn.execute(
        "UPDATE hardware_assets SET location_id = ?1 WHERE id = ?2",
        rusqlite::params![new_location_id, asset_id]
    ).map_err(|e| e.to_string())?;

    // Close previous installation record
    conn.execute(
        "UPDATE asset_installations SET status = 'REMOVED', removed_at = datetime('now') WHERE asset_id = ?1 AND status = 'INSTALLED'",
        rusqlite::params![asset_id]
    ).map_err(|e| e.to_string())?;

    // Create new installation record
    let installation_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO asset_installations (id, asset_id, location_id, technician_id, notes) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![installation_id, asset_id, new_location_id, technician_company_id, notes]
    ).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "success": true,
        "installation_id": installation_id
    }))
}

#[tauri::command]
pub fn link_child_asset(db: tauri::State<crate::Database>, parent_asset_id: String, child_asset_id: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE hardware_assets SET parent_id = ?1 WHERE id = ?2",
        rusqlite::params![parent_asset_id, child_asset_id]
    ).map_err(|e| e.to_string())?;

    // Log the timeline event
    let event_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO timeline_events (id, entity_type, entity_id, event_type, description) VALUES (?1, 'ASSET', ?2, 'LINKED', 'Asset linked as child to parent: ' || ?3)",
        rusqlite::params![event_id, child_asset_id, parent_asset_id]
    ).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "success": true
    }))
}

#[tauri::command]
pub fn unlink_child_asset(db: tauri::State<crate::Database>, child_asset_id: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE hardware_assets SET parent_id = NULL WHERE id = ?1",
        rusqlite::params![child_asset_id]
    ).map_err(|e| e.to_string())?;

    // Log the timeline event
    let event_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO timeline_events (id, entity_type, entity_id, event_type, description) VALUES (?1, 'ASSET', ?2, 'UNLINKED', 'Asset unlinked from parent')",
        rusqlite::params![event_id, child_asset_id]
    ).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "success": true
    }))
}
`;

if (!cmds.includes('install_asset_from_inventory')) {
  cmds += newCmds;
  fs.writeFileSync('apps/web/src-tauri/src/commands.rs', cmds);
}

// --- 3. PATCH main.rs ---
let main = fs.readFileSync('apps/web/src-tauri/src/main.rs', 'utf8');
if (!main.includes('install_asset_from_inventory')) {
  main = main.replace('issue_asset_from_inventory', 
    'issue_asset_from_inventory,\n            install_asset_from_inventory,\n            move_operational_asset,\n            link_child_asset,\n            unlink_child_asset'
  );
  fs.writeFileSync('apps/web/src-tauri/src/main.rs', main);
}

console.log("Patched successfully!");
