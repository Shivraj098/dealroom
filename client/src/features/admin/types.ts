export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'founder' | 'investor' | 'admin'
  suspended: boolean
  suspensionReason: string
  suspendedAt: string | null
  createdAt: string
}

export interface AdminUserList { items: AdminUser[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

export interface ModeratedStartup {
  id: string
  companyName: string
  tagline: string
  industry: string
  stage: string
  status: 'draft' | 'published'
  hidden: boolean
  moderationReason: string
  moderatedAt: string | null
  founder: { id: string; name: string; email: string } | null
  createdAt: string
}

export interface AdminStartupList { items: ModeratedStartup[]; pagination: { page: number; limit: number; total: number; totalPages: number } }
