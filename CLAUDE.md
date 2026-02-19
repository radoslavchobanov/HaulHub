# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HaulHub is a two-sided marketplace connecting clients with professional haulers. It is a full-stack application with a Django REST API backend and a React SPA frontend, deployed via Docker Compose.

## Commands

### Frontend (run from `frontend/`)
```bash
npm run dev       # Start Vite dev server on port 5173
npm run build     # Type-check + build production bundle (tsc && vite build)
npm run preview   # Preview production build
```

### Backend (Docker-based)
```bash
docker compose up --build                                        # Start all services
docker compose up --build backend celery celery-beat            # Start only backend services
docker compose logs -f backend                                   # Tail backend logs
docker compose exec backend python manage.py migrate             # Run DB migrations
docker compose exec backend python manage.py makemigrations      # Create new migrations
docker compose exec backend python manage.py createsuperuser     # Create Django admin user
docker compose exec backend python manage.py shell               # Open Django shell
docker compose exec backend pytest                               # Run backend tests (if configured)
```

### Access Points
- App: `http://localhost:8080` (via Nginx)
- Django admin: `http://localhost:8080/admin/`
- Frontend dev server directly: `http://localhost:5173`
- Backend API directly: `http://localhost:8000`

## Architecture

### Infrastructure
All services are orchestrated via Docker Compose:
- **Nginx** (port 8080) — reverse proxy; routes `/api/*` and `/ws/*` to Django, `/` to React
- **Backend** — Django (Gunicorn for HTTP) + Daphne (ASGI/WebSocket on port 8000)
- **Frontend** — Vite dev server (port 5173), with HMR proxied through Nginx
- **PostgreSQL** — primary database
- **Redis** — cache, Celery broker, and Django Channels layer
- **Celery** / **Celery Beat** — async task workers; Beat runs `auto_release_escrow` every 30 minutes

### Backend (`backend/`)

Django settings are split: `config/settings/base.py`, `dev.py`, `prod.py`. The `DJANGO_SETTINGS_MODULE` env var controls which is loaded.

Apps live in `backend/apps/`:

| App | Responsibility |
|---|---|
| `users` | Custom User model (UUID PK, `user_type`: client/hauler), HaulerProfile, auth endpoints, Google OAuth |
| `jobs` | Job postings and JobApplication CRUD |
| `bookings` | Confirmed bookings, escrow lifecycle |
| `payments` | Wallet, Stripe deposits, withdrawals, Transaction records |
| `chat` | ChatRoom and Message models, WebSocket consumer |
| `reviews` | Review submission and retrieval |

URL routing in `config/urls.py`:
- `/api/auth/` → users app
- `/api/jobs/` → jobs app
- `/api/bookings/` → bookings app
- `/api/wallet/` → payments app
- `/api/chat/` → chat app
- `/api/reviews/` → reviews app
- `/api/haulers/` → hauler public profiles

**WebSocket auth**: Custom `JWTAuthMiddleware` in `config/middleware.py` reads the JWT from the WebSocket query string (`?token=<JWT>`). Closes with code 4001 if unauthenticated, 4003 if unauthorized for the room.

**Escrow flow**: On job acceptance, a Booking is created and escrow is locked. The Celery Beat task in `apps/bookings/tasks.py` auto-releases escrow every 30 minutes for eligible completed bookings.

### Frontend (`frontend/src/`)

| Directory | Responsibility |
|---|---|
| `api/` | Axios API modules per domain (auth, jobs, bookings, payments, chat, reviews) |
| `api/client.ts` | Axios instance with JWT Bearer interceptor and auto-refresh on 401 |
| `stores/authStore.ts` | Zustand store with localStorage persistence for auth tokens and user data |
| `pages/client/` | Client-only pages (Dashboard, NewJob, JobDetail, BookingDetail) |
| `pages/hauler/` | Hauler-only pages (Board, JobDetail, Applications, BookingDetail) |
| `pages/shared/` | Pages for both roles (Wallet, EditProfile, HaulerProfile) |
| `components/` | Reusable components (layout, jobs, chat, reviews, ui primitives) |
| `hooks/useWebSocket.ts` | WebSocket hook for real-time chat |
| `types/index.ts` | All TypeScript interface definitions |
| `App.tsx` | React Router setup and route guards |

**Route guards** in `App.tsx`:
- `RequireAuth` — blocks unauthenticated users
- `RequireClient` / `RequireHauler` — role-based redirects
- `RedirectIfAuth` — prevents logged-in users from visiting auth pages

**Data fetching**: TanStack Query (v5) manages all server state. Zustand manages auth state only.

**Path alias**: `@/` maps to `src/` (configured in both `tsconfig.json` and `vite.config.ts`).

## Key Environment Variables

Defined in `.env` (see `.env.example`):
- `DJANGO_SETTINGS_MODULE` — e.g., `config.settings.dev`
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `SECRET_KEY` — Django secret key
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` — Stripe integration
- `GOOGLE_CLIENT_ID` — Google OAuth
- `VITE_API_URL` — Frontend API base URL (defaults to `/api`)
- `FRONTEND_PORT` — Vite dev server port (default: 5173)

## JWT Configuration

- Access token: 1 hour lifetime
- Refresh token: 7 days, rotation enabled
- Frontend auto-refreshes on 401 via Axios interceptor
- WebSocket connections authenticate via `?token=<access_token>` query param
