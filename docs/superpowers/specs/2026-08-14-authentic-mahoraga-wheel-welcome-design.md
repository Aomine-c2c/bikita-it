# Authentic 3D Mahoraga Wheel Welcome Screen Specification

**Date:** 2026-08-14  
**Feature Area:** Welcome / Introduction Page (`/welcome`)  
**Target Files:**

- [`ParticleSplash.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/intro/ParticleSplash.tsx)
- [`page.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/app/welcome/page.tsx)

---

## 1. Overview & Objectives

Re-architect `/welcome` ([`ParticleSplash.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/intro/ParticleSplash.tsx)) to render an authentic **Eight-Handled Divergent Sila Divine General Mahoraga Wheel (八握剣異戒神将魔虚羅の輪)** in 3D canvas space.

The screen uses a dark space backdrop (`bg-slate-950`), allowing the metallic wheel geometry, 8 extended handle grips, glowing 3D micro-grain particles, and adaptation shockwave rings to pop with maximum visual impact.

---

## 2. Authentic Wheel 3D Visual Anatomy

1. **Background & Canvas**:
   - `bg-slate-950` dark space with ambient radial blur glows (`bg-indigo-600/10` & `bg-emerald-600/10`).
   - 450 high-contrast micro-grain 3D floating particles.
2. **Concentric Double Rim**:
   - Outer Main Metallic Rim (thick stroke `lineWidth: 4`, radius `170px`).
   - Inner Hub Rim (stroke `lineWidth: 2`, radius `60px`).
   - Central Axle Core Node (radiant filled circle with 25px blur shadow).
3. **8 Outer Handle Grips (八握)**:
   - 8 spokes radiating at 45° increments.
   - Spoke shafts extend **55px past the outer rim**.
   - Each handle shaft tip features an authentic shaped metallic handle grip knob (`arc` with outer stroke ring and radial glow).
4. **8 Operational Requirement Checks**:
   1. `DB Engine`: Django & PostgreSQL Schema Health
   2. `Asset Telemetry`: Hardware Lifecycle Engine
   3. `Network Probe`: Subnet & CIDR Scanner Engine
   4. `Helpdesk SLA`: Support Ticket Engine & Escalations
   5. `Inventory Stock`: Consumable Warehouse Thresholds
   6. `Location Racks`: Server Rack Allocations & U-Slots
   7. `Software AI`: SaaS License & AI Cost Engine
   8. `Security RBAC`: Security Audit Log & Auth Controls

---

## 3. Interaction & Adaptation Sequence

- **Trigger**: Click anywhere on the screen or press `ENTER` / `SPACE`.
- **Mechanical Step Turns**:
  - Mechanical 45° rotation step per requirement (140ms step interval).
  - Passed handles light up from dark slate (`#334155`) to radiant silver/white (`#ffffff`) with radial aura pulse.
  - Live HUD text updates: `[Step X/8] Mahoraga Adaptation... <Requirement> PASS`.
- **Completion Shockwave**:
  - Upon 8/8 completion, a large radial energy ring expands across the screen.
  - Smooth router navigation into `/login` or `/setup`.

---

## 4. HUD Box Overlay

- Container: `bg-slate-900/80 border border-slate-800 text-slate-100 backdrop-blur-xl rounded-2xl shadow-2xl`.
- Action Button: `bg-white text-black font-extrabold hover:bg-slate-200 shadow-xl rounded-2xl`.

---

## 5. Verification Plan

1. **Typecheck & Build**:
   - `npx tsc --noEmit --project apps/web/tsconfig.json`
   - `npm run build --prefix apps/web`
2. **Visual Inspection**:
   - Launch app, navigate to `/welcome`.
   - Verify dark background, double rims, 8 extended handle shafts & knobs, mechanical spin, and shockwave transition.
