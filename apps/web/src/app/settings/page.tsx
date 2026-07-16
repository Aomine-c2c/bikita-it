"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import {
  Settings, Server, Database, Globe, Shield, Bell, Users,
  ChevronRight, Check, Save, ToggleLeft, ToggleRight, Wifi,
  Mail, Key, Monitor, HardDrive, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [mfa, setMfa] = useState(true);
  const [auditLog, setAuditLog] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

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
                  <input defaultValue="Bikita Minerals (Pvt) Ltd" className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none focus:border-primary w-56" />
                </SettingRow>
                <SettingRow label="Platform Name" description="Branding shown in the sidebar and browser tab.">
                  <input defaultValue="Xiphos IT Platform" className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none focus:border-primary w-56" />
                </SettingRow>
                <SettingRow label="Default Currency" description="Currency used across all financial calculations.">
                  <select className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none focus:border-primary">
                    <option>USD ($)</option>
                    <option>ZWL (ZiG)</option>
                    <option>ZAR (R)</option>
                  </select>
                </SettingRow>
                <SettingRow label="Date Format">
                  <select className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </SettingRow>
                <SettingRow label="Maintenance Mode" description="Disables all write operations and shows a maintenance banner.">
                  <Toggle enabled={maintenanceMode} onToggle={() => setMaintenanceMode(!maintenanceMode)} />
                </SettingRow>
              </div>
            )}

            {activeSection === "security" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Security & Authentication</h2>
                <p className="text-xs text-muted-foreground mb-6">Manage access controls, MFA, and session policies.</p>
                <SettingRow label="Multi-Factor Authentication (MFA)" description="Enforce MFA for all IT Admin and Manager roles.">
                  <Toggle enabled={mfa} onToggle={() => setMfa(!mfa)} />
                </SettingRow>
                <SettingRow label="Full Audit Logging" description="Record all user actions and schema changes to the audit log.">
                  <Toggle enabled={auditLog} onToggle={() => setAuditLog(!auditLog)} />
                </SettingRow>
                <SettingRow label="Session Timeout (30 min)" description="Automatically log out inactive users after 30 minutes.">
                  <Toggle enabled={sessionTimeout} onToggle={() => setSessionTimeout(!sessionTimeout)} />
                </SettingRow>
                <SettingRow label="Password Min. Length">
                  <input type="number" defaultValue={12} className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none w-24 focus:border-primary" />
                </SettingRow>
                <SettingRow label="Allowed IP Ranges" description="Restrict platform access to specific CIDR ranges.">
                  <input defaultValue="10.0.0.0/8, 192.168.1.0/24" className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none w-56 focus:border-primary" />
                </SettingRow>
              </div>
            )}

            {activeSection === "notifications" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Notifications</h2>
                <p className="text-xs text-muted-foreground mb-6">Configure alert channels for incidents, procurement, and system events.</p>
                <SettingRow label="Email Alerts" description="Send notifications to user email on ticket assignment and critical alerts.">
                  <Toggle enabled={emailAlerts} onToggle={() => setEmailAlerts(!emailAlerts)} />
                </SettingRow>
                <SettingRow label="SMS Alerts" description="Send high-severity incident alerts via SMS (requires Twilio integration).">
                  <Toggle enabled={smsAlerts} onToggle={() => setSmsAlerts(!smsAlerts)} />
                </SettingRow>
                <SettingRow label="SMTP Server" description="Outgoing mail server for system notifications.">
                  <input defaultValue="smtp.sendgrid.net:587" className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none w-56 focus:border-primary" />
                </SettingRow>
                <SettingRow label="Alert Email Sender">
                  <input defaultValue="noreply@xiphos.bikita.co.zw" className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none w-56 focus:border-primary" />
                </SettingRow>
              </div>
            )}

            {activeSection === "database" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">Database & Backup</h2>
                <p className="text-xs text-muted-foreground mb-6">Manage database connection, retention policy, and automated backups.</p>
                <SettingRow label="Automatic Nightly Backup" description="Backs up the PostgreSQL database every night at 02:00 UTC.">
                  <Toggle enabled={autoBackup} onToggle={() => setAutoBackup(!autoBackup)} />
                </SettingRow>
                <SettingRow label="Backup Retention" description="Number of days to retain backup snapshots.">
                  <select className="text-xs px-3 py-1.5 border border-border/60 rounded-md bg-white outline-none">
                    <option>30 days</option>
                    <option>60 days</option>
                    <option>90 days</option>
                  </select>
                </SettingRow>
                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-border/40">
                  <p className="text-xs font-bold text-foreground mb-3">Database Status</p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Version", value: "PostgreSQL 16.1" },
                      { label: "Total Size", value: "2.4 GB" },
                      { label: "Connections", value: "12 / 100" },
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
              <button className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 shadow-sm transition-all">
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
