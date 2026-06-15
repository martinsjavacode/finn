import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Category, CardListItem } from '../types/database'
import { fetchCategories, fetchActiveCards } from '../services/categories'

export function useAppData(authenticated: boolean, accountId?: string | null) {
  const queryClient = useQueryClient()

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => (await fetchCategories()).data,
    enabled: authenticated,
  })

  const { data: cardsList = [] } = useQuery<CardListItem[]>({
    queryKey: ['cardsList', accountId],
    queryFn: async () => (await fetchActiveCards(accountId!)).data,
    enabled: authenticated && !!accountId,
  })

  const reloadAppData = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['cardsList'] })
  }

  return { categories, cardsList, reloadAppData }
}
