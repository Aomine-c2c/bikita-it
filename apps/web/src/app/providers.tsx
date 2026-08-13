"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import "../lib/i18n";

/** Only retry on network-level failures (backend not yet started). */
function isNetworkError(err: any): boolean {
  return err instanceof TypeError && (err as TypeError).message === "Failed to fetch";
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
            // Retry up to 3 times on network failures (e.g. Tauri backend still compiling).
            // HTTP errors (4xx/5xx) are surfaced immediately — retry = false for those.
            retry: (failureCount, error) =>
              isNetworkError(error) && failureCount < 3,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
