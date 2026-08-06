const fs = require('fs');
let cmds = fs.readFileSync('apps/web/src-tauri/src/commands.rs', 'utf8');

const additionalCmds = `
#[tauri::command]
pub fn create_document(db: tauri::State<crate::Database>, title: String, content: String, category: String, related_entity_type: Option<String>, related_entity_id: Option<String>, author_id: Option<String>) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let doc_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO documents (id, title, content, category, related_entity_type, related_entity_id, author_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![doc_id, title, content, category, related_entity_type, related_entity_id, author_id]
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"success": true, "id": doc_id}))
}

#[tauri::command]
pub fn get_documents(db: tauri::State<crate::Database>, category: Option<String>, related_entity_type: Option<String>, related_entity_id: Option<String>) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    let mut query = "
        SELECT 
            d.id, d.title, d.content, d.category, d.related_entity_type, d.related_entity_id, d.created_at, d.updated_at,
            e.name as author_name
        FROM documents d
        LEFT JOIN employees e ON d.author_id = e.id
        WHERE 1=1
    ".to_string();

    let mut params: Vec<String> = Vec::new();
    
    if let Some(c) = category {
        query.push_str(&format!(" AND d.category = '{}'", c));
    }
    if let Some(ret) = related_entity_type {
        query.push_str(&format!(" AND d.related_entity_type = '{}'", ret));
    }
    if let Some(rei) = related_entity_id {
        query.push_str(&format!(" AND d.related_entity_id = '{}'", rei));
    }
    
    query.push_str(" ORDER BY d.created_at DESC");

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "title": row.get::<_, String>(1)?,
            "content": row.get::<_, String>(2)?,
            "category": row.get::<_, String>(3)?,
            "related_entity_type": row.get::<_, Option<String>>(4)?,
            "related_entity_id": row.get::<_, Option<String>>(5)?,
            "created_at": row.get::<_, String>(6)?,
            "updated_at": row.get::<_, String>(7)?,
            "author_name": row.get::<_, Option<String>>(8)?
        }))
    }).map_err(|e| e.to_string())?;

    let mut docs = Vec::new();
    for row in rows {
        if let Ok(r) = row { docs.push(r); }
    }
    
    Ok(serde_json::json!(docs))
}

#[tauri::command]
pub fn update_document(db: tauri::State<crate::Database>, doc_id: String, title: String, content: String, category: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE documents SET title = ?1, content = ?2, category = ?3, updated_at = datetime('now') WHERE id = ?4",
        rusqlite::params![title, content, category, doc_id]
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"success": true}))
}

#[tauri::command]
pub fn delete_document(db: tauri::State<crate::Database>, doc_id: String) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM documents WHERE id = ?1",
        rusqlite::params![doc_id]
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"success": true}))
}
`;

if (!cmds.includes('pub fn create_document')) {
  fs.writeFileSync('apps/web/src-tauri/src/commands.rs', cmds + additionalCmds);
}

let main = fs.readFileSync('apps/web/src-tauri/src/main.rs', 'utf8');
if (!main.includes('create_document')) {
  main = main.replace('update_asset_condition', 'update_asset_condition,\n            create_document,\n            get_documents,\n            update_document,\n            delete_document');
  fs.writeFileSync('apps/web/src-tauri/src/main.rs', main);
}
