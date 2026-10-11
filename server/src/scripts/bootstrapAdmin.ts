import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { config } from '../config/env'
import { User } from '../models/User'

const BCRYPT_ROUNDS = 12

/**
 * One-time first-admin bootstrap.
 *
 * Required environment variables:
 *   ADMIN_BOOTSTRAP_NAME
 *   ADMIN_BOOTSTRAP_EMAIL
 *   ADMIN_BOOTSTRAP_PASSWORD (minimum 16 characters)
 *
 * The script refuses to run if an administrator already exists. It is not an
 * API endpoint and must never be exposed through public registration.
 */
async function bootstrapAdmin(): Promise<void> {
  const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() ?? ''
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase() ?? ''
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? ''

  if (!name || name.length < 2 || name.length > 100) {
    throw new Error('ADMIN_BOOTSTRAP_NAME must be between 2 and 100 characters')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_BOOTSTRAP_EMAIL must be a valid email address')
  }
  if (password.length < 16 || password.length > 128) {
    throw new Error('ADMIN_BOOTSTRAP_PASSWORD must be between 16 and 128 characters')
  }

  await mongoose.connect(config.mongoUri)
  try {
    const existingAdmin = await User.findOne({ role: 'admin' }).select('_id').lean()
    if (existingAdmin) {
      throw new Error('An administrator already exists; bootstrap is only for the first administrator')
    }

    const existingEmail = await User.findOne({ email }).select('_id').lean()
    if (existingEmail) {
      throw new Error('That email already belongs to an account; use a different email for the first administrator')
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const admin = await User.create({ name, email, password: passwordHash, role: 'admin', isSuspended: false })
    console.info(`Created the initial administrator account: ${admin.email}`)
  } finally {
    await mongoose.disconnect()
  }
}

bootstrapAdmin().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Administrator bootstrap failed')
  process.exitCode = 1
  void mongoose.disconnect()
})
