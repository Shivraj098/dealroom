import mongoose, { Schema, type Document } from 'mongoose'

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId
  recipient: mongoose.Types.ObjectId
  actor?: mongoose.Types.ObjectId
  actorName: string
  type: string
  title: string
  body: string
  href: string
  entityType: string
  entityId: string
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, trim: true, default: 'DealRoom' },
    type: { type: String, required: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 500 },
    href: { type: String, trim: true, default: '/workspace', maxlength: 500 },
    entityType: { type: String, trim: true, default: '', maxlength: 80 },
    entityId: { type: String, trim: true, default: '', maxlength: 100 },
    readAt: { type: Date },
  },
  { timestamps: true, minimize: false },
)

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 })

export const Notification = mongoose.model<INotification>('Notification', notificationSchema)
