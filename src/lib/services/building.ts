import { prisma } from '@/lib/prisma'
import type { Building } from '@/generated/prisma/client'
import type { CreateBuildingInput, UpdateBuildingInput } from '@/lib/validators/building'

export async function createBuilding(
  propertyId: string,
  data: CreateBuildingInput,
): Promise<Building> {
  return prisma.building.create({ data: { ...data, propertyId } })
}

export async function updateBuilding(
  id: string,
  data: UpdateBuildingInput,
): Promise<Building> {
  return prisma.building.update({ where: { id }, data })
}

export async function deleteBuilding(id: string): Promise<void> {
  await prisma.building.delete({ where: { id } })
}
