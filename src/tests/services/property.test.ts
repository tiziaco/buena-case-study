import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import { createTestPrismaClient, cleanDatabase } from '@/tests/helpers/db'
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from '@/lib/services/property'
import type { CreatePropertyInput } from '@/lib/validators/property'

let testPrisma: ReturnType<typeof createTestPrismaClient>

vi.mock('@/lib/prisma', () => ({ get prisma() { return testPrisma } }))

// ─── Helpers ────────────────────────────────────────────────────────────────

async function createTestUser(name = 'Test User', email?: string) {
  return testPrisma.user.create({
    data: { name, email: email ?? `${name.toLowerCase().replace(/ /g, '.')}+${uuidv4()}@test.com` },
  })
}

function buildPropertyInput(
  managerId: string,
  accountantId: string,
  overrides: Partial<CreatePropertyInput> = {},
): CreatePropertyInput {
  const buildingClientId = uuidv4()
  return {
    name: 'Test Property',
    type: 'WEG',
    managerId,
    accountantId,
    declarationFileUrl: undefined,
    buildings: [
      {
        clientId: buildingClientId,
        street: 'Teststraße',
        houseNumber: '1',
        postalCode: '10115',
        city: 'Berlin',
        country: 'Germany',
      },
    ],
    units: [
      {
        buildingClientId,
        unitNumber: 'A-01',
        type: 'APARTMENT',
      },
    ],
    ...overrides,
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('property service', () => {
  beforeAll(() => { testPrisma = createTestPrismaClient() })
  beforeEach(async () => { await cleanDatabase(testPrisma) })
  afterAll(() => testPrisma.$disconnect())

  // ── getProperties ──────────────────────────────────────────────────────────

  describe('getProperties', () => {
    it('returns empty array when no properties exist', async () => {
      const result = await getProperties()
      expect(result).toEqual([])
    })

    it('returns all properties with staff mapped correctly', async () => {
      const manager = await createTestUser('Manager')
      const accountant = await createTestUser('Accountant')
      await createProperty(buildPropertyInput(manager.id, accountant.id))

      const result = await getProperties()
      expect(result).toHaveLength(1)
      expect(result[0].staff.manager?.name).toBe('Manager')
      expect(result[0].staff.accountant?.name).toBe('Accountant')
    })

    it('filters by property type', async () => {
      const manager = await createTestUser('M1')
      const accountant = await createTestUser('A1')
      await createProperty(buildPropertyInput(manager.id, accountant.id, { type: 'WEG', name: 'WEG Property' }))
      await createProperty(buildPropertyInput(manager.id, accountant.id, { type: 'MV', name: 'MV Property' }))

      const result = await getProperties({ type: 'WEG' })
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('WEG Property')
    })

    it('filters by managerId', async () => {
      const manager1 = await createTestUser('Manager One')
      const manager2 = await createTestUser('Manager Two')
      const accountant = await createTestUser('Accountant')
      await createProperty(buildPropertyInput(manager1.id, accountant.id, { name: 'Prop 1' }))
      await createProperty(buildPropertyInput(manager2.id, accountant.id, { name: 'Prop 2' }))

      const result = await getProperties({ managerId: manager1.id })
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Prop 1')
    })
  })

  // ── getPropertyById ────────────────────────────────────────────────────────

  describe('getPropertyById', () => {
    it('returns null for non-existent id', async () => {
      const result = await getPropertyById(uuidv4())
      expect(result).toBeNull()
    })

    it('returns property with buildings, units, and staff', async () => {
      const manager = await createTestUser('Manager')
      const accountant = await createTestUser('Accountant')
      const created = await createProperty(buildPropertyInput(manager.id, accountant.id))

      const result = await getPropertyById(created.id)
      expect(result).not.toBeNull()
      expect(result!.buildings).toHaveLength(1)
      expect(result!.buildings[0].units).toHaveLength(1)
      expect(result!.staff).toHaveLength(2)
    })
  })

  // ── createProperty ─────────────────────────────────────────────────────────

  describe('createProperty', () => {
    it('creates property with correct propertyNumber format', async () => {
      const manager = await createTestUser()
      const accountant = await createTestUser()
      const property = await createProperty(buildPropertyInput(manager.id, accountant.id))

      const year = new Date().getFullYear()
      expect(property.propertyNumber).toMatch(new RegExp(`^PROP-${year}-\\d{5}$`))
    })

    it('creates buildings and units within the transaction', async () => {
      const manager = await createTestUser()
      const accountant = await createTestUser()
      const property = await createProperty(buildPropertyInput(manager.id, accountant.id))

      const buildings = await testPrisma.building.findMany({ where: { propertyId: property.id } })
      expect(buildings).toHaveLength(1)

      const units = await testPrisma.unit.findMany({ where: { buildingId: buildings[0].id } })
      expect(units).toHaveLength(1)
      expect(units[0].unitNumber).toBe('A-01')
    })

    it('creates PropertyStaff records for manager and accountant', async () => {
      const manager = await createTestUser()
      const accountant = await createTestUser()
      const property = await createProperty(buildPropertyInput(manager.id, accountant.id))

      const staff = await testPrisma.propertyStaff.findMany({ where: { propertyId: property.id } })
      expect(staff).toHaveLength(2)
      expect(staff.map((s) => s.role).sort()).toEqual(['ACCOUNTANT', 'MANAGER'])
    })

    it('increments propertyNumber sequence across properties', async () => {
      const manager = await createTestUser()
      const accountant = await createTestUser()
      const first = await createProperty(buildPropertyInput(manager.id, accountant.id, { name: 'First' }))
      const second = await createProperty(buildPropertyInput(manager.id, accountant.id, { name: 'Second' }))

      const firstSeq = parseInt(first.propertyNumber.split('-')[2])
      const secondSeq = parseInt(second.propertyNumber.split('-')[2])
      expect(secondSeq).toBe(firstSeq + 1)
    })

    it('creates property with no units when units array is empty', async () => {
      const manager = await createTestUser()
      const accountant = await createTestUser()
      const property = await createProperty(buildPropertyInput(manager.id, accountant.id, { units: [] }))

      const units = await testPrisma.unit.count({ where: { building: { propertyId: property.id } } })
      expect(units).toBe(0)
    })
  })

  // ── updateProperty ─────────────────────────────────────────────────────────

  describe('updateProperty', () => {
    it('updates property name', async () => {
      const manager = await createTestUser()
      const accountant = await createTestUser()
      const property = await createProperty(buildPropertyInput(manager.id, accountant.id))

      const updated = await updateProperty(property.id, { name: 'Updated Name' })
      expect(updated.name).toBe('Updated Name')
    })

    it('updates property type', async () => {
      const manager = await createTestUser()
      const accountant = await createTestUser()
      const property = await createProperty(buildPropertyInput(manager.id, accountant.id, { type: 'WEG' }))

      const updated = await updateProperty(property.id, { type: 'MV' })
      expect(updated.type).toBe('MV')
    })
  })

  // ── deleteProperty ─────────────────────────────────────────────────────────

  describe('deleteProperty', () => {
    it('deletes the property and all related records', async () => {
      const manager = await createTestUser()
      const accountant = await createTestUser()
      const property = await createProperty(buildPropertyInput(manager.id, accountant.id))

      await deleteProperty(property.id)

      const found = await testPrisma.property.findUnique({ where: { id: property.id } })
      expect(found).toBeNull()

      const buildings = await testPrisma.building.count({ where: { propertyId: property.id } })
      expect(buildings).toBe(0)

      const staff = await testPrisma.propertyStaff.count({ where: { propertyId: property.id } })
      expect(staff).toBe(0)
    })
  })
})
