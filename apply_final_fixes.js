const fs = require('fs');

let content = fs.readFileSync('apps/web/src-tauri/src/commands.rs', 'utf8');

// 1. Update seed_demo_data
const seedTarget = `    // Network services
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
}`;

const seedReplacement = `    // Network services
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

    // Connected Devices
    let devices = vec![
        ("srv-01", "00:1A:2B:3C:4D:5E", "10.0.1.10", "Linux", "Server", "CONNECTED"),
        ("ws-sales-01", "00:1A:2B:3C:4D:5F", "10.0.2.14", "Windows 11", "Desktop", "CONNECTED"),
        ("ap-floor2", "00:1A:2B:3C:4D:60", "10.0.1.250", "Ubiquiti OS", "Access Point", "OFFLINE"),
        ("prn-hr-01", "00:1A:2B:3C:4D:61", "10.0.3.5", "Printer OS", "Printer", "CONNECTED"),
    ];
    for (host, mac, ip, os, dtype, status) in &devices {
        conn.execute(
            "INSERT OR IGNORE INTO connected_devices (id, hostname, mac_address, ip_address, os, device_type, connection_status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![Uuid::new_v4().to_string(), host, mac, ip, os, dtype, status],
        ).ok();
    }

    // Software Licenses
    let software = vec![
        ("Microsoft 365 E3", "Latest", "Microsoft", 100, 85, 36.0, "2027-01-01", "Active"),
        ("Adobe Creative Cloud", "2024", "Adobe", 20, 20, 82.5, "2025-12-31", "Active"),
        ("AutoCAD", "2024", "Autodesk", 5, 2, 1775.0, "2026-05-15", "Active"),
        ("Legacy CRM", "v4.5", "OldCorp", 50, 50, 10.0, "2023-01-01", "Expired"),
    ];
    for (name, ver, vendor, total, assigned, cost, expiry, status) in &software {
        conn.execute(
            "INSERT OR IGNORE INTO software_licenses (id, name, version, vendor, total_seats, assigned_seats, cost_per_seat, expiry_date, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![Uuid::new_v4().to_string(), name, ver, vendor, total, assigned, cost, expiry, status],
        ).ok();
    }

    // Helpdesk Tickets
    let tickets = vec![
        ("Cannot access VPN", "Alice", "In Progress", "High", "Bob", "Network"),
        ("Requesting new monitor", "John", "Backlog", "Low", "", "Hardware"),
        ("Adobe CC License expired", "Sarah", "Resolved", "Medium", "Alice", "Software"),
        ("Server Room A temperature alert", "System", "Waiting on IT", "Critical", "Bob", "Hardware"),
    ];
    for (title, req, status, prio, assignee, cat) in &tickets {
        let assignee_opt = if assignee.length === 0 ? null : assignee;
        let p_assignee = assignee_opt ? assignee_opt : null;
        conn.execute(
            "INSERT OR IGNORE INTO helpdesk_tickets (id, title, requester, status, priority, assignee, category) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![Uuid::new_v4().to_string(), title, req, status, prio, assignee === "" ? None::<&str> : Some(assignee), cat],
        ).ok();
    }

    Ok(true)
}`;

content = content.replace(seedTarget, seedReplacement);

// 2. Fix ask_ai stub
const askAiTarget = `#[tauri::command]\npub fn ask_ai() -> Result<serde_json::Value, String> { Ok(serde_json::Value::Null) }`;
const askAiReplacement = `#[tauri::command]\npub fn ask_ai(db: tauri::State<crate::Database>, query: String) -> Result<crate::ai::AIResponse, String> {\n    let conn = db.conn.lock().unwrap();\n    let engine = crate::ai::AIEngine::new();\n    engine.process(&query, &conn)\n}`;
content = content.replace(askAiTarget, askAiReplacement);

// 3. Fix get_software_licenses stub
const licenseTarget = `#[tauri::command]\npub fn get_software_licenses() -> Result<serde_json::Value, String> { Ok(serde_json::Value::Null) }`;
const licenseReplacement = `#[tauri::command]
pub fn get_software_licenses(db: tauri::State<crate::Database>) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name, version, vendor, total_seats, assigned_seats, cost_per_seat, expiry_date, status, created_at FROM software_licenses").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "name": row.get::<_, String>(1)?,
            "version": row.get::<_, Option<String>>(2)?,
            "vendor": row.get::<_, Option<String>>(3)?,
            "totalSeats": row.get::<_, i32>(4)?,
            "assignedSeats": row.get::<_, i32>(5)?,
            "costPerSeat": row.get::<_, f64>(6)?,
            "expiryDate": row.get::<_, Option<String>>(7)?,
            "status": row.get::<_, String>(8)?,
            "createdAt": row.get::<_, String>(9)?,
        }))
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        if let Ok(r) = row { result.push(r); }
    }
    Ok(serde_json::json!(result))
}`;
content = content.replace(licenseTarget, licenseReplacement);

// 4. Fix get_helpdesk_tickets stub
const ticketsTarget = `#[tauri::command]\npub fn get_helpdesk_tickets() -> Result<serde_json::Value, String> { Ok(serde_json::Value::Null) }`;
const ticketsReplacement = `#[tauri::command]
pub fn get_helpdesk_tickets(db: tauri::State<crate::Database>) -> Result<serde_json::Value, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, title, requester, status, priority, assignee, category, created_at FROM helpdesk_tickets").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "title": row.get::<_, String>(1)?,
            "requester": row.get::<_, String>(2)?,
            "status": row.get::<_, String>(3)?,
            "priority": row.get::<_, String>(4)?,
            "assignee": row.get::<_, Option<String>>(5)?,
            "category": row.get::<_, String>(6)?,
            "createdAt": row.get::<_, String>(7)?,
        }))
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        if let Ok(r) = row { result.push(r); }
    }
    Ok(serde_json::json!(result))
}`;
content = content.replace(ticketsTarget, ticketsReplacement);

fs.writeFileSync('apps/web/src-tauri/src/commands.rs', content);
console.log('Applied final fixes!');
