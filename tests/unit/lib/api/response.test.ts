import { describe, it, expect } from 'vitest'
import { apiSuccess, apiError, isPrismaNotFound } from '@/lib/api/response'
import { Prisma } from '@/generated/prisma/client'

describe('apiSuccess', () => {
  it('returns 200 with data wrapped in { data }', async () => {
    const response = apiSuccess({ id: '1', name: 'Test' })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ data: { id: '1', name: 'Test' } })
  })

  it('accepts custom status code', async () => {
    const response = apiSuccess({ created: true }, 201)
    expect(response.status).toBe(201)
  })

  it('handles null data', async () => {
    const response = apiSuccess(null)
    const body = await response.json()
    expect(body).toEqual({ data: null })
  })
})

describe('apiError', () => {
  it('returns error response with message and status', async () => {
    const response = apiError('Not found', 404)
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('Not found')
  })

  it('includes details when provided', async () => {
    const response = apiError('Validation failed', 422, { field: 'name' })
    const body = await response.json()
    expect(body.details).toEqual({ field: 'name' })
  })

  it('omits details when not provided', async () => {
    const response = apiError('Unauthorized', 401)
    const body = await response.json()
    expect(body).not.toHaveProperty('details')
  })
})

describe('isPrismaNotFound', () => {
  it('returns true for Prisma P2025 error', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.0.0',
    })
    expect(isPrismaNotFound(err)).toBe(true)
  })

  it('returns false for other Prisma error codes', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '7.0.0',
    })
    expect(isPrismaNotFound(err)).toBe(false)
  })

  it('returns false for non-Prisma errors', () => {
    expect(isPrismaNotFound(new Error('generic'))).toBe(false)
    expect(isPrismaNotFound(null)).toBe(false)
    expect(isPrismaNotFound('string')).toBe(false)
  })
})
