# Student & Staff Self-Service Portal Suite Design

## Overview

This specification details the architecture, data models, and user experience for the upgraded **Student & Staff Self-Service Portal** of BikitaIT. The design strictly adheres to the **zero-mock data policy**, integrating real Django database models, live network diagnostic probes, equipment loan reservation workflows, and predictive self-resolution knowledge bases.

---

## 1. Core Architecture & Data Models

### 1.1 Equipment Loan Model (`apps/api/core/models.py`)

- **Model Name**: `EquipmentLoan` (subclassing `TimeStampedSoftDeleteModel`)
- **Fields**:
  - `tracking_code`: `CharField(max_length=32, unique=True, db_index=True)` (e.g. `LOAN-84920`)
  - `requester_name`: `CharField(max_length=255)`
  - `requester_email`: `EmailField()`
  - `requester_id`: `CharField(max_length=50)` (Student Registration Number or Staff ID)
  - `requester_phone`: `CharField(max_length=50, blank=True, null=True)`
  - `department`: `CharField(max_length=100, blank=True, null=True)`
  - `purpose`: `TextField()`
  - `equipment_category`: `CharField(max_length=100, default='Laptop')`
  - `specific_asset`: `ForeignKey(Asset, null=True, blank=True, on_delete=models.SET_NULL)`
  - `start_date`: `DateTimeField(default=timezone.now)`
  - `expected_return_date`: `DateTimeField()`
  - `actual_return_date`: `DateTimeField(null=True, blank=True)`
  - `status`: `CharField(max_length=50, default='PENDING_APPROVAL')`
    - Choices: `PENDING_APPROVAL`, `APPROVED`, `CHECKED_OUT`, `RETURNED`, `OVERDUE`, `REJECTED`, `CANCELLED`
  - `technician_notes`: `TextField(blank=True, null=True)`
  - `approved_by`: `ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL)`

---

## 2. API Endpoints (`apps/api/core/routers/portal.py`)

### 2.1 Hardware Loan & Checkout Endpoints
- `GET /api/portal/loans/available-equipment`: Returns categories and counts of active assets currently available for loan checkout.
- `POST /api/portal/loans/request`: Submits loan request, validates duration (≤ 14 days) and institutional ID, and generates unique tracking code (`LOAN-XXXXX`).
- `GET /api/portal/loans/track/{tracking_code}`: Returns loan details, reservation status, pickup instructions, and timeline.
- `POST /api/portal/loans/{loan_id}/cancel`: Public cancel action for pending loan requests.
- `POST /api/portal/loans/{loan_id}/status`: Technician management endpoint to transition status (`APPROVED`, `CHECKED_OUT`, `RETURNED`, `REJECTED`).
- `GET /api/portal/loans`: Authenticated technician roster of all loans.

### 2.2 Campus Diagnostics & Telemetry
- `GET /api/portal/diagnostics/ping`: Timestamped probe returning server timestamp, database response time, and campus gateway health.

### 2.3 Knowledge Base & Predictive Suggester
- `GET /api/portal/knowledge/search?q={query}`: Search over `KnowledgeArticle` database records.
- `GET /api/portal/knowledge/suggest?title={title}&desc={desc}`: Predictive matching returning top 3 relevant troubleshooting articles based on title/category keywords.

---

## 3. Frontend Architecture (`apps/web/src/app/portal/page.tsx`)

### 3.1 Portal Tabs & User Workflows
1. **Report an Issue**:
   - Issue category & priority selection.
   - Predictive Quick-Fix cards appear dynamically as user types title/description.
   - One-click attach of client diagnostic telemetry.
2. **Equipment Loan Desk**:
   - Hardware category cards (Laptops, Projectors, Lab Testing Kits, AV Adapters).
   - Loan booking form (Student/Staff ID, Name, Email, Expected Return Date).
   - Generates immediate digital voucher with tracking code.
3. **Campus Health Scanner**:
   - Real-time latency ping meter, connection downlink estimate, browser environment snapshot.
   - "Attach Diagnostics to Ticket" quick button.
4. **Knowledge Base & FAQ**:
   - Campus IT guides (Eduroam Wi-Fi, Lab Printers, VPN, Email/MFA recovery).
   - Direct search bar with tag filters.
5. **Track Request**:
   - Universal search supporting both `TCK-XXXXX` and `LOAN-XXXXX` codes.
   - Step progress bar and timeline updates.

---

## 4. Verification Plan

### 4.1 Backend Django Unit Tests (`core.tests.PortalSuiteTests`)
- `test_loan_request_creation_and_tracking_code`
- `test_loan_status_transitions_by_technician`
- `test_diagnostics_ping_latency`
- `test_predictive_knowledge_suggestions`

### 4.2 Frontend Type Checking & Vitest
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web test -- --run`
