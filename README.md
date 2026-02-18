<div align="center">

# HaulHub

**A two-sided marketplace connecting clients with professional haulers for moving and hauling services.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-4.2-green?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

[Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [Architecture](#architecture) · [API Reference](#api-reference) · [Contributing](#contributing)

</div>

---

## Overview

HaulHub is a full-stack marketplace platform that connects clients who need moving and hauling services with vetted haulers. Clients post jobs, haulers apply, and the platform handles booking coordination, secure escrow payments, real-time messaging, and post-job reviews — all in one place.

## Features

### For Clients
- **Post Jobs** — Create detailed job listings with category, budget, location, and scheduled date
- **Review Haulers** — Browse hauler profiles with ratings, bios, and work history
- **Manage Applications** — Accept or reject applications from interested haulers
- **Secure Payments** — Pay via Stripe with escrow protection; funds release only on job completion
- **Real-time Chat** — Communicate directly with your hauler through in-app messaging
- **Rate & Review** — Leave honest feedback after every completed job

### For Haulers
- **Browse Job Board** — Find and filter available jobs that match your skills
- **Apply with Proposals** — Submit custom proposals and set your terms
- **Track Applications** — Monitor the status of all your submissions
- **Receive Payments Securely** — Earnings are protected via the escrow system
- **Build Your Reputation** — Grow your rating and review count with every job

### Platform
- **JWT Authentication** with Google OAuth support
- **WebSocket-based chat** with message persistence and read receipts
- **Celery task queue** for async payment processing and auto-release of escrow
- **Role-based UI** — Separate, optimized flows for clients and haulers

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Django 4.2, Django REST Framework 3.14 |
| **Authentication** | JWT (SimpleJWT), Google OAuth 2.0 |
| **Real-time** | Django Channels 4.0, WebSockets, Redis |
| **Task Queue** | Celery 5.3, Celery Beat, Redis |
| **Database** | PostgreSQL 15 |
| **Payments** | Stripe 7.12 |
| **Frontend** | React 18, TypeScript 5.3, Vite 5.1 |
| **State** | Zustand 4.5, TanStack Query 5 |
| **Styling** | Tailwind CSS 3.4 |
| **Forms** | React Hook Form 7.5 |
| **Reverse Proxy** | Nginx 1.25 |
| **Containerization** | Docker, Docker Compose |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Client Browser                   │
└──────────────────────────┬──────────────────────────┘
                           │ HTTP / WebSocket
                           ▼
┌─────────────────────────────────────────────────────┐
│                    Nginx (Port 8080)                  │
│   /api/*  →  Django Backend                         │
│   /ws/*   →  Django Channels (WebSocket)            │
│   /admin  →  Django Admin                           │
│   /*      →  React SPA (Vite)                       │
└──────────────────────────┬──────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
   ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
   │  Django API  │ │   React SPA │ │    Daphne    │
   │  (Gunicorn)  │ │   (Vite)    │ │  (WebSocket) │
   └──────┬───────┘ └─────────────┘ └──────┬───────┘
          │                                 │
          └──────────────┬──────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌────────────┐ ┌──────────┐ ┌──────────────┐
   │ PostgreSQL │ │  Redis   │ │    Celery    │
   │  Database  │ │  Cache + │ │  Workers +  │
   │            │ │  Broker  │ │    Beat      │
   └────────────┘ └──────────┘ └──────────────┘
```

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) v2+
- [Git](https://git-scm.com/)
- A [Stripe](https://stripe.com) account (for payment processing)
- A [Google Cloud](https://console.cloud.google.com/) project with OAuth 2.0 credentials (optional)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/HaulHub.git
   cd HaulHub
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Open `.env` and fill in the required values (see [Environment Variables](#environment-variables) below).

3. **Build and start services**

   ```bash
   docker compose up --build
   ```

   On first run, this will:
   - Pull all Docker images
   - Build the backend and frontend containers
   - Run database migrations automatically
   - Collect Django static files
   - Start all 7 services

4. **Access the application**

   | Service | URL |
   |---|---|
   | Web App | http://localhost:8080 |
   | Django Admin | http://localhost:8080/admin |
   | API | http://localhost:8080/api |

5. **Create a superuser** (optional, for admin access)

   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

### Development

To run services individually or access logs:

```bash
# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend

# Run Django management commands
docker compose exec backend python manage.py <command>

# Open a shell in the backend container
docker compose exec backend bash

# Rebuild a single service after changes
docker compose up --build backend
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```ini
# Django
SECRET_KEY=your-long-random-secret-key
DEBUG=True

# PostgreSQL
POSTGRES_DB=haulhub
POSTGRES_USER=haulhub_user
POSTGRES_PASSWORD=your-secure-password

# Redis
REDIS_URL=redis://redis:6379/0

# Stripe (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google OAuth (get from https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...

# Ports (optional, defaults shown)
NGINX_PORT=8080
FRONTEND_PORT=5173

# Frontend (must match backend URL)
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com
```

## API Reference

The REST API is available at `/api/`. All endpoints (except auth) require a JWT Bearer token.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Register a new user |
| `POST` | `/api/auth/login/` | Obtain JWT tokens |
| `POST` | `/api/auth/token/refresh/` | Refresh access token |
| `POST` | `/api/auth/google/` | Google OAuth login |

### Jobs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs/` | List all open jobs |
| `POST` | `/api/jobs/` | Create a new job (client) |
| `GET` | `/api/jobs/{id}/` | Get job details |
| `POST` | `/api/jobs/{id}/apply/` | Apply to a job (hauler) |
| `POST` | `/api/jobs/{id}/applications/{id}/accept/` | Accept an application (client) |

### Bookings
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/bookings/` | List user's bookings |
| `GET` | `/api/bookings/{id}/` | Get booking details |
| `POST` | `/api/bookings/{id}/complete/` | Mark booking as complete |
| `POST` | `/api/bookings/{id}/cancel/` | Cancel a booking |

### Wallet & Payments
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/wallet/` | Get wallet balance |
| `GET` | `/api/wallet/transactions/` | List transaction history |
| `POST` | `/api/wallet/deposit/` | Add funds via Stripe |
| `POST` | `/api/wallet/withdraw/` | Withdraw available balance |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/chat/rooms/` | List user's chat rooms |
| `GET` | `/api/chat/rooms/{id}/messages/` | Get messages for a room |

> **WebSocket**: Connect to `ws://localhost:8080/ws/chat/{room_id}/` with a JWT token for real-time messaging.

### Reviews
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reviews/` | Submit a review |
| `GET` | `/api/haulers/{id}/reviews/` | Get hauler's reviews |

## Project Structure

```
haulhub/
├── backend/                  # Django REST API
│   ├── apps/
│   │   ├── users/            # Authentication & profiles
│   │   ├── jobs/             # Job listings & applications
│   │   ├── bookings/         # Booking management & escrow
│   │   ├── payments/         # Wallet & Stripe integration
│   │   ├── chat/             # WebSocket messaging
│   │   └── reviews/          # Ratings & reviews
│   ├── config/               # Django settings & routing
│   ├── Dockerfile
│   ├── manage.py
│   └── requirements.txt
├── frontend/                 # React + TypeScript SPA
│   ├── src/
│   │   ├── api/              # Axios API clients
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Route pages (client/hauler/shared)
│   │   ├── stores/           # Zustand global state
│   │   └── types/            # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
├── nginx/                    # Reverse proxy configuration
├── docker-compose.yml        # Container orchestration
└── .env.example              # Environment variable template
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Make your changes following the existing code style
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, etc.
5. Push to your fork and open a Pull Request

Please read our [Contributing Guidelines](.github/PULL_REQUEST_TEMPLATE.md) and use the provided [Issue Templates](.github/ISSUE_TEMPLATE/) when reporting bugs or requesting features.

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
Made with care for the moving industry
</div>
