import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as ping from 'ping';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private isScanning = false;

  constructor(private readonly prisma: PrismaService) {}

  // Run every 15 minutes
  @Cron('0 */15 * * * *')
  async handleCron() {
    this.logger.log('Starting scheduled network discovery scan...');
    await this.scanNetwork();
  }

  async scanNetwork() {
    if (this.isScanning) {
      this.logger.warn('Scan already in progress. Skipping.');
      return;
    }

    this.isScanning = true;
    try {
      // 1. Determine local subnet (simplified to a standard /24 for demonstration)
      // In production, this would read from OS interfaces or config
      const baseIp = '192.168.1'; 
      
      // We will ping a small range to avoid taking too long in dev (e.g. 1-20)
      const promises = [];
      for (let i = 1; i <= 254; i++) {
        const ip = `${baseIp}.${i}`;
        promises.push(ping.promise.probe(ip, { timeout: 1 }));
      }
      
      this.logger.log(`Pinging subnet ${baseIp}.1-254...`);
      const results = await Promise.all(promises);
      const activeIps = results.filter(r => r.alive).map(r => r.host);
      
      this.logger.log(`Found ${activeIps.length} active devices. Retrieving ARP table...`);
      
      // 2. Read ARP table
      const arpTable = await this.getArpTable();
      
      // 3. Process devices
      let newCount = 0;
      let updatedCount = 0;

      for (const ip of activeIps) {
        const mac = arpTable.get(ip);
        if (!mac) continue;

        // Skip multicast/broadcast MACs
        if (mac.startsWith('ff:ff:ff') || mac.startsWith('01:00:5e')) continue;

        // Sync to database
        const existing = await this.prisma.connectedDevice.findFirst({
          where: { macAddress: mac }
        });

        if (existing) {
          await this.prisma.connectedDevice.update({
            where: { id: existing.id },
            data: { 
              ipAddress: ip,
              lastSeen: new Date()
            }
          });
          updatedCount++;
        } else {
          await this.prisma.connectedDevice.create({
            data: {
              ipAddress: ip,
              macAddress: mac,
              hostname: `Unknown-${mac.substring(12)}`,
              connectionStatus: 'STAGED',
              deviceType: 'UNKNOWN',
              lastSeen: new Date()
            }
          });
          newCount++;
        }
      }

      this.logger.log(`Network scan complete. Staged ${newCount} new devices. Updated ${updatedCount} existing.`);
      
    } catch (error) {
      this.logger.error('Error during network scan:', error);
    } finally {
      this.isScanning = false;
    }
  }

  private async getArpTable(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    try {
      const { stdout } = await execAsync('arp -a');
      const lines = stdout.split('\n');
      
      // Parse Windows or Linux arp output
      for (const line of lines) {
        // Simple regex to extract IP and MAC
        const ipMatch = line.match(/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/);
        const macMatch = line.match(/(?:[0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}/);
        
        if (ipMatch && macMatch) {
          const ip = ipMatch[0];
          // Standardize MAC format to lowercase, colon-separated
          const mac = macMatch[0].toLowerCase().replace(/-/g, ':');
          map.set(ip, mac);
        }
      }
    } catch (e) {
      this.logger.error('Failed to read ARP table', e);
    }
    return map;
  }
}
