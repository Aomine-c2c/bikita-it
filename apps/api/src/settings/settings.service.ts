import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    const settingsRows = await this.prisma.systemSetting.findMany();
    const settings: any = {};
    for (const row of settingsRows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch (error) {
        console.warn(`Failed to parse setting ${row.key} as JSON, using raw value`, error);
        settings[row.key] = row.value;
      }
    }

    // Get live database stats
    let dbStatus = {
      version: 'Unknown',
      size: 'Unknown',
      connections: 'Unknown'
    };

    try {
      const versionResult: any[] = await this.prisma.$queryRaw`SELECT version();`;
      if (versionResult && versionResult.length > 0 && versionResult[0].version) {
        const versionParts = versionResult[0].version.split(' ');
        dbStatus.version = versionParts.length > 1 ? versionParts[1] : versionResult[0].version;
      }
      
      const sizeResult: any[] = await this.prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as size;`;
      if (sizeResult && sizeResult.length > 0 && sizeResult[0].size) {
        dbStatus.size = sizeResult[0].size;
      }

      const connResult: any[] = await this.prisma.$queryRaw`SELECT count(*) as count FROM pg_stat_activity;`;
      if (connResult && connResult.length > 0 && connResult[0].count !== undefined) {
        const currentConnections = Number(connResult[0].count);
        dbStatus.connections = `${currentConnections} / 100`; // Assuming 100 max connections
      }
    } catch (err) {
      console.error("Failed to query database stats", err);
    }

    return {
      settings,
      dbStatus
    };
  }

  async updateSettings(data: any) {
    const promises = [];
    for (const key of Object.keys(data)) {
      const value = typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key]);
      promises.push(
        this.prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      );
    }
    await Promise.all(promises);
    return { success: true };
  }
}
