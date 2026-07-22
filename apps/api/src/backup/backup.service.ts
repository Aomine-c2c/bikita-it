import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups');

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
    const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';

    try {
      const rawPath = dbUrl.replace(/^file:/, '').split('?')[0];
      const sourcePath = path.isAbsolute(rawPath)
        ? rawPath
        : path.resolve(process.cwd(), rawPath);

      if (!fs.existsSync(sourcePath)) {
        this.logger.warn(
          `SQLite database file not found at ${sourcePath}`,
        );
        return;
      }

      const fileName = `backup-${timestamp}.db`;
      const filePath = path.join(this.backupDir, fileName);

      fs.copyFileSync(sourcePath, filePath);
      this.logger.log(`SQLite backup successful: ${fileName}`);

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
