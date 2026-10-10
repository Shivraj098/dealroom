import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors'
import { ZodError } from 'zod'
import mongoose from 'mongoose'

const isDev = process.env.NODE_ENV !== 'production'

function warnOperational(req: Request, status: number, summary: string) {
  if (isDev) {
    console.warn(`[${status}] ${req.method} ${req.path} — ${summary}`)
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Operational AppError — known 4xx/5xx thrown intentionally by the application.
  // Log a one-line warning only; never print the stack for expected errors.
  if (err instanceof AppError) {
    warnOperational(req, err.statusCode, err.message)
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    })
  }

  // Zod validation errors — expected, client-supplied bad input.
  if (err instanceof ZodError) {
    warnOperational(req, 400, 'Validation failed')
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    })
  }

  // Mongoose validation errors — expected, schema-level constraint failure.
  if (err instanceof mongoose.Error.ValidationError) {
    warnOperational(req, 400, 'Mongoose validation failed')
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: Object.values(err.errors).map(e => e.message),
    })
  }

  // Mongoose cast errors (invalid ObjectId format).
  if (err instanceof mongoose.Error.CastError) {
    warnOperational(req, 400, `Cast error on path ${err.path}`)
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
    })
  }

  // Mongoose duplicate key (unique index violation).
  if ((err as NodeJS.ErrnoException & { keyPattern?: Record<string, unknown> }).code === 11000) {
    const field = Object.keys(
      (err as NodeJS.ErrnoException & { keyPattern?: Record<string, unknown> }).keyPattern ?? {}
    )[0]
    warnOperational(req, 409, `Duplicate key: ${field ?? 'unknown'}`)
    return res.status(409).json({
      success: false,
      error: field ? `${field} already exists` : 'Duplicate entry',
    })
  }

  // Unexpected errors — log the full stack so genuine bugs are diagnosable.
  console.error(`[500] Unexpected error on ${req.method} ${req.path}:`, err)
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  })
}
