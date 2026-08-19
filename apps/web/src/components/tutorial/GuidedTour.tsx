"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, X, CheckCircle2,
  Box, ClipboardList, Wrench, Network, Server, Users, Monitor,
  ShieldCheck, BarChart3, LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TourStep {
  route: string;
  targetSelector: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    route: "/",
    targetSelector: '[data-tour="mission-control"]',
    title: "Mission Control Dashboard",
    description: "Welcome to PULSE IT Operations! This central hub displays live system telemetry, active hardware counts, assets at risk, and real-time operational status.",
    icon: LayoutDashboard,
    category: "Overview",
  },
  {
    route: "/assets",
    targetSelector: '[data-tour="assets-table"]',
    title: "Hardware Asset Lifecycle",
    description: "Manage your physical hardware assets. View laptops, servers, and mobile devices, track status (In Stock, Assigned, Maintenance), and perform quick employee reassignments.",
    icon: Box,
    category: "Hardware",
  },
  {
    route: "/inventory",
    targetSelector: '[data-tour="inventory-stock"]',
    title: "Consumables & Inventory",
    description: "Track IT supplies and warehouse stock. Monitor safety thresholds, issue consumables to technicians, and view barcode and QR codes.",
    icon: ClipboardList,
    category: "Stock",
  },
  {
    route: "/helpdesk",
    targetSelector: '[data-tour="helpdesk-tickets"]',
    title: "IT Helpdesk & SLA Tracker",
    description: "Handle incoming support tickets. Monitor live SLA countdown timers, assign technicians, update resolution status, and add internal notes.",
    icon: Wrench,
    category: "Support",
  },
  {
    route: "/network",
    targetSelector: '[data-tour="network-devices"]',
    title: "Network Devices & Telemetry",
    description: "Monitor routers, switches, and access points. Track live IP/MAC telemetry, packet throughput, and network alert indicators.",
    icon: Network,
    category: "Infrastructure",
  },
  {
    route: "/locations",
    targetSelector: '[data-tour="rack-map"]',
    title: "Server Racks & Locations",
    description: "Visualize data center locations and rack U-slot allocations. Interactively mount hardware into empty rack units with form-factor tracking.",
    icon: Server,
    category: "Data Center",
  },
  {
    route: "/software",
    targetSelector: '[data-tour="software-optimizer"]',
    title: "Software & AI Cost Optimizer",
    description: "Manage SaaS license seats and subscriptions. Use AI optimization insights to recover unassigned licenses and save operating costs.",
    icon: Monitor,
    category: "Software",
  },
  {
    route: "/employees",
    targetSelector: '[data-tour="employee-list"]',
    title: "Employee Directory & Provisioning",
    description: "View department staff, onboard new team members, and check employee hardware profiles and software allocations.",
    icon: Users,
    category: "People",
  },
  {
    route: "/activity",
    targetSelector: '[data-tour="audit-log"]',
    title: "Security & Operational Audit Log",
    description: "Immutable security logging tracking all asset reassignments, stock dispatches, configuration changes, and system events in real time.",
    icon: ShieldCheck,
    category: "Security",
  },
  {
    route: "/reports",
    targetSelector: '[data-tour="reports-toolbar"]',
    title: "Analytics & Executive Reports",
    description: "Generate PDF, Excel, and CSV executive reports, configure custom date ranges, and export tenant operational summaries.",
    icon: BarChart3,
    category: "Analytics",
  },
];

interface TooltipPosition {
  top?: number;
  bottom?: number;
  left: number;
  placement: "top" | "bottom" | "center";
}

