// Common entities shared across all modules

export interface Asset {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  id: string | number;
  name: string;
  type: string;
  status: string;
  locationId?: string | number;
  location?: Location;
  employeeId?: string | number;
  assigneeId?: string | number;
  tag?: string;
  category?: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  condition?: string;
}

export interface Employee {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  id: string | number;
  name: string;
  department: string;
  email: string;
  title?: string;
  role?: string;
  isActive?: boolean;
}

export interface Location {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  id: string | number;
  name: string;
  type?: string;
  parentId?: string | number | null;
  address?: string;
  capacity?: number;
  description?: string;
}

export interface NetworkDevice {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  id: string | number;
  ip: string;
  mac: string;
  status: string;
  type: string;
  locationId?: string | number;
  location?: Location;
  networkName?: string;
  assetId?: string | number;
  asset?: Asset;
  employeeId?: string | number;
  employee?: Employee;
  firmwareVersion?: string;
  lastSeen?: string;
}

export interface InventoryItem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  id: string | number;
  name: string;
  status?: string;
  quantity?: number;
  sku?: string;
  category?: string;
  supplier?: string;
  unitPrice?: number;
}

export interface Repair {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  id: string | number;
  type?: string;
  scheduledDate?: string;
  completedDate?: string;
  assetId?: string | number;
  technicianId?: string | number;
  description?: string;
  cost?: number;
  status?: string;
}

export interface LocationDetails {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  id: string | number;
  name?: string;
  type?: string;
  children?: Location[];
}

export interface LocationRow {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  id: string | number;
  name?: string;
  type?: string;
}

export interface InstalledRow {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  id: string | number;
  assetName?: string;
  installDate?: string;
  status?: string;
}

export interface OperationHistoryRecord {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  id: string | number;
  date?: string;
  action?: string;
  operatorId?: string | number;
  assetId?: string | number;
  details?: string;
  type?: string;
  time?: string;
  meta?: string;
}

export interface OperationPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  assetId?: string | number;
  targetLocationId?: string | number;
  assigneeId?: string | number;
  reason?: string;
  notes?: string;
  actionType?: string;
}
