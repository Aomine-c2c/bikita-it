"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import {
  Settings, Server, Database, Globe, Shield, Bell, Users,
  ChevronRight, Check, Save, ToggleLeft, ToggleRight, Wifi, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

const SECTIONS = [
  { id: "general", label: "General", icon: Settings },
  { id: "security", label: "Security & Auth", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Globe },
  { id: "database", label: "Database & Backup", icon: Database },
  { id: "users", label: "Users & Roles", icon: Users },
];

type ToggleProps = { enabled: boolean; onToggle: () => void };
function Toggle({ enabled, onToggle }: ToggleProps) {
  return (
    <button onClick={onToggle} className={cn("w-10 h-5 rounded-full transition-colors flex items-center px-0.5", enabled ? "bg-primary" : "bg-slate-200")}>
      <span className={cn("w-4 h-4 rounded-full bg-white shadow-sm transition-transform", enabled ? "translate-x-5" : "translate-x-0")} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border/30 last:border-0">
      <div className="flex-1 pr-8">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    general: { orgName: "", platformName: "", defaultCurrency: "USD ($)", dateFormat: "DD/MM/YYYY", maintenanceMode: false },
    security: { mfa: true, auditLog: true, sessionTimeout: true, passwordMinLength: 12, allowedIpRanges: "" },
    notifications: { emailAlerts: true, smsAlerts: false, smtpServer: "", alertEmailSender: "" },
    database: { autoBackup: true, backupRetention: "30 days" }
  });

  const [dbStatus, setDbStatus] = useState({
    version: "Loading...",
    size: "Loading...",
    connections: "Loading..."
  });

  useEffect(() => {
    apiFetch<any>('/settings')
      .then(data => {
        if (data.settings) {
          setSettings({
            general: { ...settings.general, ...data.settings.general },
            security: { ...settings.security, ...data.settings.security },
            notifications: { ...settings.notifications, ...data.settings.notifications },
            database: { ...settings.database, ...data.settings.database }
          });
        }
        if (data.dbStatus) {
          setDbStatus(data.dbStatus);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load settings", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await apiFetch<any>('/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
    }
    setSaving(false);
  };

  const updateSetting = (section: keyof typeof settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-full pb-8">
        {/* Title */}
        <div className="mb-6">
          <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> System Settings
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-muted-foreground mt-1">
            Configure platform behaviour, security policies, integrations, and notifications.
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex gap-6 flex-1">
          {/* Sidebar Nav */}
          <div className="w-[220px] shrink-0">
            <div className="bg-white border border-border/60 rounded-[14px] shadow-sm p-2">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                    activeSection === s.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                  )}
                >
                  <s.icon className="w-4 h-4 shrink-0" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Panel */}
          <div className="flex-1 bg-white border border-border/60 rounded-[14px] shadow-sm p-6">

            {activeSection === "general" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">General Settings</h2>
                <p className="text-xs text-muted-foreground mb-6">Configure platform identity and operational defaults.</p>
                <SettingRow label="Organisation Name" description="Displayed across reports, PDF exports and email headers.">
                  <input value={settings.general.orgName} onChange={e => updateSetting("general", "orgName", e.target.value)} className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none focus:border-primary w-56" />
                </SettingRow>
                <SettingRow label="Platform Name" description="Branding shown in the sidebar and browser tab.">
                  <input value={settings.general.platformName} onChange={e => updateSetting("general", "platformName", e.target.value)} className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none focus:border-primary w-56" />
                </SettingRow>
                <SettingRow label="Default Currency" description="Currency used across all financial calculations.">
                  <select value={settings.general.defaultCurrency} onChange={e => updateSetting("general", "defaultCurrency", e.target.value)} className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none focus:border-primary">
                    <option>USD ($)</option>
                    <option>ZWL (ZiG)</option>
                    <option>ZAR (R)</option>
                  </select>
                </SettingRow>
                <SettingRow label="Date Format">
                  <select value={settings.general.dateFormat} onChange={e => updateSetting("general", "dateFormat", e.target.value)} className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </SettingRow>
                <SettingRow label="Maintenance Mode" description="Disables all write operations and shows a maintenance banner.">
                  <Toggle enabled={settings.general.maintenanceMode} onToggle={() => updateSetting("general", "maintenanceMode", !settings.general.maintenanceMode)} />
                </SettingRow>
                <SettingRow label="Dashboard Guided Tour" description="Replay the onboarding tutorial for the platform.">
                  <button 
                    onClick={() => {
                      localStorage.removeItem("xiphos_tour_completed");
                      window.location.href = "/";
                    }}
                    className="text-xs px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition-colors border border-slate-200"
                  >
                    Reset & Replay Tour
                  </button>
                </SettingRow>
                <SettingRow label="Force System Setup" description="Manually navigate to the initial platform setup wizard.">
                  <button 
                    onClick={() => {
                      window.location.href = "/setup";
                    }}
                    className="text-xs px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-md transition-colors border border-red-200"
                  >
                    Trigger Setup
                  </button>
                </SettingRow>
              </div>
            )}

            {activeSection === "security" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Security & Authentication</h2>
                <p className="text-xs text-muted-foreground mb-6">Manage access controls, MFA, and session policies.</p>
                <SettingRow label="Multi-Factor Authentication (MFA)" description="Enforce MFA for all IT Admin and Manager roles.">
                  <Toggle enabled={settings.security.mfa} onToggle={() => updateSetting("security", "mfa", !settings.security.mfa)} />
                </SettingRow>
                <SettingRow label="Full Audit Logging" description="Record all user actions and schema changes to the audit log.">
                  <Toggle enabled={settings.security.auditLog} onToggle={() => updateSetting("security", "auditLog", !settings.security.auditLog)} />
                </SettingRow>
                <SettingRow label="Session Timeout (30 min)" description="Automatically log out inactive users after 30 minutes.">
                  <Toggle enabled={settings.security.sessionTimeout} onToggle={() => updateSetting("security", "sessionTimeout", !settings.security.sessionTimeout)} />
                </SettingRow>
                <SettingRow label="Password Min. Length">
                  <input type="number" value={settings.security.passwordMinLength} onChange={e => updateSetting("security", "passwordMinLength", parseInt(e.target.value))} className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none w-24 focus:border-primary" />
                </SettingRow>
                <SettingRow label="Allowed IP Ranges" description="Restrict platform access to specific CIDR ranges.">
                  <input value={settings.security.allowedIpRanges} onChange={e => updateSetting("security", "allowedIpRanges", e.target.value)} className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none w-56 focus:border-primary" />
                </SettingRow>
              </div>
            )}

            {activeSection === "notifications" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Notifications</h2>
                <p className="text-xs text-muted-foreground mb-6">Configure alert channels for incidents, procurement, and system events.</p>
                <SettingRow label="Email Alerts" description="Send notifications to user email on ticket assignment and critical alerts.">
                  <Toggle enabled={settings.notifications.emailAlerts} onToggle={() => updateSetting("notifications", "emailAlerts", !settings.notifications.emailAlerts)} />
                </SettingRow>
                <SettingRow label="SMS Alerts" description="Send high-severity incident alerts via SMS (requires Twilio integration).">
                  <Toggle enabled={settings.notifications.smsAlerts} onToggle={() => updateSetting("notifications", "smsAlerts", !settings.notifications.smsAlerts)} />
                </SettingRow>
                <SettingRow label="SMTP Server" description="Outgoing mail server for system notifications.">
                  <input value={settings.notifications.smtpServer} onChange={e => updateSetting("notifications", "smtpServer", e.target.value)} className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none w-56 focus:border-primary" />
                </SettingRow>
                <SettingRow label="Alert Email Sender">
                  <input value={settings.notifications.alertEmailSender} onChange={e => updateSetting("notifications", "alertEmailSender", e.target.value)} className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none w-56 focus:border-primary" />
                </SettingRow>
              </div>
            )}

            {activeSection === "database" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Database & Backup</h2>
                <p className="text-xs text-muted-foreground mb-6">Manage database connection, retention policy, and automated backups.</p>
                <SettingRow label="Automatic Nightly Backup" description="Backs up the PostgreSQL database every night at 02:00 UTC.">
                  <Toggle enabled={settings.database.autoBackup} onToggle={() => updateSetting("database", "autoBackup", !settings.database.autoBackup)} />
                </SettingRow>
                <SettingRow label="Backup Retention" description="Number of days to retain backup snapshots.">
                  <select value={settings.database.backupRetention} onChange={e => updateSetting("database", "backupRetention", e.target.value)} className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none">
                    <option>30 days</option>
                    <option>60 days</option>
                    <option>90 days</option>
                  </select>
                </SettingRow>
                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-border/40">
                  <p className="text-xs font-bold text-foreground mb-3">Database Status</p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Version", value: dbStatus.version },
                      { label: "Total Size", value: dbStatus.size },
                      { label: "Connections", value: dbStatus.connections },
                    ].map((item) => (
                      <div key={item.label} className="bg-white border border-border/40 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(activeSection === "integrations" || activeSection === "users") && (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Settings className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-semibold text-foreground">Coming Soon</p>
                <p className="text-xs text-muted-foreground mt-1">This section is under construction.</p>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end mt-8 pt-6 border-t border-border/30">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50"
              >
                {saving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                ) : saveSuccess ? (
                  <><Check className="w-3.5 h-3.5" /> Saved Successfully</>
                ) : (
                  <><Save className="w-3.5 h-3.5" /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
