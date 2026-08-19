import type {
  Asset,
  InventoryItem,
  NetworkDevice,
  Ticket,
} from "./api";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * Generate and download an Excel spreadsheet (.xls format) with
 * institutional branding, summary statistics, and styled table grids.
 */
export function downloadExcelSpreadsheet(
  title: string,
  columns: ExcelColumn[],
  rows: Record<string, unknown>[],
  summaryCards?: Record<string, string | number>,
  filename: string = "export",
  orgName: string = "BIKITA IT OPERATIONS"
) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = new Date().toLocaleTimeString();

  let summaryHtml = "";
  if (summaryCards && Object.keys(summaryCards).length > 0) {
    summaryHtml = `
      <tr style="background-color: #f1f5f9;">
        <td colspan="${columns.length}" style="padding: 10px; font-family: Calibri, Arial, sans-serif; font-size: 11pt; border: 1px solid #cbd5e1;">
          <strong>Summary Metrics:</strong> &nbsp;&nbsp;
          ${Object.entries(summaryCards)
            .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
            .join(" &nbsp;|&nbsp; ")}
        </td>
      </tr>
      <tr><td colspan="${columns.length}" style="height: 10px;"></td></tr>
    `;
  }

  const tableHeaders = columns
    .map(
      (c) =>
        `<th style="background-color: #0f172a; color: #ffffff; font-family: Calibri, Arial, sans-serif; font-size: 11pt; font-weight: bold; padding: 8px 12px; border: 1px solid #334155; text-align: left;">${c.header}</th>`
    )
    .join("");

  const tableRows = rows
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      const cells = columns
        .map((col) => {
          const val = row[col.key] ?? "";
          return `<td style="background-color: ${bg}; font-family: Calibri, Arial, sans-serif; font-size: 10pt; padding: 6px 10px; border: 1px solid #e2e8f0; color: #1e293b;">${val}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${title.substring(0, 30)}</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td colspan="${columns.length}" style="font-family: Calibri, Arial, sans-serif; font-size: 16pt; font-weight: bold; color: #0f172a; padding: 12px 0 4px 0;">
            ${orgName.toUpperCase()}
          </td>
        </tr>
        <tr>
          <td colspan="${columns.length}" style="font-family: Calibri, Arial, sans-serif; font-size: 12pt; font-weight: bold; color: #334155; padding-bottom: 4px;">
            ${title}
          </td>
        </tr>
        <tr>
          <td colspan="${columns.length}" style="font-family: Calibri, Arial, sans-serif; font-size: 9pt; color: #64748b; padding-bottom: 12px;">
            Generated on ${dateStr} at ${timeStr} · Official System Copy
          </td>
        </tr>
        ${summaryHtml}
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split("T")[0]}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open a clean, print-optimized document view and trigger browser print dialog.
 */
export function printTableSheet(
  title: string,
  columns: ExcelColumn[],
  rows: Record<string, unknown>[],
  summaryCards?: Record<string, string | number>,
  orgName: string = "BIKITA IT OPERATIONS"
) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let summaryHtml = "";
  if (summaryCards && Object.keys(summaryCards).length > 0) {
    summaryHtml = `
      <div class="summary-grid">
        ${Object.entries(summaryCards)
          .map(
            ([k, v]) => `
          <div class="summary-card">
            <div class="summary-label">${k}</div>
            <div class="summary-value">${v}</div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  const thHtml = columns.map((c) => `<th>${c.header}</th>`).join("");
  const trHtml = rows
    .map((r) => {
      const tds = columns.map((col) => `<td>${r[col.key] ?? "-"}</td>`).join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  const printDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${orgName}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 11px;
          }
          .header-banner {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .org-title {
            font-size: 18px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #0f172a;
          }
          .doc-title {
            font-size: 14px;
            font-weight: 700;
            color: #334155;
            margin-top: 2px;
          }
          .meta-info {
            text-align: right;
            font-size: 10px;
            color: #64748b;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin-bottom: 16px;
          }
          .summary-card {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            border-radius: 6px;
            padding: 8px 12px;
          }
          .summary-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
          }
          .summary-value {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 7px 10px;
            font-size: 10px;
            border: 1px solid #0f172a;
          }
          td {
            padding: 6px 10px;
            border: 1px solid #e2e8f0;
            font-size: 10px;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="header-banner">
          <div>
            <div class="org-title">${orgName.toUpperCase()}</div>
            <div class="doc-title">${title}</div>
          </div>
          <div class="meta-info">
            <div><strong>Date:</strong> ${dateStr}</div>
            <div><strong>Total Records:</strong> ${rows.length}</div>
          </div>
        </div>

        ${summaryHtml}

        <table>
          <thead>
            <tr>${thHtml}</tr>
          </thead>
          <tbody>
            ${trHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>Institutional Confidential · IT Infrastructure & Asset Roster</div>
          <div>Page 1 of 1</div>
        </div>
      </body>
    </html>
  `;

  // Hidden iframe technique for seamless printing without popup blockers or dialogs
  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(printDoc);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.error("Print trigger error:", printErr);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        }
      }, 300);
      return;
    }
  } catch (err) {
    console.warn("Iframe print initialization failed, falling back", err);
  }

  // Fallback to window.open if iframe is blocked
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printDoc);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  } else {
    window.print();
  }
}

