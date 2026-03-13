import { createBuilding } from '@/lib/services/building'
import { CreateBuildingWithPropertySchema } from '@/lib/validators/building'
import { apiSuccess, apiError } from '@/lib/api/response'

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const parsed = CreateBuildingWithPropertySchema.safeParse(body)
    if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten())
    const { propertyId, ...buildingData } = parsed.data
    const building = await createBuilding(propertyId, buildingData)
    return apiSuccess(building, 201)
  } catch {
    return apiError('Failed to create building', 500)
  }
}
