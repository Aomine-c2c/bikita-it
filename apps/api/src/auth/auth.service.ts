import { Injectable, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Hash password using bcrypt with 12 rounds (industry standard)
   * @param password Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const rounds = 12; // Standard for production
    return bcrypt.hash(password, rounds);
  }

  /**
   * Validate password meets minimum requirements
   * @param password Plain text password
   * @returns True if password meets requirements
   */
  private validatePassword(password: string): boolean {
    return password.length >= 12;
  }

  /**
   * Verify password against hash
   * @param password Plain text password
   * @param hash Stored hash
   * @returns True if password matches
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
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
      throw new InternalServerErrorException('Missing required fields: email, password, name');
    }

    if (!this.validatePassword(data.password)) {
      throw new InternalServerErrorException('Password must be at least 12 characters long');
    }

    const passwordHash = await this.hashPassword(data.password);

    const newAdmin = await this.prisma.employee.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
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
