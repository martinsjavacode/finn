import { useQuery } from '@tanstack/react-query'
import { fetchMigrationItems } from '../services/admin'
import type { MigrationItemType, MigrationItem } from '../types/admin'

export function useAdminMigration(accountId: string | null, itemType: MigrationItemType) {
  const { data = [], isLoading, error } = useQuery<MigrationItem[]>({
    queryKey: ['admin', 'migration', accountId, itemType],
    queryFn: async () => {
      const { data, error } = await fetchMigrationItems(accountId!, itemType)
      if (error) throw error
      return data ?? []
    },
    enabled: !!accountId,
  })

  return { data, isLoading, error }
}
