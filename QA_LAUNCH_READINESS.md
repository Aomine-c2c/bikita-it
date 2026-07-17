# Independent Launch-Readiness QA Report

**Test date:** 17 July 2026
**Environment:** Production-built non-production Next.js preview; backend/database unavailable
**Tested URL:** http://192.168.1.145:3000 (also supplied locally as http://127.0.0.1:3000)
**Recommendation:** **NO-GO** for public or production launch.

## Executive result

The web shell and all nine primary navigation routes render quickly, metadata and basic hardening headers are present, and setup fields use native required/email validation. However, the application is not functionally launchable: every tested database-backed request returns HTTP 500, operational screens mix empty live data with convincing hard-coded KPIs, privileged content and administrative settings are available without login, and operational CRUD API routes have no authorization enforcement. Invalid asset IDs also render fabricated sensitive-looking asset details with HTTP 200. A real PostgreSQL environment, migrations, authenticated API, and complete end-to-end retest are mandatory.

## Flow results

- **Dashboard `/`: FAIL.** Shell renders, but console records two HTTP 500 resource errors and database-backed dashboard content cannot be trusted.
- **Asset Lifecycle `/assets`: FAIL.** Graceful “API offline — unable to load assets” banner appears, but list is unusable; displayed category counts remain hard-coded. Add/import/export could not be meaningfully completed without API. Invalid `/assets/nonexistent` returns HTTP 200, says “Asset not found,” then shows fabricated asset/network/user/ticket details.
- **Inventory `/inventory`: FAIL.** Empty directory conflicts with populated KPIs: 14,295 total items, 142 low stock, 18 out of stock, 45 active loans. Receive/export cannot be validated end-to-end.
- **Maintenance `/repairs`: FAIL.** “No repairs found” conflicts with KPIs: 12 repairs today, 8 waiting parts, 4 vendor RMAs, 145 completed MTD.
- **Network `/network`: FAIL.** Rich topology, IP/MAC/device/alert data is publicly visible and appears static while live API is unavailable; discovery actions cannot be validated safely end-to-end.
- **Locations `/locations`: FAIL.** Route renders but has no live locations.
- **Employees `/employees`: FAIL.** Route renders but no live directory; unauthenticated personnel administration is exposed.
- **Reports `/reports`: FAIL.** Financial/operational figures render without a working data source or login, including $1.24M IT spend and $892K active asset value; scheduling/email/export cannot be validated end-to-end.
- **Settings `/settings`: FAIL.** Unauthenticated visitor can open Security & Auth, Database & Backup, Users & Roles, MFA, audit, session, IP-range and setup controls.
- **Initial setup `/setup`: PARTIAL PASS / BLOCKED.** Direct route renders; empty required fields and email type use browser validation (“Please fill out this field”). Completion was not submitted because API/database is unavailable and account creation is destructive. Setup status endpoint returns 500.
- **Navigation/broken links: PARTIAL PASS.** All nine sidebar links return 200. Dynamic invalid IDs incorrectly return 200 instead of a consistent 404/error state.
- **Responsive: FAIL.** Source and rendered structure show a fixed 260px sidebar with no mobile drawer/breakpoint and fixed 32px main padding; this materially constrains phone layouts. First-run tour close control was outside the automation viewport and repeatedly blocked interaction.
- **Keyboard/accessibility: FAIL.** Navigation links are semantic, but clickable user-profile containers are `div` elements without keyboard role/tab semantics; several icon buttons rely on `title` or lack stable accessible names; settings inputs have no form/name attributes. No skip link was found. Tour overlay impaired operability.
- **Performance: PASS for static shell only.** Direct warm HTTP responses were 2–18ms for prerendered primary routes; browser navigation was approximately 0.69–1.37s. API endpoints failed in ~7ms, so real data performance is untested.
- **Metadata/security headers: PARTIAL PASS.** Title “Xiphos IT Operations Platform,” description “Enterprise IT Asset Management and Operations,” `lang=en`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and restrictive Permissions-Policy are present; framework disclosure is disabled. CSP and HSTS were absent; HSTS is expected only after HTTPS deployment.

## Defects

### QA-01 — Critical — No authentication/authorization boundary
**Steps:** 1. Open a fresh session. 2. Visit `/settings`, `/employees`, `/reports`, `/network`, or `/assets` directly. 3. Observe no login challenge and access Security & Auth, Users & Roles, financial reports, network details, and write affordances.
**Expected:** Anonymous users are redirected/denied; server enforces role authorization for every read/write.
**Actual:** All routes return 200 and privileged UI is exposed. Prior code audit also confirms operational CRUD routes do not enforce production auth.
**Impact:** Unauthorized disclosure/change of personnel, inventory, infrastructure, financial and security configuration data.

### QA-02 — Critical — Backend/database unavailable; core API returns 500
**Steps:** Request `/api/setup/status` and `/api/assets`, or open dashboard/assets and inspect console.
**Expected:** Healthy JSON responses or controlled 503 with actionable UI.
**Actual:** Both endpoints return HTTP 500 `Internal Server Error`; dashboard console records two “Failed to load resource: server responded with 500” errors. Assets shows API offline; other modules silently show empty data.
**Evidence:** HTTP probes: `/api/setup/status` 500 in 7ms; `/api/assets` 500 in 7ms.
**Impact:** Core CRUD, setup, reporting, data integrity and authorization cannot be tested or used.

