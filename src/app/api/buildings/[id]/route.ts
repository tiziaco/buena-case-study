import { updateBuilding, deleteBuilding } from '@/lib/services/building'
import { UpdateBuildingSchema } from '@/lib/validators/building'
import { apiSuccess, apiError, isPrismaNotFound } from '@/lib/api/response'

type Params = Promise<{ id: string }>

export async function PATCH(req: Request, { params }: { params: Params }): Promise<Response> {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = UpdateBuildingSchema.safeParse(body)
    if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten())
    const building = await updateBuilding(id, parsed.data)
    return apiSuccess(building)
  } catch (e) {
    if (isPrismaNotFound(e)) return apiError('Building not found', 404)
    return apiError('Failed to update building', 500)
  }
}

export async function DELETE(_req: Request, { params }: { params: Params }): Promise<Response> {
  try {
    const { id } = await params
    await deleteBuilding(id)
    return new Response(null, { status: 204 })
  } catch (e) {
    if (isPrismaNotFound(e)) return apiError('Building not found', 404)
    return apiError('Failed to delete building', 500)
  }
}
