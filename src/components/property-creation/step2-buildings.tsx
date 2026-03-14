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
