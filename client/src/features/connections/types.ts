export type ConnectionRequestStatus = 'pending' | 'accepted' | 'rejected'
export type DealRoomStatus = 'active' | 'approved' | 'passed'

export interface DealRoomSummary {
  id: string
  status: DealRoomStatus
  createdAt: string
  updatedAt: string
}

export interface ConnectionRequestStatusResponse {
  request: {
    id: string
    status: ConnectionRequestStatus
    message: string
    createdAt: string
    respondedAt: string | null
  } | null
  dealRoom: DealRoomSummary | null
}

export interface ConnectionRequestItem {
  id: string
  status: ConnectionRequestStatus
  message: string
  createdAt: string
  respondedAt: string | null
  startup: {
    id: string
    companyName: string
    tagline: string
    industry: string
    stage: string
    headquarters: string
  }
  investor: {
    id: string
    name: string
    organizationName: string
  }
  dealRoom: DealRoomSummary | null
}

export interface ConnectionRequestList {
  items: ConnectionRequestItem[]
}
