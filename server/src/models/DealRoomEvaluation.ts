import mongoose, { Schema, type Document } from 'mongoose'

export const EVALUATION_CATEGORIES = [
  'market',
  'product',
  'traction',
  'team',
  'businessModel',
  'financials',
  'risk',
] as const

export type EvaluationCategory = (typeof EVALUATION_CATEGORIES)[number]
export type EvaluationScores = Partial<Record<EvaluationCategory, number | null>>

export interface IDealRoomEvaluation extends Document {
  _id: mongoose.Types.ObjectId
  dealRoom: mongoose.Types.ObjectId
  investor: mongoose.Types.ObjectId
  scores: EvaluationScores
  summary: string
  createdAt: Date
  updatedAt: Date
}

const scoresSchema = new Schema(
  {
    market: { type: Number, min: 1, max: 5 },
    product: { type: Number, min: 1, max: 5 },
    traction: { type: Number, min: 1, max: 5 },
    team: { type: Number, min: 1, max: 5 },
    businessModel: { type: Number, min: 1, max: 5 },
    financials: { type: Number, min: 1, max: 5 },
    risk: { type: Number, min: 1, max: 5 },
  },
  { _id: false, minimize: false },
)

const dealRoomEvaluationSchema = new Schema<IDealRoomEvaluation>(
  {
    dealRoom: { type: Schema.Types.ObjectId, ref: 'DealRoom', required: true, unique: true, index: true },
    investor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scores: { type: scoresSchema, default: () => ({}) },
    summary: { type: String, trim: true, default: '', maxlength: 3000 },
  },
  { timestamps: true, minimize: false },
)

dealRoomEvaluationSchema.index({ investor: 1, updatedAt: -1 })

export const DealRoomEvaluation = mongoose.model<IDealRoomEvaluation>('DealRoomEvaluation', dealRoomEvaluationSchema)
