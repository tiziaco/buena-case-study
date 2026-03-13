import type { PropertyType, StaffRole } from '@/generated/prisma/client'

export type PropertyFilters = {
  type?: string
  managerId?: string
  sizeMin?: string
  sizeMax?: string
  yearMin?: string
  yearMax?: string
}

export type PropertySummary = {
  id: string
  name: string
  type: PropertyType
  propertyNumber: string
  createdAt: string
  staff: {
    manager: { id: string; name: string } | null
    accountant: { id: string; name: string } | null
  }
}

export type PropertyDetail = {
  id: string
  name: string
  type: PropertyType
  propertyNumber: string
  declarationFileUrl: string | null
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
  staff: Array<{
    id: string
    role: StaffRole
    user: { id: string; name: string; email: string }
  }>
}
