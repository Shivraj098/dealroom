import mongoose, { Schema, type Document } from 'mongoose'
import type { UserRole } from './User'

export interface IActivityEvent extends Document {
  _id: mongoose.Types.ObjectId
  actor: mongoose.Types.ObjectId
  actorName: string
  actorRole: UserRole
  type: string
  title: string
  description: string
  audienceUsers: mongoose.Types.ObjectId[]
  audienceRoles: UserRole[]
  href: string
  dealRoom?: mongoose.Types.ObjectId
  startup?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const activityEventSchema = new Schema<IActivityEvent>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorName: { type: String, required: true, trim: true, maxlength: 100 },
    actorRole: { type: String, enum: ['founder', 'investor', 'admin'], required: true },
    type: { type: String, required: true, maxlength: 100 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    audienceUsers: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    audienceRoles: { type: [{ type: String, enum: ['founder', 'investor', 'admin'] }], default: [] },
    href: { type: String, trim: true, default: '/workspace', maxlength: 500 },
    dealRoom: { type: Schema.Types.ObjectId, ref: 'DealRoom' },
    startup: { type: Schema.Types.ObjectId, ref: 'StartupProfile' },
  },
  { timestamps: true, minimize: false },
)

activityEventSchema.index({ audienceUsers: 1, createdAt: -1 })
activityEventSchema.index({ audienceRoles: 1, createdAt: -1 })
activityEventSchema.index({ dealRoom: 1, createdAt: -1 })

export const ActivityEvent = mongoose.model<IActivityEvent>('ActivityEvent', activityEventSchema)
