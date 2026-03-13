import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import { createTestPrismaClient, cleanDatabase } from '@/tests/helpers/db'
import { getUsers } from '@/lib/services/user'

let testPrisma: ReturnType<typeof createTestPrismaClient>

vi.mock('@/lib/prisma', () => ({ get prisma() { return testPrisma } }))

describe('user service', () => {
  beforeAll(() => { testPrisma = createTestPrismaClient() })
  beforeEach(async () => { await cleanDatabase(testPrisma) })
  afterAll(() => testPrisma.$disconnect())

  describe('getUsers', () => {
    it('returns empty array when no users exist', async () => {
      const result = await getUsers()
      expect(result).toEqual([])
    })

    it('returns all users sorted by name ascending', async () => {
      await testPrisma.user.createMany({
        data: [
          { name: 'Zara', email: 'zara@test.com' },
          { name: 'Alice', email: 'alice@test.com' },
          { name: 'Miguel', email: 'miguel@test.com' },
        ],
      })

      const result = await getUsers()
      expect(result).toHaveLength(3)
      expect(result.map((u) => u.name)).toEqual(['Alice', 'Miguel', 'Zara'])
    })

    it('returns users with all fields', async () => {
      await testPrisma.user.create({ data: { name: 'Bob', email: 'bob@test.com' } })

      const result = await getUsers()
      expect(result[0]).toMatchObject({ name: 'Bob', email: 'bob@test.com' })
      expect(result[0].id).toBeDefined()
      expect(result[0].createdAt).toBeInstanceOf(Date)
    })
  })
})
