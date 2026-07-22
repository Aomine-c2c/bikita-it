import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SetupService {
  constructor(private prisma: PrismaService) {}

  async checkSetup() {
    try {
      const setupSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'setup_complete' },
      });
      const authSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'AUTH_ENABLED' },
      });
      return {
        isSetupComplete: setupSetting?.value === 'true',
        authEnabled: authSetting?.value !== 'false',
      };
    } catch (e) {
      console.error(e);
      // Database might not be initialized yet
      return { isSetupComplete: false, authEnabled: true };
    }
  }

  async initializeSetup(data: any) {
    try {
      // Create admin user
      const { name, email, password } = data as { name: string; email: string; password: string };
      const hashedPassword = await bcrypt.hash(password, 10);

      await this.prisma.employee.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          role: 'ADMIN',
          department: 'IT',
          position: 'System Administrator',
        },
      });

      // Mark setup as complete
      await this.prisma.systemSetting.upsert({
        where: { key: 'setup_complete' },
        update: { value: 'true' },
        create: { key: 'setup_complete', value: 'true' },
      });

      return { success: true };
    } catch (e) {
      console.error('Error during setup initialization:', e);
      throw new InternalServerErrorException('Failed to initialize setup');
    }
  }
}
