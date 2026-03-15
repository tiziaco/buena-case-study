import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PropertyFiltersProps {
  filters: {
    type?: string
    city?: string
    managerName?: string
  }
  cityOptions: string[]
  managerOptions: string[]
  onChange: (filters: PropertyFiltersProps['filters']) => void
}

export function PropertyFilters({ filters, cityOptions, managerOptions, onChange }: PropertyFiltersProps) {
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

      {/* City */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">City</span>
        <Select
          value={filters.city ?? ''}
          onValueChange={(val) => merge({ city: val || undefined })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All cities</SelectItem>
            {cityOptions.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Manager */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Manager</span>
        <Select
          value={filters.managerName ?? ''}
          onValueChange={(val) => merge({ managerName: val || undefined })}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All managers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All managers</SelectItem>
            {managerOptions.map((manager) => (
              <SelectItem key={manager} value={manager}>{manager}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
