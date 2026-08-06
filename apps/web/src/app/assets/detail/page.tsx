"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AssetHero } from "@/components/assets/AssetHero";
import { AssetTabs } from "@/components/assets/AssetTabs";
import { AssetOverviewTab } from "@/components/assets/AssetOverviewTab";
import { AssetHistoryTab } from "@/components/assets/AssetHistoryTab";
import { AssetDocumentsTab } from "@/components/assets/AssetDocumentsTab";
import { AssetMaintenanceTab } from "@/components/assets/AssetMaintenanceTab";
import { AssetRelationsTab } from "@/components/assets/AssetRelationsTab";
import { AssetSpecificationsTab } from "@/components/assets/AssetSpecificationsTab";
import { AssetTimelineTab } from "@/components/assets/AssetTimelineTab";
import { assetApi, type Asset } from "@/lib/api";
import { Loader2 } from "lucide-react";

function AssetDetailsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const [activeTab, setActiveTab] = useState("Overview");
  const [asset, setAsset] = useState<Asset | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    if (!id) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState("loading");
    assetApi.getOne(id).then((data) => {
      if (active) { setAsset(data); setState("ready"); }
    }).catch((error: Error) => {
      if (active) setState(error.message.includes("404") ? "missing" : "error");
    });
    return () => { active = false; };
  }, [id]);

  const renderTab = () => {
    switch (activeTab) {
      case "Overview": return <AssetOverviewTab asset={asset} />;
      case "History": return <AssetHistoryTab asset={asset} />;
      case "Documents": return <AssetDocumentsTab asset={asset} />;
      case "Maintenance": return <AssetMaintenanceTab asset={asset} />;
      case "Relations": return <AssetRelationsTab asset={asset} />;
      case "Specs": return <AssetSpecificationsTab asset={asset} />;
      case "Timeline": return <AssetTimelineTab asset={asset} />;
      default: return <div className="p-8 text-sm text-muted-foreground">No {activeTab.toLowerCase()} data is available.</div>;
    }
  };

  return (
    <DashboardLayout>
      {state === "loading" && <div className="h-[60vh] grid place-items-center"><Loader2 className="w-7 h-7 animate-spin" aria-label="Loading asset" /></div>}
      {(state === "missing" || state === "error") && <section role="alert" className="h-[60vh] grid place-items-center text-center"><div><h1 className="text-xl font-bold">{state === "missing" ? "Asset not found" : "Unable to load asset"}</h1><p className="text-sm text-muted-foreground mt-2">{state === "missing" ? "This asset does not exist or has been removed." : "Check the API connection and try again."}</p></div></section>}
      {state === "ready" && asset && <div className="flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -mt-4">
        <div className="shrink-0 bg-white"><AssetHero asset={asset} /><AssetTabs activeTab={activeTab} setActiveTab={setActiveTab} /></div>
        <div className="bg-[#F8FAFC]">
          {renderTab()}
        </div>
      </div>}
    </DashboardLayout>
  );
}

export default function AssetDetailsPage() {
  return (
    <Suspense fallback={<div className="h-[60vh] grid place-items-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}>
      <AssetDetailsContent />
    </Suspense>
  );
}