// ─── Module Exporters ─────────────────────────────────────────────────────────

const assetColumns: ExcelColumn[] = [
  { header: "Asset Tag", key: "assetTag" },
  { header: "Device Name", key: "name" },
  { header: "Category", key: "category" },
  { header: "Manufacturer", key: "manufacturer" },
  { header: "Model", key: "model" },
  { header: "Serial Number", key: "serialNumber" },
  { header: "Status", key: "status" },
  { header: "Condition", key: "condition" },
  { header: "Assigned To", key: "assignedTo" },
  { header: "Location", key: "locationName" },
  { header: "Purchase Cost", key: "purchaseCost" },
  { header: "Purchase Date", key: "purchaseDate" },
];

export function exportAssetsExcel(assets: Asset[], orgName?: string) {
  const rows = assets.map((a) => ({
    assetTag: a.assetTag || `AST-${a.id}`,
    name: a.name,
    category: a.category || "Hardware",
    manufacturer: a.manufacturer || "-",
    model: a.model || "-",
    serialNumber: a.serialNumber || "-",
    status: a.status || "ACTIVE",
    condition: a.condition || "GOOD",
    assignedTo: a.assignedUser?.name || a.assignedEmployee?.name || "Unassigned",
    locationName: a.location?.name || "-",
    purchaseCost: a.purchaseCost ? `$${Number(a.purchaseCost).toFixed(2)}` : "$0.00",
    purchaseDate: a.purchaseDate ? new Date(a.purchaseDate).toISOString().split("T")[0] : "-",
  }));

  const total = assets.length;
  const active = assets.filter((a) => a.status === "ACTIVE").length;
  const inRepair = assets.filter((a) => a.status === "IN_REPAIR" || a.status === "MAINTENANCE").length;

  downloadExcelSpreadsheet(
    "Hardware Devices & Asset Roster",
    assetColumns,
    rows,
    { "Total Devices": total, "Active / Deployed": active, "In Repair / Maintenance": inRepair },
    "hardware_devices_roster",
    orgName
  );
}

export function printAssetsSheet(assets: Asset[], orgName?: string) {
  const rows = assets.map((a) => ({
    assetTag: a.assetTag || `AST-${a.id}`,
    name: a.name,
    category: a.category || "Hardware",
    manufacturer: a.manufacturer || "-",
    model: a.model || "-",
    serialNumber: a.serialNumber || "-",
    status: a.status || "ACTIVE",
    condition: a.condition || "GOOD",
    assignedTo: a.assignedUser?.name || a.assignedEmployee?.name || "Unassigned",
    locationName: a.location?.name || "-",
    purchaseCost: a.purchaseCost ? `$${Number(a.purchaseCost).toFixed(2)}` : "$0.00",
    purchaseDate: a.purchaseDate ? new Date(a.purchaseDate).toISOString().split("T")[0] : "-",
  }));

  const total = assets.length;
  const active = assets.filter((a) => a.status === "ACTIVE").length;
  const inRepair = assets.filter((a) => a.status === "IN_REPAIR" || a.status === "MAINTENANCE").length;

  printTableSheet(
    "Hardware Devices & Asset Roster",
    assetColumns,
    rows,
    { "Total Devices": total, "Active / Deployed": active, "In Repair / Maintenance": inRepair },
    orgName
  );
}

