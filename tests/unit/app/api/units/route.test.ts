import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/units/route'
import * as unitService from '@/lib/services/unit'

vi.mock('@/lib/services/unit', () => ({
  createUnit: vi.fn(),
  bulkCreateUnits: vi.fn(),
}))

const buildingId = '550e8400-e29b-41d4-a716-446655440000'
const mockUnit = { id: 'unit-1', buildingId, unitNumber: 'A-01', type: 'APARTMENT' }

beforeEach(() => vi.clearAllMocks())

describe('POST /api/units (single)', () => {
  const validSingle = { buildingClientId: buildingId, unitNumber: 'A-01', type: 'APARTMENT' }

  it('creates single unit and returns 201', async () => {
    vi.mocked(unitService.createUnit).mockResolvedValue(mockUnit as any)
    const req = new Request('http://localhost/api/units', {
      method: 'POST',
      body: JSON.stringify(validSingle),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(unitService.createUnit).toHaveBeenCalled()
    expect(unitService.bulkCreateUnits).not.toHaveBeenCalled()
  })

  it('returns 400 on invalid single unit', async () => {
    const req = new Request('http://localhost/api/units', {
      method: 'POST',
      body: JSON.stringify({ unitNumber: 'A-01' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/units (bulk)', () => {
  const validBulk = {
    units: [
      { buildingClientId: buildingId, unitNumber: 'A-01', type: 'APARTMENT' },
      { buildingClientId: buildingId, unitNumber: 'A-02', type: 'PARKING' },
    ],
  }

  it('creates bulk units and returns 201', async () => {
    vi.mocked(unitService.bulkCreateUnits).mockResolvedValue([mockUnit] as any)
    const req = new Request('http://localhost/api/units', {
      method: 'POST',
      body: JSON.stringify(validBulk),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(unitService.bulkCreateUnits).toHaveBeenCalled()
    expect(unitService.createUnit).not.toHaveBeenCalled()
  })

  it('returns 400 on invalid unit inside bulk array', async () => {
    const req = new Request('http://localhost/api/units', {
      method: 'POST',
      body: JSON.stringify({ units: [{ unitNumber: 'A-01' }] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
