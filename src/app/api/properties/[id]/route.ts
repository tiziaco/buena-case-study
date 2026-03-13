import { getPropertyById, updateProperty, deleteProperty } from '@/lib/services/property'
import { UpdatePropertySchema } from '@/lib/validators/property'
import { apiSuccess, apiError, isPrismaNotFound } from '@/lib/api/response'

type Params = Promise<{ id: string }>

export async function GET(_req: Request, { params }: { params: Params }): Promise<Response> {
  try {
    const { id } = await params
    const property = await getPropertyById(id)
    if (!property) return apiError('Property not found', 404)
    // Serialize Prisma Decimal fields in nested units
    const serialized = {
      ...property,
      buildings: property.buildings.map((b) => ({
        ...b,
        units: b.units.map((u) => ({
          ...u,
          coOwnershipShare: u.coOwnershipShare != null
            ? Number(u.coOwnershipShare)
            : null,
        })),
      })),
    }
    return apiSuccess(serialized)
  } catch (e) {
    console.error('[GET /api/properties/:id]', e)
    return apiError('Failed to fetch property', 500)
  }
}

export async function PATCH(req: Request, { params }: { params: Params }): Promise<Response> {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = UpdatePropertySchema.safeParse(body)
    if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten())
    const property = await updateProperty(id, parsed.data)
    return apiSuccess(property)
  } catch (e) {
    if (isPrismaNotFound(e)) return apiError('Property not found', 404)
    console.error('[PATCH /api/properties/:id]', e)
    return apiError('Failed to update property', 500)
  }
}

export async function DELETE(_req: Request, { params }: { params: Params }): Promise<Response> {
  try {
    const { id } = await params
    await deleteProperty(id)
    return new Response(null, { status: 204 })
  } catch (e) {
    if (isPrismaNotFound(e)) return apiError('Property not found', 404)
    console.error('[DELETE /api/properties/:id]', e)
    return apiError('Failed to delete property', 500)
  }
}
