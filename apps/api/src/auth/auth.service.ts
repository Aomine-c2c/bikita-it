import { Injectable, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  async checkSetupStatus() {
    // Check if any admin exists
    const adminCount = await this.prisma.employee.count({
      where: { role: Role.ADMIN }
    });
    
    return {
      isSetupComplete: adminCount > 0
    };
  }

  async initializeAdmin(data: any) {
    const status = await this.checkSetupStatus();
    if (status.isSetupComplete) {
      throw new ConflictException('System is already initialized. Cannot create another master admin this way.');
    }

    if (!data.email || !data.password || !data.name) {
      throw new InternalServerErrorException('Missing required fields');
    }

    const newAdmin = await this.prisma.employee.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: this.hashPassword(data.password),
        role: Role.ADMIN,
        department: 'IT',
        position: 'System Administrator'
      }
    });

    return {
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    };
  }
}
