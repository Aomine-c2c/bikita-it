@echo off
cd /d "%~dp0apps\web"
echo Starting Pulse Dev Environment...
echo   API Server ^> http://127.0.0.1:3001/api
echo   Frontend   ^> http://localhost:3000
npx concurrently -n API,WEB -c cyan,magenta "cargo run --bin api-server --manifest-path src-tauri/Cargo.toml" "npx next dev -H 0.0.0.0"
