# Property Creation Wizard — Design Spec

**Date:** 2026-03-14
**Route:** `/properties/new`
**Status:** Approved

---

## 1. Overview

A 3-step wizard for creating a new property, rendered within the existing sidebar layout. Users progress through General Info → Buildings → Units, with optional AI-assisted pre-fill via PDF upload. The wizard submits a single `POST /api/properties` request on completion.

---

## 2. Packages to Install

- `react-hook-form@^7.54` — not currently installed; v7.54+ required for React 19 compatibility
- `@hookform/resolvers@^3.10` — v3.10+ required for Zod 4 support

---

## 3. File Structure

```
src/app/(app)/properties/new/
  page.tsx                          ← Server Component shell, renders wizard
  error.tsx                         ← Error boundary for unexpected errors

src/components/property-creation/
  property-creation-wizard.tsx      ← Root: useForm + FormProvider + step state
  step-indicator.tsx                ← Clickable step indicator (completed steps only)
  step1-general-info.tsx            ← General info fields + PDF upload
  step2-buildings.tsx               ← Buildings list with add/remove
  step3-units.tsx                   ← Inline editable unit table
  unit-table-row.tsx                ← Single row: Tab/Enter navigation, duplicate, delete
```

No new validators or API routes needed — reuse existing `CreatePropertySchema`, `CreateBuildingSchema`, `CreateUnitSchema` from `lib/validators/`.

---

## 4. Form State Architecture

**Approach: Single RHF form + FormProvider** (overrides PRD section 4.4 which specified React Context + useReducer).

**Rationale:** `CreatePropertySchema` already matches the API payload exactly, so form values can be submitted directly with no transformation. `useFieldArray` handles buildings and units arrays idiomatically. This eliminates the dual source-of-truth problem (RHF per-step + external reducer) and reduces boilerplate significantly.

```ts
// property-creation-wizard.tsx
const form = useForm<CreatePropertyInput>({
  resolver: zodResolver(CreatePropertySchema),
  defaultValues: {
    name: '',
    type: 'WEG',
    managerId: '',
    accountantId: '',
    declarationFileUrl: undefined,
    buildings: [newBuilding()],  // see newBuilding() definition below
    units: [],
  },
})

// Step state — local, not in form
const [step, setStep] = useState<1 | 2 | 3>(1)
const [highestStepReached, setHighestStepReached] = useState<1 | 2 | 3>(1)

// Extraction state — local, not in form
const [isExtracting, setIsExtracting] = useState(false)
const [extractionError, setExtractionError] = useState<string | null>(null)
```

Sub-components access form via `useFormContext<CreatePropertyInput>()`.

**`newBuilding()` helper** — produces a blank building with all required fields initialised:

```ts
function newBuilding() {
  return {
    clientId: crypto.randomUUID(),
    name: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    country: 'Germany',  // matches Zod .default('Germany'); field renders pre-filled
  }
}
```

---

## 5. Step Validation

Before advancing, `trigger()` is called with the fields relevant to the current step:

```ts
// Step 1 → Step 2
await form.trigger(['name', 'type', 'managerId', 'accountantId'])

// Step 2 → Step 3
await form.trigger(['buildings'])

// Step 3 → Submit: validate entire form (catches edits made after going back)
await form.trigger()
```

**Revalidation on edit:** Once `trigger()` has run, RHF's default `reValidateMode: 'onChange'` kicks in — fields revalidate as the user types. Going back to a completed step and breaking a field will surface the error inline in real time. "Next" always re-triggers the full step validation regardless.

---

## 6. Step Indicator

- Three steps shown as numbered nodes connected by a line
- **Completed steps** (strictly `< highestStepReached`): clickable, navigate directly without re-validating
- **Current step** (= `step`): active/highlighted, not clickable even if `highestStepReached` equals it
- **Future steps:** inactive, not clickable
- Going back does not re-validate; form data is preserved as-is
- **Safety:** the final Submit always calls `form.trigger()` (full form) — not just `['units']` — so any field broken by going back is caught before the API call regardless of which steps the user revisited

---

## 7. Layout

