import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import { createTestPrismaClient, cleanDatabase } from '../../helpers/db'
import { createBuilding, updateBuilding, deleteBuilding } from '@/lib/services/building'

let testPrisma: ReturnType<typeof createTestPrismaClient>

vi.mock('@/lib/prisma', () => ({ get prisma() { return testPrisma } }))

async function seedProperty() {
  const property = await testPrisma.property.create({
    data: {
      name: 'Seed Property',
      type: 'WEG',
      propertyNumber: `PROP-TEST-${uuidv4().slice(0, 8)}`,
    },
  })
  return property
}

describe('building service', () => {
  beforeAll(() => { testPrisma = createTestPrismaClient() })
  beforeEach(async () => { await cleanDatabase(testPrisma) })
  afterAll(() => testPrisma.$disconnect())

  describe('createBuilding', () => {
    it('creates a building linked to a property', async () => {
      const property = await seedProperty()

      const building = await createBuilding(property.id, {
        street: 'Musterstraße',
        houseNumber: '5',
        postalCode: '10115',
        city: 'Berlin',
        country: 'Germany',
      })

      expect(building.propertyId).toBe(property.id)
      expect(building.street).toBe('Musterstraße')
      expect(building.country).toBe('Germany')
    })
  })

  describe('updateBuilding', () => {
    it('updates building fields', async () => {
      const property = await seedProperty()
      const building = await createBuilding(property.id, {
        street: 'Old Street',
        houseNumber: '1',
        postalCode: '10115',
        city: 'Berlin',
        country: 'Germany',
      })

      const updated = await updateBuilding(building.id, { city: 'Hamburg', houseNumber: '99' })
      expect(updated.city).toBe('Hamburg')
      expect(updated.houseNumber).toBe('99')
      expect(updated.street).toBe('Old Street') // unchanged
    })
  })

  describe('deleteBuilding', () => {
    it('removes the building from the database', async () => {
      const property = await seedProperty()
      const building = await createBuilding(property.id, {
        street: 'To Delete',
        houseNumber: '1',
        postalCode: '10115',
        city: 'Berlin',
        country: 'Germany',
      })

      await deleteBuilding(building.id)

      const found = await testPrisma.building.findUnique({ where: { id: building.id } })
      expect(found).toBeNull()
    })
  })
})
