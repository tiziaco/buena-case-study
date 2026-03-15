import { getProperties, createProperty } from '@/lib/services/property'
import { CreatePropertySchema } from '@/lib/validators/property'
import { apiSuccess, apiError } from '@/lib/api/response'

export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url)
    const filters = {
      type: searchParams.get('type') ?? undefined,
      sizeMin: searchParams.get('sizeMin') ?? undefined,
      sizeMax: searchParams.get('sizeMax') ?? undefined,
      yearMin: searchParams.get('yearMin') ?? undefined,
      yearMax: searchParams.get('yearMax') ?? undefined,
    }
    const properties = await getProperties(filters)
    return apiSuccess(properties)
  } catch (e) {
    console.error('[GET /api/properties]', e)
    return apiError('Failed to fetch properties', 500)
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const parsed = CreatePropertySchema.safeParse(body)
    if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten())
    const property = await createProperty(parsed.data)
    return apiSuccess(property, 201)
  } catch (e) {
    console.error('[POST /api/properties]', e)
    return apiError('Failed to create property', 500)
  }
}
