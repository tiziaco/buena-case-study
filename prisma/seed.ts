import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, PropertyType, StaffRole, UnitType } from '../src/generated/prisma/client'

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.')
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'anna.mueller@example.com' },
      update: {},
      create: { name: 'Anna Müller', email: 'anna.mueller@example.com' },
    }),
    prisma.user.upsert({
      where: { email: 'thomas.berger@example.com' },
      update: {},
      create: { name: 'Thomas Berger', email: 'thomas.berger@example.com' },
    }),
    prisma.user.upsert({
      where: { email: 'sarah.klein@example.com' },
      update: {},
      create: { name: 'Sarah Klein', email: 'sarah.klein@example.com' },
    }),
    prisma.user.upsert({
      where: { email: 'michael.weber@example.com' },
      update: {},
      create: { name: 'Michael Weber', email: 'michael.weber@example.com' },
    }),
    prisma.user.upsert({
      where: { email: 'laura.fischer@example.com' },
      update: {},
      create: { name: 'Laura Fischer', email: 'laura.fischer@example.com' },
    }),
    prisma.user.upsert({
      where: { email: 'hans.schneider@example.com' },
      update: {},
      create: { name: 'Hans Schneider', email: 'hans.schneider@example.com' },
    }),
    prisma.user.upsert({
      where: { email: 'eva.bauer@example.com' },
      update: {},
      create: { name: 'Eva Bauer', email: 'eva.bauer@example.com' },
    }),
    prisma.user.upsert({
      where: { email: 'klaus.richter@example.com' },
      update: {},
      create: { name: 'Klaus Richter', email: 'klaus.richter@example.com' },
    }),
  ])

  const [anna, thomas, sarah, michael] = users
  console.log(`Upserted ${users.length} users`)

  // ── Property 1: Musterstraße WEG (1 building, 4 units) ────────────────────
  const weg = await prisma.property.upsert({
    where: { propertyNumber: 'PROP-2024-00001' },
    update: {},
    create: {
      name: 'Musterstraße WEG',
      type: PropertyType.WEG,
      propertyNumber: 'PROP-2024-00001',
    },
  })

  const wegBuildingCount = await prisma.building.count({ where: { propertyId: weg.id } })
  if (wegBuildingCount === 0) {
    const wegBuilding = await prisma.building.create({
      data: {
        propertyId: weg.id,
        street: 'Musterstraße',
        houseNumber: '1',
        postalCode: '10115',
        city: 'Berlin',
        country: 'Germany',
      },
    })

    await prisma.unit.createMany({
      data: [
        { buildingId: wegBuilding.id, unitNumber: 'W01', type: UnitType.APARTMENT, floor: 0, size: 65.5, rooms: 2 },
        { buildingId: wegBuilding.id, unitNumber: 'W02', type: UnitType.APARTMENT, floor: 1, size: 78.0, rooms: 3 },
        { buildingId: wegBuilding.id, unitNumber: 'W03', type: UnitType.APARTMENT, floor: 2, size: 78.0, rooms: 3 },
        { buildingId: wegBuilding.id, unitNumber: 'P01', type: UnitType.PARKING,   floor: -1 },
      ],
    })

    await prisma.propertyStaff.createMany({
      data: [
        { propertyId: weg.id, userId: anna.id,   role: StaffRole.MANAGER },
        { propertyId: weg.id, userId: thomas.id,  role: StaffRole.ACCOUNTANT },
      ],
      skipDuplicates: true,
    })
  }

  console.log('Upserted Musterstraße WEG with 1 building, 4 units')

  // ── Property 2: Berliner Allee MV (2 buildings, 6 units) ──────────────────
  const mv = await prisma.property.upsert({
    where: { propertyNumber: 'PROP-2024-00002' },
    update: {},
    create: {
      name: 'Berliner Allee MV',
      type: PropertyType.MV,
      propertyNumber: 'PROP-2024-00002',
    },
  })

  const mvBuildingCount = await prisma.building.count({ where: { propertyId: mv.id } })
  if (mvBuildingCount === 0) {
    const mvBuilding1 = await prisma.building.create({
      data: {
        propertyId: mv.id,
        street: 'Berliner Allee',
        houseNumber: '42',
        postalCode: '40212',
        city: 'Düsseldorf',
        country: 'Germany',
      },
    })

    const mvBuilding2 = await prisma.building.create({
      data: {
        propertyId: mv.id,
        street: 'Berliner Allee',
        houseNumber: '44',
        postalCode: '40212',
        city: 'Düsseldorf',
        country: 'Germany',
      },
    })

    await prisma.unit.createMany({
      data: [
        { buildingId: mvBuilding1.id, unitNumber: 'A01', type: UnitType.APARTMENT, floor: 0, size: 55.0, rooms: 2 },
        { buildingId: mvBuilding1.id, unitNumber: 'A02', type: UnitType.APARTMENT, floor: 1, size: 55.0, rooms: 2 },
        { buildingId: mvBuilding1.id, unitNumber: 'A03', type: UnitType.OFFICE,    floor: 0, size: 40.0 },
        { buildingId: mvBuilding2.id, unitNumber: 'B01', type: UnitType.APARTMENT, floor: 0, size: 70.0, rooms: 3 },
        { buildingId: mvBuilding2.id, unitNumber: 'B02', type: UnitType.APARTMENT, floor: 1, size: 70.0, rooms: 3 },
        { buildingId: mvBuilding2.id, unitNumber: 'B03', type: UnitType.APARTMENT, floor: 2, size: 70.0, rooms: 3 },
      ],
    })

    await prisma.propertyStaff.createMany({
      data: [
        { propertyId: mv.id, userId: sarah.id,   role: StaffRole.MANAGER },
        { propertyId: mv.id, userId: michael.id, role: StaffRole.ACCOUNTANT },
      ],
      skipDuplicates: true,
    })
  }

  console.log('Upserted Berliner Allee MV with 2 buildings, 6 units')
  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
