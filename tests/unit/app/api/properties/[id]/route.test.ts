import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH, DELETE } from '@/app/api/properties/[id]/route'
import * as propertyService from '@/lib/services/property'
import { Prisma } from '@/generated/prisma/client'

vi.mock('@/lib/services/property', () => ({
  getPropertyById: vi.fn(),
  updateProperty: vi.fn(),
  deleteProperty: vi.fn(),
}))

const mockDetail = { id: 'prop-1', name: 'Test', type: 'WEG', buildings: [], staff: [] }
const params = { params: Promise.resolve({ id: 'prop-1' }) }

beforeEach(() => vi.clearAllMocks())

describe('GET /api/properties/[id]', () => {
  it('returns 200 with property detail', async () => {
    vi.mocked(propertyService.getPropertyById).mockResolvedValue(mockDetail as any)
    const res = await GET(new Request('http://localhost/api/properties/prop-1'), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe('prop-1')
  })

  it('returns 404 when property not found', async () => {
    vi.mocked(propertyService.getPropertyById).mockResolvedValue(null)
    const res = await GET(new Request('http://localhost/api/properties/prop-1'), params)
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/properties/[id]', () => {
  it('returns 200 with updated property', async () => {
    vi.mocked(propertyService.updateProperty).mockResolvedValue({ id: 'prop-1', name: 'Updated' } as any)
    const req = new Request('http://localhost/api/properties/prop-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PATCH(req, params)
    expect(res.status).toBe(200)
  })

  it('returns 400 on invalid body (empty name)', async () => {
    const req = new Request('http://localhost/api/properties/prop-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: '' }),
    })
    const res = await PATCH(req, params)
    expect(res.status).toBe(400)
  })

  it('returns 404 when record not found (P2025)', async () => {
    vi.mocked(propertyService.updateProperty).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', { code: 'P2025', clientVersion: '7.0.0' }),
    )
    const req = new Request('http://localhost/api/properties/prop-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'X' }),
    })
    const res = await PATCH(req, params)
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/properties/[id]', () => {
  it('returns 204 on successful delete', async () => {
    vi.mocked(propertyService.deleteProperty).mockResolvedValue()
    const res = await DELETE(new Request('http://localhost/api/properties/prop-1'), params)
    expect(res.status).toBe(204)
  })

  it('returns 404 when record not found (P2025)', async () => {
    vi.mocked(propertyService.deleteProperty).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', { code: 'P2025', clientVersion: '7.0.0' }),
    )
    const res = await DELETE(new Request('http://localhost/api/properties/prop-1'), params)
    expect(res.status).toBe(404)
  })
})
