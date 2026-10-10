import bcrypt from 'bcrypt'
import { User, type IUser } from '../models/User'
import { signToken } from '../utils/jwt'
import { ConflictError, UnauthorizedError } from '../utils/errors'
import type { RegisterInput, LoginInput } from '../validators/auth.validator'

const BCRYPT_ROUNDS = 12

/** Shape returned to the client — no password, no internal fields. */
export interface SafeUser {
  id: string
  name: string
  email: string
  role: IUser['role']
  createdAt: Date
}

function toSafeUser(user: IUser): SafeUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }
}

export async function registerUser(input: RegisterInput): Promise<{ user: SafeUser; token: string }> {
  // Normalised email comes from Zod (toLowerCase). Double-check for duplicates.
  const existing = await User.findOne({ email: input.email })
  if (existing) {
    throw new ConflictError('An account with this email already exists')
  }

  const hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: hash,
    role: input.role,
  })

  const token = signToken({ userId: user._id.toString(), role: user.role })

  return { user: toSafeUser(user), token }
}

export async function loginUser(input: LoginInput): Promise<{ user: SafeUser; token: string }> {
  // Explicitly select password (select: false on schema)
  const user = await User.findOne({ email: input.email }).select('+password')

  // Deliberate: same error for wrong email and wrong password to avoid enumeration
  if (!user) {
    throw new UnauthorizedError('Invalid email or password')
  }

  const passwordMatch = await bcrypt.compare(input.password, user.password)
  if (!passwordMatch) {
    throw new UnauthorizedError('Invalid email or password')
  }

  const token = signToken({ userId: user._id.toString(), role: user.role })

  return { user: toSafeUser(user), token }
}

export async function getUserById(userId: string): Promise<SafeUser | null> {
  const user = await User.findById(userId)
  if (!user) return null
  return toSafeUser(user)
}
