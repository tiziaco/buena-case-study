import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH, DELETE } from '@/app/api/buildings/[id]/route'
import * as buildingService from '@/lib/services/building'
import { Prisma } from '@/generated/prisma/client'

vi.mock('@/lib/services/building', () => ({
  updateBuilding: vi.fn(),
  deleteBuilding: vi.fn(),
}))

const params = { params: Promise.resolve({ id: 'bld-1' }) }
beforeEach(() => vi.clearAllMocks())

describe('PATCH /api/buildings/[id]', () => {
  it('returns 200 on valid update', async () => {
    vi.mocked(buildingService.updateBuilding).mockResolvedValue({ id: 'bld-1' } as any)
    const req = new Request('http://localhost/api/buildings/bld-1', {
      method: 'PATCH',
      body: JSON.stringify({ city: 'Hamburg' }),
    })
    const res = await PATCH(req, params)
    expect(res.status).toBe(200)
  })

  it('returns 400 on invalid field (empty city)', async () => {
    const req = new Request('http://localhost/api/buildings/bld-1', {
      method: 'PATCH',
      body: JSON.stringify({ city: '' }),
    })
    const res = await PATCH(req, params)
    expect(res.status).toBe(400)
  })

  it('returns 404 on P2025', async () => {
    vi.mocked(buildingService.updateBuilding).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('', { code: 'P2025', clientVersion: '7.0.0' }),
    )
    const req = new Request('http://localhost/api/buildings/bld-1', {
      method: 'PATCH',
      body: JSON.stringify({ city: 'Hamburg' }),
    })
    const res = await PATCH(req, params)
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/buildings/[id]', () => {
  it('returns 204 on success', async () => {
    vi.mocked(buildingService.deleteBuilding).mockResolvedValue()
    const res = await DELETE(new Request('http://localhost/api/buildings/bld-1'), params)
    expect(res.status).toBe(204)
  })

  it('returns 404 on P2025', async () => {
    vi.mocked(buildingService.deleteBuilding).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('', { code: 'P2025', clientVersion: '7.0.0' }),
    )
    const res = await DELETE(new Request('http://localhost/api/buildings/bld-1'), params)
    expect(res.status).toBe(404)
  })
})
