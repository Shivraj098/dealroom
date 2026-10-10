export type DealRoomStatus = 'active' | 'approved' | 'passed'
export type EvaluationCategory = 'market' | 'product' | 'traction' | 'team' | 'businessModel' | 'financials' | 'risk'
export type InformationRequestStatus = 'open' | 'responded' | 'closed'
export type RoomRole = 'founder' | 'investor'

export interface DealRoomSummary {
  id: string
  status: DealRoomStatus
  createdAt: string
  updatedAt: string
}

export interface DealRoomListItem extends DealRoomSummary {
  startup: {
    id: string
    companyName: string
    tagline: string
    industry: string
    stage: string
  }
  otherParty: {
    id: string
    name: string
    organizationName: string
  }
}

export interface DealRoomListResult {
  items: DealRoomListItem[]
}

export interface DealRoomDetails {
  room: DealRoomSummary
  viewerRole: RoomRole
  startup: {
    id: string
    companyName: string
    tagline: string
    description: string
    website: string
    industry: string
    foundedYear: number | null
    teamSize: string
    headquarters: string
    stage: string
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
  }
  founder: { id: string; name: string }
  investor: { id: string; name: string; organizationName: string }
}

export type EvaluationScores = Partial<Record<EvaluationCategory, number | null>>

export interface DealRoomEvaluation {
  id: string
  scores: Record<EvaluationCategory, number | null>
  summary: string
  createdAt: string
  updatedAt: string
}

export interface PrivateNote {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface PrivateNoteList { items: PrivateNote[] }

export interface InformationRequest {
  id: string
  title: string
  description: string
  status: InformationRequestStatus
  responseText: string
  responseLink: string
  createdAt: string
  updatedAt: string
  respondedAt: string | null
  closedAt: string | null
}

export interface InformationRequestList { items: InformationRequest[] }
