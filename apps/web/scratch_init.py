import re

filepath = r'c:\Users\armut\404\BikitaIT\apps\web\src-tauri\src\commands.rs'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Session imports
if 'use crate::{SessionState, UserSession};' not in content:
    content = content.replace('use tauri::State;', 'use tauri::State;\nuse crate::{SessionState, UserSession};')

# 2. Add setup functions at the top of the commands
setup_funcs = """
#[tauri::command]
pub fn check_setup(db: tauri::State<crate::Database>) -> Result<bool, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = 'setup_complete'").map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let val: String = row.get(0).map_err(|e| e.to_string())?;
        Ok(val == "true")
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub fn get_settings(db: tauri::State<crate::Database>) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT key, value FROM settings").map_err(|e| e.to_string())?;
    let mut map = serde_json::Map::new();
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    }).map_err(|e| e.to_string())?;
    
    for row in rows {
        if let Ok((k, v)) = row {
            map.insert(k, serde_json::Value::String(v));
        }
    }
    Ok(serde_json::Value::Object(map))
}

#[tauri::command]
pub fn initialize_setup(db: tauri::State<crate::Database>, email: String, password: Option<String>, orgName: String) -> Result<bool, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    // Hash password
    let hash = if let Some(pwd) = password {
        bcrypt::hash(pwd, bcrypt::DEFAULT_COST).map_err(|e| e.to_string())?
    } else {
        return Err("Password required".to_string());
    };
    
    conn.execute(
        "INSERT INTO employees (id, name, email, department, position, role, password_hash) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![uuid::Uuid::new_v4().to_string(), "System Administrator", email, "IT", "Administrator", "ADMIN", hash],
    ).map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('setup_complete', 'true')",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('org_name', ?1)",
        rusqlite::params![orgName],
    ).map_err(|e| e.to_string())?;
    
    Ok(true)
}
"""
if 'pub fn check_setup' not in content:
    content = content.replace('#[derive(Serialize, Deserialize)]', setup_funcs + '\n#[derive(Serialize, Deserialize)]', 1)


# 3. Fix unwrap_or_default error
content = re.sub(r'\}\)\.unwrap_or_default\(\)\.filter_map\(\|r\| r\.ok\(\)\)\.collect\(\);', r'}).map(|rows| rows.filter_map(|r| r.ok()).collect::<Vec<serde_json::Value>>()).unwrap_or_default();', content)

# 4. Remove duplicate create_asset
pattern = r'(//.*?\n)?#\[tauri::command\]\s*pub fn create_asset\b.*?(?=#\[tauri::command\]|// ──)'
content = re.sub(pattern, '', content, flags=re.DOTALL)

# 5. Fix login and check_permission (and add logout)
old_login = """#[tauri::command]
pub fn login(db: State<Database>, email: String, password: Option<String>) -> Result<Employee, String> {
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
}"""

new_login = """#[tauri::command]
pub fn login(db: State<Database>, session: State<SessionState>, email: String, password: Option<String>) -> Result<Employee, String> {
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
            
            let mut session_lock = session.session.lock().map_err(|e| e.to_string())?;
            *session_lock = Some(UserSession {
                id: id.clone(),
                role: role.clone()
            });
            
            Ok(Employee { id, name, email: email_db, department, position, role })
        },
        Err(_) => Err("Invalid email or password".to_string())
    }
}

#[tauri::command]
pub fn logout(session: State<SessionState>) -> Result<(), String> {
    let mut session_lock = session.session.lock().map_err(|e| e.to_string())?;
    *session_lock = None;
    Ok(())
}"""

content = content.replace(old_login, new_login)

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

new_check = """pub fn check_permission(session: &State<SessionState>, required_role: &str) -> Result<(), String> {
    let session_lock = session.session.lock().map_err(|e| e.to_string())?;
    if let Some(user_session) = &*session_lock {
        if user_session.role == "ADMIN" || user_session.role == required_role {
            return Ok(());
        }
    }
    Err(format!("Permission Denied: Requires {} role.", required_role))
}"""

content = content.replace(old_check, new_check)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
