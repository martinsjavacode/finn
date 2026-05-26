import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Category, CardListItem } from '../types/database'
import { fetchCategories, fetchActiveCards } from '../services/categories'

export function useAppData(authenticated: boolean) {
  const queryClient = useQueryClient()

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => (await fetchCategories()).data,
    enabled: authenticated,
  })

  const { data: cardsList = [] } = useQuery<CardListItem[]>({
    queryKey: ['cardsList'],
    queryFn: async () => (await fetchActiveCards()).data,
    enabled: authenticated,
  })

  const reloadAppData = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['cardsList'] })
  }

  return { categories, cardsList, reloadAppData }
}
