use std::fs;
use std::path::PathBuf;
use rusqlite::Connection;

fn main() {
    println!("Setting up demo database...");
    
    // Use the real local app data path
    let local_app_data = std::env::var("LOCALAPPDATA").expect("LOCALAPPDATA not set");
    let real_dir = PathBuf::from(local_app_data).join("com.pulse.itops");
    fs::create_dir_all(&real_dir).unwrap();
    
    let db_path = real_dir.join("pulse.db");
    
    // if db_path exists, remove it
    if db_path.exists() {
        fs::remove_file(&db_path).unwrap();
    }
    
    // Just run the initialization logic from db.rs manually here
    let conn = Connection::open(&db_path).unwrap();
    
    conn.execute_batch(include_str!("../db.rs").split("pub const SCHEMA: &str = \"").nth(1).unwrap().split("\";").next().unwrap()).unwrap();
    
    // Seed demo data
    conn.execute_batch("
        INSERT OR REPLACE INTO settings (key, value) VALUES ('setup_complete', 'true');
        INSERT OR REPLACE INTO settings (key, value) VALUES ('demo_seeded', 'true');
        INSERT OR REPLACE INTO settings (key, value) VALUES ('AUTH_ENABLED', 'true');
        INSERT OR REPLACE INTO locations (id, name, type) VALUES ('loc_1', 'HQ Building', 'OFFICE');
        INSERT OR REPLACE INTO employees (id, name, email, role) VALUES ('emp_1', 'Alice Admin', 'alice@example.com', 'ADMIN');
        INSERT OR REPLACE INTO employees (id, name, email, role) VALUES ('emp_2', 'Bob Staff', 'bob@example.com', 'USER');
        INSERT OR REPLACE INTO hardware_assets (id, tag, category, status, make, model) VALUES ('hw_1', 'TAG-001', 'LAPTOP', 'IN_USE', 'Dell', 'XPS 15');
        INSERT OR REPLACE INTO inventory_items (id, sku, name, category, quantity, min_stock, max_stock) VALUES ('inv_1', 'CBL-01', 'HDMI Cable', 'ACCESSORY', 50, 10, 100);
        INSERT OR REPLACE INTO helpdesk_tickets (id, title, requester_id, status, priority, category) VALUES ('tkt_1', 'Laptop won''t boot', 'emp_2', 'OPEN', 'HIGH', 'HARDWARE');
    ").unwrap();
    
    println!("Database initialized and seeded successfully at {:?}", db_path);
}
