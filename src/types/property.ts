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
  createdAt: Date
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
  createdAt: Date
  updatedAt: Date
  buildings: Array<{
    id: string
    street: string
    houseNumber: string
    postalCode: string
    city: string
    country: string
    createdAt: Date
    updatedAt: Date
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
      createdAt: Date
      updatedAt: Date
    }>
  }>
  staff: Array<{
    id: string
    role: StaffRole
    user: { id: string; name: string; email: string }
  }>
}
