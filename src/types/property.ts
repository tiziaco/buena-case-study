import type { PropertyType } from '@/generated/prisma/client'

export type PropertyFilters = {
  type?: string
  city?: string
  managerName?: string
}

export type PropertySummary = {
  id: string
  name: string
  type: PropertyType
  propertyNumber: string
  createdAt: string
  managerName: string | null
  accountantName: string | null
  cities: string[]
}

export type PropertyDetail = {
  id: string
  name: string
  type: PropertyType
  propertyNumber: string
  declarationFileUrl: string | null
  managerName: string | null
  accountantName: string | null
  createdAt: string
  updatedAt: string
  buildings: Array<{
    id: string
    street: string
    houseNumber: string
    postalCode: string
    city: string
    country: string
    createdAt: string
    updatedAt: string
    units: Array<{
      id: string
      unitNumber: string
      type: string
      floor: number | null
      entrance: string | null
      size: number | null
      coOwnershipShare: number | null
      constructionYear: number | null
      rooms: number | null
      createdAt: string
      updatedAt: string
    }>
  }>
}
