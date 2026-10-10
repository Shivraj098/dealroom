import { z } from 'zod'
import { STARTUP_STAGES } from '../models/StartupProfile'
import { INVESTOR_TYPES, INVESTMENT_STAGES } from '../models/InvestorProfile'

const emptyOrUrl = z.union([
  z.literal(''),
  z.string().trim().url('Enter a valid URL including https://').max(300),
]).default('')

const optionalNonNegativeNumber = z.number().finite().min(0).optional()
const currencySchema = z.enum(['USD', 'INR', 'EUR', 'GBP']).default('USD')
const statusSchema = z.enum(['draft', 'published']).default('draft')

export const startupProfileSchema = z.object({
  companyName: z.string().trim().max(120).default(''),
  tagline: z.string().trim().max(180).default(''),
  description: z.string().trim().max(3000).default(''),
  website: emptyOrUrl,
  industry: z.string().trim().max(100).default(''),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear() + 1).optional(),
  teamSize: z.enum(['', '1-5', '6-10', '11-25', '26-50', '51-100', '100+']).default(''),
  headquarters: z.string().trim().max(160).default(''),
  stage: z.enum(['', ...STARTUP_STAGES]).default(''),
  problem: z.string().trim().max(2000).default(''),
  solution: z.string().trim().max(2000).default(''),
  targetMarket: z.string().trim().max(1000).default(''),
  businessModel: z.string().trim().max(1000).default(''),
  traction: z.object({
    monthlyRevenue: optionalNonNegativeNumber,
    monthlyActiveUsers: optionalNonNegativeNumber,
    payingCustomers: optionalNonNegativeNumber,
    monthOverMonthGrowth: z.number().finite().min(0).max(10000).optional(),
    highlights: z.array(z.string().trim().min(1).max(200)).max(8).default([]),
  }).default({ highlights: [] }),
  fundraising: z.object({
    isRaising: z.boolean().default(false),
    targetAmount: optionalNonNegativeNumber,
    amountRaised: optionalNonNegativeNumber,
    currency: currencySchema,
  }).default({ isRaising: false, currency: 'USD' }),
  teamMembers: z.array(z.object({
    name: z.string().trim().max(100).default(''),
    title: z.string().trim().max(100).default(''),
    bio: z.string().trim().max(500).default(''),
  })).max(12).default([]),
  status: statusSchema,
}).superRefine((data, ctx) => {
  if (data.foundedYear !== undefined && data.foundedYear > new Date().getFullYear() + 1) {
    ctx.addIssue({ code: 'custom', path: ['foundedYear'], message: 'Founded year cannot be in the future' })
  }
  if (data.fundraising.targetAmount !== undefined && data.fundraising.amountRaised !== undefined && data.fundraising.amountRaised > data.fundraising.targetAmount && data.fundraising.isRaising) {
    ctx.addIssue({ code: 'custom', path: ['fundraising', 'amountRaised'], message: 'Amount raised cannot exceed the target amount' })
  }
  if (data.status === 'published') {
    const requiredFields: Array<[keyof typeof data, string]> = [
      ['companyName', 'Company name is required before publishing'],
      ['tagline', 'A short tagline is required before publishing'],
      ['description', 'Company description is required before publishing'],
      ['industry', 'Industry is required before publishing'],
      ['stage', 'Startup stage is required before publishing'],
      ['problem', 'Describe the problem your startup solves before publishing'],
      ['solution', 'Describe your solution before publishing'],
      ['targetMarket', 'Target market is required before publishing'],
    ]
    for (const [field, message] of requiredFields) {
      if (!data[field]) ctx.addIssue({ code: 'custom', path: [field], message })
    }
  }
})

export const investorProfileSchema = z.object({
  organizationName: z.string().trim().max(160).default(''),
  investorType: z.enum(['', ...INVESTOR_TYPES]).default(''),
  bio: z.string().trim().max(2000).default(''),
  investmentThesis: z.string().trim().max(3000).default(''),
  sectors: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  stages: z.array(z.enum(INVESTMENT_STAGES)).max(6).default([]),
  geographies: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  minInvestment: optionalNonNegativeNumber,
  maxInvestment: optionalNonNegativeNumber,
  currency: currencySchema,
  website: emptyOrUrl,
  linkedinUrl: emptyOrUrl,
  portfolioCompanies: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  status: statusSchema,
}).superRefine((data, ctx) => {
  if (data.minInvestment !== undefined && data.maxInvestment !== undefined && data.maxInvestment < data.minInvestment) {
    ctx.addIssue({ code: 'custom', path: ['maxInvestment'], message: 'Maximum investment must be at least the minimum investment' })
  }
  if (data.status === 'published') {
    if (!data.organizationName) ctx.addIssue({ code: 'custom', path: ['organizationName'], message: 'Organization or investor name is required before publishing' })
    if (!data.investorType) ctx.addIssue({ code: 'custom', path: ['investorType'], message: 'Choose an investor type before publishing' })
    if (!data.investmentThesis) ctx.addIssue({ code: 'custom', path: ['investmentThesis'], message: 'Investment thesis is required before publishing' })
    if (data.sectors.length === 0) ctx.addIssue({ code: 'custom', path: ['sectors'], message: 'Select at least one sector before publishing' })
    if (data.stages.length === 0) ctx.addIssue({ code: 'custom', path: ['stages'], message: 'Select at least one investment stage before publishing' })
  }
})

export type StartupProfileInput = z.infer<typeof startupProfileSchema>
export type InvestorProfileInput = z.infer<typeof investorProfileSchema>
