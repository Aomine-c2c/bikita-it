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
        console.warn(
          `Failed to parse setting ${row.key} as JSON, using raw value`,
          error,
        );
        settings[row.key] = row.value;
      }
    }

    // Get live database stats
    const dbStatus = {
      version: 'Unknown',
      size: 'Unknown',
      connections: 'Unknown',
    };

    try {
      const versionResult: any[] = await this.prisma
        .$queryRaw`SELECT sqlite_version() as version;`;
      if (
        versionResult &&
        versionResult.length > 0 &&
        versionResult[0].version
      ) {
        dbStatus.version = String(versionResult[0].version);
      }

      dbStatus.size = 'Local SQLite DB';
      dbStatus.connections = 'N/A';
    } catch (err) {
      console.error('Failed to query database stats', err);
    }

    return {
      settings,
      dbStatus,
    };
  }

  async updateSettings(data: Record<string, unknown>) {
    const promises = [];
    for (const key of Object.keys(data)) {
      const value =
        typeof data[key] === 'object'
          ? JSON.stringify(data[key])
          : String(data[key]);
      promises.push(
        this.prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      );
    }
    await Promise.all(promises);
    return { success: true };
  }
}
