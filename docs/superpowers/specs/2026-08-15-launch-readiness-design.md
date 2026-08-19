# Launch Readiness Specification: Bikita IT Operations Platform

**Date:** 2026-08-15  
**Status:** Approved  
**Scope:** QA-01 through QA-08 Defect Remediation & Production Launch Hardening  

---

## 1. Overview & Objectives

The goal of this design is to resolve all critical, high, and medium defects identified in the Independent Launch-Readiness QA Report (`QA_LAUNCH_READINESS.md`) and achieve production launch readiness for the Bikita IT Operations Platform.

Key objectives:
1. Enforce strict authentication and authorization boundaries on both frontend and backend (QA-01).
2. Ensure robust API status handling and graceful fallback UI when backend/database services are unavailable (QA-02).
3. Completely eliminate fabricated/mock data fallbacks across all operational modules (QA-03), obeying `.agents/AGENTS.md`.
4. Enforce valid 404 dynamic routing semantics for nonexistent resource IDs (QA-04).
5. Secure the first-admin initial setup workflow against unauthenticated takeover attempts (QA-05).
6. Provide fully responsive mobile navigation with a sliding drawer navigation layout (QA-06).
7. Refine guided onboarding tour execution, scope, and accessible modal controls (QA-07).
8. Ensure complete WCAG accessibility compliance (skip links, ARIA labels, form names, keyboard focusable controls) (QA-08).

---

## 2. Architecture & Detailed Component Design

### 2.1 Authentication & Authorization Boundary (QA-01 & QA-05)

- **Next.js Middleware (`apps/web/src/middleware.ts`)**:
  - Intercepts requests for protected route patterns: `/assets/*`, `/inventory/*`, `/repairs/*`, `/network/*`, `/locations/*`, `/employees/*`, `/reports/*`, `/settings/*`, `/software/*`, `/activity/*`, `/portal/*`.
  - Checks for valid authentication session tokens (JWT in cookie/localStorage).
  - Unauthenticated access redirects immediately to `/login?callbackUrl=<requested_path>`.
  - Checks `/setup` route against backend `/api/setup/check` endpoint; if setup is complete (`initialized: true`), redirects `/setup` to `/login`.

- **Backend Role Enforcement (`apps/api/core/permissions.py` & `api.py`)**:
  - `JWTAuth()` enforced across operational API routes.
  - Role decorators (`@require_admin`, `@require_technician`) applied on privileged operations (e.g. system settings, employee role changes, data deletion).

### 2.2 Data Integrity & 404 Routing Semantics (QA-02, QA-03, QA-04)

- **Dynamic Entity Routes (`apps/web/src/app/assets/[id]`)**:
  - When an asset or entity query returns a 404 from the API, invoke Next.js `notFound()` from `next/navigation`.
  - Renders `apps/web/src/app/not-found.tsx` with proper HTTP 404 status header and clear user recovery link.

- **Mock Data Elimination & Offline Banners**:
  - Remove hardcoded fallbacks that display fabricated metrics when API calls return 500 or network is unreachable.
  - Display explicit `API Offline / Connection Error` banners with zeroed or empty states (`0 total`, `No items available`) to prevent misleading operational decisions.

### 2.3 Responsive Mobile Navigation (QA-06)

- **Sidebar Drawer Layout (`apps/web/src/components/layout/Sidebar.tsx` & `DashboardLayout.tsx`)**:
  - On viewports `< md` (phones/small tablets), sidebar translates off-screen.
  - Header hamburger button opens slide-out Sheet drawer with dark backdrop overlay.
  - Closing drawer triggered via backdrop tap, ESC key, or route navigation.

### 2.4 Guided Tour Onboarding & Accessibility Polish (QA-07 & QA-08)

- **Guided Tour (`apps/web/src/components/tutorial/GuidedTour.tsx`)**:
  - Restricted to explicit trigger from Header help button or opt-in on initial dashboard visit.
  - Excluded automatically on `/setup` and `/login` pages.
  - Clamping tooltip position strictly within viewport bounds (`window.innerWidth`, `window.innerHeight`).
  - Added full accessible ARIA labels (`aria-label="Close tour"`, `aria-label="Next step"`) and ESC keyboard shortcut support.

- **WCAG Accessibility Hardening**:
  - Verify `<a href="#main-content">Skip to main content</a>` skip link in `DashboardLayout.tsx`.
  - Convert `div` `onClick` handlers for user profile navigation to semantic `<button>` elements with keyboard focus and `aria-expanded` state.
  - Ensure all form inputs have associated `name`, `id`, and `<label>` attributes.

---

## 3. Verification Plan

### Automated Verification
1. `npm run lint` in `apps/web` and `apps/api` workspace.
2. `npm run typecheck` across all TypeScript packages.
3. `npm run test` / `vitest` unit test execution.
4. E2E route checks for `/login`, `/setup`, `/assets/nonexistent` (expecting 404), and protected routes without session.

### Manual Verification
1. Verify phone viewport layout rendering in mobile responsive mode.
2. Test guided tour trigger and dismiss controls.
3. Confirm unauthenticated direct URL access redirects to `/login`.
