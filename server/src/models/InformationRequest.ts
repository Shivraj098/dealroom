import mongoose, { Schema, type Document } from 'mongoose'

export const INFORMATION_REQUEST_STATUSES = ['open', 'responded', 'closed'] as const
export type InformationRequestStatus = (typeof INFORMATION_REQUEST_STATUSES)[number]

export interface IInformationRequest extends Document {
  _id: mongoose.Types.ObjectId
  dealRoom: mongoose.Types.ObjectId
  startup: mongoose.Types.ObjectId
  founder: mongoose.Types.ObjectId
  investor: mongoose.Types.ObjectId
  title: string
  description: string
  status: InformationRequestStatus
  responseText: string
  responseLink: string
  respondedAt?: Date
  closedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const informationRequestSchema = new Schema<IInformationRequest>(
  {
    dealRoom: { type: Schema.Types.ObjectId, ref: 'DealRoom', required: true, index: true },
    startup: { type: Schema.Types.ObjectId, ref: 'StartupProfile', required: true },
    founder: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    investor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, trim: true, required: true, maxlength: 120 },
    description: { type: String, trim: true, required: true, maxlength: 2000 },
    status: { type: String, enum: INFORMATION_REQUEST_STATUSES, default: 'open', required: true },
    responseText: { type: String, trim: true, default: '', maxlength: 5000 },
    responseLink: { type: String, trim: true, default: '', maxlength: 1000 },
    respondedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true, minimize: false },
)

informationRequestSchema.index({ dealRoom: 1, createdAt: -1 })
informationRequestSchema.index({ founder: 1, status: 1, updatedAt: -1 })

export const InformationRequest = mongoose.model<IInformationRequest>('InformationRequest', informationRequestSchema)
