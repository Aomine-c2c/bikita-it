# Bikita IT Operations Platform

A responsive IT operations platform for hardware assets, inventory, employees, locations, repairs, network discovery, reporting, and initial administrator setup. 

## Tech Stack
- **Frontend**: Next.js 16 / React 19, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend**: Django 5.2 / Python 3.11, Django Ninja (REST API), SQLite.
- **Desktop/Network Integration**: Tauri (Rust) for local system probes (Nmap, SADP).

## Setup

Requirements: Node.js 20+, npm 10+, Python 3.11+.

### 1. Backend (Django)
```bash
cd apps/api
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 3001
```

### 2. Frontend (Next.js & Tauri)
```bash
cd apps/web
npm install
# To run the web interface in the browser
npm run dev

# To run the desktop app (Tauri)
npm run tauri:dev
```

## Validation

Run `npm run lint` and `npm run typecheck` in the `apps/web` folder.
Note: We are actively migrating the frontend to strict TypeScript (removing `@ts-nocheck`), so you may see compiler warnings during the transition.

## Production

The backend uses SQLite by default but can be configured for PostgreSQL via `DATABASE_URL`. Ensure `DEBUG = False` and configure `ALLOWED_HOSTS` appropriately for production deployment.
