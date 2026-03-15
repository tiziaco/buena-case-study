import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import { createTestPrismaClient, cleanDatabase } from '../../helpers/db'
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

function buildPropertyInput(
  overrides: Partial<CreatePropertyInput> = {},
): CreatePropertyInput {
  const buildingClientId = uuidv4()
  return {
    name: 'Test Property',
    type: 'WEG',
    managerName: 'Test Manager',
    accountantName: 'Test Accountant',
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
      await createProperty(buildPropertyInput({ managerName: 'Manager', accountantName: 'Accountant' }))

      const result = await getProperties()
      expect(result).toHaveLength(1)
      expect(result[0].managerName).toBe('Manager')
      expect(result[0].accountantName).toBe('Accountant')
    })

    it('filters by property type', async () => {
      await createProperty(buildPropertyInput({ type: 'WEG', name: 'WEG Property' }))
      await createProperty(buildPropertyInput({ type: 'MV', name: 'MV Property' }))

      const result = await getProperties({ type: 'WEG' })
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('WEG Property')
    })
  })

  // ── getPropertyById ────────────────────────────────────────────────────────

  describe('getPropertyById', () => {
    it('returns null for non-existent id', async () => {
      const result = await getPropertyById(uuidv4())
      expect(result).toBeNull()
    })

    it('returns property with buildings, units, and staff', async () => {
      const created = await createProperty(buildPropertyInput())

      const result = await getPropertyById(created.id)
      expect(result).not.toBeNull()
      expect(result!.buildings).toHaveLength(1)
      expect(result!.buildings[0].units).toHaveLength(1)
      expect(result!.managerName).toBe('Test Manager')
      expect(result!.accountantName).toBe('Test Accountant')
    })
  })

  // ── createProperty ─────────────────────────────────────────────────────────

  describe('createProperty', () => {
    it('creates property with correct propertyNumber format', async () => {
      const property = await createProperty(buildPropertyInput())

      const year = new Date().getFullYear()
      expect(property.propertyNumber).toMatch(new RegExp(`^PROP-${year}-\\d{5}$`))
    })

    it('creates buildings and units within the transaction', async () => {
      const property = await createProperty(buildPropertyInput())

      const buildings = await testPrisma.building.findMany({ where: { propertyId: property.id } })
      expect(buildings).toHaveLength(1)

      const units = await testPrisma.unit.findMany({ where: { buildingId: buildings[0].id } })
      expect(units).toHaveLength(1)
      expect(units[0].unitNumber).toBe('A-01')
    })

    it('stores managerName and accountantName on property', async () => {
      const property = await createProperty(
        buildPropertyInput({ managerName: 'Anna Müller', accountantName: 'Thomas Berger' }),
      )
      const stored = await testPrisma.property.findUnique({ where: { id: property.id } })
      expect(stored?.managerName).toBe('Anna Müller')
      expect(stored?.accountantName).toBe('Thomas Berger')
    })

    it('increments propertyNumber sequence across properties', async () => {
      const first = await createProperty(buildPropertyInput({ name: 'First' }))
      const second = await createProperty(buildPropertyInput({ name: 'Second' }))

      const firstSeq = parseInt(first.propertyNumber.split('-')[2])
      const secondSeq = parseInt(second.propertyNumber.split('-')[2])
      expect(secondSeq).toBe(firstSeq + 1)
    })

    it('creates property with no units when units array is empty', async () => {
      const property = await createProperty(buildPropertyInput({ units: [] }))

      const units = await testPrisma.unit.count({ where: { building: { propertyId: property.id } } })
      expect(units).toBe(0)
    })

    it('returns PropertySummary with staff names', async () => {
      const result = await createProperty(buildPropertyInput())

      expect(result).toMatchObject({
        id: expect.any(String),
        name: 'Test Property',
        type: 'WEG',
        propertyNumber: expect.stringMatching(/^PROP-\d{4}-\d{5}$/),
        createdAt: expect.any(String),
        managerName: 'Test Manager',
        accountantName: 'Test Accountant',
      })
    })
  })

  // ── updateProperty ─────────────────────────────────────────────────────────

  describe('updateProperty', () => {
    it('updates property name', async () => {
      const property = await createProperty(buildPropertyInput())

      const updated = await updateProperty(property.id, { name: 'Updated Name' })
      expect(updated.name).toBe('Updated Name')
    })

    it('updates property type', async () => {
      const property = await createProperty(buildPropertyInput({ type: 'WEG' }))

      const updated = await updateProperty(property.id, { type: 'MV' })
      expect(updated.type).toBe('MV')
    })
  })

  // ── deleteProperty ─────────────────────────────────────────────────────────

  describe('deleteProperty', () => {
    it('deletes the property and all related records', async () => {
      const property = await createProperty(buildPropertyInput())

      await deleteProperty(property.id)

      const found = await testPrisma.property.findUnique({ where: { id: property.id } })
      expect(found).toBeNull()

      const buildings = await testPrisma.building.count({ where: { propertyId: property.id } })
      expect(buildings).toBe(0)
    })
  })
})
