'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PropertyFilters } from '@/components/dashboard/property-filters'
import { PropertyTable } from '@/components/dashboard/property-table'
import { useProperties } from '@/hooks/use-properties'
import type { PropertyFilters as PropertyFiltersType } from '@/types/property'

interface DashboardClientProps {
  initialFilters: PropertyFiltersType
}

export function DashboardClient({ initialFilters }: DashboardClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState(initialFilters)

  const { data: allProperties = [] } = useProperties({})
  const cityOptions = [...new Set(allProperties.flatMap((p) => p.cities))].sort()
  const managerOptions = [...new Set(
    allProperties.map((p) => p.managerName).filter((m): m is string => !!m)
  )].sort()

  function handleFilterChange(newFilters: PropertyFiltersType) {
    setFilters(newFilters)

    const params = new URLSearchParams(searchParams.toString())

    const keys = ['type', 'city', 'managerName'] as const

    for (const key of keys) {
      const value = newFilters[key]
      if (value !== undefined && value !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }

    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="mx-auto max-w-4xl px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Properties</h1>
        <Button size="sm" onClick={() => router.push('/properties/new')}>
          <Plus />
          New property
        </Button>
      </div>

      <PropertyFilters
        filters={filters}
        onChange={handleFilterChange}
        cityOptions={cityOptions}
        managerOptions={managerOptions}
      />

      <div className="mt-4">
        <PropertyTable filters={filters} />
      </div>
    </div>
  )
}
