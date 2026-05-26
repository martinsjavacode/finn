import { supabase } from '../lib/supabase'
import type { Transaction, CreditCard } from '../types/database'
import { monthRange, toYearMonth } from '../utils/format'

export async function fetchTransactions(ym: string) {
  const { start, end } = monthRange(ym)
  const { data, error } = await supabase
    .from('entries')
    .select('*, categories(*)')
    .neq('payment_method', 'credit_card')
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
    .from('entries')
    .select('*, categories(*)')
    .eq('payment_method', 'credit_card')
    .gte('month', start)
    .lt('month', end)
    .order('card')
    .order('description')
  return { data: (data ?? []) as CreditCard[], error }
}

export async function fetchAvailableMonths() {
  const { data } = await supabase.from('entries').select('month').order('month', { ascending: false })
  const months = (data as { month: string }[] | null) ?? []
  return [...new Set(months.map(r => toYearMonth(r.month)))].sort()
}

export async function updateTransaction(id: string, data: Partial<Transaction>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { categories, id: _id, created_at, ...clean } = data as Record<string, unknown>
  const { error } = await supabase.from('entries').update(clean as never).eq('id', id)
  return { error }
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('entries').delete().eq('id', id)
  return { error }
}

export async function deleteCreditCard(id: string) {
  const { error } = await supabase.from('entries').delete().eq('id', id)
  return { error }
}

export async function insertTransaction(row: {
  month: string; description: string; amount: number; type: string; category: string; owner: string; paid: boolean
}) {
  const { error } = await supabase.from('entries').insert({ ...row, payment_method: 'boleto' } as never)
  return { error }
}

export async function insertCreditCard(row: {
  month: string; description: string; amount: number; card: string; owner: string; category?: string
}) {
  const { error } = await supabase.from('entries').insert({ ...row, payment_method: 'credit_card', type: 'expense', paid: false } as never)
  return { error }
}

export async function toggleTransactionPaid(id: string, currentPaid: boolean) {
  const { error } = await supabase.from('entries').update({ paid: !currentPaid } as never).eq('id', id)
  return { error }
}

export async function fetchAllTransactions() {
  const { data, error } = await supabase.from('entries').select('month, amount, type').order('month')
  return { data: (data ?? []) as { month: string; amount: number; type: string }[], error }
}

export async function fetchCardInvoice(card: string, month: string) {
  const { data } = await supabase.from('card_invoices').select('paid_amount').eq('card', card).eq('month', `${month}-01`).single()
  return (data as { paid_amount: number } | null)?.paid_amount ?? 0
}

export async function upsertCardInvoice(card: string, month: string, paidAmount: number) {
  const { error } = await supabase.from('card_invoices').upsert({ card, month: `${month}-01`, paid_amount: paidAmount } as never, { onConflict: 'card,month' })
  return { error }
}
