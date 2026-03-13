import { describe, it, expect } from 'vitest'
import { CreateBuildingSchema, UpdateBuildingSchema } from '@/lib/validators/building'

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
  })
})
