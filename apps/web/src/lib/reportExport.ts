 
 

/**
 * Report export utilities — PDF (via jsPDF) and CSV download.
 * Re-uses the existing generateTablePdf from lib/pdf.ts for PDF output.
 */
import { generateTablePdf, type PDFColumn } from "./pdf";
import type {
  Asset,
  InventoryItem,
  Repair,
  NetworkDevice,
  Location,
  OperationHistoryRecord,
} from "./api";

// ─── Generic CSV helper ────────────────────────────────────────────────────────

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  return lines.join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtDate(s: string | null | undefined) {
  if (!s) return "";
  try {
    return new Date(s).toISOString().split('T')[0];
  } catch {
    return s;
  }
}

function fmtCurrency(n: number | null | undefined) {
  if (n == null) return "";
  return `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Inventory Report ─────────────────────────────────────────────────────────

const inventoryColumns: PDFColumn[] = [
  { header: "Name", dataKey: "name" },
  { header: "SKU", dataKey: "sku" },
  { header: "Category", dataKey: "category" },
  { header: "Qty", dataKey: "quantity" },
  { header: "Min Stock", dataKey: "minStock" },
  { header: "Max Stock", dataKey: "maxStock" },
  { header: "Bin Location", dataKey: "binLocation" },
  { header: "Status", dataKey: "status" },
];

export function exportInventoryPDF(items: InventoryItem[]) {
  generateTablePdf("Inventory Report", inventoryColumns, items, "inventory_report");
}

export function exportInventoryCSV(items: InventoryItem[]) {
  const headers = ["Name", "SKU", "Category", "Qty", "Min Stock", "Max Stock", "Bin Location", "Status"];
  const rows = items.map((i) => [i.name, i.sku, i.category, i.quantity, i.minStock, i.maxStock, i.binLocation, i.status]);
  downloadCSV(toCSV(headers, rows), "inventory_report");
}

// ─── Asset Report ─────────────────────────────────────────────────────────────

const assetColumns: PDFColumn[] = [
  { header: "Name", dataKey: "name" },
  { header: "Tag", dataKey: "assetTag" },
  { header: "Category", dataKey: "category" },
  { header: "Manufacturer", dataKey: "manufacturer" },
  { header: "Model", dataKey: "model" },
  { header: "Serial #", dataKey: "serialNumber" },
  { header: "Status", dataKey: "status" },
  { header: "Condition", dataKey: "condition" },
  { header: "Assigned To", dataKey: "assignedTo" },
  { header: "Location", dataKey: "locationName" },
  { header: "Purchase Date", dataKey: "purchaseDateFmt" },
  { header: "Purchase Cost", dataKey: "purchaseCostFmt" },
];

function normalizeAssetRow(a: Asset) {
  return {
    ...a,
    assignedTo: a.assignedUser?.name ?? "",
    locationName: a.location?.name ?? "",
    purchaseDateFmt: fmtDate(a.purchaseDate),
    purchaseCostFmt: fmtCurrency(a.purchaseCost),
  };
}

export function exportAssetsPDF(assets: Asset[]) {
  generateTablePdf("Asset Report", assetColumns, assets.map(normalizeAssetRow), "asset_report");
}

export function exportAssetsCSV(assets: Asset[]) {
  const headers = ["Name", "Tag", "Category", "Manufacturer", "Model", "Serial #", "Status", "Condition", "Assigned To", "Location", "Purchase Date", "Purchase Cost"];
  const rows = assets.map((a) => [
    a.name, a.assetTag, a.category, a.manufacturer, a.model, a.serialNumber,
    a.status, a.condition, a.assignedUser?.name, a.location?.name,
    fmtDate(a.purchaseDate), fmtCurrency(a.purchaseCost),
  ]);
  downloadCSV(toCSV(headers, rows), "asset_report");
}

// ─── Employee Asset Report ────────────────────────────────────────────────────

export function exportEmployeeAssetsPDF(assets: Asset[]) {
  const columns: PDFColumn[] = [
    { header: "Employee", dataKey: "assignedTo" },
    { header: "Asset Name", dataKey: "name" },
    { header: "Tag", dataKey: "assetTag" },
    { header: "Category", dataKey: "category" },
    { header: "Status", dataKey: "status" },
    { header: "Location", dataKey: "locationName" },
  ];
  const rows = assets
    .filter((a) => a.assignedUser)
    .map((a) => ({ ...a, assignedTo: a.assignedUser?.name ?? "", locationName: a.location?.name ?? "" }));
  generateTablePdf("Employee Asset Report", columns, rows, "employee_asset_report");
}

export function exportEmployeeAssetsCSV(assets: Asset[]) {
  const headers = ["Employee", "Department", "Asset Name", "Tag", "Category", "Model", "Status", "Location"];
  const rows = assets
    .filter((a) => a.assignedUser)
    .map((a) => [a.assignedUser?.name, "", a.name, a.assetTag, a.category, a.model, a.status, a.location?.name]);
  downloadCSV(toCSV(headers, rows), "employee_asset_report");
}

// ─── Network Report ───────────────────────────────────────────────────────────

export function exportNetworkPDF(devices: NetworkDevice[]) {
  const columns: PDFColumn[] = [
    { header: "Hostname", dataKey: "hostname" },
    { header: "IP Address", dataKey: "ipAddress" },
    { header: "MAC Address", dataKey: "macAddress" },
    { header: "Device Type", dataKey: "deviceType" },
    { header: "OS", dataKey: "os" },
    { header: "Status", dataKey: "connectionStatus" },
    { header: "Network", dataKey: "networkName" },
    { header: "Location", dataKey: "locationName" },
    { header: "Last Seen", dataKey: "lastSeenFmt" },
  ];
  const rows = devices.map((d) => ({
    ...d,
    locationName: d.locationId ?? "",
    lastSeenFmt: fmtDate(d.lastSeen || d.last_seen),
  }));
  generateTablePdf("Network Report", columns, rows, "network_report");
}

export function exportNetworkCSV(devices: NetworkDevice[]) {
  const headers = ["Hostname", "IP Address", "MAC Address", "Device Type", "OS", "Status", "Network", "Location", "Last Seen"];
  const rows: (string | number | null | undefined)[][] = devices.map((d) => [
    d.hostname,
    d.ipAddress || d.ip_address,
    d.macAddress || d.mac_address,
    d.deviceType || d.device_type,
    d.os,
    d.connectionStatus || d.status,
    d.networkName,
    d.locationId,
    fmtDate(d.lastSeen || d.last_seen),
  ]);
  downloadCSV(toCSV(headers, rows), "network_report");
}

// ─── Installed Equipment Report ──────────────────────────────────────────────

export function exportInstalledEquipmentPDF(assets: Asset[]) {
  const columns: PDFColumn[] = [
    { header: "Name", dataKey: "name" },
    { header: "Tag", dataKey: "assetTag" },
    { header: "Category", dataKey: "category" },
    { header: "Manufacturer", dataKey: "manufacturer" },
    { header: "Model", dataKey: "model" },
    { header: "IP Address", dataKey: "ipAddress" },
    { header: "Location", dataKey: "locationName" },
    { header: "Status", dataKey: "status" },
  ];
  const rows = assets
    .filter((a) => a.location?.id)
    .map((a) => ({ ...a, locationName: a.location?.name ?? "" }));
  generateTablePdf("Installed Equipment Report", columns, rows, "installed_equipment_report");
}

export function exportInstalledEquipmentCSV(assets: Asset[]) {
  const headers = ["Name", "Tag", "Category", "Manufacturer", "Model", "IP Address", "Location", "Status"];
  const rows = assets
    .filter((a) => a.location?.id)
    .map((a) => [a.name, a.assetTag, a.category, a.manufacturer, a.model, a.ipAddress, a.location?.name, a.status]);
  downloadCSV(toCSV(headers, rows), "installed_equipment_report");
}

// ─── Borrowed Tools Report ────────────────────────────────────────────────────

export function exportBorrowedToolsPDF(assets: Asset[]) {
  const columns: PDFColumn[] = [
    { header: "Asset Name", dataKey: "name" },
    { header: "Tag", dataKey: "assetTag" },
    { header: "Category", dataKey: "category" },
    { header: "Assigned To", dataKey: "assignedTo" },
    { header: "Status", dataKey: "status" },
  ];
  const rows = assets
    .filter((a) => a.assignedUser && a.status?.toLowerCase().includes("borrow"))
    .map((a) => ({ ...a, assignedTo: a.assignedUser?.name ?? "" }));
  // Fallback: show all assigned assets if no borrow-status ones
  const finalRows =
    rows.length > 0
      ? rows
      : assets
          .filter((a) => a.assignedUser)
          .map((a) => ({ ...a, assignedTo: a.assignedUser?.name ?? "" }));
  generateTablePdf("Borrowed Tools Report", columns, finalRows, "borrowed_tools_report");
}

export function exportBorrowedToolsCSV(assets: Asset[]) {
  const assigned = assets.filter((a) => a.assignedUser);
  const headers = ["Asset Name", "Tag", "Category", "Assigned To", "Status"];
  const rows = assigned.map((a) => [a.name, a.assetTag, a.category, a.assignedUser?.name, a.status]);
  downloadCSV(toCSV(headers, rows), "borrowed_tools_report");
}

// ─── Maintenance Report ───────────────────────────────────────────────────────

export function exportMaintenancePDF(repairs: Repair[]) {
  const columns: PDFColumn[] = [
    { header: "Asset", dataKey: "assetName" },
    { header: "Type", dataKey: "type" },
    { header: "Description", dataKey: "description" },
    { header: "Status", dataKey: "status" },
    { header: "Technician", dataKey: "techName" },
    { header: "Scheduled", dataKey: "scheduledFmt" },
    { header: "Completed", dataKey: "completedFmt" },
  ];
  const rows = repairs.map((r) => ({
    ...r,
    assetName: r.hardware ? `${r.hardware.make} ${r.hardware.model} (${r.hardware.tag})` : "",
    techName: r.technician?.name ?? "",
    scheduledFmt: fmtDate(r.scheduledDate),
    completedFmt: fmtDate(r.completedDate),
  }));
  generateTablePdf("Maintenance Report", columns, rows, "maintenance_report");
}

export function exportMaintenanceCSV(repairs: Repair[]) {
  const headers = ["Asset Tag", "Make", "Model", "Type", "Description", "Status", "Technician", "Scheduled", "Completed"];
  const rows = repairs.map((r) => [
    r.hardware?.tag, r.hardware?.make, r.hardware?.model,
    r.type, r.description, r.status, r.technician?.name,
    fmtDate(r.scheduledDate), fmtDate(r.completedDate),
  ]);
  downloadCSV(toCSV(headers, rows), "maintenance_report");
}

// ─── Location Report ──────────────────────────────────────────────────────────

export function exportLocationsPDF(locations: Location[], assets: Asset[]) {
  const columns: PDFColumn[] = [
    { header: "Location", dataKey: "name" },
    { header: "Type", dataKey: "type" },
    { header: "Asset Count", dataKey: "assetCount" },
  ];
  const rows = locations.map((l) => ({
    ...l,
    assetCount: assets.filter((a) => a.location?.id === l.id).length,
  }));
  generateTablePdf("Location Report", columns, rows, "location_report");
}

export function exportLocationsCSV(locations: Location[], assets: Asset[]) {
  const headers = ["Location", "Type", "Asset Count"];
  const rows = locations.map((l) => [l.name, l.type, assets.filter((a) => a.location?.id === l.id).length]);
  downloadCSV(toCSV(headers, rows), "location_report");
}

// ─── Timeline / Operations Report ────────────────────────────────────────────

export function exportTimelinePDF(operations: OperationHistoryRecord[]) {
  const columns: PDFColumn[] = [
    { header: "Date", dataKey: "dateFmt" },
    { header: "Type", dataKey: "type" },
    { header: "Asset", dataKey: "assetName" },
    { header: "Item", dataKey: "itemName" },
    { header: "Employee", dataKey: "employeeName" },
    { header: "Location", dataKey: "locationName" },
    { header: "Qty", dataKey: "quantity" },
    { header: "Notes", dataKey: "notes" },
  ];
  const rows = operations.map((o) => ({ ...o, dateFmt: fmtDate(o.date) }));
  generateTablePdf("Timeline Report", columns, rows, "timeline_report");
}

export function exportTimelineCSV(operations: OperationHistoryRecord[]) {
  const headers = ["Date", "Type", "Asset", "Asset Tag", "Item", "Employee", "Location", "Qty", "Notes"];
  const rows = operations.map((o) => [
    fmtDate(o.date), o.type, o.assetName, o.assetTag, o.itemName, o.employeeName, o.locationName, o.quantity, o.notes,
  ]);
  downloadCSV(toCSV(headers, rows), "timeline_report");
}

// ─── Repair Report ────────────────────────────────────────────────────────────

export function exportRepairsPDF(repairs: Repair[]) {
  const columns: PDFColumn[] = [
    { header: "Asset", dataKey: "assetName" },
    { header: "Tag", dataKey: "assetTag" },
    { header: "Type", dataKey: "type" },
    { header: "Description", dataKey: "description" },
    { header: "Status", dataKey: "status" },
    { header: "Condition", dataKey: "condition" },
    { header: "Technician", dataKey: "techName" },
    { header: "Created", dataKey: "createdFmt" },
    { header: "Completed", dataKey: "completedFmt" },
    { header: "Remarks", dataKey: "remarks" },
  ];
  const rows = repairs.map((r) => ({
    ...r,
    assetName: r.hardware ? `${r.hardware.make} ${r.hardware.model}` : "",
    assetTag: r.hardware?.tag ?? "",
    techName: r.technician?.name ?? "",
    createdFmt: fmtDate(r.createdAt),
    completedFmt: fmtDate(r.completedDate),
  }));
  generateTablePdf("Repair Report", columns, rows, "repair_report");
}

export function exportRepairsCSV(repairs: Repair[]) {
  const headers = ["Asset", "Tag", "Type", "Description", "Status", "Condition", "Technician", "Created", "Completed", "Remarks"];
  const rows = repairs.map((r) => [
    r.hardware ? `${r.hardware.make} ${r.hardware.model}` : "",
    r.hardware?.tag,
    r.type, r.description, r.status, r.condition, r.technician?.name,
    fmtDate(r.createdAt), fmtDate(r.completedDate), r.remarks,
  ]);
  downloadCSV(toCSV(headers, rows), "repair_report");
}
