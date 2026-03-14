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

  const CELL_COUNT = 8

  function handleKeyDown(cellIndex: number, e: React.KeyboardEvent) {
    if (e.key === 'Tab' && !e.shiftKey && cellIndex === CELL_COUNT - 1 && isLastInGroup) {
      e.preventDefault()
      onAppendRow(buildingClientId)
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
