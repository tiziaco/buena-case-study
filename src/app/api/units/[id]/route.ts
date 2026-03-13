import { updateUnit, deleteUnit } from '@/lib/services/unit'
import { UpdateUnitSchema } from '@/lib/validators/unit'
import { apiSuccess, apiError, isPrismaNotFound } from '@/lib/api/response'
import type { Unit } from '@/generated/prisma/client'

type Params = Promise<{ id: string }>

function serializeUnit(u: Unit) {
  return { ...u, coOwnershipShare: u.coOwnershipShare?.toNumber() ?? null }
}

export async function PATCH(req: Request, { params }: { params: Params }): Promise<Response> {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = UpdateUnitSchema.safeParse(body)
    if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten())
    const unit = await updateUnit(id, parsed.data)
    return apiSuccess(serializeUnit(unit))
  } catch (e) {
    if (isPrismaNotFound(e)) return apiError('Unit not found', 404)
    console.error('[PATCH /api/units/:id]', e)
    return apiError('Failed to update unit', 500)
  }
}

export async function DELETE(_req: Request, { params }: { params: Params }): Promise<Response> {
  try {
    const { id } = await params
    await deleteUnit(id)
    return new Response(null, { status: 204 })
  } catch (e) {
    if (isPrismaNotFound(e)) return apiError('Unit not found', 404)
    console.error('[DELETE /api/units/:id]', e)
    return apiError('Failed to delete unit', 500)
  }
}
