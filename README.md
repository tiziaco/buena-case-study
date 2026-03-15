# Buena Property Dashboard

A property management dashboard built as part of the Buena Case Study. Allows property managers to digitize physical buildings into structured digital objects through a guided 3-step creation flow.

Watch the [product walkthrough](https://www.loom.com/share/0f0b24f36d2d4c9d88a50193a4a1efe8) for a brief overview.

The original assignment brief is available in [`docs/PRD.md`](./docs/PRD.md).

## Key Design Decisions

**Next.js full-stack** - Next.js API routes instead of a separate backend to keep the project simple: one repo, shared types between frontend and backend, no API boundary to maintain.

**React Hook Form + FormProvider instead of Context + useReducer** - the Zod schema maps directly to the POST payload, so there was no need for a separate state layer. One `useForm` instance at the wizard root, shared across steps via `FormProvider`, keeps things simple and fully typed.

**Client-side state with deferred persistence** - all property data is held client-side and stays mutable throughout the creation flow. Buildings are assigned a client-generated UUID that units reference to track which building they belong to. On submission, the server resolves those IDs to real database records in a single transaction.

**Server-side filtering with URL-reflected state** - filters live in the URL and are applied in a Server Component, so every filter change hits the database directly. No client-side array filtering, and deep-linking works out of the box.

**All core services are tested** - property, building, and unit services are covered by both unit tests (mocked Prisma) and integration tests (real PostgreSQL via Testcontainers). The test suite runs fully automated with no manual setup.

**AI PDF extraction** - Uploading a Teilungserklärung pre-fills all three wizard steps via `gpt-4o-mini`; everything stays editable before submission.

---

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
cd buena-case-study
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

To reset your local environment from scratch:

```bash
make clean        # remove node_modules, .next, and coverage
make setup        # reinstall and re-seed
```

---

## Useful Commands

### Testing

```bash
make test             # all tests (unit + integration)
make test-unit        # unit tests only
make test-integration # integration tests only
make test-coverage    # full suite with coverage report
```

No manual database setup needed - integration tests use [Testcontainers](https://testcontainers.com/) to spin up a real PostgreSQL instance automatically. **Requires Docker to be running.**

### Docker

```bash
make docker-up        # start all services (web app + postgres)
make docker-down      # stop all services
make docker-rebuild   # clean build + restart
make docker-clean     # remove containers, volumes, and images
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

Authentication is intentionally out of scope for this case study. The app has no login flow - users are seeded directly into the database and selected via dropdowns.
