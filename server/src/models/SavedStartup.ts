import mongoose, { Document, Schema } from 'mongoose'

export interface ISavedStartup extends Document {
  _id: mongoose.Types.ObjectId
  investor: mongoose.Types.ObjectId
  startup: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const savedStartupSchema = new Schema<ISavedStartup>(
  {
    investor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startup: { type: Schema.Types.ObjectId, ref: 'StartupProfile', required: true },
  },
  { timestamps: true }
)

// One saved entry per investor/startup pair. This also makes repeated saves idempotent.
savedStartupSchema.index({ investor: 1, startup: 1 }, { unique: true })
savedStartupSchema.index({ investor: 1, createdAt: -1 })

export const SavedStartup = mongoose.model<ISavedStartup>('SavedStartup', savedStartupSchema)
