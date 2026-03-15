import { describe, it, expect } from 'vitest'
import { CreatePropertySchema, UpdatePropertySchema } from '@/lib/validators/property'
import { v4 as uuidv4 } from 'uuid'

const buildingClientId = uuidv4()

const validBuilding = {
  clientId: buildingClientId,
  street: 'Hauptstraße',
  houseNumber: '12',
  postalCode: '10115',
  city: 'Berlin',
}

const validUnit = {
  buildingClientId,
  unitNumber: 'A-01',
  type: 'APARTMENT' as const,
}

const validProperty = {
  name: 'Musterhof',
  type: 'WEG' as const,
  managerName: 'Anna Müller',
  accountantName: 'Thomas Berger',
  buildings: [validBuilding],
  units: [validUnit],
}

describe('CreatePropertySchema', () => {
  it('accepts a valid property', () => {
    const result = CreatePropertySchema.safeParse(validProperty)
    expect(result.success).toBe(true)
  })

  it('accepts property with no units (empty array)', () => {
    const result = CreatePropertySchema.safeParse({ ...validProperty, units: [] })
    expect(result.success).toBe(true)
  })

  it('accepts optional declarationFileUrl', () => {
    const result = CreatePropertySchema.safeParse({
      ...validProperty,
      declarationFileUrl: 'https://example.com/file.pdf',
    })
    expect(result.success).toBe(true)
  })

  it('accepts declarationFileUrl as any string (no url format validation)', () => {
    const result = CreatePropertySchema.safeParse({
      ...validProperty,
      declarationFileUrl: 'not-a-url',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = CreatePropertySchema.safeParse({ ...validProperty, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid type', () => {
    const result = CreatePropertySchema.safeParse({ ...validProperty, type: 'CONDO' })
    expect(result.success).toBe(false)
  })

  it('accepts property without managerName (optional)', () => {
    const { managerName, ...rest } = validProperty
    const result = CreatePropertySchema.safeParse(rest)
    expect(result.success).toBe(true)
  })

  it('accepts property without accountantName (optional)', () => {
    const { accountantName, ...rest } = validProperty
    const result = CreatePropertySchema.safeParse(rest)
    expect(result.success).toBe(true)
  })

  it('rejects empty buildings array', () => {
    const result = CreatePropertySchema.safeParse({ ...validProperty, buildings: [] })
    expect(result.success).toBe(false)
  })

  it('rejects building without required fields', () => {
    const result = CreatePropertySchema.safeParse({
      ...validProperty,
      buildings: [{ clientId: buildingClientId, street: 'X' }],
    })
    expect(result.success).toBe(false)
  })
})

describe('UpdatePropertySchema', () => {
  it('accepts partial update with name only', () => {
    const result = UpdatePropertySchema.safeParse({ name: 'New Name' })
    expect(result.success).toBe(true)
  })

  it('accepts empty object', () => {
    const result = UpdatePropertySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects invalid type', () => {
    const result = UpdatePropertySchema.safeParse({ type: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('rejects empty name string', () => {
    const result = UpdatePropertySchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('accepts managerName update', () => {
    const result = UpdatePropertySchema.safeParse({ managerName: 'New Manager' })
    expect(result.success).toBe(true)
  })
})
