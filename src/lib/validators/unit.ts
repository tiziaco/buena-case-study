import { z } from 'zod'

export const CreateUnitSchema = z.object({
  buildingClientId: z.uuid({ error: 'Please assign a building' }),
  unitNumber: z.string().min(1, 'Unit number is required'),
  type: z.enum(['APARTMENT', 'OFFICE', 'GARDEN', 'PARKING'], { error: 'Please select a unit type' }),
  floor: z.number().int().optional(),
  entrance: z.string().optional(),
  size: z.number().positive({ error: 'Size must be greater than 0' }).optional(),
  coOwnershipShare: z.number().positive({ error: 'Co-ownership share must be greater than 0' }).optional(),
  constructionYear: z.number().int().min(1800, 'Year must be after 1800').max(2100, 'Year must be before 2100').optional(),
  rooms: z.number().positive({ error: 'Rooms must be greater than 0' }).optional(),
})

export const UpdateUnitSchema = CreateUnitSchema.omit({ buildingClientId: true }).partial()

export type CreateUnitInput = z.infer<typeof CreateUnitSchema>
export type UpdateUnitInput = z.infer<typeof UpdateUnitSchema>

export const BulkCreateUnitSchema = z.object({ units: z.array(CreateUnitSchema) })
export type BulkCreateUnitInput = z.infer<typeof BulkCreateUnitSchema>
