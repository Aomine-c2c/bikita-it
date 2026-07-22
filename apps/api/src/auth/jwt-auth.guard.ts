import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';
import { PrismaService } from '../prisma/prisma.service';

// Simple in-memory cache to avoid hitting DB on every request
interface AuthCache {
  value: boolean;
  expiresAt: number;
}

// Module-level singleton cache shared across guard instances
let authCache: AuthCache | null = null;
const CACHE_TTL_MS = 5000; // 5 seconds

export function invalidateAuthCache() {
  authCache = null;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Check if auth is disabled globally (with TTL cache)
    try {
      const now = Date.now();
      if (!authCache || authCache.expiresAt < now) {
        const authSetting = await this.prisma.systemSetting.findUnique({
          where: { key: 'AUTH_ENABLED' },
        });
        authCache = {
          value: authSetting?.value !== 'false',
          expiresAt: now + CACHE_TTL_MS,
        };
      }

      if (!authCache.value) {
        // Auth is disabled — inject a pseudo-admin user
        const req = context.switchToHttp().getRequest();
        req.user = {
          role: 'ADMIN',
          id: 'local-admin',
          email: 'admin@xiphos.local',
        };
        return true;
      }
    } catch (_e) {
      // Ignore DB errors during initialization
    }

    return (await super.canActivate(context)) as boolean;
  }

  handleRequest(err: any, user: any, _info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
