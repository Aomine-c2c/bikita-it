// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod commands;

use db::Database;
use commands::*;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            let database = Database::new(app_dir).expect("failed to initialize native SQLite database");
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            check_setup,
            initialize_setup,
            get_dashboard_stats,
            get_assets,
            create_asset,
            get_inventory,
            get_employees,
            get_locations,
            get_repairs,
            get_connected_devices,
            seed_demo_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running xiphos");
}
