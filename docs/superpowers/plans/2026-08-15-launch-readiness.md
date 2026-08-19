# Launch Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all critical, high, and medium launch-readiness defects (QA-01 through QA-08) across the Bikita IT Operations Platform to achieve production-grade security, data integrity, responsive UX, and accessibility.

**Architecture:** Implement Next.js route-protection middleware and backend JWT/role security; enforce proper HTTP 404 routing with zeroed/offline banners (eliminating mock data); secure setup initialization; and implement responsive mobile navigation and accessible guided tour onboarding.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Django 5.2 / Django Ninja, Vitest / Playwright.

## Global Constraints

- Strictly DO NOT use mock data in this project. All data must be fetched from the real API/Database (per `.agents/AGENTS.md`).
- All interactive controls must have accessible keyboard and ARIA properties.
- Dynamic missing entity routes must return true HTTP 404 status.
- Mobile viewports (`< md`) must have a functional slide-out navigation drawer.

---

### Task 1: Next.js Route Protection Middleware (QA-01)

**Files:**
- Create: `apps/web/src/middleware.ts`
- Test: `apps/web/test/middleware.test.ts`

**Interfaces:**
- Consumes: Next.js `NextRequest`, `NextResponse`, session cookie / header
- Produces: Route redirect to `/login` for unauthenticated requests to protected paths

- [ ] **Step 1: Write test for route protection middleware**

```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

describe("Next.js Auth Middleware", () => {
  it("redirects unauthenticated user from /settings to /login", () => {
    const req = new NextRequest("http://localhost:3000/settings");
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows access to /login and /setup when unauthenticated", () => {
    const req = new NextRequest("http://localhost:3000/login");
    const res = middleware(req);
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run test/middleware.test.ts`
Expected: FAIL (middleware file does not exist)

- [ ] **Step 3: Implement `apps/web/src/middleware.ts`**

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/setup", "/api/auth/login", "/api/setup", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isStatic = pathname.startsWith("/_next") || pathname.includes(".");

  if (isPublic || isStatic) {
    return NextResponse.next();
  }

  const token = request.cookies.get("pulse_access_token")?.value || 
                request.cookies.get("token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run test/middleware.test.ts`
Expected: PASS

---

### Task 2: Dynamic 404 Routing & Mock Data Elimination (QA-03 & QA-04)

**Files:**
- Modify: `apps/web/src/app/assets/detail/page.tsx`
- Modify: `apps/web/src/app/inventory/page.tsx`
- Modify: `apps/web/src/app/repairs/page.tsx`

**Interfaces:**
- Consumes: `notFound()` from `next/navigation`, `assetApi`, `inventoryApi`, `repairsApi`
- Produces: True 404 on missing dynamic assets, clean zeroed/offline state banners on API failures

- [ ] **Step 1: Update `apps/web/src/app/assets/detail/page.tsx` to invoke `notFound()`**

When `assetApi.getOne(id)` fails with a 404 status code, trigger `notFound()` instead of displaying partial fallback fields:
```typescript
import { notFound } from "next/navigation";
...
if (state === "missing") {
  notFound();
}
```

- [ ] **Step 2: Clean up fallback metrics across `inventory/page.tsx` and `repairs/page.tsx`**

Ensure that KPI counts default to `0` / empty when the API fails, displaying a descriptive `API Connection Offline` alert rather than mock counts (14,295 items or 12 repairs).

- [ ] **Step 3: Run unit tests / typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS with 0 type errors

---

### Task 3: Setup Initialization Guard (QA-05)

**Files:**
- Modify: `apps/web/src/app/setup/page.tsx`

**Interfaces:**
- Consumes: `/api/setup/check` endpoint (`initialized: boolean`)
- Produces: Automatic redirection to `/login` if platform is already initialized

- [ ] **Step 1: Add initialization check in `apps/web/src/app/setup/page.tsx`**

On initial render, check if `check_setup` returns `initialized: true`. If true, display message and redirect to `/login` immediately.

- [ ] **Step 2: Run verification**

Run: `cd apps/web && npm run typecheck`
Expected: PASS

---

### Task 4: Responsive Mobile Navigation Drawer (QA-06)

**Files:**
- Modify: `apps/web/src/components/layout/Sidebar.tsx`
- Modify: `apps/web/src/components/layout/DashboardLayout.tsx`

**Interfaces:**
- Consumes: `isMobileOpen`, `onMobileClose` props
- Produces: Off-canvas slide-out drawer on `< md` viewports with backdrop overlay and ESC key closing

- [ ] **Step 1: Update Sidebar mobile styles and backdrop transitions**

Ensure `<aside>` uses `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:translate-x-0` and respects `isMobileOpen`.

- [ ] **Step 2: Verify responsive layouts across main content**

Ensure main content uses responsive padding (`px-4 sm:px-6 lg:px-8`) and adjusts dynamically when viewport resizes.

- [ ] **Step 3: Run typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: PASS

---

### Task 5: Guided Tour Accessibility & Modal Polish (QA-07 & QA-08)

**Files:**
- Modify: `apps/web/src/components/tutorial/GuidedTour.tsx`
- Modify: `apps/web/src/components/layout/Header.tsx`

**Interfaces:**
- Consumes: `isOpen`, `onClose` props
- Produces: Viewport-clamped tooltips with explicit ARIA labels and exclusion from `/setup` and `/login` routes

- [ ] **Step 1: Add viewport clamping and ARIA accessibility labels**

Update `calculatePosition` in `GuidedTour.tsx` to clamp within `[16, viewportWidth - cardWidth - 16]` and `[16, viewportHeight - cardHeight - 16]`.
Add `aria-label="Exit tour"`, `aria-label="Next tour step"`, and `aria-label="Previous tour step"`.

- [ ] **Step 2: Restrict auto-start to Dashboard and exclude `/setup` / `/login`**

Ensure `GuidedTour` does not auto-mount or block user interaction when on non-dashboard or setup routes.

- [ ] **Step 3: Run typecheck and tests**

Run: `cd apps/web && npm run typecheck && npm run test`
Expected: PASS

---

### Task 6: Full Suite Verification & Launch Validation

- [ ] **Step 1: Run global linting**

Run: `npm run lint --workspaces`
Expected: PASS

- [ ] **Step 2: Run global typechecking**

Run: `npm run typecheck --workspaces`
Expected: PASS

- [ ] **Step 3: Run test suites**

Run: `npm run test --workspaces`
Expected: PASS
