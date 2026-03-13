import { inject } from 'vitest'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

type TestPrismaClient = InstanceType<typeof PrismaClient>

export function createTestPrismaClient(): TestPrismaClient {
  const databaseUrl = inject('databaseUrl') as string
  const pool = new Pool({ connectionString: databaseUrl })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export async function cleanDatabase(prisma: TestPrismaClient) {
  await prisma.$transaction([
    prisma.unit.deleteMany(),
    prisma.building.deleteMany(),
    prisma.propertyStaff.deleteMany(),
    prisma.property.deleteMany(),
    prisma.user.deleteMany(),
  ])
}
