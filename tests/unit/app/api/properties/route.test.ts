import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/properties/route'
import * as propertyService from '@/lib/services/property'

vi.mock('@/lib/services/property', () => ({
  getProperties: vi.fn(),
  createProperty: vi.fn(),
}))

const mockSummary = {
  id: 'prop-1',
  name: 'Test',
  type: 'WEG',
  propertyNumber: 'PROP-2026-00001',
  createdAt: new Date(),
  staff: { manager: null, accountant: null },
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/properties', () => {
  it('returns 200 with properties list', async () => {
    vi.mocked(propertyService.getProperties).mockResolvedValue([mockSummary])
    const req = new Request('http://localhost/api/properties')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
  })

  it('passes query filters to service', async () => {
    vi.mocked(propertyService.getProperties).mockResolvedValue([])
    const req = new Request('http://localhost/api/properties?type=WEG&managerId=abc')
    await GET(req)
    expect(propertyService.getProperties).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'WEG', managerId: 'abc' }),
    )
  })

  it('returns 500 on service error', async () => {
    vi.mocked(propertyService.getProperties).mockRejectedValue(new Error('db error'))
    const req = new Request('http://localhost/api/properties')
    const res = await GET(req)
    expect(res.status).toBe(500)
  })
})

describe('POST /api/properties', () => {
  const validBody = {
    name: 'My Property',
    type: 'WEG',
    managerId: '550e8400-e29b-41d4-a716-446655440000',
    accountantId: '550e8400-e29b-41d4-a716-446655440001',
    buildings: [
      {
        clientId: '550e8400-e29b-41d4-a716-446655440002',
        street: 'Teststraße',
        houseNumber: '1',
        postalCode: '10115',
        city: 'Berlin',
      },
    ],
    units: [],
  }

  it('returns 201 with created property on valid input', async () => {
    vi.mocked(propertyService.createProperty).mockResolvedValue(mockSummary)
    const req = new Request('http://localhost/api/properties', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBe('prop-1')
  })

  it('returns 400 on invalid body', async () => {
    const req = new Request('http://localhost/api/properties', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 on service error', async () => {
    vi.mocked(propertyService.createProperty).mockRejectedValue(new Error('db error'))
    const req = new Request('http://localhost/api/properties', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
