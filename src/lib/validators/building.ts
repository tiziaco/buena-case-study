import { z } from 'zod'

export const CreateBuildingSchema = z.object({
  name: z.string().optional(),
  street: z.string().min(1),
  houseNumber: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  country: z.string().default('Germany'),
})

export const UpdateBuildingSchema = CreateBuildingSchema.partial()

export const CreateBuildingWithPropertySchema = CreateBuildingSchema.extend({
  propertyId: z.uuid(),
})

export type CreateBuildingInput = z.infer<typeof CreateBuildingSchema>
export type UpdateBuildingInput = z.infer<typeof UpdateBuildingSchema>
export type CreateBuildingWithPropertyInput = z.infer<typeof CreateBuildingWithPropertySchema>
