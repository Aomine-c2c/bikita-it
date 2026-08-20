"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export function SetupGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<"checking"|"ready"|"unavailable">("checking");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const init = async () => {
      try {
        const data = await apiFetch<{ authEnabled: boolean; isSetupComplete: boolean }>('/setup/check');
        if (!active) return;
        
        // Local mode (authEnabled: false) — treat as always ready, no login/setup needed
        if (!data.authEnabled) {
          if (pathname === "/login" || pathname === "/setup") {
            router.replace("/");
            return;
          }
          setState("ready");
          return;
        }

        // If user has valid token, allow authenticated routes
        const hasToken = document.cookie.includes("token=") || (typeof window !== "undefined" && !!localStorage.getItem("token"));
        if (hasToken) {
          if (pathname === "/login" || pathname === "/setup") {
            router.replace("/");
            return;
          }
          setState("ready");
          return;
        }

        // Check if client setup has been performed on this device
        const isClientSetupCompleted = typeof window !== "undefined" && localStorage.getItem("pulse_client_setup_completed") === "true";

        if (pathname === "/setup") {
          setState("ready");
          return;
        }

        if (!data.isSetupComplete || !isClientSetupCompleted) {
          if (pathname !== "/setup" && !pathname.startsWith("/portal")) {
            router.replace("/setup");
            return;
          }
        }

        if (pathname !== "/login" && !pathname.startsWith("/portal") && !pathname.startsWith("/welcome") && !pathname.startsWith("/setup")) {
          router.replace("/login");
          return;
        }

        setState("ready");
      } catch (__err) {
        if (!active) return;
        // If API is unreachable and setup not completed, route to /setup to configure server
        const isClientSetupCompleted = typeof window !== "undefined" && localStorage.getItem("pulse_client_setup_completed") === "true";
        if (!isClientSetupCompleted && pathname !== "/setup" && !pathname.startsWith("/portal")) {
          router.replace("/setup");
          return;
        }
        setState("ready");
      }
    };

    init();

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [pathname, router]);

  if (state === "ready") return <>{children}</>;
  return (
    <main className="min-h-screen grid place-items-center" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Verifying secure initialization…</p>
      </div>
    </main>
  );
}
