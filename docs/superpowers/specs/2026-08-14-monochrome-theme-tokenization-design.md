# Monochrome Neutral Theme Tokenization Specification

**Date:** 2026-08-14  
**Feature Area:** UI Design System & Neutral Color Alignment  
**Target Files:**
- [`GuidedTour.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/tutorial/GuidedTour.tsx)
- [`Header.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/layout/Header.tsx)
- [`SoftwareAIOptimizer.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/software/SoftwareAIOptimizer.tsx)
- [`TicketDrawer.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/service-desk/TicketDrawer.tsx)
- [`DiscoveryStagingTable.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/network/DiscoveryStagingTable.tsx)
- [`ConnectionFormModal.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/network/ConnectionFormModal.tsx)
- [`AIAssistantSidebar.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/layout/AIAssistantSidebar.tsx)

---

## 1. Overview & Objectives
Enforce strict design token compliance across all UI components by removing all hardcoded ad-hoc colors (`indigo-500`, `indigo-600`, `indigo-400`, `slate-950`) and replacing them with standard neutral white/gray/black semantic theme variables (`bg-card`, `bg-popover`, `bg-primary`, `text-primary-foreground`, `border-border`, `ring-primary`, `bg-muted`, `text-muted-foreground`).

---

## 2. Component Token Mapping

### A. `GuidedTour.tsx` (Onboarding Tour Modal)
- **Backdrop Overlay**: `bg-background/80 backdrop-blur-sm`
- **Target Spotlight Ring**: `ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5 shadow-2xl`
- **Tooltip Card Container**: `bg-card border border-border/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-card-foreground`
- **Icon Badge**: `bg-primary/10 border border-primary/20 text-primary`
- **Category & Step Header**: `text-muted-foreground` / `text-foreground`
- **Active Progress Dot**: `w-8 bg-primary shadow-xs` / Inactive: `w-2 bg-muted-foreground/30`
- **Next Step Button**: `bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold shadow-sm`
- **Back / Skip Buttons**: `border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted`

### B. Other Ad-hoc Color Cleanup
- Replace `bg-indigo-50/50`, `border-indigo-500/30`, `text-indigo-600` in AI components (`SoftwareAIOptimizer.tsx`, `TicketDrawer.tsx`, `AIAssistantSidebar.tsx`) with `bg-muted/40`, `border-border`, `text-foreground`, `bg-primary/10`, `text-primary`.
- Replace `indigo` styles in `Header.tsx`, `DiscoveryStagingTable.tsx`, and `ConnectionFormModal.tsx` with standard `bg-secondary`, `text-foreground`, `border-border`, `bg-primary`.

---

## 3. Verification Plan
1. **Visual & UI Verification**:
   - Launch application via `npm run tauri:dev` or `npm run dev`.
   - Open Guided Tour popup and verify spotlight ring, header, buttons, and backdrop are strictly white/gray/black neutral tokens.
2. **Build Verification**:
   - Run `npm run build --prefix apps/web` to ensure zero compilation or type errors.
