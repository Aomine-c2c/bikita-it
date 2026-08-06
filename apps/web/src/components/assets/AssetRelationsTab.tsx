/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import React from "react";
import { Network, Monitor, User, MapPin, Link2, MonitorSmartphone } from "lucide-react";
import type { _Asset } from "@/lib/api";

export function AssetRelationsTab({ asset }: { asset: unknown }) {
  return (
    <div className="p-4 sm:p-8 space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold tracking-tight">Asset Ecosystem</h2>
        <p className="text-sm text-muted-foreground mt-1">Interconnected relationships across the Pulse platform.</p>
      </div>

      <div className="max-w-3xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {/* Owner */}
          <div className="bg-white border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs uppercase font-bold text-muted-foreground">Current Owner</h3>
                {(asset as unknown).assigneeId ? (
                  <div className="mt-2">
                    <p className="font-semibold text-sm">Assigned Employee</p>
                  </div>
                ) : (
                  <p className="text-sm font-semibold mt-2 text-muted-foreground">Unassigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs uppercase font-bold text-muted-foreground">Location</h3>
                {(asset as unknown).locationId ? (
                  <div className="mt-2">
                    <p className="font-semibold text-sm">Physical Location</p>
                  </div>
                ) : (
                  <p className="text-sm font-semibold mt-2 text-muted-foreground">Not Installed</p>
                )}
              </div>
            </div>
          </div>

          {/* Network */}
          <div className="bg-white border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative md:col-span-2 max-w-md mx-auto w-full">
            <div className="flex items-start gap-4">
              <div className="bg-violet-50 text-violet-600 p-3 rounded-xl">
                <Network className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs uppercase font-bold text-muted-foreground">Network Connection</h3>
                {asset.networkDevice ? (
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{asset.networkDevice.hostname}</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${asset.networkDevice.status === "CONNECTED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {asset.networkDevice.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mt-1">{asset.networkDevice.ipAddress} • {asset.networkDevice.macAddress}</p>
                  </div>
                ) : (
                  <p className="text-sm font-semibold mt-2 text-muted-foreground">Offline / Unregistered</p>
                )}
              </div>
            </div>
          </div>

          {/* Parent Asset */}
          {(asset as unknown).parentId && (
            <div className="bg-white border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative md:col-span-2 max-w-md mx-auto w-full">
              <div className="flex items-start gap-4">
                <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                  <MonitorSmartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs uppercase font-bold text-muted-foreground">Connected To (Parent)</h3>
                  <div className="mt-2">
                    <p className="font-semibold text-sm">Parent Asset Record</p>
                    <p className="text-xs text-muted-foreground mt-1">This asset acts as a peripheral</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Children Assets */}
          {asset.children && asset.children.length > 0 && (
            <div className="bg-white border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative md:col-span-2">
              <div className="flex items-start gap-4">
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl">
                  <Link2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs uppercase font-bold text-muted-foreground mb-3">Connected Peripherals ({asset.children.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {asset.children.map((child: unknown) => (
                      <div key={child.id} className="border border-border/40 rounded-lg p-3 flex items-center gap-3 bg-[#FAFAFA]">
                        <Monitor className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-bold">{child.name || child.tag}</p>
                          <p className="text-[10px] text-muted-foreground">{child.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}