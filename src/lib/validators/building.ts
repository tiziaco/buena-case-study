import { z } from 'zod'

export const CreateBuildingSchema = z.object({
  name: z.string().optional(),
  street: z.string().min(1, 'Street is required'),
  houseNumber: z.string().min(1, 'House number is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().default('Germany'),
})

export const UpdateBuildingSchema = CreateBuildingSchema.partial()

export const CreateBuildingWithPropertySchema = CreateBuildingSchema.extend({
  propertyId: z.uuid(),
})

export type CreateBuildingInput = z.infer<typeof CreateBuildingSchema>
export type UpdateBuildingInput = z.infer<typeof UpdateBuildingSchema>
export type CreateBuildingWithPropertyInput = z.infer<typeof CreateBuildingWithPropertySchema>