```
┌─ sidebar ─┬─────────────── main ─────────────────┐
│           │  h1: "New property"                   │
│           │  StepIndicator  (1 · 2 · 3)           │
│           │  ──────────────────────────────────   │
│           │  <Step content>                       │
│           │                                       │
│           │  [Back]              [Next / Submit]  │
└───────────┴──────────────────────────────────────┘
```

- "Back" button hidden on Step 1
- "Next" / "Submit" label changes on Step 3
- Both navigation buttons disabled during extraction or submission

---

## 8. Step 1 — General Info

### Validator update required

`CreatePropertySchema` in `lib/validators/property.ts` must have a `.refine()` added for the manager/accountant uniqueness rule — it is not yet present:

```ts
export const CreatePropertySchema = z.object({
  // ... existing fields
}).refine(data => data.managerId !== data.accountantId, {
  message: 'Manager and accountant must be different people',
  path: ['accountantId'],
})
```

### Fields

| Field | Component | Validation |
|-------|-----------|------------|
| Management type | `ToggleGroup` (WEG / MV) | required |
| Property name | `Input` | min 1 char |
| Manager | `Select` (from `useUsers()`) | required UUID |
| Accountant | `Select` (from `useUsers()`) | required UUID, must differ from manager |

Manager and accountant selects cross-filter: the selected manager is excluded from accountant options and vice versa. The `.refine()` error surfaces on the accountant field.

### RHF integration with Base UI primitives

Both `ToggleGroup` and `Select` are built on `@base-ui/react`, not Radix. They must be wired via RHF's `Controller`:

```tsx
// ToggleGroup (single-select) — onValueChange receives (groupValue: Value[], eventDetails)
// Only the first argument is used; TypeScript requires the second to be ignored with _
<Controller
  control={control}
  name="type"
  render={({ field }) => (
    <ToggleGroup
      value={field.value ? [field.value] : []}
      onValueChange={(vals, _) => field.onChange(vals[0] ?? '')}
    >
      <ToggleGroupItem value="WEG">WEG</ToggleGroupItem>
      <ToggleGroupItem value="MV">MV</ToggleGroupItem>
    </ToggleGroup>
  )}
/>

// Select — Base UI Select.Root accepts value + onValueChange + items prop.
// The items prop is required for SelectValue to display the selected label in the trigger.
// This matches the existing pattern in property-filters.tsx.
<Controller
  control={control}
  name="managerId"
  render={({ field }) => (
    <Select
      value={field.value}
      onValueChange={field.onChange}
      items={users.map(u => ({ value: u.id, label: u.name }))}
    >
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
      </SelectContent>
    </Select>
  )}
/>
```

This pattern matches the existing usage in `property-filters.tsx` where both components are already used with `value` / `onValueChange`.

### PDF Upload (Teilungserklärung)

- Styled file drop zone, `accept=".pdf"`, max 10MB (validated client-side)
- Upload is optional — user can skip and fill manually
- On file select:
  1. `POST /api/upload` (multipart `file` field) → `{ fileRef: string }` (UUID)
  2. `POST /api/extract` with body `{ fileRef }` → raw AI JSON (snake_case fields, building linked by name)
  3. Run `mapExtractionToForm(extraction)` → transforms to camelCase, generates `clientId` UUIDs for buildings, resolves unit `buildingClientId` by matching building name
  4. `form.setValue()` for `name`, `type`, `buildings`, `units` — all three steps updated at once
  5. `form.setValue('declarationFileUrl', fileRef)` — stores fileRef so it is included in the submission payload
- During extraction: spinner on upload zone, "Next" button disabled
- On success: green banner "Data extracted — please review and adjust if needed"
- On failure: red inline error message, manual entry remains fully available

**`mapExtractionToForm()` — required mapping helper** (handles snake_case → camelCase + clientId generation):

`ExtractionResult` is `z.infer<typeof ExtractionSchema>` from `src/app/api/extract/route.ts`. Export it from that file or redeclare it as a shared type in `src/types/`:

```ts
// src/app/api/extract/route.ts — add this export
export type ExtractionResult = z.infer<typeof ExtractionSchema>
```

