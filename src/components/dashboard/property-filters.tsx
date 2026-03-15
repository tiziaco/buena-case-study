import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface PropertyFiltersProps {
  filters: {
    type?: string
    sizeMin?: string
    sizeMax?: string
    yearMin?: string
    yearMax?: string
  }
  onChange: (filters: PropertyFiltersProps['filters']) => void
}

export function PropertyFilters({ filters, onChange }: PropertyFiltersProps) {
  function merge(patch: Partial<PropertyFiltersProps['filters']>) {
    onChange({ ...filters, ...patch })
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  const typeValue: string[] = filters.type ? [filters.type] : ['all']

  return (
    <div className="flex flex-wrap gap-4">
      {/* Type */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Type</span>
        <ToggleGroup
          variant="outline"
          value={typeValue}
          onValueChange={(vals) => {
            merge({ type: vals[0] === 'all' || !vals[0] ? undefined : vals[0] })
          }}
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="WEG">WEG</ToggleGroupItem>
          <ToggleGroupItem value="MV">MV</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Surface */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Surface</span>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={filters.sizeMin ?? ''}
            onChange={(e) => merge({ sizeMin: e.target.value })}
            className="w-24"
          />
          <span className="text-muted-foreground text-xs">–</span>
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={filters.sizeMax ?? ''}
            onChange={(e) => merge({ sizeMax: e.target.value })}
            className="w-24"
          />
        </div>
      </div>

      {/* Year */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Year</span>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={1800}
            max={2100}
            placeholder="From"
            value={filters.yearMin ?? ''}
            onChange={(e) => merge({ yearMin: e.target.value })}
            className="w-24"
          />
          <span className="text-muted-foreground text-xs">–</span>
          <Input
            type="number"
            min={1800}
            max={2100}
            placeholder="To"
            value={filters.yearMax ?? ''}
            onChange={(e) => merge({ yearMax: e.target.value })}
            className="w-24"
          />
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <div className="flex flex-col justify-end">
          <Button variant="ghost" size="sm" onClick={() => onChange({})}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
