"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LocationTree } from "@/components/locations/LocationTree";
import { LocationDetails } from "@/components/locations/LocationDetails";
import { NewLocationModal } from "@/components/locations/NewLocationModal";
import { motion } from "framer-motion";
import { Layers, Plus } from "lucide-react";

export default function LocationsPage() {
  const [selectedLocation, setSelectedLocation] = useState<unknown>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] pb-4">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 shrink-0 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary" />
              Digital Twin
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Explore the physical location hierarchy of the mine and its assets.
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-6 flex-1 min-h-0"
        >
          {/* Sidebar / Tree View */}
          <div className="w-[350px] flex-shrink-0">
            <LocationTree key={refreshKey} onSelectLocation={setSelectedLocation} />
          </div>

          {/* Main Details View */}
          <div className="flex-1 min-w-0">
            <LocationDetails location={selectedLocation} />
          </div>
        </motion.div>
      </div>

      <NewLocationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { setIsModalOpen(false); setRefreshKey(k => k + 1); }}
      />
    </DashboardLayout>
  );
}
