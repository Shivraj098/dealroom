import jwt from 'jsonwebtoken'
import { config } from '../config/env'
import type { UserRole } from '../models/User'

export interface JwtPayload {
  userId: string
  role: UserRole
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload
}
