import re

def main():
    with open('src-tauri/src/commands.rs', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add get_settings if missing
    get_settings_code = """
#[tauri::command]
pub fn get_settings(db: State<Database>) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT key, value FROM settings").map_err(|e| e.to_string())?;
    let mut settings = serde_json::Map::new();
    
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    }).map_err(|e| e.to_string())?;
    
    for row in rows {
        if let Ok((k, v)) = row {
            settings.insert(k, serde_json::Value::String(v));
        }
    }
    
    Ok(serde_json::Value::Object(settings))
}
"""
    if 'pub fn get_settings' not in content:
        # insert before get_dashboard_stats
        content = content.replace('#[tauri::command]\npub fn get_dashboard_stats', get_settings_code + '\n#[tauri::command]\npub fn get_dashboard_stats')

    # 2. Replace login and add logout
    old_login = r'#\[tauri::command\]\npub fn login\(db: State<Database>.*?Ok\(serde_json::json!\(\{.*?\}\)\)\n\}'
    new_login = r'''#[tauri::command]
pub fn login(db: State<Database>, session: State<'_, SessionState>, email: String, password: Option<String>) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, role, password_hash FROM users WHERE email = ?1"
    ).map_err(|e| e.to_string())?;

    let mut rows = stmt.query(params![email]).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let id: String = row.get(0).map_err(|e| e.to_string())?;
        let role: String = row.get(1).map_err(|e| e.to_string())?;
        let hash: String = row.get(2).map_err(|e| e.to_string())?;
        
        let password_str = password.unwrap_or_default();
        
        if password_str == hash {
            let mut session_guard = session.session.lock().map_err(|e| e.to_string())?;
            *session_guard = Some(UserSession {
                id: id.clone(),
                role: role.clone(),
            });

            return Ok(serde_json::json!({
                "success": true,
                "user": {
                    "id": id,
                    "email": email,
                    "role": role
                }
            }));
        }
    }

    Ok(serde_json::json!({
        "success": false,
        "message": "Invalid email or password"
    }))
}

#[tauri::command]
pub fn logout(session: State<'_, SessionState>) -> Result<(), String> {
    let mut session_guard = session.session.lock().map_err(|e| e.to_string())?;
    *session_guard = None;
    Ok(())
}'''
    content = re.sub(old_login, new_login, content, flags=re.DOTALL)

    # Write back
    with open('src-tauri/src/commands.rs', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
