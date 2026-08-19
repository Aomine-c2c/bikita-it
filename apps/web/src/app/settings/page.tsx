"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Database, Shield, Bell, Users, Save, Loader2,
  CheckCircle2, Layers, UserPlus, RefreshCw, AlertCircle,
  SlidersHorizontal, Download, RotateCcw, Laptop, Send,
  Plus, Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  apiFetch, systemSettingsApi, 
  type UserSessionRecord, type TestDiagnosticResult
} from "@/lib/api";

interface BackupSnapshot {
  filename: string;
  timestamp: string;
  size_formatted: string;
  checksum_sha256: string;
  trigger_reason: string;
}

interface DbStatusResponse {
  is_healthy?: boolean;
  size_mb?: number;
  total_tables?: number;
  db_path?: string;
  errors?: string[];
}

const SECTIONS = [
  { id: "general",       label: "General",             icon: Settings,           desc: "Org name, timezone, language & theme" },
  { id: "users",         label: "User Provisioning",   icon: Users,              desc: "Super Admin account creation & roles" },
  { id: "permissions",   label: "Permissions Matrix",  icon: SlidersHorizontal,  desc: "Dynamic role capability toggles" },
  { id: "security",      label: "Security & Auth",      icon: Shield,             desc: "Live sessions, MFA & session revocation" },
  { id: "notifications", label: "Notifications",       icon: Bell,               desc: "SMTP alerts, webhooks & live probes" },
  { id: "taxonomies",    label: "Taxonomies",          icon: Layers,             desc: "Asset categories & SLA priorities" },
  { id: "database",      label: "Database & Backup",   icon: Database,           desc: "SQLite metrics, snapshots & restore" },
];

