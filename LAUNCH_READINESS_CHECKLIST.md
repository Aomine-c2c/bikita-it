# BikitaIT Production Launch Readiness & Verification Checklist

**Platform:** Bikita IT Operations Monorepo (Next.js 16 / React 19 + Django 5.2 Ninja REST API)  
**Governance:** 5-Tier Institutional RBAC (`SUPER_ADMIN`, `HOD`, `TECHNICIAN`, `EMPLOYEE`, `STUDENT`)  
**Helpdesk:** Dual Authenticated & Anonymous Public Reporting with Reference Code Tracking (`TIK-XXXXXX`)  
**Status:** **READY FOR PRODUCTION / STAGING DEPLOYMENT**

---

## 📋 Interactive Verification & Manual Smoke Guide

Follow these steps sequentially to verify all system capabilities end-to-end.

---

### Phase 1: Service Startup

1. **Start the Django Backend API**:
   ```powershell
   cd c:\Users\armut\404\BikitaIT\apps\api
   .\venv\Scripts\activate
   python manage.py migrate
   python manage.py runserver 3001
   ```
   - **Verification**: Open [http://127.0.0.1:3001/api/settings](http://127.0.0.1:3001/api/settings) in your browser.
   - **Expected Result**: JSON payload with `settings` and `dbStatus` (SQLite active, version displayed).

2. **Start the Next.js Frontend Web App**:
   ```powershell
   cd c:\Users\armut\404\BikitaIT\apps\web
   npm run dev
   ```
   - **Verification**: Open [http://localhost:3000](http://localhost:3000) in your browser.
   - **Expected Result**: Clean redirect to `/login` or 3D Mahoraga wheel welcome screen.

---

### Phase 2: Public Anonymous Helpdesk Flow (No Login Required)

- [ ] **Step 1: Open Public Helpdesk Portal**
  - Navigate to: **`http://localhost:3000/portal`**
  - **Verify**: Form renders with Category buttons (Hardware, Network, Software, AV, etc.), Priority selector, Contact inputs, and no login prompt.

- [ ] **Step 2: Submit an Incident Report**
  - Fill in:
    - **Category**: `Hardware & PC`
    - **Title**: `Monitor power cycling intermittently`
    - **Description**: `The Dell display in Lab 2 turns off every few minutes.`
    - **Priority**: `High`
    - **Reporter Name**: `Kudzi Moyo`
    - **Email**: `kudzi@student.bikita.ac.zw`
    - **Location**: `Block B, Lab 2`
  - Click **"Submit Incident Report"**.
  - **Verify**: Green confirmation banner appears showing unique tracking code (e.g. `TIK-84920`) with a "Copy" button.

- [ ] **Step 3: Track Ticket Status via Reference Code**
  - Click **"View Ticket Status"** or navigate to `http://localhost:3000/portal/track/TIK-84920`.
  - **Verify**: Live status badge (`NEW`), Priority (`High`), Reporter (`Kudzi Moyo`), and Timeline log are displayed.
  - **Verify Follow-up Note**: Type a message in "Add Note" (e.g. `Tested with another power brick`) and click **"Send Note"**. Note appears instantly on the public timeline.

---

### Phase 3: Super Admin Governance & User Provisioning

- [ ] **Step 4: Super Admin Login**
  - Navigate to: **`http://localhost:3000/login`**
  - Enter credentials:
    - **Username**: `admin`
    - **Password**: (Your admin password configured during setup)
  - **Verify**: Successfully navigates to the main Dashboard (`/`) with full 13-item sidebar.

- [ ] **Step 5: Provision Accounts for Institutional Tiers**
  - Navigate to: **`http://localhost:3000/settings`**
  - Select the **"User Provisioning"** section on the left.
  - **Create a Head of Department (HOD)**:
    - **Username**: `hod_cs`
    - **Full Name**: `Dr. Tariro Mapfumo`
    - **Email**: `t.mapfumo@institution.ac.zw`
    - **Role**: `Head of Dept (HOD)`
    - **Password**: `Password123!`
    - Click **"Create Account"** -> **Verify**: `hod_cs` appears in Active System Accounts roster.
  - **Create an IT Technician**:
    - **Username**: `tech_anesu`
    - **Full Name**: `Anesu Gono`
    - **Email**: `anesu.tech@institution.ac.zw`
    - **Role**: `Technician`
    - **Password**: `Password123!`
    - Click **"Create Account"** -> **Verify**: `tech_anesu` appears in roster.
  - **Create a Student**:
    - **Username**: `student_kudzi`
    - **Full Name**: `Kudzi Moyo`
    - **Email**: `kudzi.moyo@student.bikita.ac.zw`
    - **Role**: `Student`
    - **Password**: `Password123!`
    - Click **"Create Account"** -> **Verify**: `student_kudzi` appears in roster.

---

### Phase 4: Dynamic Permissions Matrix Configuration

- [ ] **Step 6: Configure Role Capabilities**
  - In **Settings**, select the **"Permissions Matrix"** tab.
  - Select **"Head of Dept (HOD)"**:
    - Toggle `can_approve` for `assets` and `tickets`.
    - Click **"Save Matrix"** -> **Verify**: Green "Saved" confirmation.
  - Select **"Technician"**:
    - Verify `can_read` and `can_write` are enabled for `assets`, `inventory`, `tickets`, `repairs`, and `network`.
  - Select **"Super Admin"**:
    - Verify root banner confirms immutable full access across all modules.

---

### Phase 5: Multi-Role Access & UI Segregation Testing

- [ ] **Step 7: Verify IT Technician Experience**
  - Log out and log in as `tech_anesu` / `Password123!`.
  - **Verify Sidebar**: Contains operational tools (Dashboard, Assets, Inventory, Accessories, Repairs, Helpdesk, Network, Cameras, Locations, Software, Knowledge, Audit).
  - **Verify Restrictions**: `Settings` administration tab is hidden from sidebar.
  - Navigate to **Helpdesk (`/helpdesk`)**:
    - Locate the ticket submitted by `Kudzi Moyo` (`Monitor power cycling intermittently`).
    - Change status from `NEW` to `IN_PROGRESS` or `RESOLVED`.
    - Assign to `Anesu Gono`.
  - Re-check public link `http://localhost:3000/portal/track/TIK-84920` in incognito window -> Status immediately shows `IN_PROGRESS` assigned to `Anesu Gono`.

- [ ] **Step 8: Verify Student Experience**
  - Log out and log in as `student_kudzi` / `Password123!`.
  - **Verify Sidebar**: Tailored specifically for student tier (Helpdesk, Knowledge Base, My Assets, Activity).
  - Restricted modules (Inventory, Network Scanner, Employee Roster, Admin Settings) are omitted.

---

### Phase 6: Automated Test Verification Commands

Run these automated verification commands to ensure zero regressions:

```powershell
# 1. Django Backend Full Test Suite (15 tests, including backup & integrity suite)
apps\api\venv\Scripts\python.exe apps/api/manage.py test core

# 2. Next.js Frontend TypeScript Typecheck (0 errors)
npm --prefix apps/web run typecheck

# 3. Frontend Vitest Unit & Integration Suites (14 tests)
npm --prefix apps/web test -- --run

# 4. Database Integrity Diagnostic Check
apps\api\venv\Scripts\python.exe apps/api/manage.py safe_migrate --integrity-check

# 5. On-Demand Pre-Upgrade Database Snapshot
apps\api\venv\Scripts\python.exe apps/api/manage.py safe_migrate --backup-only

# 6. Automated Safe Upgrade with Snapshot & Automatic Rollback
apps\api\venv\Scripts\python.exe apps/api/manage.py safe_migrate
```

---

## 🛡️ Database Safeguards & Upgrade Protection Architecture

To guarantee zero data loss during platform upgrades and schema migrations:

1. **Automated Pre-Migration Snapshots**:
   - Whenever `safe_migrate` runs (via CLI or UI button in Settings), an atomic snapshot is preserved in `/backups/db_snapshot_YYYYMMDD_HHMMSS.bak`.
   - A SHA-256 integrity checksum is calculated and stored in `backups/manifest.json`.

2. **Atomic Rollback Safeguard**:
   - If any migration fails or raises an error, the engine automatically rolls back the live database to the exact pre-migration snapshot.

3. **PRAGMA & Foreign Key Integrity Verification**:
   - Post-upgrade diagnostics run `PRAGMA integrity_check` and `PRAGMA foreign_key_check` across all 28 tables to guarantee data consistency.

4. **Super Admin UI Backup & Restore Center**:
   - Located in **Settings -> Database & Backup**:
     - Live Engine health metrics & size diagnostics.
     - **"Instant Backup"** button for on-demand snapshots.
     - **"Run Safe Migration"** button for 1-click UI upgrades.
     - Versioned snapshot history table with copyable SHA-256 checksums.

---

## 📊 Formatted Excel Spreadsheets & Physical Print Sheets

Every operational module now supports instant 1-click **Excel Spreadsheet Exports** (.xls/.xlsx compatible) and **Official Print Sheets**:

1. **Hardware Device Roster ([/assets](file:///c:/Users/armut/404/BikitaIT/apps/web/src/app/assets/page.tsx))**:
   - **Excel Export**: Tag, Name, Category, Make/Model, Serial, Status, Assignee, Location, Cost, and Date with summary chips.
   - **Print Sheet**: Formatted institutional letterhead layout ready for A4 landscape clipboard or paper audit.

2. **Network Infrastructure ([/network](file:///c:/Users/armut/404/BikitaIT/apps/web/src/app/network/page.tsx))**:
   - **Excel Export**: Device Name, IP, MAC, Switch Type, Status, Latency ms, Location, Last Seen.
   - **Print Sheet**: Clean network topology device list with online/offline tally.

3. **Consumables & Inventory ([/inventory](file:///c:/Users/armut/404/BikitaIT/apps/web/src/app/inventory/page.tsx))**:
   - **Excel Export**: SKU, Item Name, Category, Qty, Min Stock, Bin Location, Status, Unit Cost.
   - **Print Sheet**: Warehouse inventory audit count sheet.

4. **Helpdesk & Service Tickets ([/helpdesk](file:///c:/Users/armut/404/BikitaIT/apps/web/src/app/helpdesk/page.tsx))**:
   - **Excel Export**: Tracking Code, Title, Category, Priority, Status, Reporter, Assigned Tech, Date.
   - **Print Sheet**: Service desk physical docket summary.

5. **Executive Analytics ([/reports](file:///c:/Users/armut/404/BikitaIT/apps/web/src/app/reports/page.tsx))**:
   - Multi-format exports: Excel Spreadsheet, CSV dataset, and PDF executive reports.

---

## 🚀 Production Deployment Checklist

| Item | Requirement | Config Location | Status |
| :--- | :--- | :--- | :--- |
| **Database** | SQLite for single instance; PostgreSQL via `DATABASE_URL` for distributed cluster | `apps/api/.env` | Ready |
| **Backups & Safeguards** | Automated snapshots, SHA-256 checksums, atomic rollback, `safe_migrate` CLI/UI | `core/backup_service.py` | Ready |
| **Excel & Print Copies** | Styled .xls spreadsheets + `@media print` landscape institutional sheets | `src/lib/excelExport.ts` | Ready |
| **Security** | `DEBUG=False`, strong `SECRET_KEY`, HTTPS `ALLOWED_ORIGINS` | `apps/api/config/settings.py` | Ready |
| **Authentication** | JWT Access & Refresh tokens with embedded role and department claims | `core/auth_controller.py` | Ready |
| **Public Portal** | Public endpoints `/api/tickets/public` & `/portal` bypass auth | `core/routers/tickets_repairs.py` | Ready |
| **RBAC Matrix** | Server-side permission evaluators on all endpoints | `core/permissions.py` | Ready |


