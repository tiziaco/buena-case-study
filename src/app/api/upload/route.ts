import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { apiSuccess, apiError } from '@/lib/api/response'

export async function POST(req: Request): Promise<Response> {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return apiError('No file provided', 400)
    }

    if (file.type !== 'application/pdf') {
      return apiError('File must be a PDF', 400)
    }

    const fileRef = crypto.randomUUID()
    const filePath = join('/tmp', `${fileRef}.pdf`)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    return apiSuccess({ fileRef })
  } catch {
    return apiError('Failed to upload file', 500)
  }
}
