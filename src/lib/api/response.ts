import { Prisma } from '@/generated/prisma/client'

export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status })
}

export function apiError(message: string, status: number, details?: unknown): Response {
  // Only include `details` key when a value is provided — omitting it keeps responses clean
  return Response.json(
    { error: message, ...(details !== undefined && { details }) },
    { status },
  )
}

export function isPrismaNotFound(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025'
}
