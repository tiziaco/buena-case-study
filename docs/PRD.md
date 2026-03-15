# PRD — Buena Property Dashboard
**Version:** 1.1  
**Role:** Founding Software Engineer Take-Home Assignment  
**Stack:** Next.js 16 (App Router) · TypeScript · PostgreSQL · Prisma · Zod · Vercel AI SDK

---

## 1. Overview

Build a Property Dashboard with a guided 3-step property creation flow. The app allows property managers to digitize physical buildings into structured digital objects, supporting two property types: **WEG** (owner communities) and **MV** (rental properties).


**Key design decisions:**
- Manager and accountant are stored as plain text fields (`managerName`, `accountantName`) on `Property`, pre-filled by AI extraction when found in the PDF.

---

## 2. Data Model

```
Property
  id                  UUID PK
  name                String
  type                Enum (WEG | MV)
  propertyNumber      String UNIQUE (auto-generated: PROP-{YEAR}-{00001})
  managerName         String?
  accountantName      String?
  declarationFileUrl  String?
  createdAt           DateTime
  updatedAt           DateTime

  relations:
    buildings → Building[]

Building
  id            UUID PK
  propertyId    UUID FK → Property
  street        String
  houseNumber   String
  postalCode    String
  city          String
  country       String
  createdAt     DateTime
  updatedAt     DateTime

  relations:
    units → Unit[]

Unit
  id                UUID PK
  buildingId        UUID FK → Building
  unitNumber        String
  type              Enum (APARTMENT | OFFICE | GARDEN | PARKING)
  floor             Int?
  entrance          String?
  size              Float?              (sqm)
  coOwnershipShare  Float?
  constructionYear  Int?
  rooms             Float?
  createdAt         DateTime
  updatedAt         DateTime
```

---

## 3. Backend Requirements

The backend is built in **three sequential implementation steps**. Each step has a clear deliverable and should be completed and verified before moving to the next.

---

### Backend Step 1 — Infrastructure & Data Model

**Goal:** Working database, schema, migrations, and seed data. No application logic yet.

#### Deliverables

**Docker Compose (`docker-compose.yml`)**
- `postgres` service: image `postgres:16`, exposed on port `5432`
- Environment: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- Named volume for data persistence
- Optional: `adminer` service on port `8080` for quick DB inspection during development

**`.env` and `.env.example`**
```
DATABASE_URL=postgresql://user:password@localhost:5432/buena
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/buena_test
OPENAI_API_KEY=
```

**Prisma Schema (`/prisma/schema.prisma`)**
- All models as defined in Section 2
- `provider = "postgresql"`
- All enums: `PropertyType`, `StaffRole`, `UnitType`
- Correct relations and `@@unique` constraints

**Initial Migration**
```bash
npx prisma migrate dev --name init
```

**Seed Script (`/prisma/seed.ts`)**

Pre-populate the following so the frontend has real data to work with from day one:

```
Properties (2 sample records, each with buildings and units):
  - "Musterstraße WEG" (type: WEG, managerName: "Anna Müller", accountantName: "Thomas Berger") — 1 building, 4 units
  - "Berliner Allee MV" (type: MV, managerName: "Sarah Klein", accountantName: "Michael Weber") — 2 buildings, 6 units total
```

**Verification checklist for Step 1:**
- [ ] `docker compose up -d` starts Postgres without errors
- [ ] `npx prisma migrate dev` runs cleanly
- [ ] `npx prisma db seed` populates all tables
- [ ] `npx prisma studio` shows correct data and relations

---

### Backend Step 2 — Service Layer & Validators

**Goal:** All business logic and validation in place, independently testable, with no API routes yet.

#### File Structure

```
/lib
  prisma.ts                     ← PrismaClient singleton (global instance pattern)
  /services
    property.ts
    building.ts
    unit.ts
  /validators
    property.ts                 ← Zod schemas (shared with frontend)
    building.ts
    unit.ts
  /api
    response.ts                 ← apiSuccess() / apiError() helpers
/types
  index.ts                    ← shared TypeScript types derived from Zod schemas
```

#### PrismaClient Singleton (`/lib/prisma.ts`)

