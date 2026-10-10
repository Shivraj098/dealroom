import { z } from 'zod'

const scoreSchema = z.union([z.number().int().min(1).max(5), z.null()])

export const updateDealRoomStatusSchema = z.object({
  status: z.enum(['approved', 'passed']),
})

export const saveEvaluationSchema = z.object({
  scores: z.object({
    market: scoreSchema.optional(),
    product: scoreSchema.optional(),
    traction: scoreSchema.optional(),
    team: scoreSchema.optional(),
    businessModel: scoreSchema.optional(),
    financials: scoreSchema.optional(),
    risk: scoreSchema.optional(),
  }).optional(),
  summary: z.string().trim().max(3000, 'Evaluation summary must be 3000 characters or fewer').optional(),
}).refine(
  (value) => Boolean((value.summary?.trim().length ?? 0) > 0 || Object.values(value.scores ?? {}).some((score) => score !== undefined && score !== null)),
  { message: 'Provide at least one score or an evaluation summary' },
)

export const createPrivateNoteSchema = z.object({
  title: z.string().trim().min(1, 'A note title is required').max(120),
  content: z.string().trim().min(1, 'Note content is required').max(5000),
})

export const updatePrivateNoteSchema = createPrivateNoteSchema

export const createInformationRequestSchema = z.object({
  title: z.string().trim().min(1, 'A request title is required').max(120),
  description: z.string().trim().min(1, 'A description is required').max(2000),
})

const optionalUrlSchema = z.union([
  z.literal(''),
  z.string().trim().url('Enter a valid URL').max(1000),
]).optional().default('')

export const respondToInformationRequestSchema = z.object({
  responseText: z.string().trim().min(1, 'A response is required').max(5000),
  responseLink: optionalUrlSchema,
})

export type UpdateDealRoomStatusInput = z.infer<typeof updateDealRoomStatusSchema>
export type SaveEvaluationInput = z.infer<typeof saveEvaluationSchema>
export type PrivateNoteInput = z.infer<typeof createPrivateNoteSchema>
export type CreateInformationRequestInput = z.infer<typeof createInformationRequestSchema>
export type RespondToInformationRequestInput = z.infer<typeof respondToInformationRequestSchema>
