import { z } from 'zod'

export const createConnectionRequestSchema = z.object({
  message: z.string().trim().max(1000, 'Message must be 1000 characters or fewer').optional().default(''),
})

export type CreateConnectionRequestInput = z.infer<typeof createConnectionRequestSchema>
