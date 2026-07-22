"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getApiBase } from "@/lib/api";

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
        const base = await getApiBase();
        const res = await fetch(`${base}/setup/check`, { cache: "no-store", signal: controller.signal });
        if (!active) return;
        if (!res.ok) throw new Error("status unavailable");
        const data = await res.json();
        if (!active) return;
        
        // Local mode (authEnabled: false) — treat as always ready, no login/setup needed
        if (!data.authEnabled) {
          if (pathname === "/login" || pathname === "/setup") {
            window.location.href = "/";
            return;
          }
          setState("ready");
          return;
        }

        // Auth-enabled mode — enforce setup and login flows
        if (pathname === "/setup") {
          if (data.isSetupComplete) window.location.href = "/";
          else setState("ready");
          return;
        }

        if (!data.isSetupComplete) {
          window.location.href = "/setup";
          return;
        }

        if (pathname !== "/login") {
          const hasToken = document.cookie.includes("token=") || !!localStorage.getItem("token");
          if (!hasToken) {
            window.location.href = "/login";
            return;
          }
        }

        setState("ready");
      } catch (_err) {
        if (!active) return;
        // API unreachable — fall through to show the page anyway
        if (pathname === "/setup") setState("ready");
        else setState("ready");
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
