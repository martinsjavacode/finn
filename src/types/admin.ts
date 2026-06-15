export type AdminTab = 'migration' | 'accounts' | 'permissions' | 'activity'

export type MigrationItemType = 'entries' | 'installments' | 'budgets'

export type ActivityActionType =
  | 'migration'
  | 'member_added'
  | 'member_removed'
  | 'role_changed'
  | 'account_created'
  | 'account_deleted'

export interface ActivityLog {
  id: string
  action_type: ActivityActionType
  actor_email: string
  account_id: string | null
  account_name: string | null
  details: Record<string, unknown>
  created_at: string
}

export interface MigrationFilters {
  search: string
  categoryId: string | null
  dateFrom: string | null
  dateTo: string | null
  amountMin: number | null
  amountMax: number | null
}

export interface AdminMember {
  userId: string
  email: string
  displayName: string | null
  roleId: string
  roleName: string
}

export type MigrationItem = {
  id: string
  description: string
  amount: number
  date?: string
  category?: string
  categoryId?: string
  installmentsCount?: number
  card?: string
  monthlyLimit?: number
}
