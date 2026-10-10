import mongoose, { Document, Schema } from 'mongoose'

export type UserRole = 'founder' | 'investor' | 'admin'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  password: string
  role: UserRole
  isSuspended: boolean
  suspensionReason: string
  suspendedAt?: Date | null
  suspendedBy?: mongoose.Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true, // normalise on write
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // never returned unless explicitly requested
    },
    isSuspended: { type: Boolean, default: false, required: true, index: true },
    suspensionReason: { type: String, trim: true, default: '', maxlength: 500 },
    suspendedAt: { type: Date, default: null },
    suspendedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    role: {
      type: String,
      enum: {
        values: ['founder', 'investor', 'admin'],
        message: 'Role must be founder, investor or admin',
      },
      required: [true, 'Role is required'],
    },
  },
  {
    timestamps: true,
  }
)

// The unique: true on the email field already creates an index.
// No need for a redundant schema.index() call.

export const User = mongoose.model<IUser>('User', userSchema)
