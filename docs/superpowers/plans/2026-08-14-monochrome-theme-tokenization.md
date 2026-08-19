# Monochrome Neutral Theme Tokenization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all hardcoded ad-hoc colors (`indigo-500`, `indigo-600`, `indigo-400`, `slate-950`) across the entire web frontend and replace them with standard neutral white/gray/black theme tokens (`bg-card`, `bg-popover`, `bg-primary`, `text-primary-foreground`, `border-border`, `ring-primary`, `bg-muted`, `text-muted-foreground`).

**Architecture:** Refactor Tailwind CSS classes across tutorial modals, AI sidebars, headers, and modal dialogs to consume CSS variables declared in `globals.css`.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS v4, Lucide React, Framer Motion.

## Global Constraints

- Do NOT use ad-hoc indigo, blue, or purple utility classes.
- Use only neutral theme design tokens (`bg-card`, `bg-popover`, `bg-primary`, `text-primary-foreground`, `text-muted-foreground`, `border-border`, `ring-primary`, `bg-muted`).
- Preserve layout, responsiveness, and Framer Motion animations.

---

## Task 1: Refactor `GuidedTour.tsx` Spotlight & Modal Popover Styling

**Files:**

- Modify: [`apps/web/src/components/tutorial/GuidedTour.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/tutorial/GuidedTour.tsx)

**Interfaces:**

- Consumes: Tailwind theme tokens (`bg-card`, `border-border`, `ring-primary`, `bg-primary`, `text-primary-foreground`).
- Produces: Onboarding tour component with neutral white/gray/black styling.

**Steps:**

- [ ] **Step 1: Inspect `GuidedTour.tsx` hardcoded color classes**
  Verify current occurrences of `ring-indigo-500`, `bg-slate-950`, `bg-indigo-600`, `text-indigo-400`.

- [ ] **Step 2: Update Spotlight Ring and Tooltip Card classes**
  Replace indigo/slate styling with neutral theme tokens:

  ```tsx
  // Spotlight ring
  className="absolute rounded-2xl ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5 pointer-events-none z-50 shadow-2xl"

  // Tooltip card
  className="bg-card border border-border/80 text-card-foreground backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative flex flex-col"

  // Icon badge
  className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-xs"

  // Category text
  className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block"

  // Active dot
  idx === activeStepIndex ? "w-8 bg-primary shadow-xs" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"

  // Next step button
  className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
  ```

- [ ] **Step 3: Verify TypeScript and compilation**
  Run: `npx tsc --noEmit --project apps/web/tsconfig.json`
  Expected: PASS

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/components/tutorial/GuidedTour.tsx
  git commit -m "style: convert GuidedTour to neutral theme tokens"
  ```

---

## Task 2: Refactor Header Help Tour Button & AI Sidebar Components

**Files:**

- Modify: [`apps/web/src/components/layout/Header.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/layout/Header.tsx)
- Modify: [`apps/web/src/components/layout/AIAssistantSidebar.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/layout/AIAssistantSidebar.tsx)

**Interfaces:**

- Consumes: Theme tokens for navigation bar and AI sidebar.
- Produces: Header and AI sidebar with clean neutral styling.

**Steps:**

- [ ] **Step 1: Refactor `Header.tsx` Tour Trigger Button**
  Replace `border-indigo-500/30 bg-indigo-50/50 text-indigo-600` in `Header.tsx` with:

  ```tsx
  className="h-10 px-3 rounded-xl transition-all border border-border bg-muted/50 hover:bg-muted text-foreground shadow-xs flex items-center gap-1.5 font-bold text-xs cursor-pointer"
  ```

- [ ] **Step 2: Refactor `AIAssistantSidebar.tsx` AI Badges & Sparkles Icons**
  Replace indigo background/text classes with neutral `bg-primary/10 border-primary/20 text-primary`.

- [ ] **Step 3: Verify TypeScript**
  Run: `npx tsc --noEmit --project apps/web/tsconfig.json`
  Expected: PASS

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/components/layout/Header.tsx apps/web/src/components/layout/AIAssistantSidebar.tsx
  git commit -m "style: refactor Header tour trigger and AI sidebar to neutral tokens"
  ```

---

## Task 3: Refactor Software AI Optimizer & Service Desk Drawer Cards

**Files:**

- Modify: [`apps/web/src/components/software/SoftwareAIOptimizer.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/software/SoftwareAIOptimizer.tsx)
- Modify: [`apps/web/src/components/service-desk/TicketDrawer.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/service-desk/TicketDrawer.tsx)

**Interfaces:**

- Consumes: Neutral card tokens.
- Produces: Monochrome AI card layouts.

**Steps:**

- [ ] **Step 1: Update `SoftwareAIOptimizer.tsx` Card Container**
  Replace `border-indigo-500/30 bg-indigo-50/50 text-indigo-700` with:

  ```tsx
  className="relative overflow-hidden rounded-xl border border-border bg-muted/40 p-6 shadow-sm"
  ```

- [ ] **Step 2: Update `TicketDrawer.tsx` AI Suggested Resolution Card**
  Replace indigo background/border/text with `bg-muted/40 border-border text-foreground`.

- [ ] **Step 3: Verify TypeScript**
  Run: `npx tsc --noEmit --project apps/web/tsconfig.json`
  Expected: PASS

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/components/software/SoftwareAIOptimizer.tsx apps/web/src/components/service-desk/TicketDrawer.tsx
  git commit -m "style: convert AI optimizer and ticket drawer cards to neutral tokens"
  ```

---

## Task 4: Refactor Network Discovery Staging & Connection Modal

**Files:**

- Modify: [`apps/web/src/components/network/DiscoveryStagingTable.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/network/DiscoveryStagingTable.tsx)
- Modify: [`apps/web/src/components/network/ConnectionFormModal.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/network/ConnectionFormModal.tsx)

**Interfaces:**

- Consumes: Neutral network component tokens.
- Produces: Monochrome discovery staging radar and connection modal.

**Steps:**

- [ ] **Step 1: Update Radar Animation & Staging Badges in `DiscoveryStagingTable.tsx`**
  Replace indigo radar rings and icons with `border-primary/20 text-primary`.

- [ ] **Step 2: Update Input Focus & Submit Buttons in `ConnectionFormModal.tsx`**
  Replace `focus:ring-indigo-500` and `bg-indigo-600` with `focus:ring-primary` and `bg-primary text-primary-foreground`.

- [ ] **Step 3: Verify Build**
  Run: `npm run build --prefix apps/web`
  Expected: Success exit code 0.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/components/network/DiscoveryStagingTable.tsx apps/web/src/components/network/ConnectionFormModal.tsx
  git commit -m "style: convert network discovery radar and connection modal to neutral tokens"
  ```
