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
    insert(index + 1, {
      buildingClientId: original.buildingClientId,
      unitNumber: '',
      type: original.type,
      floor: original.floor,
      entrance: original.entrance,
      size: original.size,
      coOwnershipShare: original.coOwnershipShare,
      constructionYear: original.constructionYear,
      rooms: original.rooms,
    })
  }

  function handleAppendRow(buildingClientId: string) {
    // Find the last index in the fields array that belongs to this building
    let insertAt = fields.length
    for (let i = fields.length - 1; i >= 0; i--) {
      if (fields[i].buildingClientId === buildingClientId) {
        insertAt = i + 1
        break
      }
    }
    insert(insertAt, newUnit(buildingClientId))
    setTimeout(() => {
      const rows = document.querySelectorAll('tr[data-unit-row]')
      const targetRow = rows[insertAt]
      const firstInput = targetRow?.querySelector('input')
      if (firstInput instanceof HTMLElement) firstInput.focus()
    }, 50)
  }

  return (
    <div className="flex flex-col gap-6">
      {buildings.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No buildings added yet. Go back and add at least one building.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-muted/50">
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
