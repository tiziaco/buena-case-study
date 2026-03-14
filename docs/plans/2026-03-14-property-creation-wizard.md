# Property Creation Wizard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 3-step wizard at `/properties/new` (General Info → Buildings → Units) that submits `POST /api/properties` on completion.

**Architecture:** Single RHF `useForm` + `FormProvider` at the wizard root; sub-components access the form via `useFormContext`. `useFieldArray` manages `buildings[]` and `units[]`. Step state is local `useState`, not in the form.

**Tech Stack:** Next.js 16 App Router, React 19, React Hook Form 7.54+, `@hookform/resolvers` 3.10+ (Zod 4), Zod 4, TanStack Query v5, Base UI `@base-ui/react`, shadcn/ui (base-maia variant), Sonner toasts.

> **Note on testing:** No frontend testing infrastructure exists in this project (vitest is backend-only). Each task's "verify" step uses `npx tsc --noEmit` for type safety and describes manual browser checks.

---

## Chunk 1: Setup & Preconditions

### Task 1: Install required packages

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install react-hook-form and @hookform/resolvers**

```bash
npm install react-hook-form@^7.54 @hookform/resolvers@^3.10
```

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install react-hook-form and @hookform/resolvers"
```

---

### Task 2: Export ExtractionResult type

**Files:**
- Modify: `src/app/api/extract/route.ts`

- [ ] **Step 1: Add the export at the bottom of the file, after the ExtractionSchema definition (line 36)**

In `src/app/api/extract/route.ts`, after the closing `})` of `ExtractionSchema` (line 36), add:

```ts
export type ExtractionResult = z.infer<typeof ExtractionSchema>
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/extract/route.ts
git commit -m "feat: export ExtractionResult type from extract route"
```

---

### Task 3: Add manager/accountant uniqueness refine to CreatePropertySchema

**Files:**
- Modify: `src/lib/validators/property.ts`

- [ ] **Step 1: Add the `.refine()` call**

Replace the `CreatePropertySchema` definition in `src/lib/validators/property.ts`:

```ts
export const CreatePropertySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['WEG', 'MV']),
  managerId: z.uuid(),
  accountantId: z.uuid(),
  declarationFileUrl: z.string().optional(),
  buildings: z.array(CreateBuildingSchema.extend({ clientId: z.uuid() })).min(1),
  units: z.array(CreateUnitSchema),
}).refine(data => data.managerId !== data.accountantId, {
  message: 'Manager and accountant must be different people',
  path: ['accountantId'],
})
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/validators/property.ts
git commit -m "feat: add manager/accountant uniqueness validation to CreatePropertySchema"
```

---

### Task 4: Update PRD to reflect RHF decision

**Files:**
- Modify: `prompts/buenita_prompt.md` (section 4.4)

- [ ] **Step 1: Find section 4.4 in the PRD and update it**

Locate the section describing form state management (section 4.4) and replace the React Context + useReducer description with:

```
**Form State Management:** Single React Hook Form instance at the wizard root using
`useForm<CreatePropertyInput>` + `FormProvider`. Sub-components access the form via
`useFormContext`. `useFieldArray` manages `buildings[]` and `units[]` arrays.
Step navigation state is local `useState` (not in the form). This was chosen over
React Context + useReducer because `CreatePropertySchema` matches the API payload
exactly, `useFieldArray` handles arrays idiomatically, and it eliminates dual
source-of-truth between RHF and an external reducer.
```

- [ ] **Step 2: Commit**

```bash
git add prompts/buenita_prompt.md
git commit -m "docs: update PRD section 4.4 to reflect RHF + FormProvider decision"
```

---

## Chunk 2: Page Shell & Wizard Root

### Task 5: Create page route files

**Files:**
- Create: `src/app/(app)/properties/new/page.tsx`
- Create: `src/app/(app)/properties/new/error.tsx`

- [ ] **Step 1: Create `src/app/(app)/properties/new/page.tsx`**

```tsx
import { PropertyCreationWizard } from '@/components/property-creation/property-creation-wizard'

