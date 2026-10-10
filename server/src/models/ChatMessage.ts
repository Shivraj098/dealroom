import mongoose, { Schema, type Document } from 'mongoose'

export type ChatSenderRole = 'founder' | 'investor'

export interface IChatMessage extends Document {
  _id: mongoose.Types.ObjectId
  room: mongoose.Types.ObjectId
  sender: mongoose.Types.ObjectId
  senderRole: ChatSenderRole
  sequence: number
  clientMessageId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    room: { type: Schema.Types.ObjectId, ref: 'DealRoom', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['founder', 'investor'], required: true },
    sequence: { type: Number, required: true, min: 1 },
    clientMessageId: { type: String, required: true, maxlength: 100 },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
  },
  { timestamps: true }
)

// Sequence is the durable, per-room replay cursor; clientMessageId makes client retries idempotent.
chatMessageSchema.index({ room: 1, sequence: 1 }, { unique: true })
chatMessageSchema.index({ room: 1, sender: 1, clientMessageId: 1 }, { unique: true })

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema)
