// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod commands;
mod commands_update_delete;
mod server;
mod ai;

use db::Database;
use commands::*;
use commands_update_delete::*;
use tauri::Manager;
use simplelog::*;
use std::fs::File;
use std::sync::{Arc, Mutex};

pub struct UserSession {
    pub id: String,
    pub role: String,
}

pub struct SessionState {
    pub session: Mutex<Option<UserSession>>,
}

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir)?;

            let log_file_path = app_dir.join("pulse.log");
            let _ = WriteLogger::init(
                LevelFilter::Info,
                Config::default(),
                File::options().create(true).append(true).open(log_file_path)?
            );
            log::info!("Starting Pulse IT Operations...");

            // Initialize database using the proper Tauri app data directory
            let database = Arc::new(Database::new(app_dir).map_err(|e| {
                log::error!("Failed to initialize database: {}", e);
                e
            })?);

            // Spawn local HTTP API server on background thread
            let db_clone = database.clone();
            tauri::async_runtime::spawn(async move {
                log::info!("Starting Axum HTTP server on port 3001...");
                crate::server::run_server(db_clone, 3001).await;
            });

            // Register shared state
            app.manage(database);
            app.manage(crate::ai::AIEngine::new());
            app.manage(SessionState {
                session: Mutex::new(None),
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running pulse");
}
