# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Development Server**: `npm run dev` (starts Next.js at localhost:3000)
- **Build**: `npm run build` (runs prisma generate + next build)
- **Lint**: `npm run lint` (runs eslint)
- **Test**: `npm test` (runs vitest)
  - Run single test: `npx vitest tests/unit/path/to/test.ts`
  - Watch mode: `npm run test:watch`
- **Database**:
  - Push schema changes: `npm run db:push` (uses `prisma db push`)
  - Seed database: `npx prisma db seed`
  - View data: `npm run db:studio` (opens Prisma Studio)
  - Generate client: `npx prisma generate`

## Architecture & Structure

- **Framework**: Next.js 14+ (App Router) with TypeScript.
- **Styling**: Tailwind CSS + Framer Motion. UI components are in `components/ui` (shadcn-like).
- **Database**: PostgreSQL with Prisma ORM (`prisma/schema.prisma`).
- **Authentication**: NextAuth.js (v4) with JWT sessions (`lib/auth.ts`).
- **State Management**: React Server Components (server) + Zustand (client).
- **External Services**:
  - **Redis**: Rate limiting & caching.
  - **Pusher**: Real-time messaging/updates.
  - **Resend**: Transactional emails.
  - **PostHog**: Analytics/Telemetry.

### Directory Structure
- `app/`: App Router pages & layouts. API routes located in `app/api/`.
- `components/`:
  - `ui/`: Reusable primitive components.
  - `dashboard/`, `messaging/`, `landing/`: Feature-specific components.
- `lib/`: Shared utilities, singletons (Prisma, Redis), and business logic.
- `prisma/`: Database schema and seed scripts.
- `tests/`: Vitest unit and integration tests.
- `types/`: Global TypeScript definitions.

### Key Patterns
- **API Security**: Rate limiting is handled in `lib/rate-limit.ts`. API keys are hashed.
- **Real-time**: Messaging uses a dual-write pattern: persist to Postgres + publish to Pusher (`lib/pusher.ts`).
- **Deployment**: Dockerized via `docker-compose.yml`. Use `deploy.sh` for orchestration (rarely needed for coding tasks).
