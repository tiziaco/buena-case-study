import { z } from 'zod'

export const ExtractionSchema = z.object({
  property: z.object({
    name: z.string(),
    type: z.enum(['WEG', 'MV']),
  }),
  manager_name: z.string().nullable(),
  accountant_name: z.string().nullable(),
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
      floor: z.number().int().nullable(),
      entrance: z.string().nullable(),
      size: z.number().nullable(),
      co_ownership_share: z.number().nullable(),
      construction_year: z.number().int().nullable(),
      rooms: z.number().nullable(),
    }),
  ),
})

export type ExtractionResult = z.infer<typeof ExtractionSchema>
