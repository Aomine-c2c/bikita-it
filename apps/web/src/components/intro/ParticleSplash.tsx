"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowRight, Box, ClipboardList, Wrench, Network, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface GrainParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  color: string;
}

interface PulseRing {
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
}

export function ParticleSplash() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isWarping, setIsWarping] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [telemetry, setTelemetry] = useState({
    assets: 50,
    inventory: 142,
    tickets: 12,
    network: 99.8,
  });

  // Fetch real telemetry stats to showcase
  useEffect(() => {
    async function loadStats() {
      try {
        const assetsData = await apiFetch<any[]>("/assets").catch(() => []);
        const invData = await apiFetch<any[]>("/inventory").catch(() => []);
        const ticketsData = await apiFetch<any[]>("/tickets").catch(() => []);

        setTelemetry({
          assets: Array.isArray(assetsData) ? assetsData.length : 50,
          inventory: Array.isArray(invData) ? invData.length : 142,
          tickets: Array.isArray(ticketsData) ? ticketsData.length : 12,
          network: 99.8,
        });
      } catch {
        // Keep default telemetry stats
      }
    }
    loadStats();
  }, []);

  const handleProceed = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    setIsWarping(true);

    if (typeof window !== "undefined") {
      sessionStorage.setItem("hasSeenIntro", "true");
    }

    try {
      const data = await apiFetch<{ isSetupComplete: boolean }>("/setup/check");
      setTimeout(() => {
        if (!data?.isSetupComplete) {
          router.push("/setup");
        } else {
          router.push("/login");
        }
      }, 600);
    } catch {
      setTimeout(() => {
        router.push("/login");
      }, 600);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleProceed();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNavigating]);

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

    // 500+ Grain Particles
    const PARTICLE_COUNT = 520;
    const colors = [
      "rgba(99, 102, 241, ", // Indigo
      "rgba(16, 185, 129, ", // Emerald
      "rgba(59, 130, 246, ", // Blue
      "rgba(148, 163, 184, ", // Slate
    ];

    const particles: GrainParticle[] = Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 1.2 + 0.6, // Fine grain size 0.6px - 1.8px
      baseAlpha: Math.random() * 0.4 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    // Radial Pulse Shockwaves
    let pulseRings: PulseRing[] = [];
    let lastPulseTime = 0;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Spawn continuous 2-second pulse shockwaves
      const pulseInterval = isWarping ? 300 : 2000;
      if (time - lastPulseTime > pulseInterval) {
        pulseRings.push({
          radius: 0,
          maxRadius: Math.max(width, height) * 0.8,
          speed: isWarping ? 12 : 3.5,
          alpha: 0.8,
        });
        lastPulseTime = time;
      }

      // Update & draw pulse shockwaves
      pulseRings = pulseRings.filter((ring) => ring.radius < ring.maxRadius && ring.alpha > 0.01);
      pulseRings.forEach((ring) => {
        ring.radius += ring.speed;
        ring.alpha -= 0.003 * (isWarping ? 3 : 1);

        ctx.beginPath();
        ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(99, 102, 241, ${Math.max(0, ring.alpha * 0.35)})`;
        ctx.lineWidth = isWarping ? 3 : 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#6366f1";
        ctx.stroke();
      });

      // Render micro-grain particles & pulse shockwave interactions
      particles.forEach((p) => {
        const speed = isWarping ? 14 : 1;
        p.x += p.vx * speed;
        p.y += p.vy * speed;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Calculate distance to center
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const distToCenter = Math.sqrt(dx * dx + dy * dy);

        // Check if any pulse ring is currently passing through this grain particle
        let currentAlpha = p.baseAlpha;
        let glowBoost = 0;

        pulseRings.forEach((ring) => {
          const ringDist = Math.abs(distToCenter - ring.radius);
          if (ringDist < 40) {
            glowBoost = (1 - ringDist / 40) * 0.6;
          }
        });

        const finalAlpha = Math.min(1, currentAlpha + glowBoost);

        ctx.beginPath();
        ctx.arc(p.x, p.y, glowBoost > 0.2 ? p.size * 1.5 : p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${finalAlpha})`;
        if (glowBoost > 0.2) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#6366f1";
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isWarping]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 flex items-center justify-center font-sans select-none">
      {/* Canvas micro-grain particle background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Ambient native Indigo & Emerald background glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Container Showcase */}
      <div className="relative z-10 max-w-4xl w-full mx-4 flex flex-col items-center">
        
        {/* Centerpiece Glassmorphic Card */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: isWarping ? 1.05 : 1, opacity: isWarping ? 0 : 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="bg-slate-900/85 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 sm:p-10 max-w-lg w-full shadow-2xl text-center flex flex-col items-center border-indigo-500/20 mb-8"
        >
          {/* Pulsing Logo Badge */}
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/25 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-indigo-600 border border-indigo-400/40 flex items-center justify-center shadow-2xl">
              <ShieldAlert className="w-9 h-9 text-white" />
            </div>
          </div>

          {/* Branding */}
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            PULSE <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-emerald-400 to-indigo-300">IT Operations</span>
          </h1>
          <span className="mt-1 text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-950/80 border border-indigo-800/50 px-3 py-1 rounded-full">
            Enterprise Infrastructure Node Architecture v2.0
          </span>

          <p className="mt-4 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
            Unified hardware lifecycle, consumable inventory, automated helpdesk SLAs, and real-time network telemetry.
          </p>

          {/* Live Heartbeat SVG Wave */}
          <div className="w-full my-6 py-2.5 px-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-bold text-slate-300">System Pulse Active</span>
            </div>

            <svg className="w-32 h-6 text-indigo-400" viewBox="0 0 100 25" fill="none">
              <path
                d="M0 12.5 H30 L35 2 L42 23 L48 8 L54 17 L58 12.5 H100"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span className="font-mono text-emerald-400 font-bold">2.0s Shockwave</span>
          </div>

          {/* Enter Prompt & Button */}
          <button
            onClick={handleProceed}
            disabled={isNavigating}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 text-sm cursor-pointer group border border-indigo-400/30"
          >
            <span>Initialize System</span>
            <kbd className="hidden sm:inline-flex items-center justify-center bg-white/20 text-white rounded-md text-[10px] font-black h-5 px-2 tracking-wider border border-white/30">
              ENTER ↵
            </kbd>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Quick Direct Links */}
          <div className="mt-5 flex items-center gap-4 text-xs font-semibold text-slate-400">
            <button
              onClick={() => router.push("/login")}
              className="hover:text-white transition-colors cursor-pointer underline underline-offset-4"
            >
              Direct Login
            </button>
            <span>•</span>
            <button
              onClick={() => router.push("/setup")}
              className="hover:text-white transition-colors cursor-pointer underline underline-offset-4"
            >
              System Setup
            </button>
          </div>
        </motion.div>

        {/* "Showing Everything" — 4 Core Module Showcase Widgets */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isWarping ? 0 : 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full"
        >
          {/* Module 1: Hardware Assets */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Box className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">Hardware Assets</p>
              <p className="text-sm font-black text-white">{telemetry.assets} Managed</p>
            </div>
          </div>

          {/* Module 2: Consumables & Inventory */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ClipboardList className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">Stock Supplies</p>
              <p className="text-sm font-black text-white">{telemetry.inventory} Items</p>
            </div>
          </div>

          {/* Module 3: IT Helpdesk */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Wrench className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">IT Helpdesk</p>
              <p className="text-sm font-black text-white">{telemetry.tickets} Active SLAs</p>
            </div>
          </div>

          {/* Module 4: Network Telemetry */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Network className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">Network Health</p>
              <p className="text-sm font-black text-white">{telemetry.network}% Online</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
