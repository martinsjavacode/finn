import { useEffect, useState, useCallback } from 'react'
import type { Category } from '../types/database'
import { fetchCategories, fetchActiveCards } from '../services/categories'

export function useAppData(authenticated: boolean) {
  const [categories, setCategories] = useState<Category[]>([])
  const [cardsList, setCardsList] = useState<{ name: string; label: string }[]>([])

  const reload = useCallback(async () => {
    const [cats, cards] = await Promise.all([fetchCategories(), fetchActiveCards()])
    setCategories(cats.data)
    setCardsList(cards.data)
  }, [])

  useEffect(() => {
    if (!authenticated) return
    let cancelled = false
    fetchCategories().then(cats => { if (!cancelled) setCategories(cats.data) })
    fetchActiveCards().then(cards => { if (!cancelled) setCardsList(cards.data) })
    return () => { cancelled = true }
  }, [authenticated])

  return { categories, cardsList, reloadAppData: reload }
}
