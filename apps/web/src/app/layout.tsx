import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SetupGuard } from "@/components/auth/SetupGuard";
import { UpdateNotification } from "@/components/updater/UpdateNotification";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Xiphos IT Operations Platform",
  description: "Enterprise IT Asset Management and Operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased light`} style={{ colorScheme: 'light' }}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SetupGuard>
          {children}
        </SetupGuard>
        <UpdateNotification />
      </body>
    </html>
  );
}

