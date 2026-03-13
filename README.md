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
- [Docker](https://www.docker.com/) (for PostgreSQL)
- An OpenAI API key (optional — only required for PDF extraction)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd buenita_app
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/buena
OPENAI_API_KEY=your_key_here   # optional
```

### 3. Start the database

```bash
docker compose up -d
```

### 4. Run migrations

```bash
npx prisma migrate dev
```

### 5. Seed sample data

```bash
npx prisma db seed
```

This populates the database with 8 users and 2 sample properties (with buildings and units) so the dashboard has real data from day one.

---

## Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app redirects to `/dashboard`.

---

## Running Tests

```bash
npm test
```

This runs the full suite: Zod validator tests, API helper tests, and service integration tests. No manual database setup is required — integration tests use [Testcontainers](https://testcontainers.com/) to spin up a real PostgreSQL instance automatically, run migrations, and tear it down when done.

**Requires Docker to be running.**

```bash
npm run test:coverage   # with coverage report
npm run test:watch      # watch mode
```

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
