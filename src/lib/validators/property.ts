import { z } from 'zod'
import { CreateBuildingSchema } from './building'
import { CreateUnitSchema } from './unit'

export const CreatePropertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  type: z.enum(['WEG', 'MV'], { error: 'Please select a management type' }),
  managerName: z.string().optional(),
  accountantName: z.string().optional(),
  declarationFileUrl: z.string().optional(),
  buildings: z.array(CreateBuildingSchema.extend({ clientId: z.uuid() })).min(1, 'At least one building is required'),
  units: z.array(CreateUnitSchema),
})

export const UpdatePropertySchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['WEG', 'MV']).optional(),
  managerName: z.string().optional(),
  accountantName: z.string().optional(),
  declarationFileUrl: z.string().optional(),
})

export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>
export type CreatePropertyFormValues = z.input<typeof CreatePropertySchema>
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>
