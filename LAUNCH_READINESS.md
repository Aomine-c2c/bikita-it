# Launch Readiness Summary

## Stack and intended behavior

Xiphos is an IT operations monorepo: Next.js 16 and React 19 provide the responsive web dashboard; NestJS 11 exposes REST endpoints; Prisma 6 persists assets, inventory, employees, locations, repairs, discovered devices, settings, and audit data in PostgreSQL. Redis is available as supporting infrastructure. The first-run flow creates the initial administrator.

## Changes made

- Added startup validation for `DATABASE_URL`, `PORT`, and the production CORS allowlist.
- Added Helmet security headers, a strict global validation pipe, shutdown hooks, safer structured Nest logging, and exact-origin CORS behavior.
- Added a validated initial-admin DTO and retained bcrypt hashing at 12 rounds.
- Removed a duplicate setup module/controller route and removed the unused, vulnerable Apollo/GraphQL dependency tree.
- Changed frontend API calls to same-origin `/api`; made the internal proxy destination configurable with `API_INTERNAL_URL`.
- Added web security headers and removed the framework disclosure header.
- Replaced hard-coded Compose credentials and public database/cache ports with required environment substitution, private service networking, health checks, persistent Redis data, and safer restart policies.
- Added workspace lint/typecheck/test/smoke commands, repaired isolated Auth tests, added setup-status coverage, and added a frontend API-configuration test.
- Added `.env.example`, migration deployment command, and full setup/production documentation.
- Preserved pre-existing edits in `setup.service.ts` and `SwitchDetails.tsx`.

## Validation results

- `npm install --ignore-scripts`: passed; lockfile updated.
- `npm run lint`: passed with no errors (legacy unused-import and hook-dependency warnings remain non-blocking).
- `npm run typecheck`: passed for API and web.
- `npm test`: passed; API 3 suites/4 tests, web 1 test.
- `npm run build`: passed for NestJS and all 13 Next.js routes.
- `npm run smoke`: passed; HTTP 200 and product marker verified.
- `npm audit --omit=dev`: 2 moderate findings in Next.js' transitive PostCSS; no non-breaking patched Next.js release is available to the current dependency range.
- Prisma client generation: passed.
- Prisma schema validation requires a configured `DATABASE_URL`; migration application/status was not run because no launch database was supplied.

## Unresolved blockers

- A real PostgreSQL connection is required to run `prisma migrate deploy`, verify migration status, start the API, and exercise database-backed end-to-end tests.
- Production authentication/session enforcement is not implemented for the operational CRUD routes; launching on the public internet should be blocked until an authentication design is confirmed and implemented. Adding it without product requirements would change intended behavior.
- The two moderate PostCSS advisories are upstream in the installed stable Next.js line; forcing npm's suggested downgrade to Next 9 would be breaking and unsafe.
- Existing lint warnings represent cleanup debt but do not block compilation, type checking, tests, or builds.

## Required environment variables (placeholders only)

```dotenv
POSTGRES_USER=<database-user>
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=<database-name>
DATABASE_URL=postgresql://<database-user>:<strong-random-password>@localhost:5432/<database-name>
ALLOWED_ORIGINS=https://<web-host>
PORT=3001
API_INTERNAL_URL=http://<api-host>:3001
NEXT_PUBLIC_API_URL=/api
NODE_ENV=production
```

## Preview

- Worker-accessible URL: http://192.168.1.145:3000
- Local URL: http://127.0.0.1:3000
- Scope: production-built web preview; database-backed API features require the environment and database described above.
