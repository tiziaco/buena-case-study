'use client'

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import type { CreatePropertyInput } from '@/lib/validators/property'
import type { PropertyFilters, PropertySummary } from '@/types/property'

async function fetchProperties(filters: PropertyFilters): Promise<PropertySummary[]> {
  const params = new URLSearchParams()
  if (filters.type) params.set('type', filters.type)
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

async function createProperty(data: CreatePropertyInput): Promise<PropertySummary> {
  const res = await fetch('/api/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (res.status !== 201) throw new Error('Failed to create property')
  return res.json()
}

async function deleteProperty(id: string): Promise<void> {
  const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete property')
}

export function useProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => fetchProperties(filters),
    placeholderData: keepPreviousData,
  })
}

export function useCreateProperty() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: createProperty,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast.success('Property created')
      router.push('/dashboard')
    },
    onError: () => {
      toast.error('Failed to create property')
    },
  })
}

export function useDeleteProperty(propertyName: string, onSuccess: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast.success(`"${propertyName}" has been deleted`)
      onSuccess()
    },
    onError: () => {
      toast.error('Failed to delete property. Please try again.')
    },
  })
}