```ts
function mapExtractionToForm(extraction: ExtractionResult): Partial<CreatePropertyInput> {
  const buildings = extraction.buildings.map(b => ({
    clientId: crypto.randomUUID(),
    name: b.name ?? undefined,
    street: b.street,
    houseNumber: b.house_number,
    postalCode: b.postal_code,
    city: b.city,
    country: b.country ?? 'Germany',
  }))

  const units = extraction.units.map(u => {
    const building = buildings.find(b => b.name === u.building) ?? buildings[0]
    return {
      buildingClientId: building.clientId,
      unitNumber: u.number,
      type: u.type.toUpperCase() as UnitType,
      floor: u.floor ?? undefined,
      size: u.size ?? undefined,
      entrance: u.entrance ?? undefined,
      coOwnershipShare: u.co_ownership_share ?? undefined,
      constructionYear: u.construction_year ?? undefined,
      rooms: u.rooms ?? undefined,
    }
  })

  return { name: extraction.property.name, type: extraction.property.type, buildings, units }
}
```

---

## 9. Step 2 — Buildings

Managed via `useFieldArray('buildings')`. Each building is assigned a `clientId` (uuid) at append time — units reference this via `buildingClientId`.

### Building Card

Each building renders as a `Card` with header `"Building {n}"` + remove button.

| Field | Component | Default | Validation |
|-------|-----------|---------|------------|
| Name | `Input` | — | optional |
| Street | `Input` | — | required |
| House number | `Input` | — | required |
| Postal code | `Input` | — | required |
| City | `Input` | — | required |
| Country | `Input` | `"Germany"` | required |

- Remove button hidden when only one building exists (minimum 1 required)
- "Add building" button appends a blank card with a new `clientId`
- **Removing a building** also removes all units with a matching `buildingClientId` via `form.setValue('units', filtered)`

---

## 10. Step 3 — Units Inline Editable Table

Managed via `useFieldArray('units')`. Units are grouped by building in the table.

### Table Columns

| Column | Input | Required |
|--------|-------|----------|
| Unit number | `Input` | ✓ |
| Type | `Select` (APARTMENT / OFFICE / GARDEN / PARKING) | ✓ |
| Floor | `Input` (number) | — |
| Entrance | `Input` | — |
| Size (sqm) | `Input` (number) | — |
| Co-ownership share | `Input` (number) | — |
| Construction year | `Input` (number) | — |
| Rooms | `Input` (number) | — |
| Actions | Icon buttons (hover reveal) | — |

- Table header is sticky (`position: sticky, top: 0`)
- Building group headings are rendered as non-sticky sub-headers between rows
- Rows with missing required fields get a red left border
- Validation errors surface on "Submit" click, not while typing

### Efficiency UX

| Interaction | Behaviour |
|-------------|-----------|
| `Tab` | Move to next cell; wraps to first cell of next row |
| `Enter` on last cell of a row | Append blank row below, focus its first cell |
| Hover row | Reveal `⧉` (duplicate) and `🗑` (delete) on right edge |
| Duplicate (`⧉`) | Insert copy immediately below; `unitNumber` cleared |
| "Add unit" button | Below each building group; appends blank row for that building |

---

## 11. Submission

```
form.trigger()   // full form — catches any field broken by back-navigation
  → valid → POST /api/properties with form.getValues()
    → 201 → toast.success('Property created') + router.push('/dashboard')
    → error → toast.error('Failed to create property') + inline error banner
  → invalid → errors shown inline, user stays on Step 3
```

- Submit button shows loading spinner and is disabled during request (prevents double-submit)
- No leave-page confirmation dialog (out of scope for MVP)

---

## 12. Error Handling

- Field-level errors: displayed via existing `Field` / `FieldError` components
- API errors: `toast.error` + inline banner below submit button
- Unexpected errors: `error.tsx` added to `(app)/properties/new/`
- Extraction errors: inline message in the upload zone (Step 1)

---

## 13. PRD Deviation

**Section 4.4 (Form State Management)** specified React Context + `useReducer`. This is replaced by **RHF + `FormProvider`** for the following reasons:

- `CreatePropertySchema` matches the API payload — no transformation needed on submit
- `useFieldArray` covers buildings and units arrays natively
- Eliminates dual source-of-truth (RHF fields + external reducer)
- Significantly less boilerplate
- Industry standard for multi-step RHF forms

The `prompts/buenita_prompt.md` PRD will be updated to reflect this decision.
