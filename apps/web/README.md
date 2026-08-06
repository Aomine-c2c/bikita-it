# Pulse IT Operations Platform

Pulse is an enterprise-grade IT Operations, Asset Management, Network Discovery, and Help Desk Platform designed for high-density IT environments.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Rust 1.75+ (for Tauri desktop app build)

### Running Desktop App (Development)
```bash
npm run tauri dev
```

### Running Web App (Development)
```bash
npm run dev
```

### Production Build
```bash
# Production Next.js Bundle
npm run build

# Production Desktop Binary
npm run tauri build
```

---

## 📖 Complete Documentation

Complete, in-depth documentation is available in [DOCUMENTATION.md](./DOCUMENTATION.md), covering:

1. **[Architecture](./DOCUMENTATION.md#1-system-overview--architecture)** — Desktop Tauri v2 + Next.js App Router + Rusqlite Architecture
2. **[Database Schema & ERD](./DOCUMENTATION.md#2-database-architecture--schema)** — SQLite Pragmas, WAL mode, Triggers, Table Specifications
3. **[API Reference](./DOCUMENTATION.md#3-api-reference--ipc-layer)** — Frontend SDK (`lib/api.ts`) & IPC Abstraction
4. **[Authentication](./DOCUMENTATION.md#4-authentication)** — Dual Desktop / Web Auth & Setup Guard
5. **[Permissions & RBAC](./DOCUMENTATION.md#5-permissions--rbac-matrix)** — ADMIN, MANAGER, TECHNICIAN, VIEWER Access Matrices
6. **[Modules Guide](./DOCUMENTATION.md#6-modules-guide)** — Assets, Inventory, Network, Locations, Employees, Maintenance, Helpdesk, Reports
7. **[Component Architecture](./DOCUMENTATION.md#7-component-architecture)** — Directory Layout & Dynamic Imports
8. **[Deployment & Packaging](./DOCUMENTATION.md#8-deployment--packaging)** — Desktop MSI/NSIS & Docker Deployment
9. **[Configuration](./DOCUMENTATION.md#9-configuration-files)** — `next.config.ts`, `Cargo.toml`, `eslint.config.mjs`
10. **[Environment Variables](./DOCUMENTATION.md#10-environment-variables)** — Configuration parameters
11. **[Installation Guide](./DOCUMENTATION.md#11-installation-guide)** — Full installation walkthrough
12. **[Maintenance & Administration](./DOCUMENTATION.md#12-maintenance--administration)** — Database VACUUM, REINDEX, and Health Checks
13. **[Troubleshooting Guide](./DOCUMENTATION.md#13-troubleshooting-guide)** — Diagnostics & Root Cause Solutions
14. **[Developer Guide](./DOCUMENTATION.md#14-developer-guide)** — Coding standards & Unit/E2E Testing
15. **[Administrator Guide](./DOCUMENTATION.md#15-administrator-guide)** — System provisioning & user management
16. **[User Guide](./DOCUMENTATION.md#16-user-guide)** — End-user operational workflows

---

## 🛡️ License

Enterprise Proprietary. All rights reserved.
