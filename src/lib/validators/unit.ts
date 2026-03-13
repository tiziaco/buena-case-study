import { z } from 'zod'

export const CreateUnitSchema = z.object({
  buildingClientId: z.uuid(),
  unitNumber: z.string().min(1),
  type: z.enum(['APARTMENT', 'OFFICE', 'GARDEN', 'PARKING']),
  floor: z.number().int().optional(),
  entrance: z.string().optional(),
  size: z.number().positive().optional(),
  coOwnershipShare: z.number().positive().optional(),
  constructionYear: z.number().int().min(1800).max(2100).optional(),
  rooms: z.number().positive().optional(),
})

export const UpdateUnitSchema = CreateUnitSchema.omit({ buildingClientId: true }).partial()

export type CreateUnitInput = z.infer<typeof CreateUnitSchema>
export type UpdateUnitInput = z.infer<typeof UpdateUnitSchema>
