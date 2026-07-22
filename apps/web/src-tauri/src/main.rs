// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use std::net::TcpListener;
use std::sync::Mutex;

struct ApiPort(Mutex<u16>);

#[tauri::command]
fn get_api_port(port: tauri::State<ApiPort>) -> u16 {
    *port.0.lock().unwrap()
}

fn get_free_port() -> u16 {
    TcpListener::bind("127.0.0.1:0")
        .expect("Failed to bind to a free port")
        .local_addr()
        .unwrap()
        .port()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).ok();

            // Allocate a random free port for the NestJS sidecar
            let port = get_free_port();
            app.manage(ApiPort(Mutex::new(port)));

            let db_path = app_dir.join("xiphos.db");
            
            // Check if we need to copy the bundled seed database
            if !db_path.exists() {
                let resource_dir = app.path().resource_dir().unwrap();
                let bundled_db_path = resource_dir.join("prisma").join("dev.db");
                if bundled_db_path.exists() {
                    std::fs::copy(&bundled_db_path, &db_path).expect("Failed to copy initial database");
                }
            }
            
            let db_url = format!("file:{}", db_path.display());

            // JWT secret — generate a fixed per-install secret stored in app data
            let jwt_secret_path = app_dir.join("jwt.secret");
            let jwt_secret = if jwt_secret_path.exists() {
                std::fs::read_to_string(&jwt_secret_path)
                    .unwrap_or_else(|_| "xiphos-fallback-secret-2024".to_string())
            } else {
                // Generate a random 32-byte hex secret on first launch
                use std::time::{SystemTime, UNIX_EPOCH};
                let ts = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_nanos();
                let secret = format!("xiphos-{:x}-secret", ts);
                let _ = std::fs::write(&jwt_secret_path, &secret);
                secret
            };

            let resource_dir = app.path().resource_dir().unwrap();
            let query_engine_path = resource_dir.join("query_engine-windows.dll.node");

            // Spawn the NestJS API sidecar
            let sidecar_command = app.shell().sidecar("api-server").unwrap()
                .env("PORT", port.to_string())
                .env("DATABASE_URL", db_url)
                .env("JWT_SECRET", jwt_secret)
                .env("NODE_ENV", "production")
                .env("PRISMA_QUERY_ENGINE_LIBRARY", query_engine_path.to_str().unwrap())
                .env("ALLOWED_ORIGINS", "tauri://localhost,http://tauri.localhost,https://tauri.localhost,http://127.0.0.1,http://localhost");

            let (_rx, _child) = sidecar_command.spawn().expect("Failed to spawn API sidecar");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_api_port])
        .run(tauri::generate_context!())
        .expect("error while running xiphos");
}

