import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/upload/route'

// Mock fs/promises so tests don't write to disk
vi.mock('node:fs/promises', () => ({ writeFile: vi.fn().mockResolvedValue(undefined) }))

function makeFormData(file: File): FormData {
  const fd = new FormData()
  fd.append('file', file)
  return fd
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/upload', () => {
  it('returns 200 with a fileRef uuid on valid PDF upload', async () => {
    const pdfFile = new File(['%PDF-1.4 fake content'], 'test.pdf', { type: 'application/pdf' })
    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: makeFormData(pdfFile),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.fileRef).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('returns 400 when no file field is present', async () => {
    const fd = new FormData()
    const req = new Request('http://localhost/api/upload', { method: 'POST', body: fd })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when file is not a PDF', async () => {
    const txtFile = new File(['hello'], 'doc.txt', { type: 'text/plain' })
    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: makeFormData(txtFile),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 on write error', async () => {
    const { writeFile } = await import('node:fs/promises')
    vi.mocked(writeFile).mockRejectedValue(new Error('disk full'))
    const pdfFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: makeFormData(pdfFile),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
