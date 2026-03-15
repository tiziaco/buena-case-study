import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { ExtractionSchema, type ExtractionResult } from '@/lib/validators/extraction'

const EXTRACTION_PROMPT = `Extract structured data from this German property declaration (Teilungserklärung).

Return the following fields:
- property: the property name and type (WEG or MV)
- manager_name: name of the property manager (Verwalter) if present in the document, otherwise null
- accountant_name: name of the accountant (Buchhalter/Beirat) if present in the document, otherwise null
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
- Set optional fields to null if not found in the document
- For Parking units that share a group entry, create one entry per parking space`

export async function extractFromPdf(fileRef: string): Promise<ExtractionResult> {
  const filePath = join('/tmp', `${fileRef}.pdf`)

  let fileBuffer: Buffer
  try {
    fileBuffer = await readFile(filePath)
  } catch (e: any) {
    if (e?.code === 'ENOENT') throw Object.assign(new Error('File not found'), { code: 'ENOENT' })
    throw e
  }

  const result = await generateText({
    model: openai('gpt-4o-mini'),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: EXTRACTION_PROMPT },
          { type: 'file', data: new Uint8Array(fileBuffer), mediaType: 'application/pdf' },
        ],
      },
    ],
    output: Output.object({ schema: ExtractionSchema }),
  })

  if (result.output == null) {
    throw new Error('AI model returned no structured output')
  }
  return result.output
}
