import { z } from 'zod'

export const CreateBuildingSchema = z.object({
  street: z.string().min(1),
  houseNumber: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  country: z.string().default('Germany'),
})

export const UpdateBuildingSchema = CreateBuildingSchema.partial()

export type CreateBuildingInput = z.infer<typeof CreateBuildingSchema>
export type UpdateBuildingInput = z.infer<typeof UpdateBuildingSchema>
