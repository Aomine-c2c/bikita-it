# 3D Mahoraga Operational Diagnostic Wheel Specification

**Date:** 2026-08-14  
**Feature Area:** Welcome / Introduction Page (`/welcome`)  
**Target Files:**

- [`ParticleSplash.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/intro/ParticleSplash.tsx)
- [`page.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/app/welcome/page.tsx)

---

## 1. Overview & Objectives

Transform the welcome page into a minimalist, card-free 3D interactive experience. The focal point is a 3D 8-Handled Divine General Wheel (Mahoraga Wheel) rendered on a high-contrast monochrome canvas.

When initialized (via click or `ENTER` key), the wheel undergoes a 8-step sequential rotation. Each rotation click runs a live diagnostic check against the 8 core operational requirements of BikitaIT v2.0, illuminating handle knobs upon verification before launching into the application.

---

## 2. 8 Operational Requirement Spokes

| Spoke | Requirement | Diagnostic Target |
| :--- | :--- | :--- |
| **1** | Database Engine | `/settings` (Django & Schema Health) |
| **2** | Asset Telemetry | `/assets` (Hardware Lifecycle Engine) |
| **3** | Network Discovery | `/network` (Subnet Probe & Telemetry) |
| **4** | Helpdesk SLA | `/helpdesk` (Ticket Engine & SLA Timers) |
| **5** | Inventory Thresholds | `/inventory` (Warehouse & Consumable Stock) |
| **6** | Location Rack Map | `/locations` (Server Rack Allocations) |
| **7** | AI Cost Optimizer | `/software` (SaaS & AI License Engine) |
| **8** | Security & Auth RBAC | `/activity` (Immutable Security Audit Log) |

---

## 3. UI & Canvas Mechanics

### Canvas & 3D Wheel

- **No Background Cards**: Strip out modal cards/boxes. The wheel and typography float directly over the 3D particle canvas.
- **Monochrome Palette**: High-contrast white/silver/slate particles and rim strokes (`#ffffff`, `#e2e8f0`, `#64748b`, `#09090b`).
- **8 Handles**: 3D projected spokes extending from inner hub to outer rim with circular knob tips.

### Adaptation Sequence Flow

1. **Idle State**:
   - Continuous gentle 3D wobble/tilt.
   - Text overlay: "BIKITA MINERALS • IT OPERATIONS v2.0" and "Press ENTER or Click Wheel to Initialize Adaptation".
2. **Sequential Diagnostic Spin**:
   - Triggers on click or `ENTER` / `SPACE` keydown.
   - Rotates `Math.PI / 4` (45°) per step across 8 steps (interval ~120ms per click).
   - Displays live status HUD text below wheel: `[Step X/8] Verifying <Requirement>... OK`.
   - Handle knob for spoke X illuminates with white/silver radial glow upon passing.
3. **Completion & Transition**:
   - All 8 handles illuminated.
   - Final shockwave pulse expands across canvas.
   - Seamless navigation to `/login` or `/setup` via Next.js router.

---

## 4. Verification Plan

1. **Interactive Verification**:
   - Open `/welcome` in browser / Tauri window.
   - Verify card boxes are removed and 3D wheel is centered.
   - Press `ENTER` or click wheel. Verify 8-step rotation animation, live HUD status text updates, and handle knob lighting.
2. **Build Verification**:
   - Run `npx tsc --noEmit --project apps/web/tsconfig.json`.
   - Run `npm run build --prefix apps/web`.
