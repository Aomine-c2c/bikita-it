"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, notFound } from "next/navigation";
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
import { AssetFormModal } from "@/components/assets/AssetFormModal";
import { ReassignAssetModal } from "@/components/assets/ReassignAssetModal";
import { RetireAssetModal } from "@/components/assets/RetireAssetModal";
import { assetApi, type Asset } from "@/lib/api";
import { Loader2 } from "lucide-react";

function AssetDetailsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const [activeTab, setActiveTab] = useState("Overview");
  const [asset, setAsset] = useState<Asset | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false);

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

  if (state === "missing") {
    notFound();
  }

  const renderTab = () => {
    if (!asset) return null;
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
      {state === "error" && <section role="alert" className="h-[60vh] grid place-items-center text-center"><div><h1 className="text-xl font-bold">Unable to load asset</h1><p className="text-sm text-muted-foreground mt-2">Check the API connection and try again.</p></div></section>}
      {state === "ready" && asset && <div className="flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -mt-4">
        <div className="shrink-0 bg-white">
          <AssetHero 
            asset={asset} 
            onEdit={() => setIsEditModalOpen(true)} 
            onReassign={() => setIsReassignModalOpen(true)}
            onRetire={() => setIsRetireModalOpen(true)}
          />
          <AssetTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <div className="bg-[#F8FAFC]">
          {renderTab()}
        </div>
      </div>}
      
      {state === "ready" && asset && (
        <AssetFormModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          onSuccess={() => {
            assetApi.getOne(id).then(setAsset);
          }}
          assetToEdit={asset}
        />
      )}
      
      {state === "ready" && asset && (
        <ReassignAssetModal
          isOpen={isReassignModalOpen}
          onClose={() => setIsReassignModalOpen(false)}
          onSuccess={() => {
            assetApi.getOne(id).then(setAsset);
          }}
          assetId={asset.id}
        />
      )}

      {state === "ready" && asset && (
        <RetireAssetModal
          isOpen={isRetireModalOpen}
          onClose={() => setIsRetireModalOpen(false)}
          onSuccess={() => {
            assetApi.getOne(id).then(setAsset);
          }}
          asset={asset}
        />
      )}
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
