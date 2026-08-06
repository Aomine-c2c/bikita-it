/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { Database, Download, _Upload, AlertTriangle, RefreshCw, HardDrive } from "lucide-react";
import { _cn } from "@/lib/utils";

interface Backup {
  filename: string;
  size: number;
  timestamp: number;
}

export function BackupSettings() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const data: Backup[] = await invoke('get_available_backups');
      setBackups(data);
    } catch (e) {
      console.warn("Tauri invoke get_available_backups failed", e);
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBackups();
  }, []);

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('create_manual_backup');
      await fetchBackups();
    } catch (e) {
      console.warn("Tauri invoke create_manual_backup failed", e);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (filename: string) => {
    const confirm = window.confirm(
      `WARNING: This will overwrite your current database with the backup "${filename}".\n\nThe application will immediately close after restoration. You will need to start it again.\n\nAre you sure you want to proceed?`
    );
    if (!confirm) return;

    setIsRestoring(filename);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('restore_backup', { filename });
      // The app will terminate itself via Rust, so this might not be reached
    } catch (e) {
      console.warn("Tauri invoke restore_backup failed", e);
      alert("Restore failed. Check logs.");
      setIsRestoring(null);
    }
  };

  const formatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/40 bg-[#FAFAFA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Database Backups</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Manage automated and manual database snapshots</p>
            </div>
          </div>
          <button
            onClick={handleManualBackup}
            disabled={isBackingUp}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-md shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isBackingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
            Create Snapshot
          </button>
        </div>

        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-slate-50">
                <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Backup File</th>
                <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date & Time</th>
                <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Size</th>
                <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">No backups found</td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.filename} className="border-b border-border/20 hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-muted-foreground" />
                        {b.filename}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(b.timestamp * 1000).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {formatSize(b.size)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleRestore(b.filename)}
                        disabled={isRestoring === b.filename}
                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-semibold rounded transition-colors disabled:opacity-50"
                      >
                        {isRestoring === b.filename ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        Restore
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}