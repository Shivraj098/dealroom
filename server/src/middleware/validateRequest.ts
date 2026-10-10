import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

/**
 * Parse and validate req.body with a Zod schema.
 * Replaces req.body with the parsed (coerced / trimmed) output.
 * Passes ZodError to errorHandler on failure.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return next(result.error)
    }
    req.body = result.data
    next()
  }
}
