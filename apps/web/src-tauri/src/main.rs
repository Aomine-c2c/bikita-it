// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod commands;

use db::Database;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            let database = Database::new(app_dir).expect("failed to initialize database");
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::check_setup,
            commands::initialize_setup,
            commands::get_dashboard_stats,
            commands::get_assets,
            commands::create_asset,
            commands::get_inventory,
            commands::get_employees,
            commands::get_locations,
            commands::get_repairs,
            commands::get_connected_devices,
            commands::seed_demo_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running xiphos");
}
