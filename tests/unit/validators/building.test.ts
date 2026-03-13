import { describe, it, expect } from 'vitest'
import {
  CreateBuildingSchema,
  UpdateBuildingSchema,
  CreateBuildingWithPropertySchema,
} from '@/lib/validators/building'

describe('CreateBuildingSchema', () => {
  it('accepts a valid building', () => {
    const result = CreateBuildingSchema.safeParse({
      street: 'Hauptstraße',
      houseNumber: '12',
      postalCode: '10115',
      city: 'Berlin',
    })
    expect(result.success).toBe(true)
    expect(result.data?.country).toBe('Germany') // default
  })

  it('allows overriding country default', () => {
    const result = CreateBuildingSchema.safeParse({
      street: 'Rue de la Paix',
      houseNumber: '1',
      postalCode: '75001',
      city: 'Paris',
      country: 'France',
    })
    expect(result.success).toBe(true)
    expect(result.data?.country).toBe('France')
  })

  it('rejects empty street', () => {
    const result = CreateBuildingSchema.safeParse({
      street: '',
      houseNumber: '12',
      postalCode: '10115',
      city: 'Berlin',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('street')
  })

  it('rejects missing required fields', () => {
    const result = CreateBuildingSchema.safeParse({ street: 'Hauptstraße' })
    expect(result.success).toBe(false)
  })
})

describe('UpdateBuildingSchema', () => {
  it('accepts a partial update', () => {
    const result = UpdateBuildingSchema.safeParse({ city: 'Hamburg' })
    expect(result.success).toBe(true)
    expect(result.data?.city).toBe('Hamburg')
  })

  it('accepts an empty object', () => {
    const result = UpdateBuildingSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects empty string for city', () => {
    const result = UpdateBuildingSchema.safeParse({ city: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('city')
  })
})

describe('CreateBuildingSchema (with name)', () => {
  it('accepts optional name field', () => {
    const result = CreateBuildingSchema.safeParse({
      name: 'Haus A',
      street: 'Hauptstraße',
      houseNumber: '12',
      postalCode: '10115',
      city: 'Berlin',
    })
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Haus A')
  })

  it('accepts building without name', () => {
    const result = CreateBuildingSchema.safeParse({
      street: 'Hauptstraße',
      houseNumber: '12',
      postalCode: '10115',
      city: 'Berlin',
    })
    expect(result.success).toBe(true)
    expect(result.data?.name).toBeUndefined()
  })
})

describe('CreateBuildingWithPropertySchema', () => {
  it('accepts valid building with propertyId', () => {
    const result = CreateBuildingWithPropertySchema.safeParse({
      street: 'Hauptstraße',
      houseNumber: '12',
      postalCode: '10115',
      city: 'Berlin',
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing propertyId', () => {
    const result = CreateBuildingWithPropertySchema.safeParse({
      street: 'Hauptstraße',
      houseNumber: '12',
      postalCode: '10115',
      city: 'Berlin',
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-uuid propertyId', () => {
    const result = CreateBuildingWithPropertySchema.safeParse({
      street: 'Hauptstraße',
      houseNumber: '12',
      postalCode: '10115',
      city: 'Berlin',
      propertyId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })
})
