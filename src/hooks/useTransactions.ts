import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Transaction, CreditCard } from '../types/database'
import { fetchTransactions, fetchCreditCards, fetchAvailableMonths } from '../services/transactions'
import { currentYearMonth } from '../utils/format'

export const TRANSACTION_KEYS = {
  months: ['months'] as const,
  transactions: (month: string) => ['transactions', month] as const,
  creditCards: (month: string) => ['creditCards', month] as const,
}

export function invalidateTransactions(queryClient: ReturnType<typeof useQueryClient>, month: string) {
  queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.months })
  queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.transactions(month) })
  queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.creditCards(month) })
}

export function useTransactions(authenticated: boolean) {
  const [month, setMonth] = useState(currentYearMonth)
  const queryClient = useQueryClient()

  const { data: months = [] } = useQuery<string[]>({
    queryKey: TRANSACTION_KEYS.months,
    queryFn: fetchAvailableMonths,
    enabled: authenticated,
  })

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: TRANSACTION_KEYS.transactions(month),
    queryFn: async () => {
      const { data, error } = await fetchTransactions(month)
      if (error) throw error
      return data
    },
    enabled: authenticated && !!month,
  })

  const { data: cards = [] } = useQuery<CreditCard[]>({
    queryKey: TRANSACTION_KEYS.creditCards(month),
    queryFn: async () => {
      const { data, error } = await fetchCreditCards(month)
      if (error) throw error
      return data
    },
    enabled: authenticated && !!month,
  })

  const reload = () => invalidateTransactions(queryClient, month)

  const updateTransaction = (id: string, data: Partial<Transaction>) =>
    queryClient.setQueryData<Transaction[]>(TRANSACTION_KEYS.transactions(month), prev =>
      (prev ?? []).map(r => r.id === id ? { ...r, ...data } : r)
    )

  const removeTransaction = (id: string) =>
    queryClient.setQueryData<Transaction[]>(TRANSACTION_KEYS.transactions(month), prev =>
      (prev ?? []).filter(r => r.id !== id)
    )

  const removeCard = (id: string) =>
    queryClient.setQueryData<CreditCard[]>(TRANSACTION_KEYS.creditCards(month), prev =>
      (prev ?? []).filter(r => r.id !== id)
    )

  return {
    month, setMonth, months,
    transactions, cards,
    reload, updateTransaction, removeTransaction, removeCard,
  }
}
