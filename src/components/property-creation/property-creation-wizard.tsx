'use client'

import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { CreatePropertySchema, type CreatePropertyInput, type CreatePropertyFormValues } from '@/lib/validators/property'
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

  const form = useForm<CreatePropertyFormValues, unknown, CreatePropertyInput>({
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

      if (res.status !== 201) throw new Error('Failed to create property')

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
      <div className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-8">
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
