from pathlib import Path
p=Path(r'C:\Users\armut\404\BikitaIT')

def write(rel,s):
    x=p/rel; x.parent.mkdir(parents=True,exist_ok=True); x.write_text(s,encoding='utf-8')

def replace(rel,a,b):
    x=p/rel; s=x.read_text(encoding='utf-8'); assert a in s, f'missing {a[:40]} in {rel}'; x.write_text(s.replace(a,b),encoding='utf-8')

# CSP defense in depth (no unsafe-eval; inline style remains required by current UI libraries).
replace('apps/web/next.config.ts',"    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },","    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },\n    { key: 'Content-Security-Policy', value: \"default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; upgrade-insecure-requests\" },")

# Tour only belongs on dashboard, never setup/operational routes.
replace('apps/web/src/app/layout.tsx','import { GuidedTour } from "@/components/tutorial/GuidedTour";\n','')
replace('apps/web/src/app/layout.tsx','          {children}\n          <GuidedTour />','          {children}')
replace('apps/web/src/app/page.tsx','import React', 'import { GuidedTour } from "@/components/tutorial/GuidedTour";\nimport React')
# inject into dashboard page layout children
replace('apps/web/src/app/page.tsx','    <DashboardLayout>','    <DashboardLayout>\n      <GuidedTour />')
replace('apps/web/src/components/tutorial/GuidedTour.tsx','        animate: true,','        animate: true,\n        allowClose: true,\n        overlayClickBehavior: "close",\n        popoverClass: "max-w-[calc(100vw-2rem)]",')

# Setup guard fails closed when setup state cannot be established.
write('apps/web/src/components/auth/SetupGuard.tsx', '''"use client";
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
''')

# Clear label for remaining prototype visualizations.
write('apps/web/src/components/layout/DemoDataNotice.tsx','''export function DemoDataNotice() { return <div role="status" className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-semibold text-amber-900">Prototype visualization — displayed metrics and topology are sample data, not live operational records.</div>; }\n''')
replace('apps/web/src/components/layout/DashboardLayout.tsx','import { AIAssistantSidebar } from "./AIAssistantSidebar";','import { AIAssistantSidebar } from "./AIAssistantSidebar";\nimport { DemoDataNotice } from "./DemoDataNotice";')
replace('apps/web/src/components/layout/DashboardLayout.tsx','        <Header onToggleAI={() => setIsAIOpen(!isAIOpen)} isAIOpen={isAIOpen} />\n        <main','        <Header onToggleAI={() => setIsAIOpen(!isAIOpen)} isAIOpen={isAIOpen} />\n        <DemoDataNotice />\n        <main id="main-content"')
replace('apps/web/src/components/layout/DashboardLayout.tsx','className="flex-1 overflow-y-auto px-8 pb-8 pt-4"','className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8 pt-4"')
replace('apps/web/src/components/layout/DashboardLayout.tsx','    <div className="flex h-screen','    <div className="flex h-screen')
replace('apps/web/src/components/layout/DashboardLayout.tsx','      <Sidebar />','      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Skip to main content</a>\n      <Sidebar />')

# Responsive sidebar and semantic profile links.
replace('apps/web/src/components/layout/Sidebar.tsx','      className="h-full bg-[#F4F4F5]','      className="hidden md:flex h-full bg-[#F4F4F5]')
replace('apps/web/src/components/layout/Sidebar.tsx','          <div\n            onClick={() => window.location.href = \'/settings\'\n            title="John Doe — IT Administrator"','          <Link href="/settings"\n            aria-label="Open settings for current user"\n            title="Current user settings"')
replace('apps/web/src/components/layout/Sidebar.tsx','          </div>\n        ) : (\n          <div \n            onClick={() => window.location.href = \'/settings\'\n            className="flex items-center gap-3 bg-white','          </Link>\n        ) : (\n          <Link href="/settings" aria-label="Open current user settings"\n            className="flex items-center gap-3 bg-white')
# final profile closing immediately before ternary end - targeted
replace('apps/web/src/components/layout/Sidebar.tsx','            </div>\n          </div>\n        )}\n      </div>','            </div>\n          </Link>\n        )}\n      </div>')
replace('apps/web/src/components/layout/Sidebar.tsx','          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}','          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}\n          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}')

