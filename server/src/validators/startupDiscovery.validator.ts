import { z } from 'zod'
import { STARTUP_STAGES } from '../models/StartupProfile'

export const DISCOVERY_TEAM_SIZES = ['1-5', '6-10', '11-25', '26-50', '51-100', '100+'] as const
export const STARTUP_SORT_OPTIONS = ['newest', 'recently-updated', 'name-asc', 'name-desc'] as const

const booleanQuery = z.enum(['true', 'false']).transform((value) => value === 'true')

export const startupDiscoveryQuerySchema = z.object({
  search: z.string().trim().max(100, 'Search must be 100 characters or fewer').default(''),
  industry: z.string().trim().max(100).default(''),
  stage: z.enum(STARTUP_STAGES).optional(),
  location: z.string().trim().max(100).default(''),
  teamSize: z.enum(DISCOVERY_TEAM_SIZES).optional(),
  isRaising: booleanQuery.optional(),
  savedOnly: booleanQuery.optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(12),
  sort: z.enum(STARTUP_SORT_OPTIONS).default('newest'),
})

export type StartupDiscoveryQuery = z.infer<typeof startupDiscoveryQuerySchema>
