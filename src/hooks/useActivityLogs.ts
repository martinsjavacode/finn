import { useQuery } from '@tanstack/react-query'
import { fetchActivityLogs } from '../services/activityLog'
import type { ActivityLog, ActivityActionType } from '../types/admin'

interface ActivityFilters {
  actionType: ActivityActionType | null
  accountId: string | null
}

export function useActivityLogs(filters: ActivityFilters, page: number, perPage: number = 50) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'activity', filters, page, perPage],
    queryFn: async () => {
      const { data, error, count } = await fetchActivityLogs({
        actionType: filters.actionType,
        accountId: filters.accountId,
        page,
        perPage,
      })
      // If table doesn't exist yet (migration not applied), return empty gracefully
      if (error) {
        const msg = (error as { message?: string })?.message ?? ''
        if (msg.includes('activity_logs') || msg.includes('relation') || msg.includes('does not exist')) {
          return { logs: [] as ActivityLog[], totalCount: 0 }
        }
        throw error
      }
      return { logs: (data ?? []) as ActivityLog[], totalCount: count ?? 0 }
    },
    retry: false,
  })

  return {
    logs: data?.logs ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    error,
  }
}