// ─── Network Devices Exporter ──────────────────────────────────────────────────

const networkColumns: ExcelColumn[] = [
  { header: "Device Name", key: "name" },
  { header: "IP Address", key: "ipAddress" },
  { header: "MAC Address", key: "macAddress" },
  { header: "Device Type", key: "deviceType" },
  { header: "Status", key: "status" },
  { header: "Location", key: "locationName" },
  { header: "Last Ping (ms)", key: "latencyMs" },
  { header: "Last Seen", key: "lastSeen" },
];

export function exportNetworkDevicesExcel(devices: NetworkDevice[], orgName?: string) {
  const rows = devices.map((d) => {
    const loc = d.location as { name?: string } | undefined;
    const lastSeenVal = d.lastSeen || d.last_seen;
    return {
      name: d.name || d.hostname || "-",
      ipAddress: d.ipAddress || d.ip_address || "-",
      macAddress: d.macAddress || d.mac_address || "-",
      deviceType: d.deviceType || d.device_type || "SWITCH",
      status: d.status || "ONLINE",
      locationName: loc?.name || d.locationId || "-",
      latencyMs: d.latencyMs != null ? `${d.latencyMs} ms` : d.latency_ms != null ? `${d.latency_ms} ms` : "-",
      lastSeen: lastSeenVal ? new Date(String(lastSeenVal)).toLocaleString() : "-",
    };
  });

  const online = devices.filter((d) => d.status === "ONLINE").length;
  const offline = devices.filter((d) => d.status === "OFFLINE").length;

  downloadExcelSpreadsheet(
    "Network Infrastructure & Device Roster",
    networkColumns,
    rows,
    { "Total Devices": devices.length, "Online": online, "Offline": offline },
    "network_devices_roster",
    orgName
  );
}

export function printNetworkDevicesSheet(devices: NetworkDevice[], orgName?: string) {
  const rows = devices.map((d) => {
    const loc = d.location as { name?: string } | undefined;
    const lastSeenVal = d.lastSeen || d.last_seen;
    return {
      name: d.name || d.hostname || "-",
      ipAddress: d.ipAddress || d.ip_address || "-",
      macAddress: d.macAddress || d.mac_address || "-",
      deviceType: d.deviceType || d.device_type || "SWITCH",
      status: d.status || "ONLINE",
      locationName: loc?.name || d.locationId || "-",
      latencyMs: d.latencyMs != null ? `${d.latencyMs} ms` : d.latency_ms != null ? `${d.latency_ms} ms` : "-",
      lastSeen: lastSeenVal ? new Date(String(lastSeenVal)).toLocaleString() : "-",
    };
  });

  const online = devices.filter((d) => d.status === "ONLINE").length;
  const offline = devices.filter((d) => d.status === "OFFLINE").length;

  printTableSheet(
    "Network Infrastructure & Device Roster",
    networkColumns,
    rows,
    { "Total Devices": devices.length, "Online": online, "Offline": offline },
    orgName
  );
}

// ─── Inventory Exporter ────────────────────────────────────────────────────────

const inventoryColumns: ExcelColumn[] = [
  { header: "Item Name", key: "name" },
  { header: "SKU", key: "sku" },
  { header: "Category", key: "category" },
  { header: "Quantity", key: "quantity" },
  { header: "Min Stock", key: "minStock" },
  { header: "Bin Location", key: "binLocation" },
  { header: "Status", key: "status" },
  { header: "Unit Cost", key: "unitCost" },
];

