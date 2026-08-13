"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Database, Globe, Shield, Bell, Users, Check, Save, Loader2,
  HardDrive, Lock, Mail, RefreshCw, Layers, Key, AlertCircle, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch, employeesApi, type Employee } from "@/lib/api";

const SECTIONS = [
  { id: "general", label: "General", icon: Settings, desc: "Organization details, locale & system preferences" },
  { id: "security", label: "Security & Auth", icon: Shield, desc: "MFA enforcement, session limits & IP allowlists" },
  { id: "notifications", label: "Notifications", icon: Bell, desc: "Email alerts, SMS gateways & SMTP config" },
  { id: "database", label: "Database & Backup", icon: Database, desc: "SQLite metrics, automated backups & retention" },
  { id: "taxonomies", label: "Taxonomies", icon: Layers, desc: "Asset categories, hardware brands & locations" },
  { id: "users", label: "Users & Roles", icon: Users, desc: "Administrator roster & role permissions" },
];

type ToggleProps = { enabled: boolean; onToggle: () => void };
function Toggle({ enabled, onToggle }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-11 h-6 rounded-full transition-colors flex items-center px-0.5 cursor-pointer",
        enabled ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "w-5 h-5 rounded-full bg-white shadow-md transition-transform",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border/30 last:border-0">
      <div className="flex-1 pr-8">
        <p className="text-xs font-bold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings State with complete typing
  const [settings, setSettings] = useState({
    general: {
      orgName: "BikitaIT Infrastructure",
      platformName: "Pulse IT Ops",
      defaultCurrency: "USD ($)",
      dateFormat: "YYYY-MM-DD",
      maintenanceMode: false,
    },
    security: {
      mfa: true,
      auditLog: true,
      sessionTimeout: true,
      passwordMinLength: 12,
      allowedIpRanges: "192.168.1.0/24",
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      smtpServer: "smtp.internal.company.com",
      alertEmailSender: "alerts@company.com",
    },
    database: {
      autoBackup: true,
      backupRetention: "30 days",
    },
    taxonomies: {
      categories: ["Laptops", "Desktops", "Servers", "Monitors", "Printers", "Network Switches"],
      locations: ["HQ Floor 1", "HQ Floor 2", "Data Center Alpha", "Remote Office"],
    },
    AUTH_ENABLED: false,
  });

  const [dbStatus, setDbStatus] = useState({
    version: "SQLite 3.42.0",
    size: "14.2 MB",
    connections: "1 Active Connection",
  });

  // Live employees for the Users section
  const [employees, setEmployees]     = useState<Employee[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (activeSection === "users" && employees.length === 0) {
      setUsersLoading(true);
      employeesApi.getAll()
        .then((data) => setEmployees(Array.isArray(data) ? data : []))
        .catch(() => setEmployees([]))
        .finally(() => setUsersLoading(false));
    }
  }, [activeSection, employees.length]);

  useEffect(() => {
    apiFetch<any>("/settings")
      .then((data) => {
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            general: { ...prev.general, ...(data.settings.general || {}) },
            security: { ...prev.security, ...(data.settings.security || {}) },
            notifications: { ...prev.notifications, ...(data.settings.notifications || {}) },
            database: { ...prev.database, ...(data.settings.database || {}) },
            taxonomies: { ...prev.taxonomies, ...(data.settings.taxonomies || {}) },
            AUTH_ENABLED: data.settings.AUTH_ENABLED !== false,
          }));
        }
        if (data.dbStatus) {
          setDbStatus(data.dbStatus);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load settings", err);
        setLoading(false);
      });
  }, []);

  const updateSectionState = (section: string, key: string, value: any) => {
    setIsDirty(true);
    setSettings((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await apiFetch<any>("/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      await apiFetch<any>("/auth/cache/invalidate", { method: "POST" }).catch(() => {});
      setSaveSuccess(true);
      setIsDirty(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-24 relative min-h-[calc(100vh-4rem)] max-w-[1500px] mx-auto">
        {/* Title Area */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">System Settings</h1>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Configure Platform Preferences, Security Rules & Database Infrastructure
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              System Online • v2.4.0
            </span>
          </div>
        </div>

        {/* Split Pane Container */}
        <div className="flex flex-col md:flex-row gap-6 min-h-[600px]">
          {/* Left Vertical Navigation Menu */}
          <div className="w-full md:w-72 shrink-0 space-y-2">
            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-3 shadow-sm space-y-1">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", isActive ? "text-primary-foreground" : "text-primary")} />
                    <div>
                      <p className="text-xs font-bold leading-tight">{sec.label}</p>
                      <p className={cn("text-[10px] mt-0.5 line-clamp-1", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {sec.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Configuration Panels */}
          <div className="flex-1 bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs font-bold text-muted-foreground animate-pulse">
                Loading system configuration data...
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* 1. GENERAL SECTION */}
                {activeSection === "general" && (
                  <motion.div key="general" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                    <div>
                      <h3 className="text-base font-black text-foreground">General Organization Settings</h3>
                      <p className="text-xs text-muted-foreground">Manage tenant name, currency formats, and maintenance state.</p>
                    </div>

                    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 shadow-sm">
                      <SettingRow label="Organization Name" description="Used on reports, email headers, and system exports.">
                        <input
                          type="text"
                          value={settings.general.orgName}
                          onChange={(e) => updateSectionState("general", "orgName", e.target.value)}
                          className="px-3.5 py-1.5 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary w-60 shadow-sm"
                        />
                      </SettingRow>

                      <SettingRow label="Default Currency" description="Currency symbol displayed across cost rollups.">
                        <select
                          value={settings.general.defaultCurrency}
                          onChange={(e) => updateSectionState("general", "defaultCurrency", e.target.value)}
                          className="px-3.5 py-1.5 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary w-44 shadow-sm cursor-pointer"
                        >
                          <option value="USD ($)">USD ($)</option>
                          <option value="EUR (€)">EUR (€)</option>
                          <option value="GBP (£)">GBP (£)</option>
                          <option value="ZAR (R)">ZAR (R)</option>
                        </select>
                      </SettingRow>

                      <SettingRow label="System Maintenance Mode" description="Restricts access to system administrators only.">
                        <Toggle
                          enabled={settings.general.maintenanceMode}
                          onToggle={() => updateSectionState("general", "maintenanceMode", !settings.general.maintenanceMode)}
                        />
                      </SettingRow>
                    </div>
                  </motion.div>
                )}

                {/* 2. SECURITY SECTION */}
                {activeSection === "security" && (
                  <motion.div key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                    <div>
                      <h3 className="text-base font-black text-foreground">Security & Authentication Policy</h3>
                      <p className="text-xs text-muted-foreground">Enforce authentication rules, MFA requirements, and IP restrictions.</p>
                    </div>

                    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 shadow-sm">
                      <SettingRow label="Multi-Factor Authentication (MFA)" description="Require 2FA verification for technician logins.">
                        <Toggle
                          enabled={settings.security.mfa}
                          onToggle={() => updateSectionState("security", "mfa", !settings.security.mfa)}
                        />
                      </SettingRow>

                      <SettingRow label="Audit Trail Logging" description="Record immutable log events for asset changes.">
                        <Toggle
                          enabled={settings.security.auditLog}
                          onToggle={() => updateSectionState("security", "auditLog", !settings.security.auditLog)}
                        />
                      </SettingRow>

                      <SettingRow label="Allowed IP Range Allowlist" description="CIDR subnet restrictions for administrative API endpoints.">
                        <input
                          type="text"
                          value={settings.security.allowedIpRanges}
                          onChange={(e) => updateSectionState("security", "allowedIpRanges", e.target.value)}
                          className="px-3.5 py-1.5 bg-background border border-border/60 rounded-xl text-xs font-mono font-semibold outline-none focus:border-primary w-60 shadow-sm"
                        />
                      </SettingRow>
                    </div>
                  </motion.div>
                )}

                {/* 3. NOTIFICATIONS SECTION */}
                {activeSection === "notifications" && (
                  <motion.div key="notifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                    <div>
                      <h3 className="text-base font-black text-foreground">Notification Channels</h3>
                      <p className="text-xs text-muted-foreground">Configure SMTP gateway servers and alert email dispatchers.</p>
                    </div>

                    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 shadow-sm">
                      <SettingRow label="Email Incident Notifications" description="Dispatch automated alert emails for Critical SLA breaches.">
                        <Toggle
                          enabled={settings.notifications.emailAlerts}
                          onToggle={() => updateSectionState("notifications", "emailAlerts", !settings.notifications.emailAlerts)}
                        />
                      </SettingRow>

                      <SettingRow label="SMTP Gateway Host" description="Internal mail relay server hostname.">
                        <input
                          type="text"
                          value={settings.notifications.smtpServer}
                          onChange={(e) => updateSectionState("notifications", "smtpServer", e.target.value)}
                          className="px-3.5 py-1.5 bg-background border border-border/60 rounded-xl text-xs font-mono font-semibold outline-none focus:border-primary w-60 shadow-sm"
                        />
                      </SettingRow>
                    </div>
                  </motion.div>
                )}

                {/* 4. DATABASE SECTION */}
                {activeSection === "database" && (
                  <motion.div key="database" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                    <div>
                      <h3 className="text-base font-black text-foreground">Database Metrics & Backup Management</h3>
                      <p className="text-xs text-muted-foreground">Monitor SQLite database telemetry and backup schedules.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-muted/30 border border-border/40 rounded-2xl p-4">
                        <p className="text-xs font-bold text-muted-foreground">Engine Version</p>
                        <p className="text-sm font-black text-foreground mt-1">{dbStatus.version}</p>
                      </div>
                      <div className="bg-muted/30 border border-border/40 rounded-2xl p-4">
                        <p className="text-xs font-bold text-muted-foreground">Database File Size</p>
                        <p className="text-sm font-black text-foreground mt-1">{dbStatus.size}</p>
                      </div>
                      <div className="bg-muted/30 border border-border/40 rounded-2xl p-4">
                        <p className="text-xs font-bold text-muted-foreground">Active Pool Connections</p>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">{dbStatus.connections}</p>
                      </div>
                    </div>

                    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 shadow-sm">
                      <SettingRow label="Automated Nightly Backups" description="Generate timestamped SQLite snapshots daily.">
                        <Toggle
                          enabled={settings.database.autoBackup}
                          onToggle={() => updateSectionState("database", "autoBackup", !settings.database.autoBackup)}
                        />
                      </SettingRow>
                    </div>
                  </motion.div>
                )}

                {/* 5. TAXONOMIES SECTION */}
                {activeSection === "taxonomies" && (
                  <motion.div key="taxonomies" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                    <div>
                      <h3 className="text-base font-black text-foreground">Hardware Taxonomies & Categories</h3>
                      <p className="text-xs text-muted-foreground">Configure standard asset categories and location nodes.</p>
                    </div>

                    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 shadow-sm">
                      <div>
                        <h4 className="text-xs font-black uppercase text-muted-foreground mb-3">Active Hardware Categories</h4>
                        <div className="flex flex-wrap gap-2">
                          {settings.taxonomies.categories.map((cat) => (
                            <span key={cat} className="px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 6. USERS SECTION */}
                {activeSection === "users" && (
                  <motion.div key="users" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                    <div>
                      <h3 className="text-base font-black text-foreground">Administrator Roster & Roles</h3>
                      <p className="text-xs text-muted-foreground">Manage administrator access tiers and permissions.</p>
                    </div>

                    <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
                      {usersLoading ? (
                        <div className="text-center text-xs text-muted-foreground animate-pulse py-8">Loading employees…</div>
                      ) : (
                        <div className="space-y-2">
                          {employees.length === 0 ? (
                            <p className="text-center text-xs text-muted-foreground py-8">No employees found.</p>
                          ) : (
                            employees.map((emp) => (
                              <div key={emp.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20">
                                <div>
                                  <p className="text-xs font-bold text-foreground">{emp.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{emp.email}</p>
                                  {emp.department && (
                                    <p className="text-[10px] text-muted-foreground/60">{emp.department}</p>
                                  )}
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                  {emp.role || "Employee"}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Sticky Floating Save Bar */}
        <AnimatePresence>
          {(isDirty || saveSuccess) && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 dark:bg-card/90 backdrop-blur-xl border border-border/60 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4"
            >
              {saveSuccess ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Configuration saved successfully!</span>
                </div>
              ) : (
                <>
                  <span className="text-xs font-bold text-white dark:text-foreground">Unsaved configuration changes</span>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{saving ? "Saving..." : "Save Changes"}</span>
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
