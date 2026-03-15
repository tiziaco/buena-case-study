# Buena Property Dashboard

A property management dashboard built as part of the Buena Case Study. Allows property managers to digitize physical buildings into structured digital objects through a guided 3-step creation flow.

## Tech Stack

- **Framework:** Next.js (App Router) · TypeScript
- **Database:** PostgreSQL · Prisma
- **Validation:** Zod · React Hook Form
- **State:** Zustand
- **UI:** shadcn/ui · Tailwind CSS
- **Testing:** Vitest · Testcontainers
- **AI:** Vercel AI SDK (PDF extraction)
- **URL state:** nuqs

---

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/)
- An OpenAI API key

---

## Setup

### 1. Clone and configure

```bash
git clone https://github.com/tiziaco/buenita_app.git
cd buenita_app
cp .env.example .env
# Add your OPENAI_API_KEY to .env
```

### 2. Quick Start (Docker)

Spins up the full stack (web app + database) with a single command. No local Node.js install required.

```bash
make docker-up
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to `/dashboard`.

### 3. Development Setup

Runs the app locally with hot reload. Requires Node.js v20+.

```bash
make setup   # install deps · start postgres · run migrations · seed data
make dev     # start Next.js dev server
```

Open [http://localhost:3000](http://localhost:3000). The seed populates the database with 8 users and 2 sample properties so the dashboard has real data from day one.

---

## Useful Commands

### Testing

```bash
make test             # all tests (unit + integration)
make test-unit        # unit tests only
make test-integration # integration tests only
make test-coverage    # full suite with coverage report
```

No manual database setup needed — integration tests use [Testcontainers](https://testcontainers.com/) to spin up a real PostgreSQL instance automatically. **Requires Docker to be running.**

### Docker

```bash
make docker-up        # start all services (web app + postgres)
make docker-down      # stop all services
make docker-rebuild   # clean build + restart
make docker-logs      # follow all service logs
make docker-logs-web  # follow web app logs only
```

Run `make help` to see the full list of available commands.

---

## Project Structure

```
/src
  /app
    /(app)
      /dashboard        ← Property list page (Server Component)
      /properties       ← 3-step property creation flow
      /contracts        ← Placeholder for future features 
    /api                ← Route handlers (thin wrappers over services)

  /components
    /dashboard          ← Dashboard UI components (table, filters, actions)
    /property-creation  ← Creation wizard steps and upload zone
    /layout             ← Sidebar, nav, and layout components
    /ui                 ← shadcn/ui primitives

  /lib
    /services           ← Business logic (property, building, unit, user)
    /validators         ← Zod schemas (shared between frontend and backend)
    /api                ← API response helpers
    prisma.ts           ← PrismaClient singleton

  /hooks                ← Shared hooks (data fetching, PDF extraction)
  /types                ← TypeScript types derived from Zod schemas
  /providers            ← React context providers (TanStack Query, etc.)

/prisma
  schema.prisma
  seed.ts
```

---

## Notes on Authentication

Authentication is intentionally out of scope for this case study. The app has no login flow — users are seeded directly into the database and selected via dropdowns.
