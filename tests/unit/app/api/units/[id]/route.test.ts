import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH, DELETE } from '@/app/api/units/[id]/route'
import * as unitService from '@/lib/services/unit'
import { Prisma } from '@/generated/prisma/client'

vi.mock('@/lib/services/unit', () => ({
  updateUnit: vi.fn(),
  deleteUnit: vi.fn(),
}))

const params = { params: Promise.resolve({ id: 'unit-1' }) }
beforeEach(() => vi.clearAllMocks())

describe('PATCH /api/units/[id]', () => {
  it('returns 200 on valid update', async () => {
    vi.mocked(unitService.updateUnit).mockResolvedValue({ id: 'unit-1' } as any)
    const req = new Request('http://localhost/api/units/unit-1', {
      method: 'PATCH',
      body: JSON.stringify({ floor: 2 }),
    })
    const res = await PATCH(req, params)
    expect(res.status).toBe(200)
  })

  it('returns 404 on P2025', async () => {
    vi.mocked(unitService.updateUnit).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('', { code: 'P2025', clientVersion: '7.0.0' }),
    )
    const req = new Request('http://localhost/api/units/unit-1', {
      method: 'PATCH',
      body: JSON.stringify({ floor: 2 }),
    })
    const res = await PATCH(req, params)
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/units/[id]', () => {
  it('returns 204 on success', async () => {
    vi.mocked(unitService.deleteUnit).mockResolvedValue()
    const res = await DELETE(new Request('http://localhost/api/units/unit-1'), params)
    expect(res.status).toBe(204)
  })

  it('returns 404 on P2025', async () => {
    vi.mocked(unitService.deleteUnit).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('', { code: 'P2025', clientVersion: '7.0.0' }),
    )
    const res = await DELETE(new Request('http://localhost/api/units/unit-1'), params)
    expect(res.status).toBe(404)
  })
})
