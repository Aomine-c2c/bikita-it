"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowRight, Activity, Zap, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
}

export function ParticleSplash() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isWarping, setIsWarping] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const mouseRef = useRef({ x: -1000, y: -1000 });

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
      }, 500);
    } catch {
      setTimeout(() => {
        router.push("/login");
      }, 500);
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

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    const PARTICLE_COUNT = 110;
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      radius: Math.random() * 2 + 1,
      baseAlpha: Math.random() * 0.5 + 0.3,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render links between close particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.25;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Render particles & mouse interactions
      particles.forEach((p) => {
        const speed = isWarping ? 18 : 1;
        p.x += p.vx * speed;
        p.y += p.vy * speed;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Mouse connection line
        const mdx = p.x - mouseRef.current.x;
        const mdy = p.y - mouseRef.current.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 160) {
          const malpha = (1 - mdist / 160) * 0.5;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(59, 130, 246, ${malpha})`;
          ctx.lineWidth = 1.5;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, isWarping ? p.radius * 2 : p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isWarping
          ? `rgba(236, 72, 153, ${p.baseAlpha})`
          : `rgba(99, 102, 241, ${p.baseAlpha})`;
        ctx.shadowBlur = isWarping ? 12 : 6;
        ctx.shadowColor = "#6366f1";
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isWarping]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 flex items-center justify-center font-sans select-none">
      {/* Canvas particle background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Centerpiece Glassmorphic Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: isWarping ? 1.05 : 1, opacity: isWarping ? 0 : 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 sm:p-12 max-w-lg w-full mx-4 shadow-2xl text-center flex flex-col items-center border-indigo-500/20"
      >
        {/* Pulsing Logo Badge */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/30 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-indigo-600 border border-indigo-400/40 flex items-center justify-center shadow-2xl">
            <ShieldAlert className="w-9 h-9 text-white" />
          </div>
        </div>

        {/* Branding */}
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          PULSE <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">IT Operations</span>
        </h1>
        <span className="mt-1 text-[11px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-950/80 border border-indigo-800/50 px-3 py-1 rounded-full">
          Enterprise Node Architecture v2.0
        </span>

        <p className="mt-4 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
          Real-time hardware lifecycle tracking, network telemetry, automated helpdesk dispatching, and infrastructure analytics.
        </p>

        {/* Live Heartbeat SVG Wave */}
        <div className="w-full my-6 py-2 px-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bold text-slate-300">System Ready</span>
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

          <span className="font-mono text-indigo-300 font-bold">60 FPS</span>
        </div>

        {/* Enter Prompt & Button */}
        <button
          onClick={handleProceed}
          disabled={isNavigating}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 text-sm cursor-pointer group border border-indigo-400/30"
        >
          <span>Initialize System</span>
          <kbd className="hidden sm:inline-flex items-center justify-center bg-white/20 text-white rounded-md text-[10px] font-black h-5 px-2 tracking-wider border border-white/30">
            ENTER ↵
          </kbd>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Manual Direct Links */}
        <div className="mt-6 flex items-center gap-4 text-xs font-semibold text-slate-400">
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
    </div>
  );
}