export default function NewPropertyPage() {
  return <PropertyCreationWizard />
}
```

- [ ] **Step 2: Create `src/app/(app)/properties/new/error.tsx`**

Mirror the existing `src/app/(app)/dashboard/error.tsx` pattern:

```tsx
'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function NewPropertyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    toast.error('Something went wrong loading the property form.')
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        We couldn&apos;t load the property form. Please try again.
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

Note: `PropertyCreationWizard` does not exist yet — TypeScript will error. That is expected; it will be resolved in the next task. Skip this check until Task 6 is done.

---

### Task 6: Create PropertyCreationWizard root component

**Files:**
- Create: `src/components/property-creation/property-creation-wizard.tsx`

This component owns: `useForm`, `FormProvider`, step state, navigation logic, submission.

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { CreatePropertySchema, type CreatePropertyInput } from '@/lib/validators/property'
import { Button } from '@/components/ui/button'
import { StepIndicator } from './step-indicator'
import { Step1GeneralInfo } from './step1-general-info'
import { Step2Buildings } from './step2-buildings'
import { Step3Units } from './step3-units'

function newBuilding() {
  return {
    clientId: crypto.randomUUID(),
    name: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    country: 'Germany',
  }
}

export function PropertyCreationWizard() {
  const router = useRouter()

  const form = useForm<CreatePropertyInput>({
    resolver: zodResolver(CreatePropertySchema),
    defaultValues: {
      name: '',
      type: 'WEG',
      managerId: '',
      accountantId: '',
      declarationFileUrl: undefined,
      buildings: [newBuilding()],
      units: [],
    },
  })

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [highestStepReached, setHighestStepReached] = useState<1 | 2 | 3>(1)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleNext() {
    let valid = false

    if (step === 1) {
      valid = await form.trigger(['name', 'type', 'managerId', 'accountantId'])
    } else if (step === 2) {
      valid = await form.trigger(['buildings'])
    }

    if (!valid) return

    const next = (step + 1) as 2 | 3
    setStep(next)
    if (next > highestStepReached) setHighestStepReached(next)
  }

  function handleBack() {
    setStep((s) => (s - 1) as 1 | 2)
  }

  async function handleSubmit() {
    const valid = await form.trigger()
    if (!valid) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.getValues()),
      })

      if (!res.ok) throw new Error('Failed to create property')

      toast.success('Property created')
      router.push('/dashboard')
    } catch {
      toast.error('Failed to create property')
      setSubmitError('Failed to create property. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled = isExtracting || isSubmitting

  return (
    <FormProvider {...form}>
      <div className="mx-auto max-w-3xl px-4 py-8 flex flex-col gap-8">
        <h1 className="text-2xl font-semibold">New property</h1>

        <StepIndicator
          step={step}
          highestStepReached={highestStepReached}
          onStepClick={(s) => setStep(s)}
        />

        <div className="flex flex-col gap-6">
          {step === 1 && (
            <Step1GeneralInfo
              isExtracting={isExtracting}
              setIsExtracting={setIsExtracting}
            />
          )}
          {step === 2 && <Step2Buildings />}
          {step === 3 && <Step3Units />}
        </div>

        {submitError && (
          <p className="text-sm text-destructive">{submitError}</p>
        )}

        <div className="flex items-center justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} disabled={isDisabled}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button onClick={handleNext} disabled={isDisabled}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isDisabled}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          )}
        </div>
      </div>
    </FormProvider>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

Note: Step sub-components don't exist yet, so errors are expected until Tasks 8–12 are done.

---

### Task 7: Create StepIndicator component

**Files:**
- Create: `src/components/property-creation/step-indicator.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { cn } from '@/lib/utils'

const STEPS = [
  { n: 1 as const, label: 'General Info' },
  { n: 2 as const, label: 'Buildings' },
  { n: 3 as const, label: 'Units' },
]

interface StepIndicatorProps {
  step: 1 | 2 | 3
  highestStepReached: 1 | 2 | 3
  onStepClick: (step: 1 | 2 | 3) => void
}

export function StepIndicator({ step, highestStepReached, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map(({ n, label }, i) => {
        const isCompleted = n < highestStepReached
        const isCurrent = n === step
        const isClickable = isCompleted

        return (
          <div key={n} className="flex items-center gap-0">
            {/* Connector line before step (not before first) */}
            {i > 0 && (
              <div
                className={cn(
                  'h-px w-12',
                  isCompleted || isCurrent ? 'bg-primary' : 'bg-border'
                )}
              />
            )}

            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(n)}
              className={cn(
                'flex flex-col items-center gap-1.5 group',
                isClickable ? 'cursor-pointer' : 'cursor-default'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                  isCurrent && 'border-primary bg-primary text-primary-foreground',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  !isCurrent && !isCompleted && 'border-border text-muted-foreground'
                )}
              >
                {n}
              </div>
              <span
                className={cn(
                  'text-xs',
                  isCurrent || isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit (Tasks 5–7 together)**

```bash
git add src/app/(app)/properties/new/ src/components/property-creation/
git commit -m "feat: add property creation page shell, wizard root, and step indicator"
```

---

## Chunk 3: Step 1 — General Info

### Task 8: Create Step1GeneralInfo — form fields

**Files:**
- Create: `src/components/property-creation/step1-general-info.tsx`

This step renders: management type toggle, property name input, manager select, accountant select, and PDF upload zone. The upload zone is added in Task 9.

- [ ] **Step 1: Create the file with form fields**

```tsx
'use client'

import { useFormContext, Controller } from 'react-hook-form'
import { Upload, X, CheckCircle2, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'

import type { CreatePropertyInput } from '@/lib/validators/property'
import type { ExtractionResult } from '@/app/api/extract/route'
import { useUsers } from '@/hooks/use-users'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Field, FieldLabel, FieldTitle, FieldError } from '@/components/ui/field'
import type { UnitType } from '@/generated/prisma/enums'

// ─── Extraction helper ────────────────────────────────────────────────────────

function mapExtractionToForm(extraction: ExtractionResult): Partial<CreatePropertyInput> {
  const buildings = extraction.buildings.map((b) => ({
    clientId: crypto.randomUUID(),
    name: b.name ?? undefined,
    street: b.street,
    houseNumber: b.house_number,
    postalCode: b.postal_code,
    city: b.city,
    country: b.country ?? 'Germany',
  }))

  const units = extraction.units.map((u) => {
    const building = buildings.find((b) => b.name === u.building) ?? buildings[0]
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

  return {
    name: extraction.property.name,
    type: extraction.property.type,
    buildings,
    units,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Step1GeneralInfoProps {
  isExtracting: boolean
  setIsExtracting: (v: boolean) => void
}

export function Step1GeneralInfo({ isExtracting, setIsExtracting }: Step1GeneralInfoProps) {
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<CreatePropertyInput>()

  const { data: users = [] } = useUsers()

  const watchedManagerId = watch('managerId')
  const watchedAccountantId = watch('accountantId')

  const managerOptions = users.filter((u) => u.id !== watchedAccountantId)
  const accountantOptions = users.filter((u) => u.id !== watchedManagerId)

  const [extractionSuccess, setExtractionSuccess] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side size check: 10 MB max
    if (file.size > 10 * 1024 * 1024) {
      setExtractionError('File is too large. Maximum size is 10 MB.')
      return
    }

    setExtracting(true)
    setExtractionError(null)
    setExtractionSuccess(false)

    try {
      // Step 1: upload the file
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { data: { fileRef } } = await uploadRes.json()

      // Step 2: extract structured data from the PDF
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileRef }),
      })
      if (!extractRes.ok) throw new Error('Extraction failed')
      const { data: extraction } = await extractRes.json() as { data: ExtractionResult }

      // Step 3: map and apply to form
      const mapped = mapExtractionToForm(extraction)
      if (mapped.name) setValue('name', mapped.name)
      if (mapped.type) setValue('type', mapped.type)
      if (mapped.buildings) setValue('buildings', mapped.buildings)
      if (mapped.units) setValue('units', mapped.units)
      setValue('declarationFileUrl', fileRef)

      setExtractionSuccess(true)
    } catch {
      setExtractionError('Could not extract data from the PDF. Please fill in the fields manually.')
    } finally {
      setExtracting(false)
      // Reset the input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function setExtracting(v: boolean) {
    setIsExtracting(v)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Management type */}
      <Field>
        <FieldTitle>Management type</FieldTitle>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <ToggleGroup
              variant="outline"
              value={field.value ? [field.value] : []}
              onValueChange={(vals, _) => field.onChange(vals[0] ?? '')}
            >
              <ToggleGroupItem value="WEG">WEG</ToggleGroupItem>
              <ToggleGroupItem value="MV">MV</ToggleGroupItem>
            </ToggleGroup>
          )}
        />
        {errors.type && <FieldError errors={[errors.type]} />}
      </Field>

      {/* Property name */}
      <Field>
        <FieldTitle>Property name</FieldTitle>
        <Input {...register('name')} placeholder="e.g. Musterstraße WEG" />
        {errors.name && <FieldError errors={[errors.name]} />}
      </Field>

      {/* Manager */}
      <Field>
        <FieldTitle>Manager</FieldTitle>
        <Controller
          control={control}
          name="managerId"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              items={managerOptions.map((u) => ({ value: u.id, label: u.name }))}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {managerOptions.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.managerId && <FieldError errors={[errors.managerId]} />}
      </Field>

      {/* Accountant */}
      <Field>
        <FieldTitle>Accountant</FieldTitle>
        <Controller
          control={control}
          name="accountantId"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              items={accountantOptions.map((u) => ({ value: u.id, label: u.name }))}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select accountant" />
              </SelectTrigger>
              <SelectContent>
                {accountantOptions.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.accountantId && <FieldError errors={[errors.accountantId]} />}
      </Field>

      {/* PDF Upload */}
      <Field>
        <FieldTitle>Teilungserklärung (optional)</FieldTitle>
        <div className="relative">
          <label
            htmlFor="pdf-upload"
            className={[
              'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors cursor-pointer',
              isExtracting
                ? 'border-border bg-muted/30 cursor-not-allowed'
                : 'border-border hover:border-primary/50 hover:bg-muted/20',
            ].join(' ')}
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Extracting data from PDF…</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Upload PDF to auto-fill</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF up to 10 MB</p>
                </div>
              </>
            )}
          </label>
          <input
            ref={fileInputRef}
            id="pdf-upload"
            type="file"
            accept=".pdf"
            disabled={isExtracting}
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>

        {extractionSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Data extracted — please review and adjust if needed
          </div>
        )}

        {extractionError && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <X className="h-4 w-4 shrink-0" />
            {extractionError}
          </div>
        )}
      </Field>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/property-creation/step1-general-info.tsx
