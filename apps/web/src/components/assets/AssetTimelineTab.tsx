/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import React from "react";
import { type _Asset } from "@/lib/api";
import { Activity, Clock } from "lucide-react";

export function AssetTimelineTab({ asset }: { asset: unknown }) {
  const events: unknown[] = [];
  
  if (asset.createdAt) {
    events.push({ id: 'created', date: asset.createdAt, title: 'Asset Created', type: 'system' });
  }
  if (asset.purchaseDate) {
    events.push({ id: 'purchase', date: asset.purchaseDate, title: 'Asset Purchased', type: 'system' });
  }
  
  const history = asset.movementHistory || [];
  history.forEach((tx: unknown) => {
    events.push({ id: tx.id, date: tx.createdAt, title: `Movement: ${tx.type}`, type: 'movement', desc: tx.notes });
  });

  const repairs = asset.repairs || [];
  repairs.forEach((rp: unknown) => {
    events.push({ id: rp.id, date: rp.createdAt, title: `Repair: ${rp.status}`, type: 'repair', desc: rp.description });
  });

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-8">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">Activity Timeline</h3>
        <p className="text-sm text-muted-foreground">Chronological history of this asset.</p>
      </div>

      <div className="bg-white border border-border/60 rounded-2xl p-8">
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/60 before:to-transparent">
          {events.map((event) => (
            <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                {event.type === 'repair' ? <Activity className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-border/60 bg-white shadow-sm">
                <div className="flex flex-col mb-1">
                  <span className="text-sm font-bold text-foreground">{event.title}</span>
                  <time className="text-xs font-medium text-muted-foreground">{new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString()}</time>
                </div>
                {event.desc && <div className="text-sm text-muted-foreground">{event.desc}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}