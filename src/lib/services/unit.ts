import { prisma } from '@/lib/prisma'
import type { Unit } from '@/generated/prisma/client'
import type { CreateUnitInput, UpdateUnitInput } from '@/lib/validators/unit'

export async function createUnit(data: CreateUnitInput): Promise<Unit> {
  const { buildingClientId, ...rest } = data
  return prisma.unit.create({ data: { ...rest, buildingId: buildingClientId } })
}

export async function bulkCreateUnits(units: CreateUnitInput[]): Promise<Unit[]> {
  await prisma.unit.createMany({
    data: units.map(({ buildingClientId, ...rest }) => ({
      ...rest,
      buildingId: buildingClientId,
    })),
  })
  // createMany doesn't return the created records; fetch them by buildingId
  const buildingIds = [...new Set(units.map((u) => u.buildingClientId))]
  return prisma.unit.findMany({ where: { buildingId: { in: buildingIds } } })
}

export async function updateUnit(id: string, data: UpdateUnitInput): Promise<Unit> {
  return prisma.unit.update({ where: { id }, data })
}

export async function deleteUnit(id: string): Promise<void> {
  await prisma.unit.delete({ where: { id } })
}
