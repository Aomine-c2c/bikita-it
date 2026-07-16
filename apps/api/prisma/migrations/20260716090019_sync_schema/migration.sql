-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'IT_SUPPORT', 'STOREKEEPER', 'MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "HardwareCategory" AS ENUM ('LAPTOP', 'DESKTOP', 'MONITOR', 'PERIPHERAL', 'NETWORKING', 'SERVER', 'MOBILE', 'PRINTING', 'POWER', 'CCTV', 'COMMUNICATION', 'TOOL', 'CAMERA', 'CONSUMABLE');

-- CreateEnum
CREATE TYPE "HardwareStatus" AS ENUM ('IN_STOCK', 'INSTALLED', 'ASSIGNED', 'BORROWED', 'UNDER_REPAIR', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('QUEUED', 'WAITING_PARTS', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INTAKE', 'INSTALL', 'ISSUE', 'RETURN', 'CONSUME', 'TRANSFER');

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT,
    "position" TEXT,
    "office" TEXT,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareAsset" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "name" TEXT,
    "category" "HardwareCategory" NOT NULL,
    "status" "HardwareStatus" NOT NULL DEFAULT 'IN_STOCK',
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT,
    "macAddress" TEXT,
    "ipAddress" TEXT,
    "network" TEXT,
    "computerName" TEXT,
    "operatingSystem" TEXT,
    "specs" JSONB,
    "installationDate" TIMESTAMP(3),
    "locationId" TEXT,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HardwareAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL,
    "maxStock" INTEGER NOT NULL,
    "binLocation" TEXT,
    "remarks" TEXT,
    "dateReceived" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repair" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "RepairStatus" NOT NULL DEFAULT 'QUEUED',
    "condition" TEXT,
    "remarks" TEXT,
    "estimatedCompletion" TIMESTAMP(3),
    "hardwareId" TEXT NOT NULL,
    "technicianId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "remarks" TEXT,
    "hardwareAssetId" TEXT,
    "inventoryItemId" TEXT,
    "locationId" TEXT,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectedDevice" (
    "id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "os" TEXT,
    "deviceType" TEXT,
    "connectionStatus" TEXT DEFAULT 'CONNECTED',
    "accessPoint" TEXT,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareAsset_tag_key" ON "HardwareAsset"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareAsset_serialNumber_key" ON "HardwareAsset"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedDevice_macAddress_key" ON "ConnectedDevice"("macAddress");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareAsset" ADD CONSTRAINT "HardwareAsset_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareAsset" ADD CONSTRAINT "HardwareAsset_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repair" ADD CONSTRAINT "Repair_hardwareId_fkey" FOREIGN KEY ("hardwareId") REFERENCES "HardwareAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repair" ADD CONSTRAINT "Repair_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_hardwareAssetId_fkey" FOREIGN KEY ("hardwareAssetId") REFERENCES "HardwareAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedDevice" ADD CONSTRAINT "ConnectedDevice_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