git commit -m "feat: implement Step 1 — general info with PDF upload and extraction"
```

---

## Chunk 4: Step 2 — Buildings

### Task 9: Create Step2Buildings component

**Files:**
- Create: `src/components/property-creation/step2-buildings.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'

import type { CreatePropertyInput } from '@/lib/validators/property'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card'
import { Field, FieldTitle, FieldError } from '@/components/ui/field'

function newBuilding() {
  return {
    clientId: crypto.randomUUID(),
    name: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    country: 'Germany',
  }
}

export function Step2Buildings() {
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<CreatePropertyInput>()

  const { fields, append, remove } = useFieldArray({ control, name: 'buildings' })

  function removeBuilding(index: number) {
    const buildingClientId = fields[index].clientId
    // Remove all units belonging to this building
    const currentUnits = watch('units')
    setValue(
      'units',
      currentUnits.filter((u) => u.buildingClientId !== buildingClientId)
    )
    remove(index)
  }

  return (
    <div className="flex flex-col gap-4">
      {fields.map((field, index) => (
        <Card key={field.id}>
          <CardHeader>
            <CardTitle>Building {index + 1}</CardTitle>
            {fields.length > 1 && (
              <CardAction>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBuilding(index)}
                  aria-label={`Remove building ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Name (optional) */}
            <Field>
              <FieldTitle>Name (optional)</FieldTitle>
              <Input
                {...register(`buildings.${index}.name`)}
                placeholder="e.g. Haus A"
              />
            </Field>

            {/* Street + House number */}
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Field>
                <FieldTitle>Street</FieldTitle>
                <Input
                  {...register(`buildings.${index}.street`)}
                  placeholder="e.g. Musterstraße"
                />
                {errors.buildings?.[index]?.street && (
                  <FieldError errors={[errors.buildings[index].street]} />
                )}
              </Field>
              <Field>
                <FieldTitle>House no.</FieldTitle>
                <Input
                  {...register(`buildings.${index}.houseNumber`)}
                  placeholder="e.g. 12"
                  className="w-24"
                />
                {errors.buildings?.[index]?.houseNumber && (
                  <FieldError errors={[errors.buildings[index].houseNumber]} />
                )}
              </Field>
            </div>

            {/* Postal code + City */}
            <div className="grid grid-cols-[auto_1fr] gap-3">
              <Field>
                <FieldTitle>Postal code</FieldTitle>
                <Input
                  {...register(`buildings.${index}.postalCode`)}
                  placeholder="e.g. 80331"
                  className="w-32"
                />
                {errors.buildings?.[index]?.postalCode && (
                  <FieldError errors={[errors.buildings[index].postalCode]} />
                )}
              </Field>
              <Field>
                <FieldTitle>City</FieldTitle>
                <Input
                  {...register(`buildings.${index}.city`)}
                  placeholder="e.g. München"
                />
                {errors.buildings?.[index]?.city && (
                  <FieldError errors={[errors.buildings[index].city]} />
                )}
              </Field>
            </div>

            {/* Country */}
            <Field>
              <FieldTitle>Country</FieldTitle>
              <Input
                {...register(`buildings.${index}.country`)}
                placeholder="Germany"
              />
              {errors.buildings?.[index]?.country && (
                <FieldError errors={[errors.buildings[index].country]} />
              )}
            </Field>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => append(newBuilding())}
        className="w-fit"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add building
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/property-creation/step2-buildings.tsx
git commit -m "feat: implement Step 2 — buildings field array with add/remove"
```

---

## Chunk 5: Step 3 — Units

### Task 10: Create UnitTableRow component

**Files:**
- Create: `src/components/property-creation/unit-table-row.tsx`

Each row renders a single unit in the table. Handles Tab wrapping, Enter to append, duplicate, and delete.

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useRef } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Copy, Trash2 } from 'lucide-react'

import type { CreatePropertyInput } from '@/lib/validators/property'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const UNIT_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'GARDEN', label: 'Garden' },
  { value: 'PARKING', label: 'Parking' },
] as const

interface UnitTableRowProps {
  index: number
  isLastInGroup: boolean
  hasError: boolean
  onDuplicate: (index: number) => void
  onDelete: (index: number) => void
  onAppendRow: (buildingClientId: string) => void
}

export function UnitTableRow({
  index,
  isLastInGroup,
  hasError,
  onDuplicate,
  onDelete,
  onAppendRow,
}: UnitTableRowProps) {
  const { register, control, watch } = useFormContext<CreatePropertyInput>()
  const buildingClientId = watch(`units.${index}.buildingClientId`)
  const rowRef = useRef<HTMLTableRowElement>(null)

  // CELL_COUNT = number of focusable cells in a row (unitNumber, type, floor, entrance, size, coOwnershipShare, constructionYear, rooms)
  const CELL_COUNT = 8

  function handleKeyDown(cellIndex: number, e: React.KeyboardEvent) {
    if (e.key === 'Tab' && !e.shiftKey) {
      if (cellIndex === CELL_COUNT - 1) {
        // Last cell: if Enter or Tab out of last cell of group, append a new row
        if (isLastInGroup) {
          e.preventDefault()
          onAppendRow(buildingClientId)
        }
      }
    }

    if (e.key === 'Enter' && cellIndex === CELL_COUNT - 1) {
      e.preventDefault()
      onAppendRow(buildingClientId)
    }
  }

  function getInputProps(cellIndex: number) {
    return {
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(cellIndex, e),
    }
  }

  return (
    <tr
      ref={rowRef}
      data-unit-row
      className={cn(
        'group/row border-b transition-colors hover:bg-muted/30',
        hasError && 'border-l-2 border-l-destructive'
      )}
    >
      {/* Unit number */}
      <td className="px-2 py-1.5">
        <Input
          {...register(`units.${index}.unitNumber`)}
          {...getInputProps(0)}
          className="h-8 min-w-16"
          placeholder="01"
        />
      </td>

      {/* Type */}
      <td className="px-2 py-1.5">
        <Controller
          control={control}
          name={`units.${index}.type`}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              items={UNIT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            >
              <SelectTrigger className="h-8 w-32" onKeyDown={(e) => handleKeyDown(1, e)}>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </td>

      {/* Floor */}
      <td className="px-2 py-1.5">
        <Input
          {...register(`units.${index}.floor`, { setValueAs: (v) => v === '' ? undefined : Number(v) })}
          {...getInputProps(2)}
          type="number"
          className="h-8 w-16"
          placeholder="0"
        />
      </td>

      {/* Entrance */}
      <td className="px-2 py-1.5">
        <Input
          {...register(`units.${index}.entrance`)}
          {...getInputProps(3)}
          className="h-8 w-24"
          placeholder="A"
        />
      </td>

      {/* Size */}
      <td className="px-2 py-1.5">
        <Input
          {...register(`units.${index}.size`, { setValueAs: (v) => v === '' ? undefined : Number(v) })}
          {...getInputProps(4)}
          type="number"
          className="h-8 w-20"
          placeholder="75.5"
        />
      </td>

      {/* Co-ownership share */}
      <td className="px-2 py-1.5">
        <Input
          {...register(`units.${index}.coOwnershipShare`, { setValueAs: (v) => v === '' ? undefined : Number(v) })}
          {...getInputProps(5)}
          type="number"
          step="0.001"
          className="h-8 w-24"
          placeholder="0.11"
        />
      </td>

      {/* Construction year */}
      <td className="px-2 py-1.5">
        <Input
          {...register(`units.${index}.constructionYear`, { setValueAs: (v) => v === '' ? undefined : Number(v) })}
          {...getInputProps(6)}
          type="number"
          className="h-8 w-24"
          placeholder="2005"
        />
      </td>

      {/* Rooms */}
      <td className="px-2 py-1.5">
        <Input
          {...register(`units.${index}.rooms`, { setValueAs: (v) => v === '' ? undefined : Number(v) })}
          {...getInputProps(7)}
          type="number"
          step="0.5"
          className="h-8 w-16"
          placeholder="3"
        />
      </td>

      {/* Actions */}
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/row:opacity-100">
          <button
            type="button"
            onClick={() => onDuplicate(index)}
            className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Duplicate row"
            aria-label="Duplicate unit"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(index)}
            className="rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            title="Delete row"
            aria-label="Delete unit"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

---

### Task 11: Create Step3Units component

**Files:**
- Create: `src/components/property-creation/step3-units.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import React from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Plus } from 'lucide-react'

import type { CreatePropertyInput } from '@/lib/validators/property'
import { Button } from '@/components/ui/button'
import { UnitTableRow } from './unit-table-row'

export function Step3Units() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<CreatePropertyInput>()

  const { fields, append, insert, remove } = useFieldArray({ control, name: 'units' })

  const buildings = watch('buildings')

  function newUnit(buildingClientId: string) {
    return {
      buildingClientId,
      unitNumber: '',
      type: 'APARTMENT' as const,
      floor: undefined,
      entrance: undefined,
      size: undefined,
      coOwnershipShare: undefined,
      constructionYear: undefined,
      rooms: undefined,
    }
  }

  function handleDuplicate(index: number) {
    const original = fields[index]
    const copy = {
      buildingClientId: original.buildingClientId,
      unitNumber: '',  // clear unit number on duplicate
      type: original.type,
      floor: original.floor,
      entrance: original.entrance,
      size: original.size,
      coOwnershipShare: original.coOwnershipShare,
      constructionYear: original.constructionYear,
      rooms: original.rooms,
    }
    insert(index + 1, copy)
  }

  function handleAppendRow(buildingClientId: string) {
    append(newUnit(buildingClientId))
    // Focus the first cell of the newly added row after render
    setTimeout(() => {
      const rows = document.querySelectorAll('tr[data-unit-row]')
      const lastRow = rows[rows.length - 1]
      const firstInput = lastRow?.querySelector('input')
      if (firstInput instanceof HTMLElement) firstInput.focus()
    }, 50)
  }

  return (
    <div className="flex flex-col gap-6">
      {buildings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No buildings added yet. Go back and add at least one building.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 sticky top-0 z-10">
                <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Unit no.</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Type</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Floor</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Entrance</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Size (m²)</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Co-own. share</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Const. year</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Rooms</th>
                <th className="px-2 py-2 w-16" />
              </tr>
            </thead>
            <tbody>
              {buildings.map((building, buildingIndex) => {
                const buildingUnits = fields
                  .map((field, index) => ({ field, index }))
                  .filter(({ field }) => field.buildingClientId === building.clientId)

                return (
                  <React.Fragment key={building.clientId}>
                    {/* Building group sub-header */}
                    <tr className="bg-muted/20">
                      <td
                        colSpan={9}
                        className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                      >
                        {building.name || `Building ${buildingIndex + 1}`}
                      </td>
                    </tr>

                    {buildingUnits.map(({ field, index }, groupIndex) => (
                      <UnitTableRow
                        key={field.id}
                        index={index}
                        isLastInGroup={groupIndex === buildingUnits.length - 1}
                        hasError={!!errors.units?.[index]}
                        onDuplicate={handleDuplicate}
                        onDelete={remove}
                        onAppendRow={handleAppendRow}
                      />
                    ))}

                    {/* Add unit button for this building */}
                    <tr>
                      <td colSpan={9} className="px-2 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => append(newUnit(building.clientId))}
                          className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add unit
                        </Button>
                      </td>
                    </tr>
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {errors.units && !Array.isArray(errors.units) && (
        <p className="text-sm text-destructive">{errors.units.message}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors (all components are now implemented).

- [ ] **Step 3: Commit**

```bash
git add src/components/property-creation/unit-table-row.tsx src/components/property-creation/step3-units.tsx
git commit -m "feat: implement Step 3 — inline editable units table with keyboard navigation"
```

---

## Chunk 6: Final Verification

### Task 12: Full TypeScript check and manual smoke test

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Run the dev server**

```bash
npm run dev
```

- [ ] **Step 3: Manual smoke test — happy path**

1. Navigate to `http://localhost:3000/properties/new`
2. **Step 1:** Select WEG type, enter a property name, select different manager and accountant → click Next
3. Verify step indicator shows Step 1 as completed (clickable), Step 2 as current
4. **Step 2:** Default building is pre-populated with Germany; fill street, house number, postal code, city → click Next
5. Click "Add building" → verify a second building card appears with all fields editable
6. Remove the second building → verify it disappears
7. Click Next
8. **Step 3:** Click "Add unit" → verify a row appears under the building group
9. Fill unit number and type → Tab through cells → verify Tab wraps to next row on last cell
10. On the last cell of the last row, press Enter → verify a new row is appended
11. Hover a row → verify duplicate (⧉) and delete (🗑) icons appear
12. Click Submit → verify toast "Property created" appears and redirects to `/dashboard`

- [ ] **Step 4: Manual smoke test — validation**

1. Go to Step 1, leave fields empty, click Next → verify inline errors appear
2. Select same user for manager and accountant → click Next → verify "Manager and accountant must be different people" error on accountant field
3. Go back to Step 1 after completing Step 2 → break a field → click Next → verify error appears
4. Try to submit with an empty required unit field → verify the row gets a red left border and submission is blocked

- [ ] **Step 5: Manual smoke test — PDF extraction (optional, requires actual PDF)**

1. Upload a valid Teilungserklärung PDF
2. Verify spinner appears on the upload zone and Next is disabled
3. On success: verify green "Data extracted" banner and form fields are pre-filled
4. On failure: verify red error message and manual entry still works

- [ ] **Step 6: Commit all remaining files**

```bash
git add -A
git commit -m "feat: complete property creation wizard at /properties/new"
```
