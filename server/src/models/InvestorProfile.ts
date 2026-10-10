import mongoose, { Document, Schema } from 'mongoose'

export const INVESTOR_TYPES = ['angel', 'venture-capital', 'corporate', 'family-office', 'accelerator', 'other'] as const
export const INVESTMENT_STAGES = ['idea', 'pre-seed', 'seed', 'series-a', 'series-b+', 'growth'] as const
export type InvestorType = (typeof INVESTOR_TYPES)[number]
export type InvestorProfileStatus = 'draft' | 'published'

export interface IInvestorProfile extends Document {
  _id: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  organizationName: string
  investorType: InvestorType | ''
  bio: string
  investmentThesis: string
  sectors: string[]
  stages: string[]
  geographies: string[]
  minInvestment?: number
  maxInvestment?: number
  currency: 'USD' | 'INR' | 'EUR' | 'GBP'
  website: string
  linkedinUrl: string
  portfolioCompanies: string[]
  status: InvestorProfileStatus
  createdAt: Date
  updatedAt: Date
}

const investorProfileSchema = new Schema<IInvestorProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    organizationName: { type: String, trim: true, default: '', maxlength: 160 },
    investorType: { type: String, enum: ['', ...INVESTOR_TYPES], default: '' },
    bio: { type: String, trim: true, default: '', maxlength: 2000 },
    investmentThesis: { type: String, trim: true, default: '', maxlength: 3000 },
    sectors: { type: [String], default: [] },
    stages: { type: [String], default: [] },
    geographies: { type: [String], default: [] },
    minInvestment: { type: Number, min: 0 },
    maxInvestment: { type: Number, min: 0 },
    currency: { type: String, enum: ['USD', 'INR', 'EUR', 'GBP'], default: 'USD' },
    website: { type: String, trim: true, default: '', maxlength: 300 },
    linkedinUrl: { type: String, trim: true, default: '', maxlength: 300 },
    portfolioCompanies: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', required: true },
  },
  { timestamps: true, minimize: false }
)

export const InvestorProfile = mongoose.model<IInvestorProfile>('InvestorProfile', investorProfileSchema)
