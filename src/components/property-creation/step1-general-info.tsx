'use client'

import { useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { CheckCircle2, X } from 'lucide-react'

import type { CreatePropertyFormValues } from '@/lib/validators/property'
import type { ExtractionResult } from '@/lib/validators/extraction'
import type { UnitType } from '@/generated/prisma/enums'
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
import { Field, FieldTitle, FieldError } from '@/components/ui/field'
import { UploadZone } from './upload-zone'

// ─── Extraction helper ────────────────────────────────────────────────────────

function mapExtractionToForm(extraction: ExtractionResult): Partial<CreatePropertyFormValues> {
  const buildings = extraction.buildings.map((b) => ({
    clientId: crypto.randomUUID(),
    name: b.name ?? undefined,
    street: b.street,
    houseNumber: b.house_number,
    postalCode: b.postal_code,
    city: b.city,
    country: b.country ?? 'Germany',
  }))

  if (!buildings.length) {
    return { name: extraction.property.name, type: extraction.property.type, buildings: [], units: [] }
  }

  const units = extraction.units.map((u) => {
    const building = buildings.find((b) => b.name === u.building) ?? buildings[0]
    return {
      buildingClientId: building.clientId,
      unitNumber: u.number,
      type: u.type.toUpperCase() as UnitType,
      floor: u.floor ?? undefined,
      size: u.size != null && u.size > 0 ? u.size : undefined,
      entrance: u.entrance ?? undefined,
      coOwnershipShare: u.co_ownership_share != null && u.co_ownership_share > 0 ? u.co_ownership_share : undefined,
      constructionYear: u.construction_year ?? undefined,
      rooms: u.rooms != null && u.rooms > 0 ? u.rooms : undefined,
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
  } = useFormContext<CreatePropertyFormValues>()

  const { data: users = [] } = useUsers()

  const watchedManagerId = watch('managerId')
  const watchedAccountantId = watch('accountantId')

  const managerOptions = users.filter((u) => u.id !== watchedAccountantId)
  const accountantOptions = users.filter((u) => u.id !== watchedManagerId)

  const [file, setFile] = useState<File | null>(null)
  const [extractionSuccess, setExtractionSuccess] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)

  async function handleFile(f: File) {
    if (f.size > 10 * 1024 * 1024) {
      setExtractionError('File is too large. Maximum size is 10 MB.')
      return
    }

    setFile(f)
    setIsExtracting(true)
    setExtractionError(null)
    setExtractionSuccess(false)

    try {
      const formData = new FormData()
      formData.append('file', f)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { data: { fileRef } } = await uploadRes.json()

      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileRef }),
      })
      if (!extractRes.ok) throw new Error('Extraction failed')
      const { data: extraction } = await extractRes.json() as { data: ExtractionResult }

      const mapped = mapExtractionToForm(extraction)
      if (mapped.name) setValue('name', mapped.name)
      if (mapped.type) setValue('type', mapped.type)
      if (mapped.buildings) setValue('buildings', mapped.buildings)
      if (mapped.units) setValue('units', mapped.units)
      setValue('declarationFileUrl', fileRef)

      setExtractionSuccess(true)
    } catch {
      setExtractionError('Could not extract data from the PDF. Please fill in the fields manually.')
      setFile(null)
    } finally {
      setIsExtracting(false)
    }
  }

  function handleClear() {
    setFile(null)
    setExtractionSuccess(false)
    setExtractionError(null)
    setValue('declarationFileUrl', '')
  }

  return (
    <div className="flex flex-col gap-6">

      {/* PDF Upload — primary action */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">Auto-fill from PDF</p>
          <p className="text-xs text-muted-foreground">
            Upload the Teilungserklärung to populate all fields automatically.
          </p>
        </div>

        <UploadZone
          file={file}
          isExtracting={isExtracting}
          onFile={handleFile}
          onClear={handleClear}
        />

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
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or fill in manually</span>
        <div className="h-px flex-1 bg-border" />
      </div>

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

    </div>
  )
}
