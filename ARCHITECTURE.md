# DFDS.io Architecture Documentation

## Overview

DFDS.io is a modern platform designed to connect Developers, Founders, and Investors. It provides tools for team management, community interaction, project showcasing, and secure payments. The system is built as a monolithic Next.js application, leveraging serverless-ready patterns but currently deployed via Docker for control and portability.

## Technology Stack

### Core Framework
- **Frontend/Backend:** [Next.js 14+](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Framer Motion

### Data Layer
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Caching & Rate Limiting:** Redis

### Authentication & Security
- **Auth:** NextAuth.js (v4)
- **Validation:** Zod
- **API Security:** Custom API Key validation, Rate Limiting (Token Bucket), Sanitization

### Infrastructure & DevOps
- **Containerization:** Docker & Docker Compose
- **Reverse Proxy/Load Balancer:** Nginx
- **Telemetry:** PostHog
- **Email:** Resend

## System Architecture

```mermaid
graph TD
    Client[Client Browser]
    LB[Nginx Load Balancer]
    App[Next.js App (Docker)]
    DB[(PostgreSQL)]
    Redis[(Redis Cache)]
    ExtAuth[OAuth Providers]
    ExtEmail[Resend API]
    ExtAnalytics[PostHog]

    Client -->|HTTPS| LB
    LB -->|HTTP| App
    App -->|Query| DB
    App -->|Cache/Rate Limit| Redis
    App -->|Auth| ExtAuth
    App -->|Emails| ExtEmail
    Client -->|Events| ExtAnalytics
    App -->|Events| ExtAnalytics
```

## Directory Structure

| Directory | Purpose |
|---|---|
| `app/` |  Main application routes (App Router). Contains pages, layouts, and API routes. |
| `components/` |  React components organized by feature (e.g., `dashboard`, `ui`, `messaging`). |
| `lib/` |  Core utility libraries, singletons, and shared business logic. |
| `prisma/` |  Database schema (`schema.prisma`) and seed scripts. |
| `public/` |  Static assets (images, fonts). |
| `scripts/` |  Maintenance and utility scripts. |
| `types/` |  Global TypeScript type definitions. |
| `tests/` |  Unit and integration tests (Vitest). |

## Database Schema (Prisma)

The database is designed around four main user roles: **Developer**, **Founder**, **Investor**, and **Admin**.

### Key Models
- **User**: Central identity model. Linked to Profile, Activity, and Auth accounts.
- **Profile**: Extended user details (Bio, Skills, Experience, Investment focus).
- **Startup**: Represents a company/project led by a Founder.
- **Team/TeamMembership**: Manages access to Startup resources.
- **Project**: Portfolio items linked to a User Profile.
- **Thread/Reply**: Community forum system.
- **Transaction**: Records payments and financial flows.

## Key Systems Implementation

### 1. Authentication
Authentication is handled by **NextAuth.js**.
- **Providers:** GitHub, Google, Credentials (Email/Password with bcrypt).
- **Session:** Database persistence (PostgreSQL) via Prisma Adapter.

### 2. API Security & Rate Limiting
Located in `lib/api-security.ts` and `lib/rate-limit.ts`.
- **Rate Limiting:** Implemented using Redis and `rate-limiter-flexible`.
- **API Keys:** Hashed keys stored in DB (`ApiKey` model). Middleware verifies keys for programmatic access.
- **Sanitization:** `isomorphic-dompurify` prevents XSS in user submissions.

### 3. Messaging System
A real-time capable messaging system with support for:
- **Direct Messages:** User-to-User conversations.
- **Attachments:** Support for sharing files/links.
- **Read Receipts:** Tracks when messages are read.

### 4. Telemetry
Telemetry is implemented via **PostHog**.
- **Client-side:** Captures pageviews and interactions via `posthog-js`.
- **Server-side:** Captures backend events/errors via `posthog-node` (`lib/posthog-server.ts`).
- **Proxy:** `next.config.mjs` configures rewrites to avoid ad-blockers.

## Deployment Strategy

The application is deployed using a custom shell script (`deploy.sh`) and `docker-compose.yml`.

### Workflow
1. **Prepare:** `deploy.sh install` checks/installs Docker, Node, Git.
2. **Configure:** `deploy.sh setup` generates/updates `.env` safely.
3. **Build & Run:** `deploy.sh start` builds the Docker image and starts services.
4. **Scale:** `deploy.sh scale N` allows horizontal scaling of the App container behind Nginx.

### Containers
- **startit-app:** The Next.js application (Port 3753).
- **startit-db:** PostgreSQL 15.
- **startit-redis:** Redis 7 (for queues/limits).
- **startit-lb:** Nginx (Optional, for production routing).
