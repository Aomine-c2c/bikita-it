# Pulse IT Operations - Launch Notes (Beta)

## Deployment Instructions

Welcome to the beta release of Pulse IT Operations. The application is distributed as a standalone Desktop executable (packaged via Tauri).

### Installation Steps (Windows)
1. Navigate to the `apps/web/src-tauri/target/release/bundle/msi` or `nsis` directory after the build completes.
2. Locate the installer executable (e.g., `Pulse_0.2.0_x64_en-US.msi` or similar installer).
3. Run the installer and follow the standard installation prompts.
4. Launch "Pulse IT Operations" from your Start Menu.

**Note:** This is an unsigned testing build. Windows SmartScreen may prompt you with an "Unrecognized app" warning. You will need to click "More info" -> "Run anyway" to install it.

## Known Risks & Limitations

Please read the following risks carefully before using this beta version in a production capacity:

> [!WARNING]
> **1. Potential Local Data Loss**
> The application currently utilizes a local embedded SQLite database via the Tauri sidecar. **Data is stored solely on your local machine.** There is currently no automated cloud sync or remote backup functionality built-in. 
> 
> *Recommendation:* If you use this application for critical operations, manually back up your SQLite database file periodically or wait for a future version with built-in remote synchronization.

> [!WARNING]
> **2. Feature Incompleteness (API Integrations)**
> While the core CRUD operations (Assets, Inventory, Repairs, etc.) are functional through the local IPC layer, several advanced modules (such as automated network scanning routines and real-time remote telemetry) may be incomplete or missing. 
> 
> *Recommendation:* Verify module functionality with non-critical data before assuming full operational readiness.

## Troubleshooting

- **Login Failed / Connection Errors:** If you experience issues during login, ensure that the Tauri sidecar process has properly spun up. The login bypass uses `local-desktop-token`.
- **Database Errors:** Check the Tauri application logs (if running from terminal, observe standard output) for any SQLite initialization errors.

*These launch notes were compiled during the final readiness audit.*
