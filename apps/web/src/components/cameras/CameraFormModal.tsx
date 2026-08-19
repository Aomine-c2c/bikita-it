"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Video, AlertCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface CameraFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CameraFormModal({ isOpen, onClose, onSuccess }: CameraFormModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [vendor, setVendor] = useState("Hikvision");
  const [model, setModel] = useState("");
  const [resolution, setResolution] = useState("4K (3840x2160)");
  const [status, setStatus] = useState("Online");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !ipAddress.trim()) {
      setErrorMessage("Channel Title and IP Address are mandatory fields.");
      return;
    }

    setSubmitting(true);
    try {
      const cameraPayload = {
        name: name.trim(),
        ip_address: ipAddress.trim(),
        mac_address: macAddress.trim() || undefined,
        vendor: vendor.trim() || undefined,
        model: model.trim() || undefined,
        status,
        resolution,
      };

      await apiFetch("/cameras", {
        method: "POST",
        body: JSON.stringify(cameraPayload),
      });

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Failed to persist camera channel.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setIpAddress("");
    setMacAddress("");
    setVendor("Hikvision");
    setModel("");
    setResolution("4K (3840x2160)");
    setStatus("Online");
    setErrorMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-card border border-border/70 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-sm">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">Add Surveillance Stream</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Register NVR IP channel &amp; RTSP telemetry</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-2 text-xs font-bold text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Channel Name / Sector
                </label>
                <input
                  type="text"
                  placeholder="e.g. CAM-07 North Gate Perimeter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary transition-colors shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    placeholder="192.168.20.25"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full px-3.5 py-2 bg-background border border-border/60 rounded-xl text-xs font-mono font-semibold outline-none focus:border-primary transition-colors shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    MAC Address
                  </label>
                  <input
                    type="text"
                    placeholder="AA:BB:CC:DD:EE:FF"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value)}
                    className="w-full px-3.5 py-2 bg-background border border-border/60 rounded-xl text-xs font-mono font-semibold outline-none focus:border-primary transition-colors shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Hardware Vendor
                  </label>
                  <select
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary transition-colors shadow-xs cursor-pointer"
                  >
                    <option value="Hikvision">Hikvision</option>
                    <option value="Axis Communications">Axis Communications</option>
                    <option value="Dahua Technology">Dahua Technology</option>
                    <option value="Bosch Security">Bosch Security</option>
                    <option value="Hanwha Vision">Hanwha Vision</option>
                    <option value="Uniview">Uniview</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Camera Model
                  </label>
                  <input
                    type="text"
                    placeholder="DS-2CD2386G2-ISU"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3.5 py-2 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary transition-colors shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Stream Resolution
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary transition-colors shadow-xs cursor-pointer"
                  >
                    <option value="4K (3840x2160)">4K UHD (3840x2160)</option>
                    <option value="5MP (2592x1944)">5MP (2592x1944)</option>
                    <option value="1080p (60 FPS)">1080p 60 FPS</option>
                    <option value="1080p (1920x1080)">1080p 30 FPS</option>
                    <option value="720p (1280x720)">720p HD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary transition-colors shadow-xs cursor-pointer"
                  >
                    <option value="Online">Online (Streaming)</option>
                    <option value="Warning">Warning (High Latency)</option>
                    <option value="Offline">Offline (No Ping)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Register Stream</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