```ts
// Prevents multiple instances in Next.js dev hot-reload
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### Service Functions

```ts
// services/property.ts
getProperties(filters?: PropertyFilters): Promise<PropertySummary[]>
  // filters: { type?, sizeMin?, sizeMax?, yearMin?, yearMax? }
  // returns: id, name, type, propertyNumber, createdAt, managerName, accountantName
  // applies server-side WHERE clause from filters (see Section 4.2.1)

getPropertyById(id: string): Promise<PropertyDetail | null>
  // returns full property with buildings → units

createProperty(data: CreatePropertyInput): Promise<Property>
  // single Prisma transaction:
  //   1. generate propertyNumber (PROP-{YEAR}-{padded sequence})
  //   2. create Property (including managerName, accountantName)
  //   3. create Buildings, keeping a clientId → DB id map
  //   4. create Units, resolving buildingClientId → real buildingId via the map

updateProperty(id: string, data: UpdatePropertyInput): Promise<Property>

deleteProperty(id: string): Promise<void>
  // hard delete — removes property and all related buildings and units

// services/building.ts
createBuilding(data: CreateBuildingInput): Promise<Building>
updateBuilding(id: string, data: UpdateBuildingInput): Promise<Building>
deleteBuilding(id: string): Promise<void>

// services/unit.ts
createUnit(data: CreateUnitInput): Promise<Unit>
bulkCreateUnits(units: CreateUnitInput[]): Promise<Unit[]>
  // uses prisma.unit.createMany()
updateUnit(id: string, data: UpdateUnitInput): Promise<Unit>
deleteUnit(id: string): Promise<void>
```

#### Property Number Generation

```ts
// inside createProperty, within the same transaction
const count = await prisma.property.count()
const year = new Date().getFullYear()
const propertyNumber = `PROP-${year}-${String(count + 1).padStart(5, '0')}`
// Example: PROP-2025-00003
```

#### Zod Validators (`/lib/validators/`)

```ts
// validators/property.ts
export const CreatePropertySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['WEG', 'MV']),
  managerName: z.string().optional(),
  accountantName: z.string().optional(),
  declarationFileUrl: z.string().optional(),
  buildings: z.array(CreateBuildingSchema.extend({ clientId: z.string().uuid() })).min(1),
  units: z.array(CreateUnitSchema),
})
// The server resolves buildingClientId → real buildingId by matching against the
// created buildings in order within the same transaction.

// validators/building.ts
export const CreateBuildingSchema = z.object({
  street: z.string().min(1),
  houseNumber: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  country: z.string().default('Germany'),
})

// validators/unit.ts
export const CreateUnitSchema = z.object({
  buildingClientId: z.string().uuid(), // client-side UUID matching BuildingData.clientId
  unitNumber: z.string().min(1),
  type: z.enum(['APARTMENT', 'OFFICE', 'GARDEN', 'PARKING']),
  floor: z.number().int().optional(),
  entrance: z.string().optional(),
  size: z.number().positive().optional(),
  coOwnershipShare: z.number().positive().optional(),
  constructionYear: z.number().int().min(1800).max(2100).optional(),
  rooms: z.number().positive().optional(),
})
```

#### API Response Helpers (`/lib/api/response.ts`)

```ts
export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status })
}

export function apiError(message: string, status: number, details?: unknown): Response {
  return Response.json({ error: message, details }, { status })
}
```

#### Testing

**Unit tests** (`/__tests__/unit/`) — Prisma mocked via `jest-mock-extended`:

```
property.service.test.ts
  ✓ getProperties returns correct records
  ✓ createProperty generates correct propertyNumber format

building.service.test.ts
  ✓ createBuilding links to correct propertyId

unit.service.test.ts
  ✓ bulkCreateUnits calls createMany with correct payload
```

**Integration tests** (`/__tests__/integration/`) — use `@testcontainers/postgresql` to spin up a real Postgres instance automatically. No manual Docker setup required — the container starts and stops as part of the test run.

```ts
// jest.setup.integration.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql'

let container: StartedPostgreSqlContainer

beforeAll(async () => {
  container = await new PostgreSqlContainer().start()
  process.env.DATABASE_URL = container.getConnectionUri()
  execSync('npx prisma migrate deploy')
})

afterAll(async () => {
  await prisma.$disconnect()
  await container.stop()
})
```

```
property.integration.test.ts
  ✓ full property creation persists property, buildings, units, and staff in one transaction
  ✓ getPropertyById returns null for non-existent id

