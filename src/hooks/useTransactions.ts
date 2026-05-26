import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Transaction, CreditCard } from '../types/database'
import { fetchTransactions, fetchCreditCards, fetchAvailableMonths } from '../services/transactions'
import { currentYearMonth } from '../utils/format'

export function useTransactions(authenticated: boolean) {
  const [month, setMonth] = useState(currentYearMonth)
  const queryClient = useQueryClient()

  const { data: months = [] } = useQuery<string[]>({
    queryKey: ['months'],
    queryFn: fetchAvailableMonths,
    enabled: authenticated,
  })

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['transactions', month],
    queryFn: async () => (await fetchTransactions(month)).data,
    enabled: authenticated && !!month,
  })

  const { data: cards = [] } = useQuery<CreditCard[]>({
    queryKey: ['creditCards', month],
    queryFn: async () => (await fetchCreditCards(month)).data,
    enabled: authenticated && !!month,
  })

  const reload = () => {
    queryClient.invalidateQueries({ queryKey: ['months'] })
    queryClient.invalidateQueries({ queryKey: ['transactions', month] })
    queryClient.invalidateQueries({ queryKey: ['creditCards', month] })
  }

  const updateTransaction = (id: string, data: Partial<Transaction>) =>
    queryClient.setQueryData<Transaction[]>(['transactions', month], prev =>
      (prev ?? []).map(r => r.id === id ? { ...r, ...data } : r)
    )

  const removeTransaction = (id: string) =>
    queryClient.setQueryData<Transaction[]>(['transactions', month], prev =>
      (prev ?? []).filter(r => r.id !== id)
    )

  const removeCard = (id: string) =>
    queryClient.setQueryData<CreditCard[]>(['creditCards', month], prev =>
      (prev ?? []).filter(r => r.id !== id)
    )

  return {
    month, setMonth, months,
    transactions, cards,
    reload, updateTransaction, removeTransaction, removeCard,
  }
}