export function GuidedTour({
  isOpen,
  onClose,
  initialStepIndex = 0,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  initialStepIndex?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeStepIndex, setActiveStepIndex] = useState(initialStepIndex);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ left: 0, placement: "center" });
  const [autoActive, setAutoActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Auto-start on first visit on Dashboard ONLY if not manually controlled
  useEffect(() => {
    if (isOpen === undefined && typeof window !== "undefined") {
      const isExemptRoute = pathname === "/setup" || pathname === "/login" || pathname === "/welcome" || pathname === "/portal";
      const hasCompleted = localStorage.getItem("pulse_tour_completed");
      if (!hasCompleted && !isExemptRoute && pathname === "/") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAutoActive(true);
      }
    }
  }, [isOpen, pathname]);

  const isActive = isOpen !== undefined ? isOpen : autoActive;

  const currentStep = TOUR_STEPS[activeStepIndex];

  // Calculate intelligent tooltip position relative to target element with strict viewport bounds
  const calculatePosition = useCallback((rect: DOMRect | null) => {
    if (!rect || typeof window === "undefined") {
      setTooltipPos({ left: 0, placement: "center" });
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = Math.min(480, viewportWidth - 32);
    const cardHeight = 320;

    // Horizontal centering clamped within screen margins
    let left = rect.left + rect.width / 2 - cardWidth / 2;
    left = Math.max(16, Math.min(left, Math.max(16, viewportWidth - cardWidth - 16)));

    // Vertical placement: choose above or below depending on available clearance
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow >= cardHeight + 20) {
      setTooltipPos({
        top: Math.max(16, Math.min(viewportHeight - cardHeight - 20, rect.bottom + 16)),
        left,
        placement: "bottom",
      });
    } else if (spaceAbove >= cardHeight + 20) {
      setTooltipPos({
        bottom: Math.max(16, Math.min(viewportHeight - 20, viewportHeight - rect.top + 16)),
        left,
        placement: "top",
      });
    } else {
      // Fallback: place in center of screen
      setTooltipPos({ left, placement: "center" });
    }
  }, []);

  // Update target element coordinates and smooth-scroll to it
  const updateTargetPosition = useCallback(() => {
    if (!isActive || !currentStep) return;

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        calculatePosition(rect);
      }, 250);
    } else {
      setTargetRect(null);
      calculatePosition(null);
    }
  }, [isActive, currentStep, calculatePosition]);

  // Route across pages as step changes
  useEffect(() => {
    if (!isActive || !currentStep) return;

    if (pathname !== currentStep.route) {
      router.push(currentStep.route);
    }

    const timer = setTimeout(updateTargetPosition, 450);
    return () => clearTimeout(timer);
  }, [activeStepIndex, isActive, currentStep, pathname, router, updateTargetPosition]);

  // Window resize & scroll listeners
  useEffect(() => {
    if (!isActive) return;
    const handleReposition = () => {
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        calculatePosition(rect);
      }
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isActive, currentStep, calculatePosition]);

  const handleClose = useCallback(() => {
    setAutoActive(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("pulse_tour_completed", "true");
    }
    if (onClose) onClose();
  }, [onClose]);

  const handleNext = useCallback(() => {
    if (activeStepIndex < TOUR_STEPS.length - 1) {
      setActiveStepIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      setTimeout(() => {
        handleClose();
      }, 1400);
    }
  }, [activeStepIndex, handleClose]);

  const handlePrev = useCallback(() => {
    if (activeStepIndex > 0) {
      setActiveStepIndex((prev) => prev - 1);
    }
  }, [activeStepIndex]);

  // Keyboard Navigation Listener
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, handleNext, handlePrev, handleClose]);

  if (!isActive || !currentStep) return null;

  const StepIcon = currentStep.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none select-none font-sans">
        {/* Soft Dark Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
          onClick={handleClose}
        />

        {/* Target Element Spotlight Ring */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: Math.max(0, targetRect.top - 8),
              left: Math.max(0, targetRect.left - 8),
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="absolute rounded-2xl ring-2 ring-primary ring-offset-4 ring-offset-background bg-primary/5 pointer-events-none z-50 shadow-2xl"
          />
        )}

        {/* Dynamic Positioned Floating Tooltip Card */}
        <div
          className={cn(
            "fixed z-50 pointer-events-auto transition-all duration-300",
            tooltipPos.placement === "center" && "inset-0 flex items-center justify-center p-4"
          )}
          style={
            tooltipPos.placement !== "center"
              ? {
                  top: tooltipPos.top !== undefined ? `${tooltipPos.top}px` : undefined,
                  bottom: tooltipPos.bottom !== undefined ? `${tooltipPos.bottom}px` : undefined,
                  left: `${tooltipPos.left}px`,
                  width: "min(480px, calc(100vw - 32px))",
                }
              : undefined
          }
        >
          <motion.div
            key={activeStepIndex}
            initial={{ opacity: 0, y: tooltipPos.placement === "top" ? -12 : 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="bg-card border border-border/80 text-card-foreground backdrop-blur-2xl rounded-3xl p-6 sm:p-7 shadow-2xl relative flex flex-col w-full"
          >
            {/* Header / Category Badge & Step Indicator */}
            <div className="flex items-center justify-between gap-3 mb-3.5 border-b border-border/50 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-sm shrink-0">
                  <StepIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      {currentStep.category}
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Step {activeStepIndex + 1} of {TOUR_STEPS.length}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-foreground tracking-tight mt-0.5">
                    {currentStep.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={handleClose}
                aria-label="Exit Tour"
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Exit Tour (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Description Body */}
            <p className="text-xs text-muted-foreground leading-relaxed mb-5 font-medium">
              {currentStep.description}
            </p>

            {/* Interactive Step Jump Pills */}
            <div className="flex items-center justify-between gap-1 mb-5 p-1 bg-muted/40 rounded-xl border border-border/40 overflow-x-auto custom-scrollbar">
              {TOUR_STEPS.map((s, idx) => {
                const isCurrent = idx === activeStepIndex;
                const isPassed = idx < activeStepIndex;
                return (
                  <button
                    key={s.title}
                    onClick={() => setActiveStepIndex(idx)}
                    aria-label={`Step ${idx + 1}: ${s.title}`}
                    className={cn(
                      "flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer truncate text-center shrink-0 min-w-8.5",
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-xs font-black"
                        : isPassed
                        ? "text-foreground hover:bg-muted"
                        : "text-muted-foreground/50 hover:text-muted-foreground"
                    )}
                    title={`${idx + 1}. ${s.title}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Bottom Controls & Keyboard Shortcut Badges */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClose}
                  aria-label="Skip Tour"
                  className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Skip Tour
                </button>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 font-mono">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px]">ESC</kbd>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {activeStepIndex > 0 && (
                  <button
                    onClick={handlePrev}
                    aria-label="Previous tour step"
                    className="flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground border border-border/60 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}

                <button
                  onClick={handleNext}
                  aria-label={activeStepIndex === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next tour step"}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <span>{activeStepIndex === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next"}</span>
                  {activeStepIndex === TOUR_STEPS.length - 1 ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Completion Modal Pop */}
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-card rounded-3xl p-8 flex flex-col items-center justify-center text-center z-10"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-foreground">Onboarding Tour Complete!</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  You are now ready to operate the PULSE IT platform. You can relaunch this tour anytime from the header.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
