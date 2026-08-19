# Authentic 3D Mahoraga Wheel Welcome Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-architect `/welcome` ([`ParticleSplash.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/intro/ParticleSplash.tsx)) to render the exact 8-Handled Divine General Mahoraga Wheel matching the user's reference image on a pitch black background (`#000000`).

**Exact Geometry & Proportions from Reference Image:**

- **Canvas Background**: Pitch Black (`#000000` / `bg-black`).
- **Double Concentric Outer Rim**: Main outer metallic ring + inner concentric border ring.
- **Center Axle Hub**: Solid circle in the exact center of the wheel.
- **8 Radiating Spokes**: Straight 45° spokes connecting hub circle through double rim to handle tip.
- **8 Large Circular Handle Knobs**: Prominent solid circular disks ($r \approx 22\text{px}$) mounted at the end of short handle shafts extending outside the rim.

**Tech Stack:** React 19, Next.js 16, HTML5 Canvas 2D Context (3D perspective math), Lucide React, Framer Motion.

---

## Task 1: Re-architect `ParticleSplash.tsx` for Pitch Black Canvas & Reference Geometry

**Files:**

- Modify: [`apps/web/src/components/intro/ParticleSplash.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/intro/ParticleSplash.tsx)

**Interfaces:**

- Consumes: Canvas 2D Context, math projection.
- Produces: Reference-accurate 3D Mahoraga Wheel rendering & 8-step adaptation sequence.

**Steps:**

- [ ] **Step 1: Update Canvas setup for Pitch Black background**
  Set container to `bg-black select-none text-white`.

- [ ] **Step 2: Implement exact Mahoraga Wheel geometry in Canvas render loop**
  - **Outer Double Rim**:

    ```typescript
    const WHEEL_OUTER_R = 140;
    const WHEEL_INNER_R = 122;
    const HUB_R = 28;
    const HANDLE_OFFSET = 38; // Tip at 178px
    const KNOB_R = 20; // Large circular handle knobs
    ```

  - **Drawing Outer Double Rim**:
    Draw two concentric circles (`WHEEL_OUTER_R` and `WHEEL_INNER_R`) with `#ffffff` / `#cbd5e1` stroke.
  - **Drawing Center Hub Circle**:
    Draw filled hub circle (`HUB_R`) with center axle.
  - **Drawing 8 Spokes & 8 Large Circular Handle Knobs**:
    For each of the 8 handles at `(h / 8) * Math.PI * 2`:
    - Draw spoke line from `HUB_R` to `(WHEEL_OUTER_R + HANDLE_OFFSET)`.
    - Draw large handle knob circle (`KNOB_R`).
    - If `currentStepIdx >= h`, fill handle knob with `#ffffff` (bright active glow) and add pulse ring. If unverified, fill with `#1e293b` (dark slate metal) and `#cbd5e1` stroke.

- [ ] **Step 3: Update HUD container to Sleek Dark Glass Box**

  ```tsx
  <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-2xl w-full">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
      {isSpinning ? `[Step ${activeStep + 1}/8] Mahoraga Adaptation` : "3D Divine General Wheel Ready"}
    </p>
    <p className="text-sm font-mono font-black text-white">
      {isSpinning && activeStep >= 0
        ? DIAGNOSTIC_STEPS[activeStep].text
        : "Press ENTER or Click Wheel to Initialize Adaptation"}
    </p>
  </div>

  <button
    onClick={handleStartDiagnostic}
    disabled={isSpinning}
    className="w-full py-3.5 px-6 bg-white text-black hover:bg-slate-200 rounded-2xl font-extrabold text-sm shadow-2xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
  >
    ...
  </button>
  ```

- [ ] **Step 4: Verify TypeScript & Static Export Build**
  Run: `npx tsc --noEmit --project apps/web/tsconfig.json`
  Run: `npm run build --prefix apps/web`
  Expected: PASS exit code 0.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/intro/ParticleSplash.tsx
  git commit -m "feat: implement reference-accurate 3D Mahoraga Wheel with 8 large handle knobs"
  ```
