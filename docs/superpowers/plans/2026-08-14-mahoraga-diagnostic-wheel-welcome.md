# 3D Mahoraga Operational Diagnostic Wheel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `/welcome` ([`ParticleSplash.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/intro/ParticleSplash.tsx)) into a card-free 3D Mahoraga Operational Diagnostic Wheel where pressing ENTER or clicking the Wheel triggers an 8-spoke sequential rotation test across all BikitaIT v2.0 requirements before launching into the app.

**Architecture:** Update 3D Canvas rendering loop, replace glassmorphic card containers with minimal HUD overlay, add 8-step rotation state and spoke illumination math, and wire real-time diagnostic checks to router navigation.

**Tech Stack:** React 19, Next.js 16, HTML5 Canvas 2D Context (with 3D perspective projection), Lucide React, Framer Motion.

## Global Constraints

- No background cards or glass boxes on `/welcome`.
- High-contrast monochrome neutral palette (`#ffffff`, `#e2e8f0`, `#64748b`, `#09090b`).
- 8 handles/spokes mapping to 8 system operational requirements.
- ENTER key or Wheel click starts 8-step diagnostic spin.

---

## Task 1: Refactor `ParticleSplash.tsx` Layout & Strip Background Cards

**Files:**

- Modify: [`apps/web/src/components/intro/ParticleSplash.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/intro/ParticleSplash.tsx)

**Interfaces:**

- Consumes: Next.js `useRouter`, React `useState`/`useEffect`/`useRef`.
- Produces: Minimal card-free layout with central 3D canvas and HUD status text.

**Steps:**

- [ ] **Step 1: Inspect `ParticleSplash.tsx` JSX structure**
  Identify glassmorphic card container (`bg-slate-900/85`) and module grid widgets (`grid-cols-4`).

- [ ] **Step 2: Remove card containers and implement minimal HUD overlay**
  Replace card container and grid widgets with clean, card-free HUD overlay:

  ```tsx
  return (
    <div className="relative w-full h-screen overflow-hidden bg-background flex flex-col items-center justify-between p-6 sm:p-10 font-sans select-none">
      {/* 3D Mahoraga Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Top Brand Header */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-6xl pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-foreground tracking-wider uppercase">BIKITA MINERALS</h1>
            <p className="text-xs text-muted-foreground font-semibold">IT Operations Platform v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/login")}
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted"
          >
            Direct Login
          </button>
          <button
            onClick={() => router.push("/setup")}
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted"
          >
            System Setup
          </button>
        </div>
      </div>

      {/* Bottom Live Diagnostic HUD */}
      <div className="relative z-10 flex flex-col items-center max-w-xl w-full text-center space-y-4 pointer-events-auto mb-4">
        {/* HUD Status Text */}
        <div className="bg-card/90 border border-border/80 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-xl w-full">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {isSpinning ? `[Step ${activeStep + 1}/8] Operational Diagnostic` : "Mahoraga Wheel Ready"}
          </p>
          <p className="text-sm font-mono font-black text-foreground">
            {isSpinning ? DIAGNOSTIC_STEPS[activeStep].text : "Press ENTER or Click Wheel to Initialize Adaptation"}
          </p>
        </div>

        <button
          onClick={handleStartDiagnostic}
          disabled={isSpinning}
          className="px-8 py-3.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center gap-3 cursor-pointer disabled:opacity-60"
        >
          <span>{isSpinning ? "Adapting System..." : "Initialize 8-Spoke Diagnostic"}</span>
          <kbd className="hidden sm:inline-flex items-center justify-center bg-primary-foreground/20 text-primary-foreground rounded-md text-[10px] font-black h-5 px-2 tracking-wider">
            ENTER ↵
          </kbd>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
  ```

- [ ] **Step 3: Verify TypeScript**
  Run: `npx tsc --noEmit --project apps/web/tsconfig.json`
  Expected: PASS

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/components/intro/ParticleSplash.tsx
  git commit -m "refactor: remove background cards in ParticleSplash for card-free HUD layout"
  ```

---

## Task 2: Implement 8-Spoke Diagnostic Rotation Engine in 3D Canvas

**Files:**

- Modify: [`apps/web/src/components/intro/ParticleSplash.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/intro/ParticleSplash.tsx)

**Interfaces:**

- Consumes: Canvas 2D Context, math projection.
- Produces: 8-spoke rotation math and handle knob lighting state.

**Steps:**

- [ ] **Step 1: Define 8 Diagnostic Requirement Steps**
  Add `DIAGNOSTIC_STEPS` array:

  ```typescript
  const DIAGNOSTIC_STEPS = [
    { label: "DB Connectivity", text: "Verifying Django Schema & PostgreSQL Engine... PASS", key: "db" },
    { label: "Asset Telemetry", text: "Probing Hardware Lifecycle & Serial Registry... PASS", key: "assets" },
    { label: "Network Probe", text: "Scanning CIDR Subnet & Device Sensors... PASS", key: "network" },
    { label: "Helpdesk SLA", text: "Verifying Support Ticket Timers & Escalations... PASS", key: "helpdesk" },
    { label: "Inventory Stock", text: "Checking Consumables & Threshold Alarms... PASS", key: "inventory" },
    { label: "Location Racks", text: "Validating Server Rack Allocations & U-Slots... PASS", key: "locations" },
    { label: "Software AI Engine", text: "Optimizing SaaS Licenses & Cost Analytics... PASS", key: "software" },
    { label: "Security & Auth", text: "Auditing Security Logs & Access Controls... PASS", key: "security" },
  ];
  ```

- [ ] **Step 2: Update 3D Canvas Wheel rendering for 8 Spokes and illuminated handles**
  Render 8 spokes with handle knobs (`#ffffff` for passed steps, `#64748b` for unverified steps). Add spring-assisted step rotation math (`targetAngleZ = activeStep * (Math.PI / 4)`).

- [ ] **Step 3: Connect ENTER key and Click handlers to 8-step timer**
  Sequential step interval timer (140ms per step) advancing `activeStep` from 0 to 7 before triggering navigation.

- [ ] **Step 4: Verify TypeScript and build**
  Run: `npx tsc --noEmit --project apps/web/tsconfig.json`
  Run: `npm run build --prefix apps/web`
  Expected: Success exit code 0.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/intro/ParticleSplash.tsx
  git commit -m "feat: implement 3D Mahoraga 8-Spoke Diagnostic Wheel adaptation sequence"
  ```
