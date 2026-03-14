import { extractFromPdf } from '@/lib/services/extraction'
import { apiSuccess, apiError } from '@/lib/api/response'

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const { fileRef } = body

    if (!fileRef || typeof fileRef !== 'string') {
      return apiError('fileRef is required', 400)
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    if (!UUID_REGEX.test(fileRef)) {
      return apiError('Invalid fileRef format', 400)
    }

    const result = await extractFromPdf(fileRef)
    return apiSuccess(result)
  } catch (e: any) {
    if (e?.code === 'ENOENT') return apiError('File not found', 404)
    console.error('[POST /api/extract]', e)
    return apiError('Failed to extract data from PDF', 500)
  }
}
