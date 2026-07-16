"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function SetupGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Don't check on the setup page itself
    if (pathname === "/setup") {
      setIsChecking(false);
      return;
    }

    const checkSetup = async () => {
      try {
        const res = await fetch("/api/setup/check");
        if (res.ok) {
          const data = await res.json();
          if (!data.isSetupComplete) {
            router.push("/setup");
          } else {
            setIsChecking(false);
          }
        } else {
          // If API fails, just let it through for now or show error
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Failed to check setup status:", error);
        setIsChecking(false);
      }
    };

    checkSetup();
  }, [pathname, router]);

  if (isChecking && pathname !== "/setup") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground font-medium">Initializing Xiphos...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
