'use client'

import { useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { CheckCircle2, X } from 'lucide-react'

import type { CreatePropertyFormValues } from '@/lib/validators/property'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Field, FieldTitle, FieldError } from '@/components/ui/field'
import { UploadZone } from './upload-zone'

interface Step1GeneralInfoProps {
  onFile: (file: File) => void
  isExtracting: boolean
  extractionSuccess: boolean
  extractionError: string | undefined
}

export function Step1GeneralInfo({ onFile, isExtracting, extractionSuccess, extractionError }: Step1GeneralInfoProps) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<CreatePropertyFormValues>()

  const [file, setFile] = useState<File | null>(null)

  function handleFile(f: File) {
    setFile(f)
    onFile(f)
  }

  function handleClear() {
    setFile(null)
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
        <Input {...register('managerName')} placeholder="e.g. Anna Müller" />
        {errors.managerName && <FieldError errors={[errors.managerName]} />}
      </Field>

      {/* Accountant */}
      <Field>
        <FieldTitle>Accountant</FieldTitle>
        <Input {...register('accountantName')} placeholder="e.g. Thomas Berger" />
        {errors.accountantName && <FieldError errors={[errors.accountantName]} />}
      </Field>

    </div>
  )
}
