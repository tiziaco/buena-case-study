'use client'

import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'

import { CreatePropertySchema, type CreatePropertyInput, type CreatePropertyFormValues } from '@/lib/validators/property'
import type { ExtractionResult } from '@/lib/validators/extraction'
import type { UnitType } from '@/generated/prisma/enums'
import { Button } from '@/components/ui/button'
import { useCreateProperty } from '@/hooks/use-properties'
import { useExtractFromPdf } from '@/hooks/use-extract-from-pdf'
import { StepIndicator } from './step-indicator'
import { Step1GeneralInfo } from './step1-general-info'
import { Step2Buildings } from './step2-buildings'
import { Step3Units } from './step3-units'

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
    return { name: extraction.property.name, type: extraction.property.type, managerName: extraction.manager_name ?? undefined, accountantName: extraction.accountant_name ?? undefined, buildings: [], units: [] }
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

  return { name: extraction.property.name, type: extraction.property.type, managerName: extraction.manager_name ?? undefined, accountantName: extraction.accountant_name ?? undefined, buildings, units }
}

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
  const { mutate, isPending: isSubmitting, isError: hasSubmitError } = useCreateProperty()

  const form = useForm<CreatePropertyFormValues, unknown, CreatePropertyInput>({
    resolver: zodResolver(CreatePropertySchema),
    defaultValues: {
      name: '',
      type: 'WEG',
      managerName: '',
      accountantName: '',
      declarationFileUrl: undefined,
      buildings: [newBuilding()],
      units: [],
    },
  })

  const {
    mutate: extract,
    isPending: isExtracting,
    isSuccess: extractionSuccess,
    isError: hasExtractionError,
    error: extractionError,
  } = useExtractFromPdf(({ extraction, fileRef }) => {
    const mapped = mapExtractionToForm(extraction)
    if (mapped.name) form.setValue('name', mapped.name)
    if (mapped.type) form.setValue('type', mapped.type)
    if (mapped.managerName) form.setValue('managerName', mapped.managerName)
    if (mapped.accountantName) form.setValue('accountantName', mapped.accountantName)
    if (mapped.buildings) form.setValue('buildings', mapped.buildings)
    if (mapped.units) form.setValue('units', mapped.units)
    form.setValue('declarationFileUrl', fileRef)
  })

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [highestStepReached, setHighestStepReached] = useState<1 | 2 | 3>(1)

  async function handleNext() {
    let valid = false

    if (step === 1) {
      valid = await form.trigger(['name', 'type', 'managerName', 'accountantName'])
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
    mutate(form.getValues() as CreatePropertyInput)
  }

  const isDisabled = isExtracting || isSubmitting

  return (
    <FormProvider {...form}>
      <div className="mx-auto max-w-4xl px-4 flex flex-col gap-8">
        <h1 className="text-2xl font-semibold">New property</h1>

        <div className="mx-auto w-full max-w-2xl">
          <StepIndicator
            step={step}
            highestStepReached={highestStepReached}
            onStepClick={(s) => setStep(s)}
          />
        </div>

        <div className="flex flex-col gap-6">
          {step === 1 && (
            <Step1GeneralInfo
              onFile={extract}
              isExtracting={isExtracting}
              extractionSuccess={extractionSuccess}
              extractionError={hasExtractionError ? extractionError?.message : undefined}
            />
          )}
          {step === 2 && <Step2Buildings />}
          {step === 3 && <Step3Units />}
        </div>

        {hasSubmitError && (
          <p className="text-sm text-destructive">Failed to create property. Please try again.</p>
        )}

        <div className="sticky bottom-0 -mx-4 flex items-center justify-between border-t border-border/40 bg-background/80 px-4 pt-2 backdrop-blur-sm">
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
