def main():
    with open('src-tauri/src/commands.rs', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add imports
    content = content.replace('use uuid::Uuid;', 'use uuid::Uuid;\nuse crate::{SessionState, UserSession};', 1)

    # 2. Fix line 186 unwrap_or_default
    old_line_186 = '    }).unwrap_or_default().filter_map(|r| r.ok()).collect();'
    new_line_186 = '    }).map(|rows| rows.filter_map(|r| r.ok()).collect()).unwrap_or_else(|_| vec![]);'
    if old_line_186 in content:
        content = content.replace(old_line_186, new_line_186, 1)
    else:
        print("Warning: Could not find old_line_186")

    # 3. Add get_settings right before get_dashboard_stats
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
        content = content.replace('#[tauri::command]\npub fn get_dashboard_stats', get_settings_code + '\n#[tauri::command]\npub fn get_dashboard_stats', 1)

    # 4. Remove create_asset
    create_asset_start = '#[tauri::command]\npub fn create_asset'
    idx_start = content.find(create_asset_start)
    if idx_start != -1:
        idx_end = content.find('// ── Inventory', idx_start)
        if idx_end != -1:
            content = content[:idx_start] + content[idx_end:]

    # 5. Patch check_permission
    old_check = """pub fn check_permission(conn: &rusqlite::Connection, required_role: &str) -> Result<(), String> {
    // In V1.0 Foundation, we assume a single-tenant or mocked session where current user is ADMIN.
    // Future iterations will extract the user ID from a token in the tauri::State session.
    let role_res: Result<String, _> = conn.query_row("SELECT value FROM settings WHERE key = 'current_user_role'", [], |row| row.get(0));
    
    let current_role = role_res.unwrap_or_else(|_| "ADMIN".to_string());
    if current_role == "ADMIN" || current_role == required_role {
        Ok(())
    } else {
        Err(format!("Permission Denied: Requires {} role.", required_role))
    }
}"""
    new_check = """pub fn check_permission(session: &State<'_, SessionState>, required_role: &str) -> Result<(), String> {
    let session_guard = session.session.lock().map_err(|e| e.to_string())?;
    let user = session_guard.as_ref().ok_or("Unauthorized")?;
    
    if user.role != required_role && user.role != "ADMIN" {
        return Err("Forbidden".to_string());
    }
    Ok(())
}"""
    content = content.replace(old_check, new_check, 1)

    # 6. Replace login and add logout
    idx_login = content.find('#[tauri::command]\npub fn login')
    idx_issue = content.find('#[tauri::command]\npub fn issue_asset_from_inventory')
    if idx_login != -1 and idx_issue != -1:
        new_login_logout = """#[tauri::command]
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
}

"""
        content = content[:idx_login] + new_login_logout + content[idx_issue:]

    with open('src-tauri/src/commands.rs', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
