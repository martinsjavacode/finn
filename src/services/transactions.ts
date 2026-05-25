import { supabase } from '../lib/supabase'
import type { Transaction, CreditCard } from '../types/database'
import { monthRange, toYearMonth } from '../utils/format'

export async function fetchTransactions(ym: string) {
  const { start, end } = monthRange(ym)
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(*)')
    .gte('month', start)
    .lt('month', end)
    .order('month')
    .order('type')
    .order('description')
  return { data: (data ?? []) as Transaction[], error }
}

export async function fetchCreditCards(ym: string) {
  const { start, end } = monthRange(ym)
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .gte('month', start)
    .lt('month', end)
    .order('card')
    .order('description')
  return { data: (data ?? []) as CreditCard[], error }
}

export async function fetchAvailableMonths() {
  const [{ data: t }, { data: c }] = await Promise.all([
    supabase.from('transactions').select('month').order('month', { ascending: false }),
    supabase.from('credit_cards').select('month').order('month', { ascending: false }),
  ])
  const tMonths = (t as { month: string }[] | null) ?? []
  const cMonths = (c as { month: string }[] | null) ?? []
  return [...new Set([...tMonths.map(r => toYearMonth(r.month)), ...cMonths.map(r => toYearMonth(r.month))])].sort()
}

export async function updateTransaction(id: string, data: Partial<Transaction>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { categories, id: _id, created_at, ...clean } = data as Record<string, unknown>
  const { error } = await supabase.from('transactions').update(clean as never).eq('id', id)
  return { error }
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  return { error }
}

export async function deleteCreditCard(id: string) {
  const { error } = await supabase.from('credit_cards').delete().eq('id', id)
  return { error }
}

export async function insertTransaction(row: {
  month: string; description: string; amount: number; type: string; category: string; owner: string; paid: boolean
}) {
  const { error } = await supabase.from('transactions').insert(row as never)
  return { error }
}

export async function insertCreditCard(row: {
  month: string; description: string; amount: number; card: string; owner: string
}) {
  const { error } = await supabase.from('credit_cards').insert(row as never)
  return { error }
}

export async function toggleTransactionPaid(id: string, currentPaid: boolean) {
  const { error } = await supabase.from('transactions').update({ paid: !currentPaid } as never).eq('id', id)
  return { error }
}

export async function fetchAllTransactions() {
  const { data, error } = await supabase.from('transactions').select('month, amount, type').order('month')
  return { data: (data ?? []) as { month: string; amount: number; type: string }[], error }
}
