"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, RefreshCw, FastForward } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Particle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

const EIGHT_DIAGNOSTIC_STEPS = [
  { step: 1, label: "Database Engine", text: "Verifying Django Schema & PostgreSQL Connectivity... PASS" },
  { step: 2, label: "Asset Telemetry", text: "Probing Hardware Lifecycle & Serial Registry... PASS" },
  { step: 3, label: "Network Probe", text: "Scanning Subnet CIDR & Device Sensors... PASS" },
  { step: 4, label: "Helpdesk SLA", text: "Verifying Support Ticket Timers & Escalations... PASS" },
  { step: 5, label: "Inventory Stock", text: "Checking Consumables & Warehouse Thresholds... PASS" },
  { step: 6, label: "Location Racks", text: "Validating Server Rack Allocations & U-Slots... PASS" },
  { step: 7, label: "Software AI Engine", text: "Optimizing SaaS Licenses & Cost Analytics... PASS" },
  { step: 8, label: "Security & Auth", text: "Auditing Security Logs & RBAC Access Controls... PASS" },
];

export function ParticleSplash() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeStep, setActiveStep] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // References for Animation Loop
  const activeStepRef = useRef<number>(0);
  activeStepRef.current = activeStep;

  // Handle Instant Skip to Login / Setup
  const handleSkip = useCallback(async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("has_seen_welcome", "true");
    }
    try {
      const data = await apiFetch<{ isSetupComplete: boolean }>("/setup/check");
      if (!data?.isSetupComplete) {
        router.push("/setup");
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  }, [isNavigating, router]);

  // Global ESC key listener for instant bypass
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSkip]);

  // Automated 8-turn adaptation (1 turn per second)
  useEffect(() => {
    let currentTurn = 0;

    if (typeof window !== "undefined") {
      sessionStorage.setItem("hasSeenIntro", "true");
    }

    const interval = setInterval(() => {
      currentTurn++;
      if (currentTurn < EIGHT_DIAGNOSTIC_STEPS.length) {
        setActiveStep(currentTurn);
      } else {
        clearInterval(interval);
        handleSkip();
      }
    }, 1000); // 1 turn per second

    return () => clearInterval(interval);
  }, [handleSkip]);

  // Pure 2D Mahoraga Wheel & Grain Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // 2D Rotation State
    let angleZ = 0;
    let targetAngleZ = 0;
    let shockwaveRadius = 0;

    // 350 High-Contrast 2D Micro-Grain Particles
    const PARTICLE_COUNT = 350;
    const particles: Particle2D[] = Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: (Math.random() - 0.5) * width,
      y: (Math.random() - 0.5) * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 - 20; // Centered vertically

      const currentStepIdx = activeStepRef.current;

      // Rotation Spring Physics for 8-Turn Adaptation Clicks (1 turn per second)
      targetAngleZ = currentStepIdx * (Math.PI / 4);
      angleZ += (targetAngleZ - angleZ) * 0.2;

      // Draw 2D Background Micro-Grain Particles
      particles.forEach((p) => {
        p.x += p.vx * 2;
        p.y += p.vy * 2;

        if (p.x > width / 2) p.x = -width / 2;
        if (p.x < -width / 2) p.x = width / 2;
        if (p.y > height / 2) p.y = -height / 2;
        if (p.y < -height / 2) p.y = height / 2;

        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.75})`;
        ctx.fill();
      });

      // ─── DRAW PURE 2D MAHORAGA WHEEL (Reference Image Geometry) ───
      const WHEEL_OUTER_R = 120;
      const WHEEL_INNER_R = 104;
      const HUB_R = 24;
      const SHAFT_EXT = 38;
      const KNOB_R = 20; // Prominent solid circular handle knobs
      const HANDLE_COUNT = 8;

      // 1. Draw Outer Concentric Ring Rim
      ctx.beginPath();
      ctx.arc(cx, cy, WHEEL_OUTER_R, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ffffff";
      ctx.stroke();

      // 2. Draw Inner Concentric Border Rim
      ctx.beginPath();
      ctx.arc(cx, cy, WHEEL_INNER_R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 3. Draw Solid Center Axle Hub Circle
      ctx.beginPath();
      ctx.arc(cx, cy, HUB_R, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ffffff";
      ctx.fill();

      // 4. Draw 8 Radiating Spokes & 8 Large Solid Circular Handle Knobs
      for (let h = 0; h < HANDLE_COUNT; h++) {
        const angle = angleZ + (h / HANDLE_COUNT) * Math.PI * 2;
        const isSpokePassed = currentStepIdx >= h;

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const hubX = cx + cosA * HUB_R;
        const hubY = cy + sinA * HUB_R;

        const knobCenterX = cx + cosA * (WHEEL_OUTER_R + SHAFT_EXT);
        const knobCenterY = cy + sinA * (WHEEL_OUTER_R + SHAFT_EXT);

        // Draw Spoke Line from Hub -> Knob Center
        ctx.beginPath();
        ctx.moveTo(hubX, hubY);
        ctx.lineTo(knobCenterX, knobCenterY);
        ctx.strokeStyle = isSpokePassed ? "#ffffff" : "rgba(255, 255, 255, 0.75)";
        ctx.lineWidth = isSpokePassed ? 5 : 4;
        ctx.stroke();

        // Draw Large Solid Circular Handle Knob Disk
        ctx.beginPath();
        ctx.arc(knobCenterX, knobCenterY, KNOB_R, 0, Math.PI * 2);
        
        ctx.fillStyle = isSpokePassed ? "#ffffff" : "#334155";
        ctx.shadowBlur = isSpokePassed ? 25 : 6;
        ctx.shadowColor = "#ffffff";
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // 5. Final 8th Turn Readiness Shockwave Ring
      if (currentStepIdx >= 7) {
        shockwaveRadius += 20;
        ctx.beginPath();
        ctx.arc(cx, cy, shockwaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, 1 - shockwaveRadius / 800)})`;
        ctx.lineWidth = 5;
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#ffffff";
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex flex-col items-center justify-between p-6 sm:p-10 font-sans select-none text-white">
      {/* 2D Mahoraga Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Top Brand Header */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-6xl pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-black shadow-lg">
            <ShieldCheck className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-wider uppercase">BIKITA MINERALS</h1>
            <p className="text-xs text-slate-400 font-semibold">IT Operations Platform v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            className="text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900/90 backdrop-blur-md flex items-center gap-1.5 shadow-md"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Skip</span>
            <kbd className="bg-white/20 text-white rounded text-[10px] px-1.5 py-0.5 font-mono">ESC</kbd>
          </button>
          <button
            onClick={() => router.push("/login")}
            className="text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md"
          >
            Direct Login
          </button>
          <button
            onClick={() => router.push("/setup")}
            className="text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md"
          >
            System Setup
          </button>
        </div>
      </div>

      {/* Bottom Automated Live Diagnostic HUD */}
      <div className="relative z-10 flex flex-col items-center max-w-xl w-full text-center space-y-4 pointer-events-auto mb-8">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-2xl w-full transition-all flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            <span>[Turn {activeStep + 1}/8] Mahoraga Automatic Adaptation (1s / turn)</span>
          </div>
          <p className="text-sm font-mono font-black text-white">
            {EIGHT_DIAGNOSTIC_STEPS[activeStep]?.text || "Operational Adaptation Complete"}
          </p>
        </div>
      </div>
    </div>
  );
}
