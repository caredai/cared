export interface Session {
  session: {
    id: string
    userId: string
    expiresAt: Date
    token: string
    ipAddress?: string | null
    userAgent?: string | null
    geolocation?: {
      city?: string
      region?: string
      country?: string
    } | null
    activeAccountId?: string | null
    activeTeamId?: string | null
    impersonatedBy?: string | null
    createdAt: Date
    updatedAt: Date
  }
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string | null
    twoFactorEnabled?: boolean | null
    banned?: boolean | null
    role?: string | null
    banReason?: string | null
    banExpires?: Date | null
    defaultAccountId?: string | null
    createdAt: Date
    updatedAt: Date
  }
}
