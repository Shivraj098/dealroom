import mongoose, { type QueryFilter } from 'mongoose'
import { SavedStartup } from '../models/SavedStartup'
import { STARTUP_STAGES, StartupProfile, type IStartupProfile } from '../models/StartupProfile'
import { BadRequestError, NotFoundError } from '../utils/errors'
import { DISCOVERY_TEAM_SIZES, type StartupDiscoveryQuery } from '../validators/startupDiscovery.validator'

const sortDefinitions = {
  newest: { createdAt: -1 as const, _id: -1 as const },
  'recently-updated': { updatedAt: -1 as const, _id: -1 as const },
  'name-asc': { companyName: 1 as const, _id: 1 as const },
  'name-desc': { companyName: -1 as const, _id: -1 as const },
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toStartupDto(profile: IStartupProfile, isSaved: boolean) {
  return {
    id: profile._id.toString(),
    companyName: profile.companyName,
    tagline: profile.tagline,
    description: profile.description,
    website: profile.website,
    industry: profile.industry,
    foundedYear: profile.foundedYear ?? null,
    teamSize: profile.teamSize,
    headquarters: profile.headquarters,
    stage: profile.stage,
    problem: profile.problem,
    solution: profile.solution,
    targetMarket: profile.targetMarket,
    businessModel: profile.businessModel,
    traction: {
      monthlyRevenue: profile.traction?.monthlyRevenue ?? null,
      monthlyActiveUsers: profile.traction?.monthlyActiveUsers ?? null,
      payingCustomers: profile.traction?.payingCustomers ?? null,
      monthOverMonthGrowth: profile.traction?.monthOverMonthGrowth ?? null,
      highlights: profile.traction?.highlights ?? [],
    },
    fundraising: {
      isRaising: profile.fundraising?.isRaising ?? false,
      targetAmount: profile.fundraising?.targetAmount ?? null,
      amountRaised: profile.fundraising?.amountRaised ?? null,
      currency: profile.fundraising?.currency ?? 'USD',
    },
    teamMembers: (profile.teamMembers ?? []).map((member) => ({
      name: member.name,
      title: member.title,
      bio: member.bio,
    })),
    status: 'published' as const,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    isSaved,
  }
}

function buildFilter(query: StartupDiscoveryQuery): QueryFilter<IStartupProfile> {
  const filter: QueryFilter<IStartupProfile> = { status: 'published' }

  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i')
    filter.$or = [
      { companyName: pattern },
      { tagline: pattern },
      { description: pattern },
      { industry: pattern },
      { headquarters: pattern },
      { targetMarket: pattern },
      { solution: pattern },
      { businessModel: pattern },
    ]
  }

  if (query.industry) filter.industry = new RegExp(`^${escapeRegex(query.industry)}$`, 'i')
  if (query.stage) filter.stage = query.stage
  if (query.location) filter.headquarters = new RegExp(escapeRegex(query.location), 'i')
  if (query.teamSize) filter.teamSize = query.teamSize
  if (query.isRaising !== undefined) filter['fundraising.isRaising'] = query.isRaising

  return filter
}

async function getSavedStartupIds(investorId: string): Promise<mongoose.Types.ObjectId[]> {
  const saved = await SavedStartup.find({ investor: investorId }).select('startup').lean()
  return saved.map((entry) => entry.startup as mongoose.Types.ObjectId)
}

export async function getStartupDiscoveryFilters() {
  const industries = await StartupProfile.distinct('industry', {
    status: 'published',
    industry: { $nin: ['', null] },
  })

  return {
    industries: industries.filter((industry): industry is string => typeof industry === 'string' && industry.trim().length > 0).sort((a, b) => a.localeCompare(b)),
    stages: [...STARTUP_STAGES],
    teamSizes: [...DISCOVERY_TEAM_SIZES],
  }
}

export async function listDiscoverableStartups(investorId: string, query: StartupDiscoveryQuery) {
  const savedIds = await getSavedStartupIds(investorId)

  const filter = buildFilter(query)
  if (query.savedOnly) {
    if (savedIds.length === 0) {
      return {
        items: [],
        pagination: { page: query.page, limit: query.limit, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: query.page > 1 },
      }
    }
    filter._id = { $in: savedIds }
  }

  const skip = (query.page - 1) * query.limit
  const [profiles, total] = await Promise.all([
    StartupProfile.find(filter)
      .sort(sortDefinitions[query.sort])
      .skip(skip)
      .limit(query.limit),
    StartupProfile.countDocuments(filter),
  ])
  const savedIdSet = new Set(savedIds.map((id) => id.toString()))
  const totalPages = Math.ceil(total / query.limit)

  return {
    items: profiles.map((profile) => toStartupDto(profile, savedIdSet.has(profile._id.toString()))),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1 && total > 0,
    },
  }
}

export async function getDiscoverableStartup(investorId: string, startupId: string) {
  if (!mongoose.isValidObjectId(startupId)) throw new BadRequestError('Invalid startup ID')

  const startup = await StartupProfile.findOne({ _id: startupId, status: 'published' })
  if (!startup) throw new NotFoundError('Startup not found')

  const saved = await SavedStartup.exists({ investor: investorId, startup: startup._id })
  return toStartupDto(startup, Boolean(saved))
}

export async function saveStartup(investorId: string, startupId: string) {
  if (!mongoose.isValidObjectId(startupId)) throw new BadRequestError('Invalid startup ID')

  const startup = await StartupProfile.findOne({ _id: startupId, status: 'published' }).select('_id')
  if (!startup) throw new NotFoundError('Startup not found')

  await SavedStartup.updateOne(
    { investor: investorId, startup: startup._id },
    { $setOnInsert: { investor: new mongoose.Types.ObjectId(investorId), startup: startup._id } },
    { upsert: true },
  )
  return { startupId: startup._id.toString(), saved: true }
}

export async function unsaveStartup(investorId: string, startupId: string) {
  if (!mongoose.isValidObjectId(startupId)) throw new BadRequestError('Invalid startup ID')

  await SavedStartup.deleteOne({ investor: investorId, startup: startupId })
  return { startupId, saved: false }
}
