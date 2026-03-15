import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { ExtractionSchema, type ExtractionResult } from '@/lib/validators/extraction'

const EXTRACTION_PROMPT = `Extract structured data from this German property declaration (Teilungserklärung).

Return the following fields:
- property: the WEG or community name as written in the document, and its type (WEG or MV)
- manager_name: full name of the property manager (Verwalter/Hausverwaltung) if present, otherwise null
- accountant_name: full name of the accountant or accounting firm (Buchhalter/Buchhaltung) if present, otherwise null
- buildings: all buildings with their name (e.g. "Haus A"), street, house_number, postal_code, city, country
- units: all units with:
  - number: unit number as a string (e.g. "01")
  - type: exactly one of "Apartment", "Office", "Parking", "Garden", "Storage", "Shop", "Other"
    - Wohnung → Apartment
    - Büro, Praxis → Office
    - Stellplatz, Tiefgaragenstellplatz, Garage → Parking
    - Garten, Gartenanteil → Garden
    - Keller, Abstellraum, Lager → Storage
    - Laden, Gewerbe, Verkaufsfläche → Shop
    - Anything else → Other
  - building: the building name (e.g. "Haus A") — must match one of the buildings listed above
  - floor: integer — convert German floor labels:
    - UG, Untergeschoss → -1
    - EG, Erdgeschoss → 0
    - 1. OG, 1. Obergeschoss → 1
    - 2. OG, 2. Obergeschoss → 2
    - 3. OG, 3. Obergeschoss → 3
    - 4. OG, 4. Obergeschoss → 4
    - DG, Dachgeschoss → infer the actual floor number from the building's floor sequence (e.g. if floors go EG, 1.OG, 2.OG, DG then DG=3)
  - entrance: entrance label as found in the document (e.g. "Eingang A")
  - size: floor area in m² as a decimal number
  - co_ownership_share: convert the fraction to a decimal (e.g. "110/1000" → 0.11)
  - construction_year: year as an integer — if only defined at building level, replicate it to all units in that building
  - rooms: number of rooms as a number

Rules:
- Do NOT infer or fabricate values
- Set optional fields to null if not found in the document
- For Parking units that share a group entry, create one entry per parking space
- Use "Other" only when no other type fits — not as a default`

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