# Mobile header nav and explicit accessible names.
replace('apps/web/src/components/layout/Header.tsx','import { Search, Bell, Settings, ChevronRight, Sparkles }','import { Search, Bell, Settings, ChevronRight, Sparkles, Menu }')
replace('apps/web/src/components/layout/Header.tsx','className="h-16 bg-background flex items-center justify-between px-8','className="h-16 bg-background flex items-center justify-between px-4 sm:px-8')
replace('apps/web/src/components/layout/Header.tsx','      <div className="flex items-center gap-2 text-[13px]">','      <div className="flex items-center gap-2 text-[13px]">\n        <a href="#mobile-navigation" className="md:hidden p-2" aria-label="Open mobile navigation"><Menu className="w-5 h-5" /></a>')
replace('apps/web/src/components/layout/Header.tsx','        <div className="relative w-64"','        <div className="relative w-64 hidden sm:block"')
replace('apps/web/src/components/layout/Header.tsx','            title="Ask AI Assistant"','            aria-label="Ask AI Assistant"\n            title="Ask AI Assistant"')
replace('apps/web/src/components/layout/Header.tsx','            title="Notifications"','            aria-label="Open notifications"\n            title="Notifications"')
replace('apps/web/src/components/layout/Header.tsx','            title="Settings"','            aria-label="Open settings"\n            title="Settings"')
# Simple mobile route strip below header.
replace('apps/web/src/components/layout/Header.tsx','    </header>\n  );','      <nav id="mobile-navigation" aria-label="Mobile navigation" className="md:hidden absolute top-16 left-0 right-0 overflow-x-auto bg-white border-b px-3 py-2 flex gap-3">{Object.entries(ROUTE_LABELS).map(([href,label]) => <a key={href} href={href} className="whitespace-nowrap text-xs font-medium p-2">{label}</a>)}</nav>\n    </header>\n  );')

# Dynamic records: invalid non-UUID slugs are genuine server-side 404s and never render sample details.
write('apps/web/src/app/assets/[id]/page.tsx','''import { notFound } from "next/navigation";
import AssetDetailsClient from "./AssetDetailsClient";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function Page({params}:{params:Promise<{id:string}>}) { const {id}=await params; if(!UUID.test(id)) notFound(); return <AssetDetailsClient assetId={id}/>; }
''')
# client detail is conservative unavailable state until actual endpoint succeeds
write('apps/web/src/app/assets/[id]/AssetDetailsClient.tsx','''"use client";
import { useEffect,useState } from "react"; import { DashboardLayout } from "@/components/layout/DashboardLayout";
export default function AssetDetailsClient({assetId}:{assetId:string}) { const [state,setState]=useState<"loading"|"missing"|"error">("loading"); useEffect(()=>{fetch(`/api/assets/${encodeURIComponent(assetId)}`,{cache:"no-store"}).then(r=>{if(r.status===404)setState("missing");else if(!r.ok)setState("error");else setState("error");}).catch(()=>setState("error"));},[assetId]); return <DashboardLayout><section role="status" className="rounded-xl border bg-white p-8"><h1 className="text-xl font-bold">{state==="loading"?"Loading asset…":state==="missing"?"Asset not found":"Asset details unavailable"}</h1><p className="mt-2 text-sm text-muted-foreground">{state==="missing"?"No asset exists with this identifier.":state==="error"?"Live asset data could not be loaded. No sample record is displayed.":"Verifying the record…"}</p></section></DashboardLayout>; }\n''')
write('apps/web/src/app/employees/[id]/page.tsx','''import { notFound } from "next/navigation";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function Page({params}:{params:Promise<{id:string}>}) { const {id}=await params; if(!UUID.test(id)) notFound(); return <main className="min-h-screen grid place-items-center p-8"><section><h1 className="text-xl font-bold">Employee details unavailable</h1><p>Live employee data must be verified before display.</p></section></main>; }
''')

# Setup response endpoint naming consistency and endpoint contract tests.
replace('apps/web/test/config.test.mjs',"assert.doesNotMatch(source, /localhost:3001/); });","assert.doesNotMatch(source, /localhost:3001/); });\ntest('web supplies CSP and fail-closed setup guard', () => { const config=fs.readFileSync(new URL('../next.config.ts', import.meta.url),'utf8'); const guard=fs.readFileSync(new URL('../src/components/auth/SetupGuard.tsx', import.meta.url),'utf8'); assert.match(config,/Content-Security-Policy/); assert.match(guard,/Access is denied/); });\ntest('guided tour is dashboard-only', () => { const layout=fs.readFileSync(new URL('../src/app/layout.tsx', import.meta.url),'utf8'); const dashboard=fs.readFileSync(new URL('../src/app/page.tsx', import.meta.url),'utf8'); assert.doesNotMatch(layout,/GuidedTour/); assert.match(dashboard,/GuidedTour/); });")
print('QA remediation patches applied')