type ToggleProps = { enabled: boolean; onToggle: () => void; disabled?: boolean };
function Toggle({ enabled, onToggle, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "w-11 h-6 rounded-full transition-colors flex items-center px-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
        enabled ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span className={cn("w-5 h-5 rounded-full bg-white shadow-md transition-transform", enabled ? "translate-x-5" : "translate-x-0")} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border/30 last:border-0 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-1">
      {(title || description) && (
        <div className="mb-3">
          {title && <h4 className="text-xs font-black text-foreground uppercase tracking-wider">{title}</h4>}
          {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

const ROLES = [
  { id: "SUPER_ADMIN", label: "Super Admin", desc: "Full Infrastructure & User Provisioning", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { id: "HOD", label: "Head of Dept (HOD)", desc: "Departmental Assets, Tickets & Approvals", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  { id: "TECHNICIAN", label: "Technician", desc: "Repairs, Maintenance & Network Scans", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { id: "EMPLOYEE", label: "Staff / Employee", desc: "Staff Portal & Hardware Requests", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { id: "STUDENT", label: "Student", desc: "Student Lab Checkouts & Public Issue Reporting", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
];

const MODULES = [
  { id: "assets", label: "Hardware Assets" },
  { id: "inventory", label: "Inventory Stock" },
  { id: "tickets", label: "Helpdesk Tickets" },
  { id: "repairs", label: "Maintenance & Repairs" },
  { id: "network", label: "Network Scanner & Topology" },
  { id: "locations", label: "Locations & Cameras" },
  { id: "employees", label: "Personnel Directory" },
  { id: "reports", label: "Analytics & Reports" },
  { id: "settings", label: "System Administration" },
];

interface SystemUser {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  department_id?: number;
  is_active: boolean;
  date_joined: string;
}

interface PermissionItem {
  role: string;
  module: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_approve: boolean;
}

interface DepartmentItem {
  id: number;
  name: string;
  code: string;
  description?: string;
  hod_name?: string;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [settings, setSettings] = useState({
    general: {
      orgName: "BikitaIT Infrastructure",
      platformName: "Pulse IT Ops",
      defaultCurrency: "USD ($)",
      timezone: "Africa/Harare",
      language: "en",
      theme: "light",
      maintenanceMode: false,
    },
    security: {
      mfa: true,
      auditLog: true,
      sessionTimeout: true,
      sessionTimeoutMinutes: 60,
      passwordMinLength: 12,
      allowedIpRanges: "0.0.0.0/0",
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      smtpServer: "127.0.0.1",
      smtpPort: 587,
      alertEmailSender: "alerts@bikita.ac.zw",
      alertRecipient: "admin@bikita.ac.zw",
      useTls: true,
      slackWebhook: "",
    },
    database: {
      autoBackup: true,
      backupRetention: "30 days",
    },
    taxonomies: {
      categories: ["Laptops", "Desktops", "Servers", "Monitors", "Printers", "Network Switches"],
      locations: ["HQ Floor 1", "HQ Floor 2", "Data Center Alpha", "Remote Office"],
      departments: ["IT", "Engineering", "Finance", "Administration", "Academic Operations"],
      statuses: ["ACTIVE", "IN_REPAIR", "IN_STOCK", "RESERVED", "RETIRED"],
      priorities: [
        { id: "CRITICAL", name: "Critical", sla_hours: 2 },
        { id: "HIGH", name: "High", sla_hours: 8 },
        { id: "MEDIUM", name: "Medium", sla_hours: 24 },
        { id: "LOW", name: "Low", sla_hours: 72 },
      ],
    },
    AUTH_ENABLED: true,
  });

  const [dbStatus, setDbStatus] = useState({
    version: "SQLite 3.42.0",
    size: "14.2 MB",
    connections: "1 Active Connection",
  });

  // User Provisioning state
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("EMPLOYEE");
  const [newDepartmentId, setNewDepartmentId] = useState<number | undefined>(undefined);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [provisionSuccess, setProvisionSuccess] = useState(false);

  // Dynamic Permissions Matrix state
  const [matrix, setMatrix] = useState<PermissionItem[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixSaving, setMatrixSaving] = useState(false);
  const [selectedMatrixRole, setSelectedMatrixRole] = useState("HOD");
  const [matrixSuccess, setMatrixSuccess] = useState(false);

  // Active Sessions state
  const [sessions, setSessions] = useState<UserSessionRecord[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Notifications live probe state
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<TestDiagnosticResult | null>(null);
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<TestDiagnosticResult | null>(null);

  // Taxonomies state
  const [newCategoryInput, setNewCategoryInput] = useState("");

  // Database & Backup state
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<DbStatusResponse | null>(null);
  const [runningIntegrity, setRunningIntegrity] = useState(false);
  const [restoreModalSnapshot, setRestoreModalSnapshot] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await apiFetch<SystemUser[]>("/system/users");
      setSystemUsers(Array.isArray(data) ? data : []);
    } catch {
      setSystemUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const data = await systemSettingsApi.getSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const fetchTaxonomies = useCallback(async () => {
    try {
      const data = await systemSettingsApi.getTaxonomies();
      if (data) {
        setSettings((prev) => ({
          ...prev,
          taxonomies: {
            ...prev.taxonomies,
            ...data,
          },
        }));
      }
    } catch (err) {
      console.error("Failed to load taxonomies:", err);
    }
  }, []);

  const fetchBackupsAndDbStatus = useCallback(async () => {
    setBackupsLoading(true);
    try {
      const [backupsData, statusData] = await Promise.all([
        apiFetch<BackupSnapshot[]>("/system/database/backups").catch(() => []),
        apiFetch<DbStatusResponse>("/system/database/status").catch(() => null),
      ]);
      setBackups(Array.isArray(backupsData) ? backupsData : []);
      if (statusData) {
        setDbStatus((prev) => ({
          ...prev,
          version: `SQLite (${statusData.db_path || "db.sqlite3"})`,
          size: `${statusData.size_mb || 0} MB`,
          connections: `${statusData.total_tables || 0} Tables (${statusData.is_healthy ? "Healthy" : "Attention Needed"})`,
        }));
      }
    } finally {
      setBackupsLoading(false);
    }
  }, []);

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      await apiFetch("/system/database/backups", {
        method: "POST",
        body: JSON.stringify({ trigger_reason: "admin_manual" }),
      });
      await fetchBackupsAndDbStatus();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to create backup.");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreModalSnapshot) return;
    setRestoring(true);
    try {
      await systemSettingsApi.restoreBackup(restoreModalSnapshot);
      setRestoreModalSnapshot(null);
      await fetchBackupsAndDbStatus();
      alert("Database snapshot restored successfully. Pre-restore rollback backup was preserved.");
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to restore database backup.");
    } finally {
      setRestoring(false);
    }
  };

  const handleSafeMigrate = async () => {
    if (!confirm("Run automated safe database upgrade? A pre-migration snapshot will be created automatically.")) return;
    setMigrating(true);
    setMigrationStatus(null);
    try {
      const res = await apiFetch<{ message?: string }>("/system/database/migrate-safe", { method: "POST" });
      setMigrationStatus(res?.message || "Migration completed safely.");
      await fetchBackupsAndDbStatus();
    } catch (err: unknown) {
      setMigrationStatus(`Migration Error: ${(err as Error)?.message}`);
    } finally {
      setMigrating(false);
    }
  };

  const handleRunIntegrity = async () => {
    setRunningIntegrity(true);
    setIntegrityStatus(null);
    try {
      const res = await apiFetch<DbStatusResponse>("/system/database/integrity-check");
      setIntegrityStatus(res);
    } catch (err: unknown) {
      setIntegrityStatus({ is_healthy: false, errors: [(err as Error)?.message || "Check failed"] });
    } finally {
      setRunningIntegrity(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await systemSettingsApi.revokeSession(sessionId);
      await fetchSessions();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to revoke session");
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      await systemSettingsApi.revokeOtherSessions();
      await fetchSessions();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to revoke other sessions");
    }
  };

  const handleTestEmail = async () => {
    setEmailTesting(true);
    setEmailTestResult(null);
    try {
      const res = await systemSettingsApi.testEmail({
        smtp_server: settings.notifications.smtpServer,
        smtp_port: Number(settings.notifications.smtpPort),
        sender_email: settings.notifications.alertEmailSender,
        recipient_email: settings.notifications.alertRecipient,
        use_tls: settings.notifications.useTls,
      });
      setEmailTestResult(res);
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || "Test email failed";
      setEmailTestResult({
        success: false,
        latency_ms: 0,
        message: errMsg,
        diagnostic_logs: [errMsg],
      });
    } finally {
      setEmailTesting(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!settings.notifications.slackWebhook) {
      alert("Please provide a webhook URL to test.");
      return;
    }
    setWebhookTesting(true);
    setWebhookTestResult(null);
    try {
      const res = await systemSettingsApi.testWebhook({
        webhook_url: settings.notifications.slackWebhook,
      });
      setWebhookTestResult(res);
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || "Webhook delivery failed";
      setWebhookTestResult({
        success: false,
        latency_ms: 0,
        message: errMsg,
        diagnostic_logs: [errMsg],
      });
    } finally {
      setWebhookTesting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryInput.trim()) return;
    const updatedCats = [...settings.taxonomies.categories, newCategoryInput.trim()];
    setSettings((prev) => ({
      ...prev,
      taxonomies: { ...prev.taxonomies, categories: updatedCats },
    }));
    setNewCategoryInput("");
    await systemSettingsApi.updateTaxonomies({ categories: updatedCats });
  };

  const handleRemoveCategory = async (catToRemove: string) => {
    const updatedCats = settings.taxonomies.categories.filter((c) => c !== catToRemove);
    setSettings((prev) => ({
      ...prev,
      taxonomies: { ...prev.taxonomies, categories: updatedCats },
    }));
    await systemSettingsApi.updateTaxonomies({ categories: updatedCats });
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (activeSection === "users") {
        setUsersLoading(true);
        try {
          const [u, d] = await Promise.all([
            apiFetch<SystemUser[]>("/system/users"),
            apiFetch<DepartmentItem[]>("/system/departments"),
          ]);
          if (!ignore) {
            setSystemUsers(Array.isArray(u) ? u : []);
            setDepartments(Array.isArray(d) ? d : []);
          }
        } catch {
          if (!ignore) {
            setSystemUsers([]);
            setDepartments([]);
          }
        } finally {
          if (!ignore) setUsersLoading(false);
        }
      } else if (activeSection === "permissions") {
        setMatrixLoading(true);
        try {
          const data = await apiFetch<{ matrix: PermissionItem[] }>("/system/permissions");
          if (!ignore && data?.matrix) setMatrix(data.matrix);
        } catch {
          if (!ignore) setMatrix([]);
        } finally {
          if (!ignore) setMatrixLoading(false);
        }
      } else if (activeSection === "security") {
        fetchSessions();
      } else if (activeSection === "taxonomies") {
        fetchTaxonomies();
      } else if (activeSection === "database") {
        fetchBackupsAndDbStatus();
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [activeSection, fetchBackupsAndDbStatus, fetchSessions, fetchTaxonomies]);

  useEffect(() => {
    apiFetch<{ settings?: Record<string, unknown>; dbStatus?: { version: string; size: string; connections: string } }>("/settings")
      .then((data) => {
        if (data?.settings) {
          const general = (data.settings.general as Record<string, unknown>) || {};
          const security = (data.settings.security as Record<string, unknown>) || {};
          const notifications = (data.settings.notifications as Record<string, unknown>) || {};
          const database = (data.settings.database as Record<string, unknown>) || {};
          const taxonomies = (data.settings.taxonomies as Record<string, unknown>) || {};
          setSettings((prev) => ({
            ...prev,
            general:       { ...prev.general,       ...general },
            security:      { ...prev.security,      ...security },
            notifications: { ...prev.notifications, ...notifications },
            database:      { ...prev.database,      ...database },
            taxonomies:    { ...prev.taxonomies,    ...taxonomies },
            AUTH_ENABLED: data.settings?.AUTH_ENABLED !== false,
          }));
        }
        if (data?.dbStatus) setDbStatus(data.dbStatus);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (section: string, key: string, value: unknown) => {
    setIsDirty(true);
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...((prev as unknown as Record<string, Record<string, unknown>>)[section] || {}),
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await apiFetch<Record<string, unknown>>("/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaveSuccess(true);
      setIsDirty(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionError(null);

    if (!newUsername.trim() || !newEmail.trim() || !newName.trim() || !newPassword.trim()) {
      setProvisionError("Please complete all required fields.");
      return;
    }

    setProvisioning(true);
    try {
      const payload = {
        username: newUsername.trim(),
        email: newEmail.trim(),
        name: newName.trim(),
        password: newPassword,
        role: newRole,
        department_id: newDepartmentId || undefined,
      };

      await apiFetch("/system/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setProvisionSuccess(true);
      setNewUsername("");
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      await fetchUsers();
      setTimeout(() => setProvisionSuccess(false), 3500);
    } catch (err: unknown) {
      setProvisionError((err as Error)?.message || "Failed to provision user account.");
    } finally {
      setProvisioning(false);
    }
  };

  const handleUserRoleChange = async (userId: number, role: string) => {
    try {
      await apiFetch(`/system/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      await fetchUsers();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to update role.");
    }
  };

  const handleUserStatusToggle = async (userId: number, currentStatus: boolean) => {
    try {
      await apiFetch(`/system/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      await fetchUsers();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to update user status.");
    }
  };

  const togglePermission = (moduleName: string, action: "can_read" | "can_write" | "can_delete" | "can_approve") => {
    setMatrix((prev) =>
      prev.map((item) => {
        if (item.role === selectedMatrixRole && item.module === moduleName) {
          return { ...item, [action]: !item[action] };
        }
        return item;
      })
    );
  };

  const handleSavePermissions = async () => {
    setMatrixSaving(true);
    setMatrixSuccess(false);
    try {
      const currentRolePerms = matrix.filter((m) => m.role === selectedMatrixRole);
      await apiFetch("/system/permissions", {
        method: "PUT",
        body: JSON.stringify({ permissions: currentRolePerms }),
      });
      setMatrixSuccess(true);
      setTimeout(() => setMatrixSuccess(false), 3000);
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to save permissions.");
    } finally {
      setMatrixSaving(false);
    }
  };

  const inputCls = "px-3 py-1.5 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary transition-colors shadow-sm";
  const selectCls = "px-3 py-1.5 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary transition-colors shadow-sm cursor-pointer";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground">Settings & Governance</h2>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              Super Admin controls, dynamic RBAC, system policies, and infrastructure status.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isDirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            )}
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
        </div>

        {/* Split Pane */}
        <div className="flex flex-col md:flex-row gap-5 min-h-150">
          {/* Left Nav */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-2.5 shadow-sm space-y-0.5 sticky top-6">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", isActive ? "text-primary-foreground" : "text-primary")} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight">{sec.label}</p>
                      <p className={cn("text-[10px] mt-0.5 line-clamp-1 leading-snug", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {sec.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-sm min-h-125">
            {loading ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading configuration…
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* ── 1. GENERAL ── */}
                {activeSection === "general" && (
                  <motion.div key="general" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
                    <div>
                      <h3 className="text-base font-black text-foreground">General Settings</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Organization identity, locale, and display preferences.</p>
                    </div>

                    <SectionCard title="Organization">
                      <SettingRow label="Organization Name" description="Used on reports, exports and email headers.">
                        <input type="text" value={settings.general.orgName} onChange={(e) => update("general", "orgName", e.target.value)} className={cn(inputCls, "w-56")} />
                      </SettingRow>
                      <SettingRow label="Platform Name" description="Display name shown in the browser tab.">
                        <input type="text" value={settings.general.platformName} onChange={(e) => update("general", "platformName", e.target.value)} className={cn(inputCls, "w-56")} />
                      </SettingRow>
                      <SettingRow label="Default Currency" description="Currency symbol displayed across cost rollups.">
                        <select value={settings.general.defaultCurrency} onChange={(e) => update("general", "defaultCurrency", e.target.value)} className={cn(selectCls, "w-40")}>
                          <option>USD ($)</option>
                          <option>EUR (€)</option>
                          <option>GBP (£)</option>
                          <option>ZAR (R)</option>
                        </select>
                      </SettingRow>
                    </SectionCard>

                    <SectionCard title="Locale & Display">
                      <SettingRow label="Timezone" description="Server and report timestamp zone.">
                        <select value={settings.general.timezone} onChange={(e) => update("general", "timezone", e.target.value)} className={cn(selectCls, "w-52")}>
                          <option value="Africa/Harare">Africa/Harare (CAT)</option>
                          <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                          <option value="UTC">UTC</option>
                          <option value="Europe/London">Europe/London (GMT/BST)</option>
                          <option value="America/New_York">America/New_York (EST/EDT)</option>
                        </select>
                      </SettingRow>
                    </SectionCard>
                  </motion.div>
                )}

                {/* ── 2. USERS & PROVISIONING ── */}
                {activeSection === "users" && (
                  <motion.div key="users" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
                    <div>
                      <h3 className="text-base font-black text-foreground">Super Admin User Provisioning</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Direct account creation and level-access assignment across all institutional tiers.
                      </p>
                    </div>

                    {/* Role Hierarchy Legend */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {ROLES.map((r) => (
                        <div key={r.id} className={cn("p-2.5 rounded-xl border text-xs", r.color)}>
                          <div className="font-bold flex items-center justify-between">
                            <span>{r.label}</span>
                            <span className="text-[10px] uppercase font-mono">{r.id}</span>
                          </div>
                          <p className="text-[10px] opacity-80 mt-0.5">{r.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* Provision Form */}
                    <SectionCard title="Provision New Account">
                      <form onSubmit={handleProvisionUser} className="space-y-4 pt-1">
                        {provisionError && (
                          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{provisionError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1">Username *</label>
                            <input
                              type="text"
                              placeholder="e.g. t_mapfumo"
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              required
                              className={cn(inputCls, "w-full")}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1">Full Name *</label>
                            <input
                              type="text"
                              placeholder="e.g. Dr. Tariro Mapfumo"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              required
                              className={cn(inputCls, "w-full")}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1">Email Address *</label>
                            <input
                              type="email"
                              placeholder="e.g. tmapfumo@institution.ac.zw"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              required
                              className={cn(inputCls, "w-full")}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1">Initial Password *</label>
                            <input
                              type="password"
                              placeholder="••••••••••••"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                              className={cn(inputCls, "w-full")}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1">Assigned Access Level *</label>
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              className={cn(selectCls, "w-full")}
                            >
                              {ROLES.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.label} ({r.id})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1">Department (Optional)</label>
                            <select
                              value={newDepartmentId || ""}
                              onChange={(e) => setNewDepartmentId(e.target.value ? Number(e.target.value) : undefined)}
                              className={cn(selectCls, "w-full")}
                            >
                              <option value="">No specific department</option>
                              {departments.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name} ({d.code})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          {provisionSuccess ? (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Account provisioned successfully!
                            </span>
                          ) : <div />}
                          <button
                            type="submit"
                            disabled={provisioning}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
                          >
                            {provisioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                            <span>Create Account</span>
                          </button>
                        </div>
                      </form>
                    </SectionCard>

                    {/* Active Accounts Table */}
                    <SectionCard title="Active System Accounts">
                      {usersLoading ? (
                        <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading roster...
                        </div>
                      ) : systemUsers.length === 0 ? (
                        <p className="py-8 text-center text-xs text-muted-foreground">No accounts found.</p>
                      ) : (
                        <div className="divide-y divide-border/40">
                          {systemUsers.map((u) => (
                            <div key={u.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                  {u.username[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-foreground">{u.name || u.username}</span>
                                    <span className="text-[10px] font-mono text-muted-foreground">@{u.username}</span>
                                    {!u.is_active && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-bold uppercase">Disabled</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">{u.email} {u.department && `· ${u.department}`}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center">
                                <select
                                  value={u.role}
                                  onChange={(e) => handleUserRoleChange(u.id, e.target.value)}
                                  className={cn(selectCls, "text-[11px] py-1")}
                                >
                                  {ROLES.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleUserStatusToggle(u.id, u.is_active)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all",
                                    u.is_active
                                      ? "border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                                      : "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                                  )}
                                >
                                  {u.is_active ? "Deactivate" : "Activate"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  </motion.div>
                )}

                {/* ── 3. DYNAMIC PERMISSIONS MATRIX ── */}
                {activeSection === "permissions" && (
                  <motion.div key="permissions" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-foreground">Dynamic Role Permissions Matrix</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Granular read, write, delete, and approval capabilities stored in database.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {matrixSuccess && (
                          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                          </span>
                        )}
                        <button
                          onClick={handleSavePermissions}
                          disabled={matrixSaving || selectedMatrixRole === "SUPER_ADMIN"}
                          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
                        >
                          {matrixSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save Matrix
                        </button>
                      </div>
                    </div>

                    {/* Role Selector Tabs */}
                    <div className="flex flex-wrap gap-2">
                      {ROLES.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setSelectedMatrixRole(r.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                            selectedMatrixRole === r.id
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "border-border/60 bg-background/60 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>

                    {selectedMatrixRole === "SUPER_ADMIN" ? (
                      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 text-xs font-semibold flex items-center gap-2.5">
                        <Shield className="w-4 h-4 shrink-0" />
                        <span>Super Admin possesses full immutable root capabilities across all modules.</span>
                      </div>
                    ) : null}

                    {/* Permissions Grid */}
                    <SectionCard title={`${ROLES.find(r => r.id === selectedMatrixRole)?.label} Capabilities`}>
                      {matrixLoading ? (
                        <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading permissions...
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-border/40 text-muted-foreground">
                                <th className="py-2.5 font-bold">Module</th>
                                <th className="py-2.5 font-bold text-center">View / Read</th>
                                <th className="py-2.5 font-bold text-center">Create / Edit</th>
                                <th className="py-2.5 font-bold text-center">Delete</th>
                                <th className="py-2.5 font-bold text-center">Approve / Authorize</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                              {MODULES.map((m) => {
                                const perm = matrix.find(
                                  (p) => p.role === selectedMatrixRole && p.module === m.id
                                ) || {
                                  can_read: false,
                                  can_write: false,
                                  can_delete: false,
                                  can_approve: false,
                                };
                                const isSuper = selectedMatrixRole === "SUPER_ADMIN";

                                return (
                                  <tr key={m.id} className="hover:bg-muted/20">
                                    <td className="py-3 font-semibold text-foreground">{m.label}</td>
                                    <td className="py-3 text-center">
                                      <input
                                        type="checkbox"
                                        disabled={isSuper}
                                        checked={isSuper ? true : perm.can_read}
                                        onChange={() => togglePermission(m.id, "can_read")}
                                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                      />
                                    </td>
                                    <td className="py-3 text-center">
                                      <input
                                        type="checkbox"
                                        disabled={isSuper}
                                        checked={isSuper ? true : perm.can_write}
                                        onChange={() => togglePermission(m.id, "can_write")}
                                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                      />
                                    </td>
                                    <td className="py-3 text-center">
                                      <input
                                        type="checkbox"
                                        disabled={isSuper}
                                        checked={isSuper ? true : perm.can_delete}
                                        onChange={() => togglePermission(m.id, "can_delete")}
                                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                      />
                                    </td>
                                    <td className="py-3 text-center">
                                      <input
                                        type="checkbox"
                                        disabled={isSuper}
                                        checked={isSuper ? true : perm.can_approve}
                                        onChange={() => togglePermission(m.id, "can_approve")}
                                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </SectionCard>
                  </motion.div>
                )}

                {/* ── 4. SECURITY & ACTIVE SESSIONS ── */}
                {activeSection === "security" && (
                  <motion.div key="security" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
                    <div>
                      <h3 className="text-base font-black text-foreground">Security, Auth & Active Sessions</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Enforce MFA, inspect live login sessions, and revoke unauthorized devices.</p>
                    </div>

                    <SectionCard title="Authentication Policies">
                      <SettingRow label="Multi-Factor Authentication (MFA)" description="Require 2FA for all admin and technician logins.">
                        <Toggle enabled={settings.security.mfa} onToggle={() => update("security", "mfa", !settings.security.mfa)} />
                      </SettingRow>
                      <SettingRow label="Audit Trail Logging" description="Record immutable log entries for all asset and config changes.">
                        <Toggle enabled={settings.security.auditLog} onToggle={() => update("security", "auditLog", !settings.security.auditLog)} />
                      </SettingRow>
                      <SettingRow label="Session Expiry Limits" description="Automatically invalidate inactive access tokens after 60 minutes.">
                        <Toggle enabled={settings.security.sessionTimeout} onToggle={() => update("security", "sessionTimeout", !settings.security.sessionTimeout)} />
                      </SettingRow>
                    </SectionCard>

                    {/* Live Active Sessions Manager */}
                    <SectionCard title="Live Active User Sessions" description="Inspect registered client sessions and instantly revoke stolen or inactive JWT tokens.">
                      <div className="pt-2">
                        <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/40">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-foreground">Active Sessions ({sessions.length})</span>
                          </div>
                          <button
                            onClick={handleRevokeOtherSessions}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors border border-destructive/20"
                          >
                            Revoke All Other Sessions
                          </button>
                        </div>

                        {sessionsLoading ? (
                          <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Polling active sessions...
                          </div>
                        ) : sessions.length === 0 ? (
                          <p className="py-6 text-center text-xs text-muted-foreground">No active sessions tracked.</p>
                        ) : (
                          <div className="divide-y divide-border/30">
                            {sessions.map((sess) => (
                              <div key={sess.session_id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-xl bg-secondary text-primary mt-0.5">
                                    <Laptop className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-foreground">{sess.device_info}</span>
                                      <span className="font-mono text-[10px] text-muted-foreground">@{sess.username}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                                      <span>IP: <code className="font-mono">{sess.ip_address}</code></span>
                                      <span>·</span>
                                      <span>Active: {new Date(sess.last_active).toLocaleTimeString()}</span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleRevokeSession(sess.session_id)}
                                  className="self-end sm:self-center px-2.5 py-1 rounded-lg text-[11px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/50 transition-colors"
                                >
                                  Revoke Token
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  </motion.div>
                )}

                {/* ── 5. NOTIFICATIONS & WEBHOOKS ── */}
                {activeSection === "notifications" && (
                  <motion.div key="notifications" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
                    <div>
                      <h3 className="text-base font-black text-foreground">Notification Channels & Live Probes</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Configure SMTP alerts, webhooks, and execute real-time handshake diagnostic probes.</p>
                    </div>

                    <SectionCard title="SMTP Outbound Server">
                      <SettingRow label="Email Incident Notifications" description="Send alerts for critical SLA breaches, asset failures and security events.">
                        <Toggle enabled={settings.notifications.emailAlerts} onToggle={() => update("notifications", "emailAlerts", !settings.notifications.emailAlerts)} />
                      </SettingRow>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                        <div>
                          <label className="block text-[11px] font-bold text-muted-foreground mb-1">SMTP Host</label>
                          <input
                            type="text"
                            value={settings.notifications.smtpServer}
                            onChange={(e) => update("notifications", "smtpServer", e.target.value)}
                            className={cn(inputCls, "w-full")}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted-foreground mb-1">Port</label>
                          <input
                            type="number"
                            value={settings.notifications.smtpPort}
                            onChange={(e) => update("notifications", "smtpPort", Number(e.target.value))}
                            className={cn(inputCls, "w-full")}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted-foreground mb-1">Sender Email</label>
                          <input
                            type="email"
                            value={settings.notifications.alertEmailSender}
                            onChange={(e) => update("notifications", "alertEmailSender", e.target.value)}
                            className={cn(inputCls, "w-full")}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted-foreground mb-1">Test Recipient Email</label>
                          <input
                            type="email"
                            value={settings.notifications.alertRecipient}
                            onChange={(e) => update("notifications", "alertRecipient", e.target.value)}
                            className={cn(inputCls, "w-full")}
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-between">
                        <button
                          onClick={handleTestEmail}
                          disabled={emailTesting}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all"
                        >
                          {emailTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>Test SMTP Handshake</span>
                        </button>
                      </div>

                      {emailTestResult && (
                        <div className={cn(
                          "mt-3 p-3.5 rounded-xl border text-xs space-y-1.5",
                          emailTestResult.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-destructive/10 border-destructive/20 text-destructive"
                        )}>
                          <div className="font-bold flex items-center justify-between">
                            <span>{emailTestResult.message}</span>
                            <span className="font-mono text-[10px]">{emailTestResult.latency_ms}ms</span>
                          </div>
                          {emailTestResult.diagnostic_logs && (
                            <pre className="p-2 rounded bg-black/20 text-[10px] font-mono text-muted-foreground">
                              {emailTestResult.diagnostic_logs.join("\n")}
                            </pre>
                          )}
                        </div>
                      )}
                    </SectionCard>

                    <SectionCard title="Slack / Teams / Discord Webhook">
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-muted-foreground mb-1">Incoming Webhook URL</label>
                          <input
                            type="url"
                            placeholder="https://hooks.slack.com/services/..."
                            value={settings.notifications.slackWebhook}
                            onChange={(e) => update("notifications", "slackWebhook", e.target.value)}
                            className={cn(inputCls, "w-full")}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={handleTestWebhook}
                            disabled={webhookTesting}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all"
                          >
                            {webhookTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            <span>Send Webhook Test Event</span>
                          </button>
                        </div>

                        {webhookTestResult && (
                          <div className={cn(
                            "mt-3 p-3.5 rounded-xl border text-xs space-y-1.5",
                            webhookTestResult.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-destructive/10 border-destructive/20 text-destructive"
                          )}>
                            <div className="font-bold flex items-center justify-between">
                              <span>{webhookTestResult.message}</span>
                              <span className="font-mono text-[10px]">{webhookTestResult.latency_ms}ms</span>
                            </div>
                            {webhookTestResult.diagnostic_logs && (
                              <pre className="p-2 rounded bg-black/20 text-[10px] font-mono text-muted-foreground">
                                {webhookTestResult.diagnostic_logs.join("\n")}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  </motion.div>
                )}

                {/* ── 6. TAXONOMIES ── */}
                {activeSection === "taxonomies" && (
                  <motion.div key="taxonomies" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
                    <div>
                      <h3 className="text-base font-black text-foreground">Taxonomies & Classification Schema</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Manage persistent hardware asset categories and ticket SLA targets.</p>
                    </div>

                    <SectionCard title="Hardware Categories">
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Add new category (e.g. Drone, Workstation)..."
                            value={newCategoryInput}
                            onChange={(e) => setNewCategoryInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
                            className={cn(inputCls, "flex-1")}
                          />
                          <button
                            onClick={handleAddCategory}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {settings.taxonomies.categories.map((cat: string) => (
                            <span key={cat} className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-xl text-xs font-semibold border border-border/50 text-foreground">
                              <span>{cat}</span>
                              <button
                                onClick={() => handleRemoveCategory(cat)}
                                className="text-muted-foreground hover:text-destructive ml-1"
                                title="Remove category"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Ticket Priority SLA Thresholds">
                      <div className="space-y-2 pt-1 text-xs">
                        {settings.taxonomies.priorities?.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/40">
                            <span className="font-bold text-foreground">{p.name} ({p.id})</span>
                            <span className="font-mono text-muted-foreground">{p.sla_hours} hours target</span>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  </motion.div>
                )}

                {/* ── 7. DATABASE & BACKUPS ── */}
                {activeSection === "database" && (
                  <motion.div key="database" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-foreground">Database Safeguards & Snapshots</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Automated pre-migration snapshots, integrity checks, and upgrade rollback protection.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleRunIntegrity}
                          disabled={runningIntegrity}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-background hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all shadow-xs"
                        >
                          {runningIntegrity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5 text-primary" />}
                          <span>Run Integrity Audit</span>
                        </button>
                        <button
                          onClick={handleCreateBackup}
                          disabled={creatingBackup}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                        >
                          {creatingBackup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                          <span>Instant Backup</span>
                        </button>
                      </div>
                    </div>

                    {/* Migration Status Alert */}
                    {migrationStatus && (
                      <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs font-bold text-foreground flex items-center justify-between gap-2">
                        <span>{migrationStatus}</span>
                        <button onClick={() => setMigrationStatus(null)} className="text-muted-foreground hover:text-foreground text-[10px]">Dismiss</button>
                      </div>
                    )}

                    {/* Integrity Report Alert */}
                    {integrityStatus && (
                      <div className={cn(
                        "p-4 rounded-2xl border text-xs space-y-1",
                        integrityStatus.is_healthy ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-destructive/10 border-destructive/20 text-destructive"
                      )}>
                        <div className="font-black flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{integrityStatus.is_healthy ? "Database Integrity Verified (0 Violations)" : "Integrity Violations Detected"}</span>
                        </div>
                        {integrityStatus.errors?.map((err: string, idx: number) => (
                          <p key={idx} className="text-[11px] opacity-90">{err}</p>
                        ))}
                      </div>
                    )}

                    {/* Database Health Card */}
                    <SectionCard title="Engine Metrics">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-1 text-xs">
                        <div className="p-3 bg-muted/20 rounded-xl border border-border/40">
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Engine & Storage</span>
                          <span className="font-bold text-foreground">{dbStatus.version}</span>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-xl border border-border/40">
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Database File Size</span>
                          <span className="font-bold text-foreground">{dbStatus.size}</span>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-xl border border-border/40">
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Status & Schema</span>
                          <span className="font-bold text-emerald-600">{dbStatus.connections}</span>
                        </div>
                      </div>
                    </SectionCard>

                    {/* Safe Upgrade Action */}
                    <SectionCard title="Safe Platform Upgrades" description="Executes schema migrations inside an atomic transaction guarded by an automated pre-migration snapshot.">
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-xs font-bold text-foreground">Automated Safe Migration</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Automatically reverts to pre-migration snapshot if any migration error occurs.
                          </p>
                        </div>
                        <button
                          onClick={handleSafeMigrate}
                          disabled={migrating}
                          className="flex items-center gap-1.5 px-4 py-2 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                        >
                          {migrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          <span>{migrating ? "Migrating Safely..." : "Run Safe Migration"}</span>
                        </button>
                      </div>
                    </SectionCard>

                    {/* Snapshot History Table */}
                    <SectionCard title="Snapshot History & Restoration">
                      {backupsLoading ? (
                        <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading snapshots...
                        </div>
                      ) : backups.length === 0 ? (
                        <p className="py-8 text-center text-xs text-muted-foreground">No snapshots recorded yet. Create an instant backup above.</p>
                      ) : (
                        <div className="divide-y divide-border/30">
                          {backups.map((b) => (
                            <div key={b.filename} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-foreground">{b.filename}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                                    {b.trigger_reason}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                                  <span>{new Date(b.timestamp).toLocaleString()}</span>
                                  <span>·</span>
                                  <span>{b.size_formatted}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <a
                                  href={`/api/system/database/backups/${encodeURIComponent(b.filename)}/download`}
                                  download
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border/50"
                                  title="Download .sqlite3 File"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </a>

                                <button
                                  onClick={() => setRestoreModalSnapshot(b.filename)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors border border-destructive/20"
                                  title="Restore this Snapshot"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Restore</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Restore Snapshot Confirmation Modal */}
        {restoreModalSnapshot && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>Restore Database Snapshot</span>
                </h3>
                <button onClick={() => setRestoreModalSnapshot(null)} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  Are you sure you want to restore snapshot <code className="font-mono text-foreground font-bold">{restoreModalSnapshot}</code>?
                </p>
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[11px]">
                  <strong>Safety Notice:</strong> An automated pre-restore rollback backup will be generated immediately prior to overwriting the active database.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
                <button
                  onClick={() => setRestoreModalSnapshot(null)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-secondary text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestoreBackup}
                  disabled={restoring}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
                >
                  {restoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                  <span>Confirm Restore</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
