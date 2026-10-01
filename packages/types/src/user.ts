export interface User {
  id: string
  clerkId: string
  email: string
  name: string | null
  avatarUrl: string | null
  workspaceId: string | null
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  ownerId: string
  plan: WorkspacePlan
  memberCount: number
  createdAt: string
}

export type WorkspacePlan = 'free' | 'pro' | 'team' | 'enterprise'

export interface TeamInvite {
  id: string
  workspaceId: string
  email: string
  role: TeamRole
  token: string
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
}

export type TeamRole = 'owner' | 'admin' | 'member'
