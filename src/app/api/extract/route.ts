import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { apiSuccess, apiError } from '@/lib/api/response'

const ExtractionSchema = z.object({
  property: z.object({
    name: z.string(),
    type: z.enum(['WEG', 'MV']),
  }),
  buildings: z.array(
    z.object({
      name: z.string(),
      street: z.string(),
      house_number: z.string(),
      postal_code: z.string(),
      city: z.string(),
      country: z.string(),
    }),
  ),
  units: z.array(
    z.object({
      number: z.string(),
      type: z.string(),
      building: z.string(),
      floor: z.number().int().optional(),
      entrance: z.string().optional(),
      size: z.number().optional(),
      co_ownership_share: z.number().optional(),
      construction_year: z.number().int().optional(),
      rooms: z.number().optional(),
    }),
  ),
})

const EXTRACTION_PROMPT = `Extract structured data from this German property declaration (Teilungserklärung).

Return the following fields:
- property: the property name and type (WEG or MV)
- buildings: all buildings with their name (e.g. "Haus A"), street, house_number, postal_code, city, country
- units: all units with:
  - number: unit number as a string (e.g. "01")
  - type: exactly one of "Apartment", "Office", "Parking", "Garden"
  - building: the building name (e.g. "Haus A") — must match one of the buildings listed above
  - floor: integer — convert German floor labels (Untergeschoss=-1, Erdgeschoss=0, 1. Obergeschoss=1, 2. Obergeschoss=2, 3. Obergeschoss=3, 4. Obergeschoss=4)
  - entrance: entrance label as found in the document (e.g. "Eingang A")
  - size: floor area in m² as a decimal number
  - co_ownership_share: convert the fraction to a decimal (e.g. "110.0/1000" → 0.11)
  - construction_year: year as an integer
  - rooms: number of rooms as a number

Rules:
- Do NOT infer or fabricate values
- Omit optional fields entirely if not found in the document
- For Parking units that share a group entry, create one entry per parking space`

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

    const filePath = join('/tmp', `${fileRef}.pdf`)

    let fileBuffer: Buffer
    try {
      fileBuffer = await readFile(filePath)
    } catch (e: any) {
      if (e?.code === 'ENOENT') return apiError('File not found', 404)
      throw e
    }

    const base64Data = fileBuffer.toString('base64')
    const fileDataUrl = `data:application/pdf;base64,${base64Data}`

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: EXTRACTION_PROMPT },
            { type: 'file', data: fileDataUrl, mediaType: 'application/pdf' },
          ],
        },
      ],
      output: Output.object({ schema: ExtractionSchema }),
    })

    return apiSuccess(result.output)
  } catch (e) {
    console.error('[POST /api/extract]', e)
    return apiError('Failed to extract data from PDF', 500)
  }
}
