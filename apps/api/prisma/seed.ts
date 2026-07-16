import { PrismaClient, HardwareCategory, HardwareStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');

  // Clean existing data in a specific order to avoid foreign key constraints
  console.log('Cleaning existing data...');
  await prisma.systemSetting.deleteMany();
  await prisma.systemService.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.repair.deleteMany();
  await prisma.connectedDevice.deleteMany();
  await prisma.hardwareAsset.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.location.deleteMany();
  await prisma.employee.deleteMany();

  // 1. Create Base Locations
  console.log('Creating base locations...');
  const hq = await prisma.location.create({
    data: {
      name: 'HQ Building',
      type: 'BUILDING',
    }
  });

  const serverRoom = await prisma.location.create({
    data: {
      name: 'Main Server Room',
      type: 'ROOM',
      parentId: hq.id
    }
  });

  const warehouse = await prisma.location.create({
    data: {
      name: 'IT Warehouse',
      type: 'ROOM',
      parentId: hq.id
    }
  });

  // 2. Create basic inventory categories (we won't create employees yet - admin setup handles that)
  console.log('Creating base inventory...');
  await prisma.inventoryItem.createMany({
    data: [
      {
        sku: 'CBL-CAT6-10M',
        name: 'Cat6 Ethernet Cable (10m)',
        category: 'Networking',
        type: 'Consumable',
        quantity: 50,
        minStock: 20,
        maxStock: 100,
        binLocation: 'A1-01'
      },
      {
        sku: 'ACC-MSE-WLESS',
        name: 'Wireless Mouse',
        category: 'Peripheral',
        type: 'Consumable',
        quantity: 15,
        minStock: 5,
        maxStock: 30,
        binLocation: 'A2-05'
      }
    ]
  });

  console.log('Creating system services...');
  await prisma.systemService.createMany({
    data: [
      { name: "Core Network", status: "online", uptime: "99.98%", latency: "2ms" },
      { name: "ERP Integration", status: "online", uptime: "99.5%", latency: "45ms" },
      { name: "Backup Service", status: "online", uptime: "100%", latency: "—" },
      { name: "VPN Gateway", status: "online", uptime: "100%", latency: "8ms" },
      { name: "Email Server", status: "online", uptime: "99.9%", latency: "12ms" },
    ],
    skipDuplicates: true
  });

  console.log('Creating system settings...');
  await prisma.systemSetting.createMany({
    data: [
      { key: "general", value: JSON.stringify({ orgName: "Bikita Minerals (Pvt) Ltd", platformName: "Xiphos IT Platform", defaultCurrency: "USD ($)", dateFormat: "DD/MM/YYYY", maintenanceMode: false }) },
      { key: "security", value: JSON.stringify({ mfa: true, auditLog: true, sessionTimeout: true, passwordMinLength: 12, allowedIpRanges: "10.0.0.0/8, 192.168.1.0/24" }) },
      { key: "notifications", value: JSON.stringify({ emailAlerts: true, smsAlerts: false, smtpServer: "smtp.sendgrid.net:587", alertEmailSender: "noreply@xiphos.bikita.co.zw" }) },
      { key: "database", value: JSON.stringify({ autoBackup: true, backupRetention: "30 days" }) }
    ],
    skipDuplicates: true
  });

  console.log('Seed process completed successfully. Database is clean and ready.');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
