import { z } from 'zod'

export const createChatMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message must be at most 2000 characters'),
  clientMessageId: z.string().uuid('A valid client message ID is required'),
})

export type CreateChatMessageInput = z.infer<typeof createChatMessageSchema>
