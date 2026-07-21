import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../enums';
import * as bcrypt from 'bcryptjs';
import { InitializeAdminDto } from './initialize-admin.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.employee.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.verifyPassword(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    };
  }

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
      where: { role: Role.ADMIN },
    });

    return {
      isSetupComplete: adminCount > 0,
    };
  }

  async initializeAdmin(data: InitializeAdminDto) {
    const status = await this.checkSetupStatus();
    if (status.isSetupComplete) {
      throw new ConflictException(
        'System is already initialized. Cannot create another master admin this way.',
      );
    }

    if (!data.email || !data.password || !data.name) {
      throw new BadRequestException(
        'Missing required fields: email, password, name',
      );
    }

    if (!this.validatePassword(data.password)) {
      throw new BadRequestException(
        'Password must be at least 12 characters long',
      );
    }

    const passwordHash = await this.hashPassword(data.password);

    const newAdmin = await this.prisma.employee.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: Role.ADMIN,
        department: 'IT',
        position: 'System Administrator',
      },
    });

    return {
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    };
  }
}
