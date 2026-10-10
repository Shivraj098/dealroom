import type { StartupProfile, StartupStage } from '@/types/models'

export type DiscoverableStartup = Omit<StartupProfile, 'status' | 'completionPercentage'> & {
  status: 'published'
  isSaved: boolean
}

export type StartupSort = 'newest' | 'recently-updated' | 'name-asc' | 'name-desc'

export interface StartupDiscoveryParams {
  search?: string
  industry?: string
  stage?: StartupStage
  location?: string
  teamSize?: Exclude<StartupProfile['teamSize'], ''>
  isRaising?: boolean
  savedOnly?: boolean
  page: number
  limit: number
  sort: StartupSort
}

export interface StartupDiscoveryResult {
  items: DiscoverableStartup[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface StartupDiscoveryFilters {
  industries: string[]
  stages: StartupStage[]
  teamSizes: Exclude<StartupProfile['teamSize'], ''>[]
}
