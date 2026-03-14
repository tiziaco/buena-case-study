# Buena Property Dashboard

A property management dashboard built as part of the Buena Tech Case Study. Allows property managers to digitize physical buildings into structured digital objects through a guided 3-step creation flow.

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

### Quick Start (using Make)

```bash
git clone https://github.com/tiziaco/buenita_app.git
cd buenita_app
cp .env.example .env
# Edit .env with your DATABASE_URL and OPENAI_API_KEY
make setup
make dev
```

### Manual Setup

#### 1. Clone and install

```bash
git clone <repo-url>
cd buenita_app
npm install
```

#### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/buena
OPENAI_API_KEY=your_key_here   # optional
```

#### 3. Start the database

```bash
docker compose up -d
```

#### 4. Run migrations

```bash
npx prisma migrate dev
```

#### 5. Seed sample data

```bash
npx prisma db seed
```

This populates the database with 8 users and 2 sample properties (with buildings and units) so the dashboard has real data from day one.

### Available Make Commands

Run `make help` to see all available commands:

- **Setup**: `make setup` - Full automated setup
- **Docker**: `make docker-up`, `make docker-down`, `make docker-logs`
- **Database**: `make migrate`, `make seed`, `make db-reset`
- **Testing**: `make test`, `make test-unit`, `make test-coverage`
- **Development**: `make dev` - Start development server

---

## Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app redirects to `/dashboard`.

---

## Running Tests

### Using Make (recommended)

```bash
make test             # run all tests (unit + integration)
make test-unit        # unit tests only
make test-integration # integration tests only
make test-coverage    # full suite with coverage report
```

### Using npm directly

```bash
npm test                        # run all tests (unit + integration)
npm run test:unit               # unit tests only
npm run test:unit:watch         # unit tests in watch mode
npm run test:integration        # integration tests only
npm run test:coverage           # full suite with coverage report
npm run test:coverage:integration  # integration tests with coverage report
```

No manual database setup is required — integration tests use [Testcontainers](https://testcontainers.com/) to spin up a real PostgreSQL instance automatically, run migrations, and tear it down when done.

**Requires Docker to be running.**

---

## Project Structure

```
/app
  /dashboard          ← Property list page (Server Component)
  /properties/new     ← 3-step property creation flow
  /api                ← Route handlers (thin wrappers over services)

/lib
  /services           ← Business logic (property, building, unit, user)
  /validators         ← Zod schemas (shared between frontend and backend)
  /store              ← Zustand store for creation wizard state
  /hooks              ← Shared hooks (useSearchParam, etc.)
  /types              ← TypeScript types derived from Zod schemas
  prisma.ts           ← PrismaClient singleton

/prisma
  schema.prisma
  seed.ts
```

---

## Notes on Authentication

Authentication is intentionally out of scope for this case study. The app has no login flow — users are seeded directly into the database and selected via dropdowns.

In a production environment, authentication would be added using a solution like [NextAuth.js](https://next-auth.js.org/) or [Clerk](https://clerk.com/). The `User` model is already structured to support this — adding a `passwordHash` or OAuth provider field and protecting routes via middleware would be the natural next step.
