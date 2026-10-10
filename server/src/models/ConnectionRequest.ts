import mongoose, { Schema, type Document } from 'mongoose'

export const CONNECTION_REQUEST_STATUSES = ['pending', 'accepted', 'rejected'] as const
export type ConnectionRequestStatus = (typeof CONNECTION_REQUEST_STATUSES)[number]

export interface IConnectionRequest extends Document {
  _id: mongoose.Types.ObjectId
  startup: mongoose.Types.ObjectId
  founder: mongoose.Types.ObjectId
  investor: mongoose.Types.ObjectId
  message: string
  status: ConnectionRequestStatus
  respondedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const connectionRequestSchema = new Schema<IConnectionRequest>(
  {
    startup: { type: Schema.Types.ObjectId, ref: 'StartupProfile', required: true, index: true },
    founder: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    investor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, trim: true, default: '', maxlength: 1000 },
    status: { type: String, enum: CONNECTION_REQUEST_STATUSES, default: 'pending', required: true },
    respondedAt: { type: Date },
  },
  { timestamps: true, minimize: false }
)

// Preserve request history while allowing only one pending request per investor/startup pair.
connectionRequestSchema.index(
  { investor: 1, startup: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
)
connectionRequestSchema.index({ founder: 1, status: 1, createdAt: -1 })
connectionRequestSchema.index({ investor: 1, createdAt: -1 })

export const ConnectionRequest = mongoose.model<IConnectionRequest>('ConnectionRequest', connectionRequestSchema)
