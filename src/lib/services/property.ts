import { prisma } from '@/lib/prisma'
import { Prisma, PropertyType } from '@/generated/prisma/client'
import type { Property } from '@/generated/prisma/client'
import type { CreatePropertyInput, UpdatePropertyInput } from '@/lib/validators/property'
import type { PropertyFilters, PropertySummary, PropertyDetail } from '@/types/property'

export async function getProperties(filters?: PropertyFilters): Promise<PropertySummary[]> {
  const { type, city, managerName } = filters ?? {}

  const where: Prisma.PropertyWhereInput = {
    ...(type && { type: type as PropertyType }),
    ...(managerName && { managerName: { contains: managerName, mode: 'insensitive' } }),
    ...(city && { buildings: { some: { city: { contains: city, mode: 'insensitive' } } } }),
  }

  const properties = await prisma.property.findMany({
    where,
    select: {
      id: true,
      name: true,
      type: true,
      propertyNumber: true,
      managerName: true,
      accountantName: true,
      createdAt: true,
      buildings: { select: { city: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return properties.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    propertyNumber: p.propertyNumber,
    createdAt: p.createdAt.toISOString(),
    managerName: p.managerName,
    accountantName: p.accountantName,
    cities: p.buildings.map((b) => b.city),
  }))
}

export async function getPropertyById(id: string): Promise<PropertyDetail | null> {
  const p = await prisma.property.findUnique({
    where: { id },
    include: { buildings: { include: { units: true } } },
  })
  if (!p) return null
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    propertyNumber: p.propertyNumber,
    declarationFileUrl: p.declarationFileUrl,
    managerName: p.managerName,
    accountantName: p.accountantName,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    buildings: p.buildings.map((b) => ({
      id: b.id,
      street: b.street,
      houseNumber: b.houseNumber,
      postalCode: b.postalCode,
      city: b.city,
      country: b.country,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      units: b.units.map((u) => ({
        id: u.id,
        unitNumber: u.unitNumber,
        type: u.type,
        floor: u.floor,
        entrance: u.entrance,
        size: u.size ? Number(u.size) : null,
        coOwnershipShare: u.coOwnershipShare ? Number(u.coOwnershipShare) : null,
        constructionYear: u.constructionYear,
        rooms: u.rooms ? Number(u.rooms) : null,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
    })),
  }
}

export async function createProperty(data: CreatePropertyInput): Promise<PropertySummary> {
  return prisma.$transaction(async (tx) => {
    // 1. Generate property number
    const count = await tx.property.count()
    const year = new Date().getFullYear()
    const propertyNumber = `PROP-${year}-${String(count + 1).padStart(5, '0')}`

    // 2. Create property
    const property = await tx.property.create({
      data: {
        name: data.name,
        type: data.type,
        propertyNumber,
        declarationFileUrl: data.declarationFileUrl,
        managerName: data.managerName ?? null,
        accountantName: data.accountantName ?? null,
      },
    })

    // 3. Create buildings, keeping clientId → DB id map
    const buildingIdMap = new Map<string, string>()
    for (const building of data.buildings) {
      const { clientId, ...buildingData } = building
      const created = await tx.building.create({
        data: { ...buildingData, propertyId: property.id },
      })
      buildingIdMap.set(clientId, created.id)
    }

    // 4. Create units, resolving buildingClientId → real buildingId
    if (data.units.length > 0) {
      await tx.unit.createMany({
        data: data.units.map(({ buildingClientId, ...rest }) => ({
          ...rest,
          buildingId: buildingIdMap.get(buildingClientId)!,
        })),
      })
    }

    const createdBuildings = await tx.building.findMany({
      where: { propertyId: property.id },
      select: { city: true },
    })

    return {
      id: property.id,
      name: property.name,
      type: property.type,
      propertyNumber: property.propertyNumber,
      createdAt: property.createdAt.toISOString(),
      managerName: property.managerName,
      accountantName: property.accountantName,
      cities: createdBuildings.map((b) => b.city),
    }
  })
}

export async function updateProperty(id: string, data: UpdatePropertyInput): Promise<Property> {
  return prisma.property.update({ where: { id }, data })
}

export async function deleteProperty(id: string): Promise<void> {
  await prisma.$transaction([
    prisma.unit.deleteMany({ where: { building: { propertyId: id } } }),
    prisma.building.deleteMany({ where: { propertyId: id } }),
    prisma.property.delete({ where: { id } }),
  ])
}