export function exportInventoryExcel(items: InventoryItem[], orgName?: string) {
  const rows = items.map((i) => ({
    name: i.name,
    sku: i.sku || "-",
    category: i.category || "General",
    quantity: i.quantity,
    minStock: i.minStock,
    binLocation: i.binLocation || "-",
    status: i.status || "IN_STOCK",
    unitCost: i.unitCost ? `$${Number(i.unitCost).toFixed(2)}` : "$0.00",
  }));

  const totalQty = items.reduce((acc, i) => acc + (i.quantity || 0), 0);
  const lowStock = items.filter((i) => i.quantity <= i.minStock).length;

  downloadExcelSpreadsheet(
    "Consumables & Inventory Stock Roster",
    inventoryColumns,
    rows,
    { "Total Item Types": items.length, "Total Units": totalQty, "Low Stock Alerts": lowStock },
    "inventory_stock_roster",
    orgName
  );
}

export function printInventorySheet(items: InventoryItem[], orgName?: string) {
  const rows = items.map((i) => ({
    name: i.name,
    sku: i.sku || "-",
    category: i.category || "General",
    quantity: i.quantity,
    minStock: i.minStock,
    binLocation: i.binLocation || "-",
    status: i.status || "IN_STOCK",
    unitCost: i.unitCost ? `$${Number(i.unitCost).toFixed(2)}` : "$0.00",
  }));

  const totalQty = items.reduce((acc, i) => acc + (i.quantity || 0), 0);
  const lowStock = items.filter((i) => i.quantity <= i.minStock).length;

  printTableSheet(
    "Consumables & Inventory Stock Roster",
    inventoryColumns,
    rows,
    { "Total Item Types": items.length, "Total Units": totalQty, "Low Stock Alerts": lowStock },
    orgName
  );
}

// ─── Tickets Exporter ──────────────────────────────────────────────────────────

const ticketColumns: ExcelColumn[] = [
  { header: "Tracking Code", key: "trackingCode" },
  { header: "Title", key: "title" },
  { header: "Category", key: "category" },
  { header: "Priority", key: "priority" },
  { header: "Status", key: "status" },
  { header: "Reporter", key: "reporter" },
  { header: "Assigned Tech", key: "assignedTo" },
  { header: "Location", key: "location" },
  { header: "Date Filed", key: "createdAt" },
];

export function exportTicketsExcel(tickets: Ticket[], orgName?: string) {
  const rows = tickets.map((t) => ({
    trackingCode: t.tracking_code || `TIK-${t.id}`,
    title: t.title,
    category: t.category || "General",
    priority: t.priority || "Medium",
    status: t.status || "OPEN",
    reporter: t.reporter_name || t.requesterName || "Anonymous",
    assignedTo: t.assigneeName || "Unassigned",
    location: t.location_details || t.location || "-",
    createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-",
  }));

  const openCount = tickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;

  downloadExcelSpreadsheet(
    "Helpdesk Incident & Service Tickets",
    ticketColumns,
    rows,
    { "Total Tickets": tickets.length, "Open / In Progress": openCount, "Resolved": resolvedCount },
    "helpdesk_tickets_roster",
    orgName
  );
}

export function printTicketsSheet(tickets: Ticket[], orgName?: string) {
  const rows = tickets.map((t) => ({
    trackingCode: t.tracking_code || `TIK-${t.id}`,
    title: t.title,
    category: t.category || "General",
    priority: t.priority || "Medium",
    status: t.status || "OPEN",
    reporter: t.reporter_name || t.requesterName || "Anonymous",
    assignedTo: t.assigneeName || "Unassigned",
    location: t.location_details || t.location || "-",
    createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-",
  }));

  const openCount = tickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;

  printTableSheet(
    "Helpdesk Incident & Service Tickets",
    ticketColumns,
    rows,
    { "Total Tickets": tickets.length, "Open / In Progress": openCount, "Resolved": resolvedCount },
    orgName
  );
}
