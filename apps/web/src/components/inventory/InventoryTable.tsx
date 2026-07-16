"use client";

import React from "react";
import { MoreHorizontal, Box, QrCode, Barcode, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const mockInventory = [
  { id: "INV-001", item: "Logitech MX Master 3S", category: "Peripherals", quantity: 42, minStock: 10, maxStock: 50, reorderLevel: 15, warehouse: "Main HQ", shelf: "A-12", supplier: "TechData", cost: "$99.00", trackable: "SERIALIZED" },
  { id: "INV-002", item: "Cat6 Ethernet Cable (Box)", category: "Cables", quantity: 8, minStock: 20, maxStock: 100, reorderLevel: 25, warehouse: "Main HQ", shelf: "B-04", supplier: "Amazon Business", cost: "$14.50", trackable: "CONSUMABLE" },
  { id: "INV-003", item: "PTZ Dome Camera", category: "Cameras", quantity: 5, minStock: 2, maxStock: 20, reorderLevel: 5, warehouse: "Processing Plant", shelf: "C-01", supplier: "CDW", cost: "$450.00", trackable: "NON_RETURNABLE" },
  { id: "INV-004", item: "Makita Hammer Drill", category: "Tools", quantity: 3, minStock: 2, maxStock: 5, reorderLevel: 2, warehouse: "Main HQ", shelf: "A-09", supplier: "Home Depot", cost: "$180.00", trackable: "RETURNABLE" },
  { id: "INV-005", item: "HP Toner Cartridge Black", category: "Printers", quantity: 12, minStock: 15, maxStock: 40, reorderLevel: 20, warehouse: "Main HQ", shelf: "D-11", supplier: "Staples", cost: "$85.00", trackable: "CONSUMABLE" },
  { id: "INV-006", item: "Screwdriver Set", category: "Tools", quantity: 14, minStock: 10, maxStock: 30, reorderLevel: 15, warehouse: "Processing Plant", shelf: "E-02", supplier: "CDW", cost: "$35.00", trackable: "RETURNABLE" },
];

const getQuantityColor = (quantity: number, reorderLevel: number) => {
  if (quantity === 0) return "bg-destructive/10 text-destructive border-destructive/20";
  if (quantity <= reorderLevel) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
};

export function InventoryTable() {
  const [search, setSearch] = React.useState("");

  const filtered = mockInventory.filter((item) =>
    [item.id, item.item, item.category, item.supplier, item.warehouse, item.shelf]
      .some((v) => v && typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col mt-6">
      <div className="p-4 border-b border-border/40 bg-[#FAFAFA] flex items-center justify-between gap-4 sticky left-0">
        <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inventory by item name, SKU..."
              className="w-72 px-3 py-1.5 bg-white border border-border/60 rounded-md text-xs outline-none focus:border-primary shadow-sm"
            />
            <select className="text-xs bg-white border border-border/60 rounded-md px-2 py-1.5 outline-none shadow-sm">
              <option>All Warehouses</option>
              <option>Main HQ</option>
              <option>Processing Plant</option>
            </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-white border border-border/60 rounded-md text-xs font-semibold text-foreground hover:bg-slate-50 shadow-sm">Export CSV</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-border/40 bg-[#FAFAFA]">
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-10 sticky left-0 bg-[#FAFAFA] z-10 backdrop-blur-sm border-r border-border/20">
                <input type="checkbox" className="rounded border-muted-foreground/30 text-primary" />
              </th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider sticky left-10 bg-[#FAFAFA] z-10 backdrop-blur-sm border-r border-border/20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">SKU</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Item Name</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Quantity</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Reorder Level</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Warehouse</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Shelf</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Supplier</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Unit Cost</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Codes</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center sticky right-0 bg-[#FAFAFA] z-10 backdrop-blur-sm border-l border-border/20 shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-16 text-sm text-muted-foreground">
                  No inventory items found matching &ldquo;{search}&rdquo;
                </td>
              </tr>
            ) : filtered.map((item, idx) => (
              <tr key={idx} className="border-b border-border/20 last:border-0 hover:bg-slate-50/80 transition-colors group">
                <td className="px-5 py-3 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 border-r border-border/20 transition-colors">
                  <input type="checkbox" className="rounded border-muted-foreground/30 text-primary" />
                </td>
                <td className="px-5 py-3 text-xs font-semibold text-primary sticky left-10 bg-white group-hover:bg-slate-50/80 z-10 border-r border-border/20 shadow-[2px_0_5px_rgba(0,0,0,0.02)] transition-colors">{item.id}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-muted-foreground">
                      <Box className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{item.item}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{item.category}</td>
                <td className="px-5 py-3 text-right">
                  <span className={cn("inline-flex px-2.5 py-1 rounded-md text-xs font-bold border", getQuantityColor(item.quantity, item.reorderLevel))}>
                    {item.quantity}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">{item.reorderLevel}</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{item.warehouse}</td>
                <td className="px-5 py-3 text-xs font-mono text-muted-foreground bg-slate-50 rounded inline-block mt-2.5">{item.shelf}</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{item.supplier}</td>
                <td className="px-5 py-3 text-right text-xs font-semibold text-foreground">{item.cost}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <QrCode className="w-4 h-4 hover:text-foreground cursor-pointer transition-colors" />
                    <Barcode className="w-4 h-4 hover:text-foreground cursor-pointer transition-colors" />
                  </div>
                </td>
                <td className="px-5 py-3 text-center sticky right-0 bg-white group-hover:bg-slate-50/80 z-10 border-l border-border/20 shadow-[-2px_0_5px_rgba(0,0,0,0.02)] transition-colors">
                  <div className="flex items-center justify-end gap-2">
                    <button className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold uppercase tracking-wider rounded transition-colors">
                      {item.trackable === "RETURNABLE" ? "Loan / Return" : item.trackable === "NON_RETURNABLE" ? "Install / Deploy" : item.trackable === "CONSUMABLE" ? "Consume" : "Assign"}
                    </button>
                    <button className="p-1.5 rounded-md text-muted-foreground hover:bg-slate-200 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
