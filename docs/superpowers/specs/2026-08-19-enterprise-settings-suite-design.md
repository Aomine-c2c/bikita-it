# Enterprise Settings & System Administration Suite Design

## Overview

This specification details the architecture and implementation for upgrading the Settings & System Administration domain of BikitaIT into an Enterprise Management Suite, adhering strictly to the **zero-mock data policy**.

---

## 1. Core Architecture & Endpoints

### 1.1 Active Session Registry & Revocation

- **Backend Model / Store**: Track active login sessions with IP address, user-agent string, device type, issue timestamp, last active timestamp, and revoked status.
- **Endpoints**:
  - `GET /api/system/sessions`: Return all active sessions for current user and (if Super Admin) system-wide active sessions.
  - `POST /api/system/sessions/{session_id}/revoke`: Invalidate specific session token immediately.
  - `POST /api/system/sessions/revoke-others`: Invalidate all active sessions for the user except current session.

### 1.2 Database Backup Download & Safe In-Place Restore

- **Endpoints**:
  - `GET /api/system/database/backups/{filename}/download`: Stream binary `.sqlite3` file with `Content-Disposition: attachment`.
  - `POST /api/system/database/backups/{filename}/restore`:
    1. Create automated pre-restore safety snapshot (e.g. `pre_restore_safety_<timestamp>.sqlite3`).
    2. Atomic copy snapshot into active SQLite database file.
    3. Log operation in `OperationLog`.
    4. Return success status and pre-restore backup filename.

### 1.3 Live Notification & Webhook Diagnostic Probe

- **Endpoints**:
  - `POST /api/settings/notifications/test-email`:
    - Payload: `{ "smtp_server": str, "smtp_port": int, "recipient_email": str, "sender_email": str, "use_tls": bool }`
    - Logic: Connect to SMTP server, measure TCP handshake + HELO latency in ms, send test email or return socket error details.
  - `POST /api/settings/notifications/test-webhook`:
    - Payload: `{ "webhook_url": str, "service_type": "slack" | "teams" | "discord" | "custom" }`
    - Logic: HTTP POST test payload with timestamp, measuring response latency (ms) and returning HTTP status code and response body snippet.

### 1.4 Taxonomies & Custom Configuration

- **Endpoints**:
  - `GET /api/system/taxonomies`: Retrieve saved category lists, SLA thresholds, and status configurations.
  - `PATCH /api/system/taxonomies`: Update taxonomies persisted in JSON storage or DB.

---

## 2. Frontend Interface Enhancements

### 2.1 Settings Tabs & Control Panels (`apps/web/src/app/settings/page.tsx`)

- **Security & Active Sessions Tab**:
  - Display Active Sessions card with Browser/OS icon, IP address, Login time, and "Revoke" button.
  - "Revoke All Other Sessions" button.
- **Database & Disaster Recovery Tab**:
  - Add "Download" button on each backup snapshot card.
  - Add "Restore Snapshot" modal with confirmation and pre-restore rollback warning.
- **Notifications & Webhooks Tab**:
  - "Send Test Email" modal with live latency & diagnostic log terminal viewer.
  - "Test Webhook" button with instant HTTP response code and latency badge.
- **Taxonomies Tab**:
  - Add/Remove custom asset categories and department nodes with instant saving.

---

## 3. Verification Plan

- **Django Unit Tests**: Add test cases for session registry, backup download/restore, and notification test handlers in `core.tests`.
- **Frontend Typecheck & Vitest**: Verify `npm --prefix apps/web run typecheck` and `npm --prefix apps/web test -- --run`.
