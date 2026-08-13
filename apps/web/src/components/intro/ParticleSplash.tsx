"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Box, ClipboardList, Wrench, Network, Zap } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
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
        // Fallback
      }
    }
    loadStats();
  }, []);

  const handleAdaptationTrigger = async () => {
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
      }, 700);
    } catch {
      setTimeout(() => {
        router.push("/login");
      }, 700);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleAdaptationTrigger();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNavigating]);

  // 3D Mahoraga Wheel & Grain Particles Engine
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

    // 3D Rotation State
    let angleZ = 0;
    let angleY = 0.2;
    let angleX = 0.3;

    // 450 Micro-Grain Particles around the Wheel
    const PARTICLE_COUNT = 450;
    const particles: Particle3D[] = Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 800,
      z: (Math.random() - 0.5) * 800,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      vz: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    // 3D Projection Math helper
    const project = (p: Point3D) => {
      // Z rotation
      const cosZ = Math.cos(angleZ);
      const sinZ = Math.sin(angleZ);
      const x1 = p.x * cosZ - p.y * sinZ;
      const y1 = p.x * sinZ + p.y * cosZ;
      const z1 = p.z;

      // Y rotation
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const x2 = x1 * cosY + z1 * sinY;
      const y2 = y1;
      const z2 = -x1 * sinY + z1 * cosY;

      // X rotation
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const x3 = x2;
      const y3 = y2 * cosX - z2 * sinX;
      const z3 = y2 * sinX + z2 * cosX;

      // Perspective projection
      const fov = 450;
      const scale = fov / (fov + z3 + 400);
      return {
        x: width / 2 + x3 * scale,
        y: height / 2 + y3 * scale,
        scale,
        z: z3,
      };
    };

    let shockwaveRadius = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth Z rotation (continuous + Mahoraga click turns)
      const rotationSpeed = isWarping ? 0.08 : 0.006;
      angleZ += rotationSpeed;

      // Ambient X/Y tilt wobble
      angleY = Math.sin(Date.now() * 0.001) * 0.25;
      angleX = Math.cos(Date.now() * 0.001) * 0.2;

      // Draw background 3D Micro-Grain Particles
      particles.forEach((p) => {
        p.x += p.vx * (isWarping ? 4 : 1);
        p.y += p.vy * (isWarping ? 4 : 1);
        p.z += p.vz * (isWarping ? 4 : 1);

        if (p.x > 500) p.x = -500;
        if (p.x < -500) p.x = 500;
        if (p.y > 500) p.y = -500;
        if (p.y < -500) p.y = 500;
        if (p.z > 500) p.z = -500;
        if (p.z < -500) p.z = 500;

        const proj = project(p);
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, p.size * proj.scale, 0, Math.PI * 2);
        ctx.fillStyle = isWarping
          ? `rgba(99, 102, 241, ${p.alpha * proj.scale})`
          : `rgba(148, 163, 184, ${p.alpha * proj.scale * 0.7})`;
        ctx.fill();
      });

      // ─── DRAW 3D MAHORAGA WHEEL (Eight-Handled Divergent Sila Divine General Wheel) ───
      const WHEEL_RADIUS = 160;
      const HANDLE_COUNT = 8;

      // 1. Draw Outer Rim Circle
      const SEGMENTS = 64;
      ctx.beginPath();
      for (let i = 0; i <= SEGMENTS; i++) {
        const theta = (i / SEGMENTS) * Math.PI * 2;
        const pt = project({
          x: Math.cos(theta) * WHEEL_RADIUS,
          y: Math.sin(theta) * WHEEL_RADIUS,
          z: 0,
        });
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = isWarping ? "rgba(99, 102, 241, 0.9)" : "rgba(99, 102, 241, 0.6)";
      ctx.lineWidth = isWarping ? 4 : 2.5;
      ctx.shadowBlur = isWarping ? 25 : 12;
      ctx.shadowColor = "#6366f1";
      ctx.stroke();

      // Inner Hub Rim Circle
      ctx.beginPath();
      for (let i = 0; i <= SEGMENTS; i++) {
        const theta = (i / SEGMENTS) * Math.PI * 2;
        const pt = project({
          x: Math.cos(theta) * (WHEEL_RADIUS * 0.4),
          y: Math.sin(theta) * (WHEEL_RADIUS * 0.4),
          z: 0,
        });
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = "rgba(16, 185, 129, 0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Central Energy Core Node
      const centerPt = project({ x: 0, y: 0, z: 0 });
      ctx.beginPath();
      ctx.arc(centerPt.x, centerPt.y, 12 * centerPt.scale, 0, Math.PI * 2);
      ctx.fillStyle = "#6366f1";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#10b981";
      ctx.fill();

      // 2. Draw 8 Spokes & 8 Handles (Eight-Handled Divergent Sila Wheel)
      for (let h = 0; h < HANDLE_COUNT; h++) {
        const angle = (h / HANDLE_COUNT) * Math.PI * 2;

        const hubPt = project({
          x: Math.cos(angle) * (WHEEL_RADIUS * 0.4),
          y: Math.sin(angle) * (WHEEL_RADIUS * 0.4),
          z: 0,
        });

        const rimPt = project({
          x: Math.cos(angle) * WHEEL_RADIUS,
          y: Math.sin(angle) * WHEEL_RADIUS,
          z: 0,
        });

        const handleTipPt = project({
          x: Math.cos(angle) * (WHEEL_RADIUS + 45),
          y: Math.sin(angle) * (WHEEL_RADIUS + 45),
          z: 0,
        });

        // Draw Spoke Line
        ctx.beginPath();
        ctx.moveTo(hubPt.x, hubPt.y);
        ctx.lineTo(rimPt.x, rimPt.y);
        ctx.strokeStyle = "rgba(99, 102, 241, 0.7)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Handle Shaft
        ctx.beginPath();
        ctx.moveTo(rimPt.x, rimPt.y);
        ctx.lineTo(handleTipPt.x, handleTipPt.y);
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw Mahoraga Handle Tip Knob
        ctx.beginPath();
        ctx.arc(handleTipPt.x, handleTipPt.y, 7 * handleTipPt.scale, 0, Math.PI * 2);
        ctx.fillStyle = isWarping ? "#10b981" : "#6366f1";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#6366f1";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw Shockwave Ring on ENTER / Click Adaptation
      if (isWarping) {
        shockwaveRadius += 15;
        ctx.beginPath();
        ctx.arc(centerPt.x, centerPt.y, shockwaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16, 185, 129, ${Math.max(0, 1 - shockwaveRadius / 600)})`;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#10b981";
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isWarping]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 flex items-center justify-center font-sans select-none">
      {/* 3D Mahoraga Wheel & Grain Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Centerpiece Container */}
      <div className="relative z-10 max-w-4xl w-full mx-4 flex flex-col items-center pointer-events-auto">
        
        {/* Centerpiece Glassmorphic Card */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: isWarping ? 1.05 : 1, opacity: isWarping ? 0 : 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="bg-slate-900/85 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 sm:p-10 max-w-lg w-full shadow-2xl text-center flex flex-col items-center border-indigo-500/20 mb-8"
        >
          {/* Mahoraga Adaptation Status Badge */}
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/25 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-indigo-600 border border-indigo-400/40 flex items-center justify-center shadow-2xl">
              <Zap className="w-9 h-9 text-emerald-400 animate-bounce" />
            </div>
          </div>

          {/* Branding */}
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            PULSE <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-emerald-400 to-indigo-300">IT Operations</span>
          </h1>
          <span className="mt-1 text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-950/80 border border-indigo-800/50 px-3 py-1 rounded-full flex items-center gap-1.5 justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Divine General Wheel Architecture v2.0
          </span>

          <p className="mt-4 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
            Continuous system adaptation — asset lifecycle tracking, consumable inventory, automated helpdesk SLAs, and network telemetry.
          </p>

          {/* 3D Wheel Adaptation Notches Indicator */}
          <div className="w-full my-6 py-2.5 px-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-300">Mahoraga Wheel Active</span>
            </div>

            <span className="font-mono text-indigo-400 font-bold">8-Handled Rotation</span>

            <span className="font-mono text-emerald-400 font-bold">60 FPS</span>
          </div>

          {/* Enter Prompt & Adaptation Spin Button */}
          <button
            onClick={handleAdaptationTrigger}
            disabled={isNavigating}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 text-sm cursor-pointer group border border-indigo-400/30"
          >
            <span>Rotate Wheel & Initialize</span>
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

        {/* 4 Core Module Showcase Widgets with Uniform App Colors */}
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
