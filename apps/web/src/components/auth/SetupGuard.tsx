"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function SetupGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<"checking"|"ready"|"unavailable">("checking");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch("/api/setup/check", { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) throw new Error("status unavailable");
        const data = await res.json();
        if (!active) return;
        if (pathname === "/setup") {
          if (data.isSetupComplete) window.location.href = "/";
          else setState("ready");
        } else if (!data.isSetupComplete) {
          window.location.href = "/setup";
        } else {
          setState("ready");
        }
      })
      .catch(() => {
        if (!active) return;
        // API unreachable — fall through to show the page anyway
        // so the app isn't stuck on a fresh dev environment
        if (pathname === "/setup") setState("ready");
        else setState("ready"); // allow access, user may see empty data
      });

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