unit.integration.test.ts
  ✓ bulkCreateUnits persists all records correctly
```

**Verification checklist for Step 2:**
- [ ] All service functions importable and TypeScript compiles with no errors
- [ ] Zod schemas export correct inferred types
- [ ] Unit tests pass with mocked Prisma
- [ ] Integration tests pass (Testcontainers spins up automatically)

---

### Backend Step 3 — API Routes ✅ COMPLETE

**Goal:** Thin route handlers wired to services. Services are already tested in Step 2.

#### Implemented Changes (Step 3)

**Schema migrations:**
- `Building` model: added optional `name String?` field
- `Unit` model: `coOwnershipShare` changed from `Float?` to `Decimal?`

**Validator updates:**
- `CreateBuildingSchema`: added optional `name` field
- `CreateBuildingWithPropertySchema`: new schema combining building fields + `propertyId: z.uuid()` (used by POST /api/buildings)
- `BulkCreateUnitSchema`: new schema wrapping `z.array(CreateUnitSchema)` (used by bulk POST /api/units)

**Service updates:**
- `createProperty` now returns `PropertySummary` (with `staff.manager` / `staff.accountant` names) instead of raw `Property`

**API utilities (`src/lib/api/response.ts`):**
- `apiError` fixed to omit `details` key when not provided
- `isPrismaNotFound(e: unknown): boolean` helper added — returns `true` for Prisma P2025 errors; used in all PATCH/DELETE handlers for 404 responses

**Dependencies added:** `ai`, `@ai-sdk/openai` (Vercel AI SDK)

#### File Structure

```
src/app/api/
  properties/
    route.ts              ← GET (list), POST (create → returns PropertySummary)
    [id]/
      route.ts            ← GET (detail, serializes Decimal fields), PATCH (update), DELETE
  buildings/
    route.ts              ← POST (uses CreateBuildingWithPropertySchema)
    [id]/
      route.ts            ← PATCH, DELETE
  units/
    route.ts              ← POST single or bulk (discriminated by `units` array key)
    [id]/
      route.ts            ← PATCH (serializes Decimal), DELETE
  upload/
    route.ts              ← POST: accept PDF, store in /tmp, return { fileRef }
  extract/
    route.ts              ← POST: validate fileRef UUID, read PDF, AI extraction
```

#### API Endpoints

**Properties**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/properties` | List properties; supports `type`, `managerId`, `sizeMin`, `sizeMax`, `yearMin`, `yearMax` query params |
| POST | `/api/properties` | Create property + buildings + units + staff (transaction); returns `PropertySummary` |
| GET | `/api/properties/:id` | Full detail with buildings, units (Decimal serialized), staff |
| PATCH | `/api/properties/:id` | Update general info |
| DELETE | `/api/properties/:id` | Hard delete (cascades units → buildings → staff → property) |

**Buildings**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/buildings` | Add building to existing property (body: `{ propertyId, ...buildingFields }`) |
| PATCH | `/api/buildings/:id` | Update building |
| DELETE | `/api/buildings/:id` | Delete building |

**Units**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/units` | Create single unit or bulk (`{ units: UnitInput[] }`); serializes `coOwnershipShare` Decimal |
| PATCH | `/api/units/:id` | Update unit; serializes `coOwnershipShare` Decimal |
| DELETE | `/api/units/:id` | Delete unit |

**File & AI**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | Accept PDF (multipart `file` field), store in `/tmp/{uuid}.pdf`, return `{ fileRef: uuid }` |
| POST | `/api/extract` | Accept `{ fileRef }` (UUID validated), read PDF, AI extraction via `gpt-4o-mini`, return structured JSON |

#### Route Handler Pattern (keep routes thin)

```ts
export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const parsed = CreatePropertySchema.safeParse(body)
    if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten())
    const property = await createProperty(parsed.data)
    return apiSuccess(property, 201)
  } catch {
    return apiError('Failed to create property', 500)
  }
}

// PATCH/DELETE — use isPrismaNotFound for 404
export async function DELETE(_req: Request, { params }: { params: Params }): Promise<Response> {
  try {
    const { id } = await params   // Next.js 16: params is a Promise
    await deleteProperty(id)
    return new Response(null, { status: 204 })
  } catch (e) {
    if (isPrismaNotFound(e)) return apiError('Property not found', 404)
    return apiError('Failed to delete property', 500)
  }
}
```

