'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PropertyFilters } from '@/components/dashboard/property-filters'
import { PropertyTable } from '@/components/dashboard/property-table'

interface DashboardClientProps {
  initialFilters: {
    type?: string
    sizeMin?: string
    sizeMax?: string
    yearMin?: string
    yearMax?: string
  }
}

export function DashboardClient({ initialFilters }: DashboardClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState(initialFilters)

  function handleFilterChange(newFilters: typeof filters) {
    setFilters(newFilters)

    const params = new URLSearchParams(searchParams.toString())

    const keys = ['type', 'sizeMin', 'sizeMax', 'yearMin', 'yearMax'] as const

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

      <PropertyFilters filters={filters} onChange={handleFilterChange} />

      <div className="mt-4">
        <PropertyTable filters={filters} />
      </div>
    </div>
  )
}
