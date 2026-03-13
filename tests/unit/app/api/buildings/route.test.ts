import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/buildings/route'
import * as buildingService from '@/lib/services/building'

vi.mock('@/lib/services/building', () => ({ createBuilding: vi.fn() }))

const mockBuilding = { id: 'bld-1', propertyId: 'prop-1', name: 'Haus A', street: 'Teststraße', houseNumber: '1', postalCode: '10115', city: 'Berlin', country: 'Germany' }

beforeEach(() => vi.clearAllMocks())

describe('POST /api/buildings', () => {
  const validBody = {
    propertyId: '550e8400-e29b-41d4-a716-446655440000',
    street: 'Teststraße',
    houseNumber: '1',
    postalCode: '10115',
    city: 'Berlin',
  }

  it('returns 201 with created building', async () => {
    vi.mocked(buildingService.createBuilding).mockResolvedValue(mockBuilding as any)
    const req = new Request('http://localhost/api/buildings', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(buildingService.createBuilding).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      expect.objectContaining({ street: 'Teststraße' }),
    )
  })

  it('returns 400 on missing propertyId', async () => {
    const req = new Request('http://localhost/api/buildings', {
      method: 'POST',
      body: JSON.stringify({ street: 'Teststraße', houseNumber: '1', postalCode: '10115', city: 'Berlin' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 on service error', async () => {
    vi.mocked(buildingService.createBuilding).mockRejectedValue(new Error('db'))
    const req = new Request('http://localhost/api/buildings', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
