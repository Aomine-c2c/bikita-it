import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), '..', '..', 'backups');

  onApplicationBootstrap() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Run at 2:00 AM every day
  @Cron('0 2 * * *')
  async handleCron() {
    this.logger.log('Starting scheduled database backup...');
    await this.performBackup();
  }

  async performBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.sql`;
    const filePath = path.join(this.backupDir, fileName);

    // Default postgres user, or read from env
    const dbUrl =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/xiphos_db';

    try {
      // NOTE: pg_dump must be installed on the system (postgresql-client)
      await execAsync(`pg_dump "${dbUrl}" > "${filePath}"`);
      this.logger.log(`Backup successful: ${fileName}`);

      this.cleanOldBackups();
    } catch (error) {
      this.logger.error('Database backup failed', error);
    }
  }

  private cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const now = Date.now();
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtimeMs > SEVEN_DAYS) {
          fs.unlinkSync(filePath);
          this.logger.log(`Deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to clean old backups', error);
    }
  }
}
