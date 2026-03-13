import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/extract/route'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}))

vi.mock('ai', () => ({
  generateText: vi.fn(),
  Output: { object: vi.fn((x) => x) },
}))

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'mocked-model'),
}))

const mockExtractionResult = {
  property: { name: 'Parkview Residences Berlin', type: 'WEG' },
  buildings: [{ name: 'Haus A', street: 'Am Fiktivpark', house_number: '12', postal_code: '10557', city: 'Berlin', country: 'Germany' }],
  units: [{ number: '01', type: 'Apartment', building: 'Haus A', floor: 0, size: 95, co_ownership_share: 0.11, construction_year: 2023, rooms: 3 }],
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/extract', () => {
  it('returns 400 when fileRef is missing', async () => {
    const req = new Request('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when fileRef is not a valid UUID', async () => {
    const req = new Request('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({ fileRef: '../../../etc/passwd' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when file does not exist on disk', async () => {
    const { readFile } = await import('node:fs/promises')
    const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    vi.mocked(readFile).mockRejectedValue(err)
    const req = new Request('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({ fileRef: '00000000-0000-0000-0000-000000000000' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns 200 with extraction result', async () => {
    const { readFile } = await import('node:fs/promises')
    vi.mocked(readFile).mockResolvedValue(Buffer.from('%PDF-1.4 fake') as any)
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValue({ output: mockExtractionResult } as any)
    const req = new Request('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({ fileRef: '00000000-0000-0000-0000-000000000000' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.property.name).toBe('Parkview Residences Berlin')
    expect(body.data.buildings).toHaveLength(1)
    expect(body.data.units).toHaveLength(1)
  })

  it('returns 500 on AI service error', async () => {
    const { readFile } = await import('node:fs/promises')
    vi.mocked(readFile).mockResolvedValue(Buffer.from('%PDF-1.4 fake') as any)
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockRejectedValue(new Error('OpenAI error'))
    const req = new Request('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({ fileRef: '00000000-0000-0000-0000-000000000000' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
