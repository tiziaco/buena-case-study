'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { PropertyFilters, PropertySummary } from '@/types/property'

async function fetchProperties(filters: PropertyFilters): Promise<PropertySummary[]> {
  const params = new URLSearchParams()
  if (filters.type) params.set('type', filters.type)
  if (filters.managerId) params.set('managerId', filters.managerId)
  if (filters.sizeMin) params.set('sizeMin', filters.sizeMin)
  if (filters.sizeMax) params.set('sizeMax', filters.sizeMax)
  if (filters.yearMin) params.set('yearMin', filters.yearMin)
  if (filters.yearMax) params.set('yearMax', filters.yearMax)

  const qs = params.toString()
  const res = await fetch(`/api/properties${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('Failed to fetch properties')
  const json = await res.json()
  return json.data
}

export function useProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => fetchProperties(filters),
    placeholderData: keepPreviousData,
  })
}
