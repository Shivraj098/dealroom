import mongoose, { Schema, type Document } from 'mongoose'

export interface IPrivateNote extends Document {
  _id: mongoose.Types.ObjectId
  dealRoom: mongoose.Types.ObjectId
  investor: mongoose.Types.ObjectId
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

const privateNoteSchema = new Schema<IPrivateNote>(
  {
    dealRoom: { type: Schema.Types.ObjectId, ref: 'DealRoom', required: true, index: true },
    investor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, trim: true, required: true, maxlength: 120 },
    content: { type: String, trim: true, required: true, maxlength: 5000 },
  },
  { timestamps: true, minimize: false },
)

privateNoteSchema.index({ dealRoom: 1, investor: 1, updatedAt: -1 })

export const PrivateNote = mongoose.model<IPrivateNote>('PrivateNote', privateNoteSchema)
