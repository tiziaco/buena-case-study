import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import { createTestPrismaClient, cleanDatabase } from '../../helpers/db'
import { createUnit, bulkCreateUnits, updateUnit, deleteUnit } from '@/lib/services/unit'

let testPrisma: ReturnType<typeof createTestPrismaClient>

vi.mock('@/lib/prisma', () => ({ get prisma() { return testPrisma } }))

async function seedBuilding() {
  const property = await testPrisma.property.create({
    data: {
      name: 'Seed Property',
      type: 'WEG',
      propertyNumber: `PROP-TEST-${uuidv4().slice(0, 8)}`,
    },
  })
  const building = await testPrisma.building.create({
    data: {
      propertyId: property.id,
      street: 'Seedstraße',
      houseNumber: '1',
      postalCode: '10115',
      city: 'Berlin',
      country: 'Germany',
    },
  })
  return building
}

describe('unit service', () => {
  beforeAll(() => { testPrisma = createTestPrismaClient() })
  beforeEach(async () => { await cleanDatabase(testPrisma) })
  afterAll(() => testPrisma.$disconnect())

  describe('createUnit', () => {
    it('creates a unit linked to a building', async () => {
      const building = await seedBuilding()

      // createUnit uses buildingClientId as the buildingId (direct DB id in this context)
      const unit = await createUnit({
        buildingClientId: building.id,
        unitNumber: 'A-01',
        type: 'APARTMENT',
      })

      expect(unit.buildingId).toBe(building.id)
      expect(unit.unitNumber).toBe('A-01')
    })

    it('creates a unit with all optional fields', async () => {
      const building = await seedBuilding()
      const unit = await createUnit({
        buildingClientId: building.id,
        unitNumber: 'B-02',
        type: 'OFFICE',
        floor: 3,
        entrance: 'B',
        size: 65.5,
        coOwnershipShare: 0.1,
        constructionYear: 1995,
        rooms: 4,
      })

      expect(unit.floor).toBe(3)
      expect(unit.size).toBe(65.5)
      expect(unit.constructionYear).toBe(1995)
    })
  })

  describe('bulkCreateUnits', () => {
    it('creates multiple units and returns them', async () => {
      const building = await seedBuilding()

      const units = await bulkCreateUnits([
        { buildingClientId: building.id, unitNumber: 'A-01', type: 'APARTMENT' },
        { buildingClientId: building.id, unitNumber: 'A-02', type: 'PARKING' },
        { buildingClientId: building.id, unitNumber: 'A-03', type: 'GARDEN' },
      ])

      expect(units).toHaveLength(3)
      const numbers = units.map((u) => u.unitNumber).sort()
      expect(numbers).toEqual(['A-01', 'A-02', 'A-03'])
    })
  })

  describe('updateUnit', () => {
    it('updates unit fields', async () => {
      const building = await seedBuilding()
      const unit = await createUnit({
        buildingClientId: building.id,
        unitNumber: 'C-01',
        type: 'APARTMENT',
      })

      const updated = await updateUnit(unit.id, { floor: 5, rooms: 3.5 })
      expect(updated.floor).toBe(5)
      expect(updated.rooms).toBe(3.5)
      expect(updated.unitNumber).toBe('C-01') // unchanged
    })
  })

  describe('deleteUnit', () => {
    it('removes the unit from the database', async () => {
      const building = await seedBuilding()
      const unit = await createUnit({
        buildingClientId: building.id,
        unitNumber: 'D-01',
        type: 'APARTMENT',
      })

      await deleteUnit(unit.id)

      const found = await testPrisma.unit.findUnique({ where: { id: unit.id } })
      expect(found).toBeNull()
    })
  })
})
