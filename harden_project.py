from pathlib import Path
import json
root=Path(r'C:\Users\armut\404\BikitaIT')
# root scripts and safer workspace orchestration
p=root/'package.json'; d=json.loads(p.read_text())
d['scripts'].update({'lint':'npm run lint --workspaces --if-present','typecheck':'npm run typecheck --workspaces --if-present','test':'npm run test --workspaces --if-present','smoke':'node scripts/smoke-test.mjs'})
p.write_text(json.dumps(d,indent=2)+'\n')
# remove unused, vulnerable GraphQL stack; add runtime hardening and scripts
p=root/'apps/api/package.json'; d=json.loads(p.read_text())
for k in ['@nestjs/apollo','@nestjs/graphql','apollo-server-express','graphql']:
 d['dependencies'].pop(k,None)
d['dependencies']['helmet']='^8.1.0'
d['scripts']['typecheck']='tsc --noEmit'
d['scripts']['lint']='eslint "{src,apps,libs,test}/**/*.ts"'
d['scripts']['db:deploy']='prisma migrate deploy'
p.write_text(json.dumps(d,indent=2)+'\n')
p=root/'apps/web/package.json'; d=json.loads(p.read_text()); d['scripts'].update({'typecheck':'tsc --noEmit','test':'node --test test/*.test.mjs'}); p.write_text(json.dumps(d,indent=2)+'\n')
# bootstrap hardening
(root/'apps/api/src/main.ts').write_text("""import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL environment variable is not set');
  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port');
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) throw new Error('ALLOWED_ORIGINS is required in production');

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.setGlobalPrefix('api');
  app.enableCors({ origin: allowedOrigins.length ? allowedOrigins : false, methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', credentials: true });
  app.enableShutdownHooks();
  await app.listen(port, '0.0.0.0');
  logger.log(`API listening on port ${port}`);
}
bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('Application startup failed', error instanceof Error ? error.stack : undefined);
  process.exit(1);
});
""")
# eliminate duplicate /setup controller; retain stronger AuthService implementation
p=root/'apps/api/src/app.module.ts'; s=p.read_text(); s=s.replace("import { SetupModule } from './setup/setup.module';\n",'').replace(',\n    SetupModule\n','\n'); p.write_text(s)
# typed validated setup DTO
(root/'apps/api/src/auth/initialize-admin.dto.ts').write_text("""import { IsEmail, IsString, Length, Matches } from 'class-validator';
export class InitializeAdminDto {
  @IsString() @Length(2, 100) name!: string;
  @IsEmail() @Length(3, 254) email!: string;
  @IsString() @Length(12, 128) @Matches(/[a-z]/, { message: 'password must contain a lowercase letter' })
  @Matches(/[A-Z]/, { message: 'password must contain an uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain a number' }) password!: string;
}
""")
p=root/'apps/api/src/auth/auth.controller.ts'; s=p.read_text().replace("import { AuthService } from './auth.service';", "import { AuthService } from './auth.service';\nimport { InitializeAdminDto } from './initialize-admin.dto';").replace('body: any','body: InitializeAdminDto'); p.write_text(s)
p=root/'apps/api/src/auth/auth.service.ts'; s=p.read_text().replace("import { Injectable, InternalServerErrorException, ConflictException } from '@nestjs/common';","import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';").replace("import * as bcrypt from 'bcrypt';","import * as bcrypt from 'bcrypt';\nimport { InitializeAdminDto } from './initialize-admin.dto';").replace('async initializeAdmin(data: any)','async initializeAdmin(data: InitializeAdminDto)').replace("throw new InternalServerErrorException('Missing required fields: email, password, name');","throw new BadRequestException('Missing required fields: email, password, name');").replace("throw new InternalServerErrorException('Password must be at least 12 characters long');","throw new BadRequestException('Password must be at least 12 characters long');"); p.write_text(s)
# proxy configurable server-side while client defaults same-origin
p=root/'apps/web/next.config.ts'; p.write_text("""import type { NextConfig } from 'next';
const apiOrigin = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() { return [{ source: '/:path*', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ] }]; },
  rewrites: async () => [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }],
};
export default nextConfig;
""")
p=root/'apps/web/src/lib/api.ts'; s=p.read_text().replace("const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';","const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';"); p.write_text(s)
# env template, compose safety, docs and smoke tests
(root/'.env.example').write_text('POSTGRES_USER=<database-user>\nPOSTGRES_PASSWORD=<strong-random-password>\nPOSTGRES_DB=<database-name>\nDATABASE_URL=postgresql://<database-user>:<strong-random-password>@localhost:5432/<database-name>\nALLOWED_ORIGINS=http://localhost:3000\nPORT=3001\nAPI_INTERNAL_URL=http://127.0.0.1:3001\nNEXT_PUBLIC_API_URL=/api\n')
(root/'docker-compose.yml').write_text("""services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:?set POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:?set POSTGRES_DB}
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck: { test: [CMD-SHELL, 'pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB'], interval: 10s, timeout: 5s, retries: 5 }
    restart: unless-stopped
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes: [redis_data:/data]
    healthcheck: { test: [CMD, redis-cli, ping], interval: 10s, timeout: 5s, retries: 5 }
    restart: unless-stopped
volumes:
  postgres_data:
  redis_data:
""")
(root/'scripts').mkdir(exist_ok=True)
(root/'scripts/smoke-test.mjs').write_text("""const base = process.env.PREVIEW_URL ?? 'http://127.0.0.1:3000';
const response = await fetch(base, { signal: AbortSignal.timeout(10000) });
if (!response.ok) throw new Error(`Preview returned ${response.status}`);
const html = await response.text();
if (!html.includes('Xiphos')) throw new Error('Expected product name was not rendered');
console.log(`Smoke test passed: ${base} (${response.status})`);
""")
(root/'apps/web/test').mkdir(exist_ok=True)
(root/'apps/web/test/config.test.mjs').write_text("""import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
test('frontend uses same-origin API by default', () => { const source=fs.readFileSync(new URL('../src/lib/api.ts', import.meta.url),'utf8'); assert.match(source, /NEXT_PUBLIC_API_URL \\|\\| '\\/api'/); assert.doesNotMatch(source, /localhost:3001/); });
""")
(root/'README.md').write_text("""# Xiphos IT Operations Platform

A responsive IT operations platform for hardware assets, inventory, employees, locations, repairs, network discovery, reporting, and initial administrator setup. The monorepo uses Next.js 16/React 19 for the web UI, NestJS 11 for the REST API, Prisma 6 with PostgreSQL, and optional Redis infrastructure.

## Setup

Requirements: Node.js 20+, npm 10+, Docker Compose, and PostgreSQL client tools (`pg_dump`) when scheduled backups are enabled.

1. Copy `.env.example` to `.env` and replace every placeholder. Never commit `.env`.
2. Copy the database values needed by the API into `apps/api/.env`, including `DATABASE_URL` and `ALLOWED_ORIGINS`.
3. Run `npm ci`.
4. Run `docker compose up -d`, then `npm --workspace api run db:deploy`.
5. Optionally run `npm --workspace api run seed` only on disposable data; the seed intentionally clears tables.
6. Start API and web in separate terminals with `npm --workspace api run dev` and `npm --workspace web run dev`.

## Validation

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit --omit=dev`, and (with preview running) `npm run smoke`.

## Production

Set `NODE_ENV=production`, use unique managed database credentials, set the exact HTTPS origins in `ALLOWED_ORIGINS`, run `npm --workspace api run db:deploy` before API rollout, terminate TLS at a trusted reverse proxy, and persist/monitor backups. The API refuses production startup without an origin allowlist.
""")
print('Launch hardening files written')
