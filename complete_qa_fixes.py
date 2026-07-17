from pathlib import Path
p=Path(r'C:\Users\armut\404\BikitaIT')
def w(r,s): (p/r).write_text(s,encoding='utf-8')
def rep(r,a,b):
 x=p/r;s=x.read_text(encoding='utf-8');\n if a in s: x.write_text(s.replace(a,b),encoding='utf-8')
# semantic responsive sidebar
rep('apps/web/src/components/layout/Sidebar.tsx','className="h-full bg-[#F4F4F5]','className="hidden md:flex h-full bg-[#F4F4F5]')
rep('apps/web/src/components/layout/Sidebar.tsx','          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}','          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}\n          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}')
rep('apps/web/src/components/layout/Sidebar.tsx','''          <div
            onClick={() => window.location.href = '/settings'}
            title="John Doe — IT Administrator"''','''          <Link href="/settings"
            aria-label="Open current user settings"
            title="Current user settings"''')
rep('apps/web/src/components/layout/Sidebar.tsx','''          </div>
        ) : (
          <div 
            onClick={() => window.location.href = '/settings'}''','''          </Link>
        ) : (
          <Link href="/settings" aria-label="Open current user settings"''')
# only last expanded profile closure
old='''            </div>
          </div>
        )}
      </div>
    </motion.aside>'''
new='''            </div>
          </Link>
        )}
      </div>
    </motion.aside>'''
rep('apps/web/src/components/layout/Sidebar.tsx',old,new)
# Header
rep('apps/web/src/components/layout/Header.tsx','import { Search, Bell, Settings, ChevronRight, Sparkles }','import { Search, Bell, Settings, ChevronRight, Sparkles, Menu }')
rep('apps/web/src/components/layout/Header.tsx','className="h-16 bg-background flex items-center justify-between px-8','className="h-16 bg-background flex items-center justify-between px-4 sm:px-8 relative')
rep('apps/web/src/components/layout/Header.tsx','      <div className="flex items-center gap-2 text-[13px]">','      <div className="flex items-center gap-2 text-[13px]">\n        <a href="#mobile-navigation" className="md:hidden p-2" aria-label="Open mobile navigation"><Menu className="w-5 h-5" /></a>')
rep('apps/web/src/components/layout/Header.tsx','        <div className="relative w-64"','        <div className="relative w-64 hidden sm:block"')
rep('apps/web/src/components/layout/Header.tsx','            title="Ask AI Assistant"','            aria-label="Ask AI Assistant"\n            title="Ask AI Assistant"')
rep('apps/web/src/components/layout/Header.tsx','            title="Notifications"','            aria-label="Open notifications"\n            title="Notifications"')
rep('apps/web/src/components/layout/Header.tsx','            title="Settings"','            aria-label="Open settings"\n            title="Settings"')
rep('apps/web/src/components/layout/Header.tsx','''      </div>
    </header>
  );''','''      </div>
      <nav id="mobile-navigation" aria-label="Mobile navigation" className="md:hidden absolute top-16 left-0 right-0 overflow-x-auto bg-white border-b px-3 py-2 flex gap-3">{Object.entries(ROUTE_LABELS).map(([href,label]) => <a key={href} href={href} className="whitespace-nowrap text-xs font-medium p-2">{label}</a>)}</nav>
    </header>
  );''')
# Dynamic routes
w('apps/web/src/app/assets/[id]/page.tsx','''import { notFound } from "next/navigation"; import AssetDetailsClient from "./AssetDetailsClient";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function Page({params}:{params:Promise<{id:string}>}) { const {id}=await params; if(!UUID.test(id)) notFound(); return <AssetDetailsClient assetId={id}/>; }
''')
w('apps/web/src/app/assets/[id]/AssetDetailsClient.tsx','''"use client";
import { useEffect,useState } from "react"; import { DashboardLayout } from "@/components/layout/DashboardLayout";
export default function AssetDetailsClient({assetId}:{assetId:string}) { const [state,setState]=useState<"loading"|"missing"|"error">("loading"); useEffect(()=>{fetch(`/api/assets/${encodeURIComponent(assetId)}`,{cache:"no-store"}).then(r=>setState(r.status===404?"missing":"error")).catch(()=>setState("error"));},[assetId]); return <DashboardLayout><section role="status" className="rounded-xl border bg-white p-8"><h1 className="text-xl font-bold">{state==="loading"?"Loading asset…":state==="missing"?"Asset not found":"Asset details unavailable"}</h1><p className="mt-2 text-sm text-muted-foreground">{state==="missing"?"No asset exists with this identifier.":state==="error"?"Live asset data could not be loaded. No sample record is displayed.":"Verifying the record…"}</p></section></DashboardLayout>; }
''')
w('apps/web/src/app/employees/[id]/page.tsx','''import { notFound } from "next/navigation";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function Page({params}:{params:Promise<{id:string}>}) { const {id}=await params; if(!UUID.test(id)) notFound(); return <main className="min-h-screen grid place-items-center p-8"><section><h1 className="text-xl font-bold">Employee details unavailable</h1><p>Live employee data must be verified before display.</p></section></main>; }
''')
# tests append
x=p/'apps/web/test/config.test.mjs';s=x.read_text(encoding='utf-8');s+='''\ntest('web supplies CSP and fail-closed setup guard', () => { const config=fs.readFileSync(new URL('../next.config.ts', import.meta.url),'utf8'); const guard=fs.readFileSync(new URL('../src/components/auth/SetupGuard.tsx', import.meta.url),'utf8'); assert.match(config,/Content-Security-Policy/); assert.match(guard,/Access is denied/); });
test('guided tour is dashboard-only', () => { const layout=fs.readFileSync(new URL('../src/app/layout.tsx', import.meta.url),'utf8'); const dashboard=fs.readFileSync(new URL('../src/app/page.tsx', import.meta.url),'utf8'); assert.doesNotMatch(layout,/GuidedTour/); assert.match(dashboard,/GuidedTour/); });
''';x.write_text(s,encoding='utf-8')
print('remaining fixes applied')
