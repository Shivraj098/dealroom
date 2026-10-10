import { z } from 'zod'

export const updateUserSuspensionSchema = z.object({
  suspended: z.boolean(),
  reason: z.string().trim().max(500, 'Suspension reason must be 500 characters or fewer').optional().default(''),
})

export const updateStartupModerationSchema = z.object({
  hidden: z.boolean(),
  reason: z.string().trim().max(500, 'Moderation reason must be 500 characters or fewer').optional().default(''),
})

export type UpdateUserSuspensionInput = z.infer<typeof updateUserSuspensionSchema>
export type UpdateStartupModerationInput = z.infer<typeof updateStartupModerationSchema>