#### AI Extraction Endpoint (`/api/extract`)

- Validates `fileRef` matches UUID format (prevents path traversal)
- Reads PDF from `/tmp/{fileRef}.pdf`, encodes as base64 data URL
- Calls `generateText` (Vercel AI SDK) with `gpt-4o-mini` and `Output.object({ schema: ExtractionSchema })`
- Returns structured JSON:

```json
{
  "property": { "name": "Parkview Residences Berlin", "type": "WEG" },
  "buildings": [{ "name": "Haus A", "street": "Am Fiktivpark", "house_number": "12", "postal_code": "10557", "city": "Berlin", "country": "Germany" }],
  "units": [{ "number": "01", "type": "Apartment", "building": "Haus A", "floor": 0, "size": 95, "co_ownership_share": 0.11, "rooms": 3 }]
}
```

- Frontend maps this to the creation wizard (fields remain editable before submission)

#### Known Issues / Follow-up

- `bulkCreateUnits` returns all units in the affected buildings (not only newly created ones) — pre-existing service bug; low risk for now since buildings start empty
- JSON parse errors (`req.json()` on malformed body) return 500 instead of 400 — systematic gap across all route handlers

**Verification checklist for Step 3:**
- [x] All endpoints return correct status codes and response shapes
- [x] POST `/api/properties` creates all nested records atomically and returns `PropertySummary`
- [x] PATCH/DELETE return 404 on missing record (P2025), 204 on successful delete
- [x] `coOwnershipShare` Decimal serialized to number at route boundary
- [x] POST `/api/extract` validates fileRef UUID, returns structured AI extraction JSON
- [x] 115/115 tests pass (89 unit, 26 integration)

---

## 4. Frontend Requirements

### 4.0 UI Component Library

