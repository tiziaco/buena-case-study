import { createUnit, bulkCreateUnits } from '@/lib/services/unit'
import { CreateUnitSchema, BulkCreateUnitSchema } from '@/lib/validators/unit'
import { apiSuccess, apiError } from '@/lib/api/response'
import type { Unit } from '@/generated/prisma/client'

// Prisma returns coOwnershipShare as Decimal — convert to number for JSON serialization
function serializeUnit(u: Unit) {
  return { ...u, coOwnershipShare: u.coOwnershipShare?.toNumber() ?? null }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json()

    // Discriminate: bulk if body has a `units` array key
    if ('units' in body && Array.isArray(body.units)) {
      const parsed = BulkCreateUnitSchema.safeParse(body)
      if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten())
      const units = await bulkCreateUnits(parsed.data.units)
      return apiSuccess(units.map(serializeUnit), 201)
    }

    const parsed = CreateUnitSchema.safeParse(body)
    if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten())
    const unit = await createUnit(parsed.data)
    return apiSuccess(serializeUnit(unit), 201)
  } catch (e) {
    console.error('[POST /api/units]', e)
    return apiError('Failed to create unit(s)', 500)
  }
}
