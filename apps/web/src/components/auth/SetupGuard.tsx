"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function SetupGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter();
  const [state, setState] = useState<"checking"|"ready"|"unavailable">("checking");
  useEffect(() => {
    let active=true;
    fetch("/api/setup/check", { cache: "no-store" }).then(async res => {
      if (!res.ok) throw new Error("status unavailable");
      const data=await res.json(); if(!active) return;
      if (pathname === "/setup") { if(data.isSetupComplete) router.replace("/"); else setState("ready"); }
      else if (!data.isSetupComplete) router.replace("/setup"); else setState("ready");
    }).catch(() => active && setState("unavailable"));
    return () => { active=false; };
  }, [pathname, router]);
  if(state === "ready") return <>{children}</>;
  if(state === "unavailable") return <main className="min-h-screen grid place-items-center p-6 bg-slate-50"><section role="alert" className="max-w-lg rounded-xl border bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold">Service temporarily unavailable</h1><p className="mt-3 text-sm text-muted-foreground">Xiphos could not securely verify system initialization. Access is denied until the API and database are healthy.</p><button className="mt-5 rounded-md bg-primary px-4 py-2 text-sm text-white" onClick={() => location.reload()}>Retry</button></section></main>;
  return <main className="min-h-screen grid place-items-center" aria-live="polite"><p>Verifying secure initialization…</p></main>;
}
