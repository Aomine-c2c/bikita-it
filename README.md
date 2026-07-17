# Xiphos IT Operations Platform

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
