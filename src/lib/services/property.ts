import { prisma } from '@/lib/prisma'
import { Prisma, PropertyType } from '@/generated/prisma/client'
import type { Property } from '@/generated/prisma/client'
import type { CreatePropertyInput, UpdatePropertyInput } from '@/lib/validators/property'
import type { PropertyFilters, PropertySummary, PropertyDetail } from '@/types/property'

export async function getProperties(filters?: PropertyFilters): Promise<PropertySummary[]> {
  const { type, managerId, sizeMin, sizeMax, yearMin, yearMax } = filters ?? {}

  const where: Prisma.PropertyWhereInput = {
    ...(type && { type: type as PropertyType }),
    ...(managerId && {
      staff: { some: { userId: managerId, role: 'MANAGER' } },
    }),
    ...((sizeMin || sizeMax) && {
      buildings: {
        some: {
          units: {
            some: {
              ...(sizeMin && { size: { gte: Number(sizeMin) } }),
              ...(sizeMax && { size: { lte: Number(sizeMax) } }),
            },
          },
        },
      },
    }),
    ...((yearMin || yearMax) && {
      buildings: {
        some: {
          units: {
            some: {
              ...(yearMin && { constructionYear: { gte: Number(yearMin) } }),
              ...(yearMax && { constructionYear: { lte: Number(yearMax) } }),
            },
          },
        },
      },
    }),
  }

  const properties = await prisma.property.findMany({
    where,
    select: {
      id: true,
      name: true,
      type: true,
      propertyNumber: true,
      createdAt: true,
      staff: {
        select: {
          role: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return properties.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    propertyNumber: p.propertyNumber,
    createdAt: p.createdAt,
    staff: {
      manager: p.staff.find((s) => s.role === 'MANAGER')?.user ?? null,
      accountant: p.staff.find((s) => s.role === 'ACCOUNTANT')?.user ?? null,
    },
  }))
}

export async function getPropertyById(id: string): Promise<PropertyDetail | null> {
  return prisma.property.findUnique({
    where: { id },
    include: {
      buildings: { include: { units: true } },
      staff: { include: { user: true } },
    },
  }) as Promise<PropertyDetail | null>
}

export async function createProperty(data: CreatePropertyInput): Promise<Property> {
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

    // 5. Create PropertyStaff records
    await tx.propertyStaff.createMany({
      data: [
        { propertyId: property.id, userId: data.managerId, role: 'MANAGER' },
        { propertyId: property.id, userId: data.accountantId, role: 'ACCOUNTANT' },
      ],
    })

    return property
  })
}

export async function updateProperty(id: string, data: UpdatePropertyInput): Promise<Property> {
  return prisma.property.update({ where: { id }, data })
}

export async function deleteProperty(id: string): Promise<void> {
  await prisma.$transaction([
    prisma.unit.deleteMany({ where: { building: { propertyId: id } } }),
    prisma.building.deleteMany({ where: { propertyId: id } }),
    prisma.propertyStaff.deleteMany({ where: { propertyId: id } }),
    prisma.property.delete({ where: { id } }),
  ])
}
