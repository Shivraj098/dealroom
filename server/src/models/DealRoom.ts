import mongoose, { Schema, type Document } from 'mongoose'

// Phase 6 will add the due-diligence workspace features around this persistent entity.
export const DEAL_ROOM_STATUSES = ['active', 'approved', 'passed'] as const
export type DealRoomStatus = (typeof DEAL_ROOM_STATUSES)[number]

export interface IDealRoom extends Document {
  _id: mongoose.Types.ObjectId
  startup: mongoose.Types.ObjectId
  founder: mongoose.Types.ObjectId
  investor: mongoose.Types.ObjectId
  connectionRequest: mongoose.Types.ObjectId
  status: DealRoomStatus
  createdAt: Date
  updatedAt: Date
}

const dealRoomSchema = new Schema<IDealRoom>(
  {
    startup: { type: Schema.Types.ObjectId, ref: 'StartupProfile', required: true },
    founder: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    investor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    connectionRequest: { type: Schema.Types.ObjectId, ref: 'ConnectionRequest', required: true },
    status: { type: String, enum: DEAL_ROOM_STATUSES, default: 'active', required: true },
  },
  { timestamps: true, minimize: false }
)

// MVP rule: a startup/investor pair can have only one Deal Room for its lifetime.
dealRoomSchema.index({ startup: 1, investor: 1 }, { unique: true })
dealRoomSchema.index({ founder: 1, updatedAt: -1 })
dealRoomSchema.index({ investor: 1, updatedAt: -1 })

export const DealRoom = mongoose.model<IDealRoom>('DealRoom', dealRoomSchema)