Use [shadcn/ui](https://ui.shadcn.com/docs/components) components wherever available — inputs, dropdowns, buttons, badges, toasts, dialogs, tables, and form primitives. Build custom components only when shadcn has no equivalent (e.g. the inline editable unit table in Step 3).

### 4.1 Pages & Routes

```
/dashboard                  ← Property list
/properties/new             ← Multi-step creation flow (3 steps)
```

### 4.2 Dashboard Page (`/dashboard`)

- Table/list of all properties showing: name, type (WEG/MV badge), property number, assigned manager name, creation date
- Rows are **not clickable** — there is no property detail page in this version
- Empty state when no properties exist
- "Create new property" button → navigates to `/properties/new`
- No pagination required for MVP
- **Delete:** hovering a row reveals a `🗑` icon button on the right edge; clicking it opens a confirmation dialog before issuing `DELETE /api/properties/:id` and removing the row from the list

#### 4.2.1 Filters

The dashboard exposes four filters rendered above the property table:

| Filter | UI Control | Query param | Description |
|--------|-----------|-------------|-------------|
| Property type | Toggle / segmented control | `type` | `WEG`, `MV`, or empty (all) |
| Surface (min / max) | Two numeric inputs | `sizeMin`, `sizeMax` | Filter properties whose units contain at least one unit within the given sqm range |
| Construction year | Two numeric inputs | `yearMin`, `yearMax` | Filter properties whose units contain at least one unit within the given construction year range |

**URL-reflected filter state:**
- All active filter values are written to the URL as search params (e.g. `/dashboard?type=WEG&sizeMin=40`).
- On page load the URL params are read and applied as the initial filter state — deep-linking and browser back/forward work correctly.
- Filters are applied **server-side**: the `GET /api/properties` endpoint (or a Next.js Server Component using Prisma directly) receives the params and builds a `WHERE` clause before returning data. No client-side array filtering.
- A "Clear filters" button resets all params and navigates back to `/dashboard`.

**Search param management — `nuqs`:**

URL state is managed with [`nuqs`](https://nuqs.47ng.com/) via a shared `useSearchParam` hook:

```ts
// /lib/hooks/use-search-param.ts
import { parseAsString, useQueryState } from 'nuqs'

export function useSearchParam(key: string) {
  return useQueryState(
    key,
    parseAsString.withDefault('').withOptions({ clearOnDefault: true, shallow: false }),
  )
}
```

- `clearOnDefault: true` — removes the param from the URL when the value equals the default (empty string), keeping URLs clean.
- `shallow: false` — triggers a server navigation on change, so the Server Component re-renders with the updated `searchParams` and re-fetches filtered data from the DB.
- Each filter control calls `useSearchParam` with its own key (`'type'`, `'sizeMin'`, etc.) — no custom URL serialization needed.
- Numeric inputs (`sizeMin`, `sizeMax`, `yearMin`, `yearMax`) must debounce their URL writes to avoid triggering a server navigation on every keystroke. Use `useDebouncedCallback` from the `use-debounce` package with a 300ms delay.

**Server-side filtering logic:**

```ts
// app/dashboard/page.tsx  (Server Component)
interface SearchParams {
  type?: 'WEG' | 'MV'
  sizeMin?: string
  sizeMax?: string
  yearMin?: string
  yearMax?: string
}

// Prisma where clause built from searchParams:
const where: Prisma.PropertyWhereInput = {
  ...(type && { type }),
  ...((sizeMin || sizeMax) && {
    buildings: {
      some: {
        units: {
          some: {
            ...(sizeMin && { size: { gte: Number(sizeMin) } }),
            ...(sizeMax && { size: { lte: Number(sizeMax) } }),
          },
        },
      },
    },
  }),
  ...((yearMin || yearMax) && {
    buildings: {
      some: {
        units: {
          some: {
            ...(yearMin && { constructionYear: { gte: Number(yearMin) } }),
            ...(yearMax && { constructionYear: { lte: Number(yearMax) } }),
          },
        },
      },
    },
  }),
}
```

**`GET /api/properties` query-param support** (for client-side use / testing):

| Param | Type | Effect |
|-------|------|--------|
| `type` | `WEG\|MV` | Exact match on `Property.type` |
| `sizeMin` | number | Unit `size >= sizeMin` |
| `sizeMax` | number | Unit `size <= sizeMax` |
| `yearMin` | number | Unit `constructionYear >= yearMin` |
| `yearMax` | number | Unit `constructionYear <= yearMax` |

### 4.3 Property Creation Flow (`/properties/new`)

Three-step wizard with a visible step indicator (Step 1 / 2 / 3). The step indicator is navigable: completed steps can be clicked to jump back. The current step and future steps are not directly clickable.

**Step validation before advancing:** Each "Next" button calls `trigger()` from React Hook Form before advancing. The Zod resolver surfaces all field errors inline — the user cannot proceed until the current step is valid.

Global state for the full flow managed via **Zustand store** (`/lib/store/property-creation.ts`). Data is held in memory and only submitted on final step completion.

#### Step 1 — General Info
Fields:
- Management type: WEG / MV (segmented control or radio)
- Property name (text input)
- Property manager (plain text input; pre-filled from AI extraction via `managerName` when found in the PDF)
- Accountant (plain text input; pre-filled from AI extraction via `accountantName` when found in the PDF)
- PDF upload for Teilungserklärung (file input, PDF only, max 10MB)
  - On upload: POST to `/api/upload` then POST to `/api/extract`
  - Show loading state during extraction
  - On success: pre-fill Steps 1–3 with extracted data, show success banner
  - On partial/failure: show error, allow manual entry

#### Step 2 — Building Data
- List of buildings to be added to the property
- For each building: street, house number, postal code, city, country
- "Add building" button to add more buildings
- Minimum 1 building required
- Pre-filled from AI extraction if available; user can edit/add/remove

#### Step 3 — Units
- Units displayed in an **inline editable table** grouped by building
- All cells are always in edit mode (inputs rendered by default, no click-to-activate). This is the simpler, MVP-appropriate approach and better supports keyboard-driven entry.
- The table header is **sticky** so column labels remain visible when scrolling through 60+ rows.
- Columns: unit number, type, floor, entrance, size (sqm), co-ownership share, construction year, rooms
- Rows pre-filled from AI extraction if available; all cells remain editable
- Validation highlighting: rows with missing required fields shown with a visual indicator
- "Submit" button → single POST to `/api/properties` → redirect to `/dashboard` on success

**Efficiency UX (Efficiency Challenge — 60+ units):**

The table is designed for fast keyboard-driven and mouse-driven data entry:

| Interaction | Behaviour |
|-------------|-----------|
| `Tab` | Move focus to the next cell; wraps to first cell of the next row |
| `Enter` on last cell of a row | Commits the row and inserts a new blank row below, focusing its first cell |
| Hover a row | Reveals two icon buttons on the right edge: `⧉` (duplicate row) and `🗑` (delete row) |
| Duplicate (`⧉`) | Inserts a copy of the row immediately below; all values copied except unit number (cleared for editing) |
| "Add unit" button | Always visible below the table; appends a blank row to the active building group |

This means the primary workflow for a block of similar units (e.g. 20 apartments with the same floor/size) is:
1. Fill in the first row completely
2. Click `⧉` or press Enter to duplicate/add
3. Edit only the unit number — all other values carry over

### 4.4 Form State Management

The wizard uses a single **React Hook Form** instance (`useForm<CreatePropertyInput>`) at the wizard root, wrapped in `FormProvider`. Sub-components access the form via `useFormContext`. `useFieldArray` manages `buildings[]` and `units[]` arrays natively. Step navigation state is local `useState` (not in the form).

**Rationale for replacing the originally specified React Context + useReducer approach:**

- `CreatePropertySchema` (with `managerName`/`accountantName` as optional strings) matches the API payload exactly — no transformation needed; RHF form values serialize directly to POST body
- `useFieldArray` handles dynamic arrays (`buildings`, `units`) idiomatically without boilerplate
- Eliminates dual source-of-truth (form data in context vs. RHF internal state)
- Reduces boilerplate significantly — no custom reducer, no manual dispatch calls
- Better TypeScript integration — form values are fully typed via Zod schema inference

**Implementation outline:**

```ts
// /app/properties/new/page.tsx (Root component)
const form = useForm<CreatePropertyInput>({
  resolver: zodResolver(CreatePropertySchema),
  mode: 'onBlur',
})

const buildingsArray = useFieldArray({
  control: form.control,
  name: 'buildings',
})

const unitsArray = useFieldArray({
  control: form.control,
  name: 'units',
})

return (
  <FormProvider {...form}>
    {/* Step indicator and navigation — uses local useState */}
    <StepIndicator currentStep={step} onStepClick={setStep} />

    {/* Step components — access form via useFormContext and useFieldArray */}
    {step === 1 && <Step1GeneralInfo />}
    {step === 2 && <Step2Buildings />}
    {step === 3 && <Step3Units />}
  </FormProvider>
)
```

**Sub-component example:**

```ts
// /app/properties/new/step1-general-info.tsx
function Step1GeneralInfo() {
  const form = useFormContext<CreatePropertyInput>()
  // Use form.register, form.formState.errors, etc.
  return (
    // Input components using form.register('name'), form.register('type'), etc.
  )
}
```

**Array management example:**

```ts
// /app/properties/new/step2-buildings.tsx
function Step2Buildings() {
  const form = useFormContext<CreatePropertyInput>()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'buildings',
  })
  // Use fields.map(...), append(), remove(index) for dynamic list
}
```

### 4.5 Shared Validation

Frontend forms use **React Hook Form** + **Zod resolvers**, importing the same Zod schemas from `/lib/validators/`. No duplicated validation logic.

### 4.6 Error Handling

- API errors displayed inline near the relevant form section
- Global error boundary for unexpected errors
- Toast notifications for success/failure on submission

---

## 5. Non-Functional Requirements

- **No authentication** — out of scope; noted in README
- **TypeScript strict mode** throughout
- **Environment variables** — `DATABASE_URL`, `TEST_DATABASE_URL`, `OPENAI_API_KEY` documented in `.env.example`
- **README** must include:
  - Prerequisites (Node, Docker)
  - Setup: clone → install → env → docker compose up → migrate → seed
  - How to run the app
  - How to run unit tests
  - How to run integration tests
  - Note on auth omission and how it would be added in production

---

## 6. Out of Scope

- Authentication / authorization
- User management UI (users are seeded, not created via the app)
- Pagination on the dashboard
- Edit properties from the dashboard UI
- Real file storage (PDFs stored in `/tmp` for the duration of the extraction call only)
- Soft delete (`deletedAt`) — properties are hard-deleted or kept; no archiving needed for MVP