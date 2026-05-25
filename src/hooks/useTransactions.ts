import { useEffect, useState, useCallback } from 'react'
import type { Transaction, CreditCard } from '../types/database'
import { fetchTransactions, fetchCreditCards, fetchAvailableMonths } from '../services/transactions'
import { currentYearMonth } from '../utils/format'

export function useTransactions(authenticated: boolean) {
  const [month, setMonth] = useState(currentYearMonth)
  const [months, setMonths] = useState<string[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])

  const loadMonth = useCallback(async (ym: string) => {
    const [t, c] = await Promise.all([fetchTransactions(ym), fetchCreditCards(ym)])
    setTransactions(t.data)
    setCards(c.data)
  }, [])

  const loadMonths = useCallback(async () => {
    const all = await fetchAvailableMonths()
    setMonths(all)
  }, [])

  useEffect(() => {
    if (!authenticated) return
    let cancelled = false
    fetchAvailableMonths().then(all => { if (!cancelled) setMonths(all) })
    return () => { cancelled = true }
  }, [authenticated])

  useEffect(() => {
    if (!authenticated || !month) return
    let cancelled = false
    Promise.all([fetchTransactions(month), fetchCreditCards(month)]).then(([t, c]) => {
      if (cancelled) return
      setTransactions(t.data)
      setCards(c.data)
    })
    return () => { cancelled = true }
  }, [authenticated, month])

  const reload = async () => {
    await loadMonths()
    await loadMonth(month)
  }

  const updateTransaction = (id: string, data: Partial<Transaction>) =>
    setTransactions(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))

  const removeTransaction = (id: string) =>
    setTransactions(prev => prev.filter(r => r.id !== id))

  const removeCard = (id: string) =>
    setCards(prev => prev.filter(r => r.id !== id))

  return {
    month, setMonth, months,
    transactions, cards,
    reload, updateTransaction, removeTransaction, removeCard,
  }
}
