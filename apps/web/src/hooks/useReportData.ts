/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  assetApi,
  inventoryApi,
  repairsApi,
  networkApi,
  employeesApi,
  locationsApi,
  operationsApi,
  type Asset,
  type InventoryItem,
  type Repair,
  type NetworkDevice,
  type Employee,
  type Location,
  type OperationHistoryRecord,
} from "@/lib/api";

export interface ReportFilters {
  department: string;
  locationId: string;
  dateFrom: string;
  dateTo: string;
  assetType: string;
  employeeId: string;
  status: string;
}

export const DEFAULT_FILTERS: ReportFilters = {
  department: "",
  locationId: "",
  dateFrom: "",
  dateTo: "",
  assetType: "",
  employeeId: "",
  status: "",
};

export interface ReportData {
  assets: Asset[];
  inventory: InventoryItem[];
  repairs: Repair[];
  network: NetworkDevice[];
  employees: Employee[];
  locations: Location[];
  operations: OperationHistoryRecord[];
  loading: boolean;
  error: string | null;
}

function inDateRange(dateStr: string | null | undefined, from: string, to: string): boolean {
  if (!dateStr) return true;
  const d = new Date(dateStr).getTime();
  if (from && d < new Date(from).getTime()) return false;
  if (to && d > new Date(to + "T23:59:59").getTime()) return false;
  return true;
}

export function useReportData(filters: ReportFilters): ReportData {
  const [raw, setRaw] = useState<Omit<ReportData, "loading" | "error">>({
    assets: [],
    inventory: [],
    repairs: [],
    network: [],
    employees: [],
    locations: [],
    operations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      assetApi.getAll().catch(() => [] as Asset[]),
      inventoryApi.getAll().catch(() => [] as InventoryItem[]),
      repairsApi.getAll().catch(() => [] as Repair[]),
      networkApi.getAll().catch(() => [] as NetworkDevice[]),
      employeesApi.getAll().catch(() => [] as Employee[]),
      locationsApi.getAll().catch(() => [] as Location[]),
      operationsApi.getHistory().catch(() => [] as OperationHistoryRecord[]),
    ])
      .then(([assets, inventory, repairs, network, employees, locations, operations]) => {
        setRaw({ assets, inventory, repairs, network, employees, locations, operations });
        setError(null);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const { department, locationId, dateFrom, dateTo, assetType, employeeId, status } = filters;

    const assets = raw.assets.filter((a) => {
      if (assetType && a.category !== assetType) return false;
      if (locationId && a.location?.id !== locationId) return false;
      if (status && a.status !== status) return false;
      if (!inDateRange(a.createdAt, dateFrom, dateTo)) return false;
      return true;
    });

    const inventory = raw.inventory.filter((i) => {
      if (status && i.status !== status) return false;
      return true;
    });

    const repairs = raw.repairs.filter((r) => {
      if (status && r.status !== status) return false;
      if (!inDateRange(r.createdAt, dateFrom, dateTo)) return false;
      return true;
    });

    const network = raw.network.filter((n) => {
      if (locationId && n.locationId !== locationId) return false;
      if (status && n.connectionStatus !== status) return false;
      return true;
    });

    const employees = raw.employees.filter((e) => {
      if (department && e.department !== department) return false;
      if (employeeId && e.id !== employeeId) return false;
      return true;
    });

    const operations = raw.operations.filter((o) => {
      if (!inDateRange(o.date, dateFrom, dateTo)) return false;
      return true;
    });

    return {
      assets,
      inventory,
      repairs,
      network,
      employees,
      locations: raw.locations,
      operations,
    };
  }, [raw, filters]);

  return { ...filtered, loading, error };
}

/** Derive unique filter option lists from raw data */
export function useFilterOptions(data: ReportData) {
  return useMemo(() => {
    const departments = [...new Set(data.employees.map((e) => e.department).filter(Boolean))] as string[];
    const assetTypes = [...new Set(data.assets.map((a) => a.category).filter(Boolean))] as string[];
    const statuses = [...new Set(data.assets.map((a) => a.status).filter(Boolean))] as string[];

    return { departments, assetTypes, statuses };
  }, [data.employees, data.assets]);
}
