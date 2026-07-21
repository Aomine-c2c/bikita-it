"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getApiBase } from "@/lib/api";
import { Loader2 } from "lucide-react";

const PUBLIC_PATHS = ["/login", "/setup"];

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (match) return match[1];
  return localStorage.getItem("token");
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    if (isPublic) {
      setChecked(true);
      return;
    }

    async function check() {
      const token = getToken();

      if (!token) {
        try {
          const base = await getApiBase();
          const res = await fetch(`${base}/setup/check`);
          const data = await res.json();
          if (!data.isSetupComplete) {
            router.replace("/setup");
          } else {
            router.replace("/login");
          }
        } catch {
          router.replace("/login");
        }
        return;
      }

      setChecked(true);
    }

    check();
  }, [pathname, router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
