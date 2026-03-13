import { prisma } from '@/lib/prisma'
import type { User } from '@/generated/prisma/client'

export async function getUsers(): Promise<User[]> {
  return prisma.user.findMany({ orderBy: { name: 'asc' } })
}
