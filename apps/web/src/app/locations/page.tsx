"use client";

import React, { useState } from "react";
import { LocationTree } from "@/components/locations/LocationTree";
import { LocationDetails } from "@/components/locations/LocationDetails";
import { Layers } from "lucide-react";

export default function LocationsPage() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Digital Twin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explore the physical location hierarchy of the mine and its assets.
          </p>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-140px)]">
        {/* Sidebar / Tree View */}
        <div className="w-[350px] flex-shrink-0">
          <LocationTree onSelectLocation={setSelectedLocation} />
        </div>

        {/* Main Details View */}
        <div className="flex-1 min-w-0">
          <LocationDetails location={selectedLocation} />
        </div>
      </div>
    </div>
  );
}
