import { supabase } from '../lib/supabase'
import type { ActivityActionType } from '../types/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const activityTable = () => (supabase as any).from('activity_logs')

export async function recordActivity(params: {
  actionType: ActivityActionType
  actorEmail: string
  accountId?: string
  accountName?: string
  details: Record<string, unknown>
}) {
  return activityTable().insert({
    action_type: params.actionType,
    actor_email: params.actorEmail,
    account_id: params.accountId ?? null,
    account_name: params.accountName ?? null,
    details: params.details,
  })
}

export async function fetchActivityLogs(params: {
  actionType?: string | null
  accountId?: string | null
  page: number
  perPage: number
}) {
  let query = activityTable()
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (params.actionType) query = query.eq('action_type', params.actionType)
  if (params.accountId) query = query.eq('account_id', params.accountId)

  const offset = (params.page - 1) * params.perPage
  query = query.range(offset, offset + params.perPage - 1)

  const { data, error, count } = await query

  return { data, error, count }
}
