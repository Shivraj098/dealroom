export type UserRole = 'founder' | 'investor' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export type StartupStage = 'idea' | 'pre-seed' | 'seed' | 'series-a' | 'series-b+' | 'growth'
export type ProfileStatus = 'draft' | 'published'
export type Currency = 'USD' | 'INR' | 'EUR' | 'GBP'

export interface StartupTeamMember {
  name: string
  title: string
  bio: string
}

export interface StartupProfile {
  id: string
  companyName: string
  tagline: string
  description: string
  website: string
  industry: string
  foundedYear: number | null
  teamSize: '' | '1-5' | '6-10' | '11-25' | '26-50' | '51-100' | '100+'
  headquarters: string
  stage: StartupStage | ''
  problem: string
  solution: string
  targetMarket: string
  businessModel: string
  traction: {
    monthlyRevenue: number | null
    monthlyActiveUsers: number | null
    payingCustomers: number | null
    monthOverMonthGrowth: number | null
    highlights: string[]
  }
  fundraising: {
    isRaising: boolean
    targetAmount: number | null
    amountRaised: number | null
    currency: Currency
  }
  teamMembers: StartupTeamMember[]
  status: ProfileStatus
  completionPercentage: number
  createdAt: string
  updatedAt: string
}

export interface InvestorProfile {
  id: string
  organizationName: string
  investorType: '' | 'angel' | 'venture-capital' | 'corporate' | 'family-office' | 'accelerator' | 'other'
  bio: string
  investmentThesis: string
  sectors: string[]
  stages: StartupStage[]
  geographies: string[]
  minInvestment: number | null
  maxInvestment: number | null
  currency: Currency
  website: string
  linkedinUrl: string
  portfolioCompanies: string[]
  status: ProfileStatus
  completionPercentage: number
  createdAt: string
  updatedAt: string
}

export type MyProfileSummary =
  | { role: 'founder'; profile: StartupProfile | null; completionPercentage: number; onboardingComplete: boolean }
  | { role: 'investor'; profile: InvestorProfile | null; completionPercentage: number; onboardingComplete: boolean }
  | { role: 'admin'; profile: null; completionPercentage: 100; onboardingComplete: true }

export interface StartupProfilePayload {
  companyName: string
  tagline: string
  description: string
  website: string
  industry: string
  foundedYear?: number
  teamSize: StartupProfile['teamSize']
  headquarters: string
  stage: StartupStage | ''
  problem: string
  solution: string
  targetMarket: string
  businessModel: string
  traction: {
    monthlyRevenue?: number
    monthlyActiveUsers?: number
    payingCustomers?: number
    monthOverMonthGrowth?: number
    highlights: string[]
  }
  fundraising: {
    isRaising: boolean
    targetAmount?: number
    amountRaised?: number
    currency: Currency
  }
  teamMembers: StartupTeamMember[]
  status: ProfileStatus
}

export interface InvestorProfilePayload {
  organizationName: string
  investorType: InvestorProfile['investorType']
  bio: string
  investmentThesis: string
  sectors: string[]
  stages: StartupStage[]
  geographies: string[]
  minInvestment?: number
  maxInvestment?: number
  currency: Currency
  website: string
  linkedinUrl: string
  portfolioCompanies: string[]
  status: ProfileStatus
}
