import { z } from 'zod'
import { CreateBuildingSchema } from './building'
import { CreateUnitSchema } from './unit'

export const CreatePropertySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['WEG', 'MV']),
  managerId: z.uuid(),
  accountantId: z.uuid(),
  declarationFileUrl: z.string().optional(),
  buildings: z.array(CreateBuildingSchema.extend({ clientId: z.uuid() })).min(1),
  units: z.array(CreateUnitSchema),
}).refine(data => data.managerId !== data.accountantId, {
  message: 'Manager and accountant must be different people',
  path: ['accountantId'],
})

export const UpdatePropertySchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['WEG', 'MV']).optional(),
  declarationFileUrl: z.string().optional(),
})

export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>
export type CreatePropertyFormValues = z.input<typeof CreatePropertySchema>
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>
