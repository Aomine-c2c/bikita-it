"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle, ChevronRight, ChevronLeft, X, CheckCircle2,
  Box, ClipboardList, Wrench, Network, Server, Users, Monitor,
  ShieldCheck, BarChart3, LayoutDashboard, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TourStep {
  route: string;
  targetSelector: string;
  title: string;
  description: string;
  icon: any;
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
  const [isActive, setIsActive] = useState(false);

  // Auto-start on first visit if not manually controlled
  useEffect(() => {
    if (isOpen !== undefined) {
      setIsActive(isOpen);
    } else if (typeof window !== "undefined") {
      const hasCompleted = localStorage.getItem("pulse_tour_completed");
      if (!hasCompleted) {
        setIsActive(true);
      }
    }
  }, [isOpen]);

  const currentStep = TOUR_STEPS[activeStepIndex];

  // Route & Element position listener
  const updateTargetPosition = useCallback(() => {
    if (!isActive || !currentStep) return;

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      // Fallback center box if element not mounted yet
      setTargetRect(null);
    }
  }, [isActive, currentStep]);

  // Navigate across pages as step changes
  useEffect(() => {
    if (!isActive || !currentStep) return;

    if (pathname !== currentStep.route) {
      router.push(currentStep.route);
    }

    const timer = setTimeout(updateTargetPosition, 400);
    return () => clearTimeout(timer);
  }, [activeStepIndex, isActive, currentStep, pathname, router, updateTargetPosition]);

  // Window resize & scroll listeners
  useEffect(() => {
    if (!isActive) return;
    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition, true);
    return () => {
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition, true);
    };
  }, [isActive, updateTargetPosition]);

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
  }, [isActive, activeStepIndex]);

  const handleNext = () => {
    if (activeStepIndex < TOUR_STEPS.length - 1) {
      setActiveStepIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    setIsActive(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("pulse_tour_completed", "true");
    }
    if (onClose) onClose();
  };

  if (!isActive || !currentStep) return null;

  const StepIcon = currentStep.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none select-none">
        {/* Dark Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs pointer-events-auto"
          onClick={handleClose}
        />

        {/* Target Element Spotlight Ring */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute rounded-2xl ring-4 ring-indigo-500 ring-offset-2 ring-offset-slate-950 bg-indigo-500/10 pointer-events-none z-50 shadow-2xl"
          />
        )}

        {/* Floating Tooltip Card */}
        <div className="absolute inset-0 flex items-center justify-center p-4 z-50 pointer-events-auto">
          <motion.div
            key={activeStepIndex}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/95 border border-indigo-500/30 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-white relative flex flex-col"
          >
            {/* Header / Category Badge */}
            <div className="flex items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 border border-indigo-400/30 flex items-center justify-center shadow-md">
                  <StepIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                    {currentStep.category} • Step {activeStepIndex + 1} of {TOUR_STEPS.length}
                  </span>
                  <h3 className="text-lg font-black text-white tracking-tight">{currentStep.title}</h3>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Exit Tour"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Description Body */}
            <p className="text-sm text-slate-300 leading-relaxed mb-6 font-medium">
              {currentStep.description}
            </p>

            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStepIndex(idx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all cursor-pointer",
                    idx === activeStepIndex
                      ? "w-8 bg-indigo-500 shadow-sm"
                      : "w-2 bg-slate-700 hover:bg-slate-500"
                  )}
                  title={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={handleClose}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Skip Tour
              </button>

              <div className="flex items-center gap-2">
                {activeStepIndex > 0 && (
                  <button
                    onClick={handlePrev}
                    className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>{activeStepIndex === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next Step"}</span>
                  {activeStepIndex === TOUR_STEPS.length - 1 ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
