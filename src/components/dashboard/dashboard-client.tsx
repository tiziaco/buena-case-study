'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PropertyFilters } from '@/components/dashboard/property-filters'
import { PropertyTable } from '@/components/dashboard/property-table'

interface DashboardClientProps {
  initialFilters: {
    type?: string
    managerId?: string
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

    const keys = ['type', 'managerId', 'sizeMin', 'sizeMax', 'yearMin', 'yearMax'] as const

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
    <div>
      <div className="flex items-center justify-between mb-14">
        <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
        <Button onClick={() => router.push('/properties/new')}>
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