### QA-03 — High — Static metrics/details misrepresent unavailable live data
**Steps:** With API unavailable, visit inventory, repairs, reports, network, then `/assets/nonexistent`.
**Expected:** Consistent unavailable/empty state, never invented production facts.
**Actual:** Inventory says 14,295 items while directory is empty; repairs says 12 today while list is empty; reports show $1.24M; network shows live topology/IP/MAC/alerts; invalid asset shows “Asset not found” plus Sarah Jenkins, IP/MAC, battery, ticket and hardware details.
**Impact:** Users may make operational decisions from fabricated/stale data; privacy/security confusion.

### QA-04 — High — Invalid dynamic asset ID returns 200 and contradictory fabricated record
**Steps:** Visit `/assets/nonexistent`.
**Expected:** HTTP 404 with a single clear not-found view and no record data/actions.
**Actual:** HTTP 200; page displays “Asset not found” followed by detailed device, network, user and ticket content and actions.
**Impact:** Broken deep-link semantics, indexing/caching problems, and severe trust/privacy concern.

### QA-05 — High — Public first-admin setup exposure cannot verify initialized state
**Steps:** Open `/setup` directly in an anonymous session; query `/api/setup/status`.
**Expected:** Wizard shown only when securely verified uninitialized; otherwise redirect/deny.
**Actual:** Wizard renders while status endpoint returns 500.
**Impact:** Risk of initialization takeover if deployed with a reachable, uninitialized or misconfigured database.

### QA-06 — Medium — Mobile navigation/layout not launch-ready
**Steps:** Inspect dashboard at phone width/responsive structure.
**Expected:** Sidebar becomes a drawer or compact mobile navigation; content retains usable width and padding.
**Actual:** Sidebar always animates between fixed 260px/64px widths with no responsive breakpoint or mobile menu; main uses fixed `px-8`.
**Impact:** Primary navigation and tables are materially constrained on phones.

### QA-07 — Medium — Guided tour blocks interaction and is mounted on every route
**Steps:** Use a clean browser profile; wait 1.5 seconds on any route. Attempt Close. Navigate to another route before completion.
**Expected:** Accessible, reachable modal controls; tour limited to compatible dashboard context and dismissal reliably persisted.
**Actual:** Close was reported outside viewport in repeated browser attempts; tour appears on setup and operational pages and prevented ordinary control testing.
**Impact:** First-use abandonment and keyboard/mobile accessibility risk.

### QA-08 — Medium — Accessibility semantics incomplete
**Steps:** Keyboard-navigate header/sidebar/settings and inspect interactive semantics.
**Expected:** Every control is focusable, named, and operable by keyboard; labeled form controls and skip navigation exist.
**Actual:** User profile navigation is an `onClick` div; some icon buttons have no explicit accessible label; settings controls lack form/name semantics; no skip link found.
**Impact:** WCAG keyboard/name-role-value failures for assistive-technology users.

### QA-09 — Medium — Missing CSP; HTTPS/HSTS production posture unverified
**Steps:** Inspect response headers for `/`.
**Expected:** Production security policy includes a tested CSP and HTTPS deployment supplies HSTS.
**Actual:** nosniff/referrer/permissions headers exist, but CSP is absent; preview is HTTP so HSTS/TLS cannot be assessed.
**Impact:** Reduced defense in depth against script injection; transport readiness unknown.

## Launch gates

1. Provision non-production PostgreSQL/Redis with placeholder-free secrets; run `prisma migrate deploy` and confirm migration status.
2. Implement login/session management and deny-by-default server-side RBAC on every API route; protect setup with atomic initialized-state enforcement.
3. Remove or clearly label mock data; render consistent API failure states; correct invalid-ID 404 behavior.
4. Implement and test mobile navigation plus accessible tour/dialog and keyboard semantics.
5. Add CSP, deploy behind HTTPS, validate HSTS/cookies/CORS/CSRF/rate limits, and run dependency remediation when a safe upstream patch exists.
6. Repeat full E2E QA using seeded non-production data, valid/invalid CRUD, multi-role authorization, exports, email/report scheduling, backup/restore, network tools, and destructive-action confirmations.

## Final recommendation

**NO-GO.** Static-shell quality is promising, but critical authentication and backend availability failures block production launch. A conditional launch is not appropriate until Critical and High defects are resolved and database-backed, role-aware end-to-end testing passes.

## URLs visited and processed

- http://192.168.1.145:3000/
- http://192.168.1.145:3000/assets
- http://192.168.1.145:3000/inventory
- http://192.168.1.145:3000/repairs
- http://192.168.1.145:3000/network
- http://192.168.1.145:3000/locations
- http://192.168.1.145:3000/employees
- http://192.168.1.145:3000/reports
- http://192.168.1.145:3000/settings
- http://192.168.1.145:3000/setup
- http://192.168.1.145:3000/assets/nonexistent
- http://192.168.1.145:3000/employees/nonexistent
- http://192.168.1.145:3000/api/setup/status
- http://192.168.1.145:3000/api/assets