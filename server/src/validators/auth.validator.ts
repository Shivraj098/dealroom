import { z } from 'zod'

// Zod v4 uses z.string(error?: string) — the old `required_error` param was renamed.
// z.enum in v4 requires a const tuple; we declare it separately so TypeScript is happy.

const roleValues = ['founder', 'investor'] as const

export const registerSchema = z.object({
  name: z
    .string('Name is required')
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z
    .string('Email is required')
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  password: z
    .string('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  role: z.enum(roleValues, 'Role must be founder or investor'),
})

export const loginSchema = z.object({
  email: z
    .string('Email is required')
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  password: z
    .string('Password is required')
    .min(1, 'Password is required'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
