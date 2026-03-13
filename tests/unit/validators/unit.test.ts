import { describe, it, expect } from 'vitest'
import { CreateUnitSchema, UpdateUnitSchema, BulkCreateUnitSchema } from '@/lib/validators/unit'
import { v4 as uuidv4 } from 'uuid'

const validUnit = {
  buildingClientId: uuidv4(),
  unitNumber: 'A-01',
  type: 'APARTMENT' as const,
}

describe('CreateUnitSchema', () => {
  it('accepts minimal valid unit', () => {
    const result = CreateUnitSchema.safeParse(validUnit)
    expect(result.success).toBe(true)
  })

  it('accepts full unit with all optional fields', () => {
    const result = CreateUnitSchema.safeParse({
      ...validUnit,
      floor: 3,
      entrance: 'A',
      size: 75.5,
      coOwnershipShare: 0.05,
      constructionYear: 2001,
      rooms: 3.5,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid buildingClientId (not uuid)', () => {
    const result = CreateUnitSchema.safeParse({ ...validUnit, buildingClientId: 'not-a-uuid' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('buildingClientId')
  })

  it('rejects empty unitNumber', () => {
    const result = CreateUnitSchema.safeParse({ ...validUnit, unitNumber: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('unitNumber')
  })

  it('rejects invalid unit type', () => {
    const result = CreateUnitSchema.safeParse({ ...validUnit, type: 'WAREHOUSE' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('type')
  })

  it('rejects constructionYear before 1800', () => {
    const result = CreateUnitSchema.safeParse({ ...validUnit, constructionYear: 1799 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('constructionYear')
  })

  it('rejects constructionYear after 2100', () => {
    const result = CreateUnitSchema.safeParse({ ...validUnit, constructionYear: 2101 })
    expect(result.success).toBe(false)
  })

  it('rejects negative size', () => {
    const result = CreateUnitSchema.safeParse({ ...validUnit, size: -10 })
    expect(result.success).toBe(false)
  })
})

describe('UpdateUnitSchema', () => {
  it('accepts partial update without buildingClientId', () => {
    const result = UpdateUnitSchema.safeParse({ floor: 2, rooms: 4 })
    expect(result.success).toBe(true)
  })

  it('accepts empty object', () => {
    const result = UpdateUnitSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects invalid type in update', () => {
    const result = UpdateUnitSchema.safeParse({ type: 'BARN' })
    expect(result.success).toBe(false)
  })
})

describe('BulkCreateUnitSchema', () => {
  it('accepts an array of valid units', () => {
    const result = BulkCreateUnitSchema.safeParse({
      units: [
        {
          buildingClientId: '550e8400-e29b-41d4-a716-446655440000',
          unitNumber: 'A-01',
          type: 'APARTMENT',
        },
        {
          buildingClientId: '550e8400-e29b-41d4-a716-446655440000',
          unitNumber: 'A-02',
          type: 'PARKING',
        },
      ],
    })
    expect(result.success).toBe(true)
    expect(result.data?.units).toHaveLength(2)
  })

  it('rejects missing units key', () => {
    const result = BulkCreateUnitSchema.safeParse({ items: [] })
    expect(result.success).toBe(false)
  })

  it('rejects invalid unit inside array', () => {
    const result = BulkCreateUnitSchema.safeParse({
      units: [{ buildingClientId: 'not-a-uuid', unitNumber: 'A-01', type: 'APARTMENT' }],
    })
    expect(result.success).toBe(false)
  })
})
