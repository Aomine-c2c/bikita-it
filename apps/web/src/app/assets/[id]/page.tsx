"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AssetHero } from "@/components/assets/AssetHero";
import { AssetTabs } from "@/components/assets/AssetTabs";
import { AssetOverviewTab } from "@/components/assets/AssetOverviewTab";
import { motion } from "framer-motion";

export default function AssetDetailsPage() {
  const params = useParams();
  const assetId = (params?.id as string) || "XIP-4910";
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 sm:-m-8">
        
        {/* Sticky Header Section */}
        <div className="shrink-0 bg-white sticky top-0 z-20">
          <AssetHero assetId={assetId} />
          <AssetTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] -[#0B0F19]">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "Overview" && <AssetOverviewTab />}
            {activeTab !== "Overview" && (
              <div className="p-8 flex items-center justify-center h-64 border-2 border-dashed border-border/60 rounded-2xl m-8">
                <p className="text-muted-foreground text-sm font-semibold">
                  {activeTab} tab content is under construction
                </p>
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </DashboardLayout>
  );
}
