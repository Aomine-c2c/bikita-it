# Automated 7-Turn 2D Mahoraga Wheel Specification

**Date:** 2026-08-14  
**Feature Area:** Welcome / Introduction Page (`/welcome`)  
**Target Files:**

- [`ParticleSplash.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/intro/ParticleSplash.tsx)
- [`page.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/app/welcome/page.tsx)

---

## 1. Overview & Objectives

Make the 2D Mahoraga Wheel adaptation sequence **100% automated** on page load.

The wheel automatically executes 7 step turns at a pace of **1 turn per second** (7 seconds total duration). After the 7th turn completes, a readiness shockwave expands across the canvas and the application automatically redirects to `/login` (or `/setup` if initial setup is pending).

A **Skip Adaptation (ESC)** control is provided in the top header and bound globally to the `Escape` key for returning users to bypass the 7-second sequence instantly.

---

## 2. Automated 7-Turn Sequence Mechanics

1. **Auto-Trigger**: Starts automatically upon component mount (`useEffect`).
2. **Interval**: Exactly 1 turn per second (`1000ms`).
3. **Step Turns (7 Total)**:
   - Turn 1: Database Engine Check
   - Turn 2: Asset Telemetry Probe
   - Turn 3: Network CIDR Scanner
   - Turn 4: Helpdesk SLA Timers
   - Turn 5: Consumable Stock Inventory
   - Turn 6: Location Server Rack Map
   - Turn 7: Security Audit Logs & Auth RBAC
4. **Visual Rotation & Knobs**:
   - Rotates `Math.PI / 4` per step turn.
   - Corresponding handle knob illuminates from `#334155` to solid `#ffffff` with a radial aura blur on each turn.
5. **HUD Display**:
   - Displays active turn progress: `[Turn X/7] Mahoraga Automatic Adaptation (1s / turn)`
   - Displays requirement check status text.

---

## 3. Skip Adaptation Control (ESC)

- **Top Header Button**: `Skip (ESC)` button next to Direct Login and System Setup.
- **Global Key Binding**: Pressing `Escape` or `ESC` immediately cancels the 7-second timer, triggers the shockwave, and navigates to `/login` or `/setup`.

---

## 4. Verification Plan

1. **Automated Build & Typecheck**:
   - `npx tsc --noEmit --project apps/web/tsconfig.json`
   - `npm run build --prefix apps/web`
2. **Runtime Verification**:
   - Verify page auto-starts turns on load.
   - Verify 1 turn per second rate across 7 turns.
   - Verify pressing `ESC` or clicking `Skip (ESC)` immediately bypasses the sequence.
