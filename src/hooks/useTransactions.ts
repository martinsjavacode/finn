import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Transaction, CreditCard } from '../types/database'
import { fetchTransactions, fetchCreditCards, fetchAvailableMonths } from '../services/transactions'
import { currentYearMonth } from '../utils/format'

export const TRANSACTION_KEYS = {
  months: (accountId: string | null) => ['months', accountId] as const,
  transactions: (month: string, accountId: string | null) => ['transactions', month, accountId] as const,
  creditCards: (month: string, accountId: string | null) => ['creditCards', month, accountId] as const,
}

export function invalidateTransactions(queryClient: ReturnType<typeof useQueryClient>, month: string, accountId?: string | null) {
  queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.months(accountId ?? null) })
  queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.transactions(month, accountId ?? null) })
  queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.creditCards(month, accountId ?? null) })
}

export function useTransactions(authenticated: boolean, accountId?: string | null) {
  const [month, setMonth] = useState(currentYearMonth)
  const queryClient = useQueryClient()

  const { data: months = [] } = useQuery<string[]>({
    queryKey: TRANSACTION_KEYS.months(accountId ?? null),
    queryFn: () => fetchAvailableMonths(accountId ?? undefined),
    enabled: authenticated,
  })

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: TRANSACTION_KEYS.transactions(month, accountId ?? null),
    queryFn: async () => {
      const { data, error } = await fetchTransactions(month, accountId ?? undefined)
      if (error) throw error
      return data
    },
    enabled: authenticated && !!month,
  })

  const { data: cards = [] } = useQuery<CreditCard[]>({
    queryKey: TRANSACTION_KEYS.creditCards(month, accountId ?? null),
    queryFn: async () => {
      const { data, error } = await fetchCreditCards(month, accountId ?? undefined)
      if (error) throw error
      return data
    },
    enabled: authenticated && !!month,
  })

  const reload = () => invalidateTransactions(queryClient, month, accountId)

  const updateTransaction = (id: string, data: Partial<Transaction>) =>
    queryClient.setQueryData<Transaction[]>(TRANSACTION_KEYS.transactions(month, accountId ?? null), prev =>
      (prev ?? []).map(r => r.id === id ? { ...r, ...data } : r)
    )

  const removeTransaction = (id: string) =>
    queryClient.setQueryData<Transaction[]>(TRANSACTION_KEYS.transactions(month, accountId ?? null), prev =>
      (prev ?? []).filter(r => r.id !== id)
    )

  const removeCard = (id: string) =>
    queryClient.setQueryData<CreditCard[]>(TRANSACTION_KEYS.creditCards(month, accountId ?? null), prev =>
      (prev ?? []).filter(r => r.id !== id)
    )

  return {
    month, setMonth, months,
    transactions, cards,
    reload, updateTransaction, removeTransaction, removeCard,
  }
}
