import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      // Use parallel queries for independent operations
      const [
        totalHardware,
        atRiskHardware,
        lowStockItemsCount,
        activeNetworkDevices,
        activeRepairs,
        recentActivity,
        rawTrend,
      ] = await Promise.all([
        this.prisma.hardwareAsset.count(),
        this.prisma.hardwareAsset.count({
          where: {
            status: {
              in: ['UNDER_REPAIR', 'MAINTENANCE'],
            },
          },
        }),
        this.prisma
          .$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*)::int as count FROM "InventoryItem" WHERE quantity <= "minStock"
          `
          .then((rows) => Number(rows[0].count))
          .catch(() => 0),
        this.prisma.connectedDevice.count({
          where: {
            connectionStatus: 'CONNECTED',
          },
        }),
        this.prisma.repair.findMany({
          where: { status: { not: 'COMPLETED' } },
          include: { hardware: true, technician: true },
          take: 3,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.stockTransaction.findMany({
          include: { hardwareAsset: true, inventoryItem: true, assignee: true },
          take: 7,
          orderBy: { createdAt: 'desc' },
        }),
        // Single query fetching all transactions in date range (fixes 14-query N+1)
        this.prisma.stockTransaction.findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { type: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      // Build 7-day trend by grouping in memory (O(n) instead of 14 DB roundtrips)
      const transactionTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        const intakeCount = rawTrend.filter(
          (e) => e.type === 'INTAKE' && e.createdAt >= dayStart && e.createdAt <= dayEnd,
        ).length;
        const issueCount = rawTrend.filter(
          (e) => e.type === 'ISSUE' && e.createdAt >= dayStart && e.createdAt <= dayEnd,
        ).length;

        transactionTrend.push({
          day: dayName,
          received: intakeCount,
          issued: issueCount,
        });
      }

      // Fetch system services with safe null handling
      const systemServices = await this.prisma.systemService
        .findMany({
          select: {
            name: true,
            status: true,
            uptime: true,
            latency: true,
          },
        })
        .catch(() => []);

      return {
        kpis: {
          totalHardware,
          atRiskHardware,
          lowStockItems: lowStockItemsCount,
          activeNetworkDevices,
        },
        // Safe null reference handling with optional chaining and fallbacks
        activeRepairs: activeRepairs.map((r) => ({
          id: r.id.substring(0, 8),
          asset: `${r.hardware?.make ?? 'Unknown'} ${r.hardware?.model ?? 'Model'}`,
          issue: r.description,
          tech: r.technician?.name ?? 'Unassigned',
          eta: r.estimatedCompletion
            ? r.estimatedCompletion.toLocaleDateString()
            : 'TBD',
        })),
        recentActivity: recentActivity.map((a) => ({
          action: `${a.type ?? 'Unknown'} Transaction`,
          meta: a.hardwareAsset?.tag ?? a.inventoryItem?.name ?? '',
          type: a.hardwareAsset ? 'asset' : 'inventory',
          time: `${a.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${a.createdAt.toLocaleDateString()}`,
        })),
        transactionTrend,
        systemStatus: systemServices,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }
}
