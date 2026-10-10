import dotenv from 'dotenv'

dotenv.config()

interface Config {
  port: number
  mongoUri: string
  jwtSecret: string
  jwtExpiresIn: string
  nodeEnv: string
  clientOrigin: string
  cookieSecure: boolean
  csrfSecret: string
}

function validateEnv(): void {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'CSRF_SECRET']
  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters')
  }

  if (process.env.CSRF_SECRET && process.env.CSRF_SECRET.length < 32) {
    throw new Error('CSRF_SECRET must be at least 32 characters')
  }
}

validateEnv()

export const config: Config = {
  port: parseInt(process.env.PORT || '5000'),
  mongoUri: process.env.MONGODB_URI!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  cookieSecure: process.env.NODE_ENV === 'production',
  csrfSecret: process.env.CSRF_SECRET!,
}
