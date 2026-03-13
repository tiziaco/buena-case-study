import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/users/route'
import * as userService from '@/lib/services/user'

vi.mock('@/lib/services/user', () => ({ getUsers: vi.fn() }))

beforeEach(() => vi.clearAllMocks())

describe('GET /api/users', () => {
  it('returns 200 with users list', async () => {
    vi.mocked(userService.getUsers).mockResolvedValue([
      { id: 'user-1', name: 'Alice', email: 'alice@test.com', createdAt: new Date(), updatedAt: new Date() },
    ])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].name).toBe('Alice')
  })

  it('returns 500 on service error', async () => {
    vi.mocked(userService.getUsers).mockRejectedValue(new Error('db'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
