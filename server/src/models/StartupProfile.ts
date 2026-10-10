import mongoose, { Document, Schema } from 'mongoose'

export const STARTUP_STAGES = ['idea', 'pre-seed', 'seed', 'series-a', 'series-b+', 'growth'] as const
export type StartupStage = (typeof STARTUP_STAGES)[number]
export type StartupStatus = 'draft' | 'published'
export type TeamSize = '1-5' | '6-10' | '11-25' | '26-50' | '51-100' | '100+'

export interface IStartupProfile extends Document {
  _id: mongoose.Types.ObjectId
  founder: mongoose.Types.ObjectId
  companyName: string
  tagline: string
  description: string
  website: string
  industry: string
  foundedYear?: number
  teamSize: TeamSize | ''
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
    currency: string
  }
  teamMembers: Array<{ name: string; title: string; bio: string }>
  status: StartupStatus
  moderationStatus: 'visible' | 'hidden'
  moderationReason: string
  moderatedAt?: Date | null
  moderatedBy?: mongoose.Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const startupProfileSchema = new Schema<IStartupProfile>(
  {
    founder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    companyName: { type: String, trim: true, default: '', maxlength: 120 },
    tagline: { type: String, trim: true, default: '', maxlength: 180 },
    description: { type: String, trim: true, default: '', maxlength: 3000 },
    website: { type: String, trim: true, default: '', maxlength: 300 },
    industry: { type: String, trim: true, default: '', maxlength: 100 },
    foundedYear: { type: Number, min: 1800, max: new Date().getFullYear() + 1 },
    teamSize: { type: String, enum: ['', '1-5', '6-10', '11-25', '26-50', '51-100', '100+'], default: '' },
    headquarters: { type: String, trim: true, default: '', maxlength: 160 },
    stage: { type: String, enum: ['', ...STARTUP_STAGES], default: '' },
    problem: { type: String, trim: true, default: '', maxlength: 2000 },
    solution: { type: String, trim: true, default: '', maxlength: 2000 },
    targetMarket: { type: String, trim: true, default: '', maxlength: 1000 },
    businessModel: { type: String, trim: true, default: '', maxlength: 1000 },
    traction: {
      monthlyRevenue: { type: Number, min: 0 },
      monthlyActiveUsers: { type: Number, min: 0 },
      payingCustomers: { type: Number, min: 0 },
      monthOverMonthGrowth: { type: Number, min: 0, max: 10000 },
      highlights: { type: [String], default: [] },
    },
    fundraising: {
      isRaising: { type: Boolean, default: false },
      targetAmount: { type: Number, min: 0 },
      amountRaised: { type: Number, min: 0 },
      currency: { type: String, default: 'USD', enum: ['USD', 'INR', 'EUR', 'GBP'] },
    },
    teamMembers: {
      type: [{
        name: { type: String, trim: true, maxlength: 100 },
        title: { type: String, trim: true, maxlength: 100 },
        bio: { type: String, trim: true, maxlength: 500 },
      }],
      default: [],
      validate: [(members: unknown[]) => members.length <= 12, 'A startup can list at most 12 team members'],
    },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', required: true },
    moderationStatus: { type: String, enum: ['visible', 'hidden'], default: 'visible', required: true, index: true },
    moderationReason: { type: String, trim: true, default: '', maxlength: 500 },
    moderatedAt: { type: Date, default: null },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, minimize: false }
)

export const StartupProfile = mongoose.model<IStartupProfile>('StartupProfile', startupProfileSchema)
