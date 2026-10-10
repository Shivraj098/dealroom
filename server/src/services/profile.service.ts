import { StartupProfile, type IStartupProfile } from '../models/StartupProfile'
import { InvestorProfile, type IInvestorProfile } from '../models/InvestorProfile'
import { BadRequestError } from '../utils/errors'
import type { UserRole } from '../models/User'
import type { InvestorProfileInput, StartupProfileInput } from '../validators/profile.validator'

function hasValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.length > 0
  return value !== undefined && value !== null
}

export function calculateStartupCompletion(profile: Partial<IStartupProfile> | null): number {
  if (!profile) return 0
  const checks = [
    Boolean(profile.companyName?.trim() && profile.tagline?.trim() && profile.description?.trim()),
    Boolean(profile.industry?.trim() && profile.stage),
    Boolean(profile.problem?.trim() && profile.solution?.trim()),
    hasValue(profile.targetMarket),
    hasValue(profile.website),
    Boolean(profile.headquarters?.trim() && profile.teamSize && profile.foundedYear),
    hasValue(profile.businessModel),
    Boolean(profile.traction && (
      profile.traction.highlights?.length ||
      profile.traction.monthlyRevenue !== undefined ||
      profile.traction.monthlyActiveUsers !== undefined ||
      profile.traction.payingCustomers !== undefined
    )),
    Boolean(profile.fundraising && (!profile.fundraising.isRaising || profile.fundraising.targetAmount !== undefined)),
    Boolean(profile.teamMembers?.some((member) => member.name?.trim() && member.title?.trim())),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export function calculateInvestorCompletion(profile: Partial<IInvestorProfile> | null): number {
  if (!profile) return 0
  const checks = [
    Boolean(profile.organizationName?.trim() && profile.investorType),
    hasValue(profile.bio),
    hasValue(profile.investmentThesis),
    hasValue(profile.sectors),
    hasValue(profile.stages),
    hasValue(profile.geographies),
    profile.minInvestment !== undefined && profile.maxInvestment !== undefined,
    hasValue(profile.website),
    hasValue(profile.linkedinUrl),
    hasValue(profile.portfolioCompanies),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function startupDto(profile: IStartupProfile | null) {
  if (!profile) return null
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
    status: profile.status,
    completionPercentage: calculateStartupCompletion(profile),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

function investorDto(profile: IInvestorProfile | null) {
  if (!profile) return null
  return {
    id: profile._id.toString(),
    organizationName: profile.organizationName,
    investorType: profile.investorType,
    bio: profile.bio,
    investmentThesis: profile.investmentThesis,
    sectors: profile.sectors ?? [],
    stages: profile.stages ?? [],
    geographies: profile.geographies ?? [],
    minInvestment: profile.minInvestment ?? null,
    maxInvestment: profile.maxInvestment ?? null,
    currency: profile.currency,
    website: profile.website,
    linkedinUrl: profile.linkedinUrl,
    portfolioCompanies: profile.portfolioCompanies ?? [],
    status: profile.status,
    completionPercentage: calculateInvestorCompletion(profile),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

export async function getMyProfile(userId: string, role: UserRole) {
  if (role === 'admin') {
    return { role, profile: null, completionPercentage: 100, onboardingComplete: true }
  }

  if (role === 'founder') {
    const profile = await StartupProfile.findOne({ founder: userId })
    const completionPercentage = calculateStartupCompletion(profile)
    return {
      role,
      profile: startupDto(profile),
      completionPercentage,
      onboardingComplete: profile?.status === 'published',
    }
  }

  const profile = await InvestorProfile.findOne({ user: userId })
  const completionPercentage = calculateInvestorCompletion(profile)
  return {
    role,
    profile: investorDto(profile),
    completionPercentage,
    onboardingComplete: profile?.status === 'published',
  }
}

export async function saveStartupProfile(userId: string, input: StartupProfileInput) {
  if (input.status === 'published') {
    const required = [input.companyName, input.tagline, input.description, input.industry, input.stage, input.problem, input.solution, input.targetMarket]
    if (required.some((value) => !value?.trim())) {
      throw new BadRequestError('Complete the required company, product, and market details before publishing')
    }
  }

  let profile = await StartupProfile.findOne({ founder: userId })
  if (!profile) profile = new StartupProfile({ founder: userId })
  profile.set(input)
  await profile.save()
  return startupDto(profile)
}

export async function saveInvestorProfile(userId: string, input: InvestorProfileInput) {
  if (input.status === 'published') {
    if (!input.organizationName || !input.investorType || !input.investmentThesis || input.sectors.length === 0 || input.stages.length === 0) {
      throw new BadRequestError('Complete the required investor details before publishing')
    }
    if (input.minInvestment !== undefined && input.maxInvestment !== undefined && input.maxInvestment < input.minInvestment) {
      throw new BadRequestError('Maximum investment must be at least the minimum investment')
    }
  }

  let profile = await InvestorProfile.findOne({ user: userId })
  if (!profile) profile = new InvestorProfile({ user: userId })
  profile.set(input)
  await profile.save()
  return investorDto(profile)
}

