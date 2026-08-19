import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SetupGuard } from "@/components/auth/SetupGuard";
import { UpdateNotification } from "@/components/updater/UpdateNotification";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pulse IT Operations Platform v2.0",
  description: "Enterprise IT Operations Platform — Asset Management, Knowledge Base, Operations Center, and Documentation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased light`} style={{ colorScheme: 'light' }}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <SetupGuard>
            {children}
          </SetupGuard>
          <UpdateNotification />
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
