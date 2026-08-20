"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getSavedApiBaseUrl, saveApiBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Server, CheckCircle2, XCircle, Loader2, ArrowRight, ArrowLeft, Building2, User, KeyRound, Sparkles } from "lucide-react";

export default function SetupWizardPage() {
  const router = useRouter();

  // Wizard Navigation
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Server Discovery
  const [serverUrl, setServerUrl] = useState("http://127.0.0.1:3001/api");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [serverInfo, setServerInfo] = useState<{
    version?: string;
    service?: string;
    latency?: number;
    isSetupComplete?: boolean;
    message?: string;
  }>({});

  // Step 2: Master Account Creation
  const [formData, setFormData] = useState({
    name: "System Administrator",
    email: "admin@bikitaminerals.com",
    password: "",
    confirmPassword: "",
    orgName: "Bikita Minerals IT Operations",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load existing saved server on mount and run initial connection test
  useEffect(() => {
    const saved = getSavedApiBaseUrl();
    if (saved) {
      setServerUrl(saved);
    }
  }, []);

  const handleTestServer = async (targetUrl = serverUrl) => {
    setTestStatus("testing");
    setError("");

    let cleanUrl = targetUrl.trim().replace(/\/+$/, "");
    if (!cleanUrl.endsWith("/api")) {
      cleanUrl = `${cleanUrl}/api`;
    }

    const startTime = performance.now();

    try {
      // 1. Ping Health endpoint
      const healthRes = await fetch(`${cleanUrl}/health`, { method: "GET" });
      const latency = Math.round(performance.now() - startTime);

      if (!healthRes.ok) {
        throw new Error(`Server returned HTTP ${healthRes.status}`);
      }

      const healthData = await healthRes.json().catch(() => ({}));

      // 2. Check setup state
      const checkRes = await fetch(`${cleanUrl}/setup/check`, { method: "GET" });
      const checkData = checkRes.ok ? await checkRes.json().catch(() => ({})) : {};

      setTestStatus("success");
      setServerInfo({
        version: healthData.version || "0.4.0",
        service: healthData.service || "Pulse IT Operations API",
        latency,
        isSetupComplete: !!checkData.isSetupComplete,
      });

      // Persist working server address
      saveApiBaseUrl(cleanUrl);
    } catch (err: any) {
      setTestStatus("error");
      setServerInfo({
        message:
          "Connection refused. Ensure the backend is running (python manage.py runserver 0.0.0.0:3001) and reachable on this network.",
      });
    }
  };

  const handleStep1Proceed = () => {
    saveApiBaseUrl(serverUrl);
    if (serverInfo.isSetupComplete) {
      // Server already has an admin database configured
      if (typeof window !== "undefined") {
        localStorage.setItem("pulse_client_setup_completed", "true");
      }
      router.push("/login");
    } else {
      setStep(2);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.password) {
      setError("Please enter a master password.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await apiFetch<{ success?: boolean; message?: string }>("/setup/initialize", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          orgName: formData.orgName,
        }),
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("pulse_client_setup_completed", "true");
        localStorage.setItem("has_seen_welcome", "true");
      }

      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Failed to initialize master account on server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-mesh p-4 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply blur-3xl opacity-70"></div>
      <div className="absolute top-0 -right-1/4 w-96 h-96 bg-indigo-300/20 rounded-full mix-blend-multiply blur-3xl opacity-70"></div>
      <div className="absolute -bottom-32 left-20 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply blur-3xl opacity-70"></div>

      <Card className="w-full max-w-lg relative glass shadow-premium border-primary/20 rounded-2xl overflow-hidden z-10 transition-all">
        {/* Header with Step indicator */}
        <CardHeader className="text-center pb-4 pt-6 space-y-3">
          <div className="mx-auto bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-primary/20">
            {step === 1 ? (
              <Server className="h-7 w-7 text-primary animate-pulse" />
            ) : (
              <ShieldCheck className="h-7 w-7 text-primary" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-gradient">
              {step === 1 ? "Pulse System Setup" : "Initialize Master Account"}
            </CardTitle>
            <CardDescription className="text-sm mt-1 text-muted-foreground font-medium">
              {step === 1
                ? "Connect this client application to your central Pulse server."
                : "Create your root administrator profile to secure the platform."}
            </CardDescription>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className={`h-2 rounded-full transition-all duration-300 ${step === 1 ? "w-8 bg-primary" : "w-2 bg-primary/30"}`} />
            <div className={`h-2 rounded-full transition-all duration-300 ${step === 2 ? "w-8 bg-primary" : "w-2 bg-primary/30"}`} />
          </div>
        </CardHeader>

        {/* STEP 1: SERVER DISCOVERY */}
        {step === 1 && (
          <div className="space-y-4 p-6 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Central Server Address (Host IP)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={serverUrl}
                  onChange={(e) => {
                    setServerUrl(e.target.value);
                    setTestStatus("idle");
                  }}
                  placeholder="http://192.168.1.100:3001/api"
                  className="font-mono text-xs h-11 bg-background/60 border-border"
                />
                <Button
                  type="button"
                  onClick={() => handleTestServer()}
                  disabled={testStatus === "testing"}
                  className="h-11 px-4 text-xs font-semibold cursor-pointer shrink-0"
                >
                  {testStatus === "testing" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Test Ping"
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                If running on the same machine, use <span className="font-mono font-bold text-foreground">http://127.0.0.1:3001/api</span>. For other devices across your network, enter the server machine&apos;s LAN IP.
              </p>
            </div>

            {/* Live Connection Diagnostics Card */}
            {testStatus !== "idle" && (
              <div
                className={`p-4 rounded-xl text-xs space-y-2 border transition-all ${
                  testStatus === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                    : testStatus === "error"
                    ? "bg-destructive/10 border-destructive/30 text-destructive"
                    : "bg-primary/5 border-primary/20 text-primary"
                }`}
              >
                {testStatus === "testing" && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Pinging backend service on {serverUrl}...</span>
                  </div>
                )}

                {testStatus === "success" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Backend Connected
                      </span>
                      <span className="font-mono text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        {serverInfo.latency}ms latency
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Service: <span className="font-semibold text-foreground">{serverInfo.service} v{serverInfo.version}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Status:{" "}
                      {serverInfo.isSetupComplete ? (
                        <span className="font-bold text-foreground">Master database initialized. Ready for sign-in.</span>
                      ) : (
                        <span className="font-bold text-amber-500">Uninitialized. Master admin creation required.</span>
                      )}
                    </p>
                  </div>
                )}

                {testStatus === "error" && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <XCircle className="w-4 h-4" />
                      Unable to reach server
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">{serverInfo.message}</p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={handleStep1Proceed}
                disabled={testStatus !== "success"}
                className="w-full h-11 bg-primary text-primary-foreground font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{serverInfo.isSetupComplete ? "Connect & Sign In" : "Continue to Account Setup"}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: MASTER ADMIN INITIALIZATION */}
        {step === 2 && (
          <form onSubmit={handleAccountSubmit} className="space-y-4 p-6 pt-2">
            {error && (
              <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl text-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="orgName" className="text-xs font-semibold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" /> Organization Name
              </Label>
              <Input
                id="orgName"
                value={formData.orgName}
                onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                placeholder="Bikita Minerals IT Operations"
                required
                className="h-10 text-xs bg-background/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" /> Administrator Full Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Anesu Gono"
                required
                className="h-10 text-xs bg-background/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Admin Work Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@bikitaminerals.com"
                required
                className="h-10 text-xs bg-background/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-primary" /> Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="h-10 text-xs bg-background/60"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                  Confirm
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="h-10 text-xs bg-background/60"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="h-11 px-4 text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-11 bg-primary text-primary-foreground font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Initializing System...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Complete Setup & Launch</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        <CardFooter className="bg-muted/20 border-t border-border/40 py-3 px-6 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Pulse IT Operations v0.4.0</span>
          <span>Enterprise Mining Edition</span>
        </CardFooter>
      </Card>
    </div>
  );
}
