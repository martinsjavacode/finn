import { supabase } from '../lib/supabase'
import type { Transaction, CreditCard } from '../types/database'
import type { Database } from '../types/supabase-generated'
import { monthRange } from '../utils/format'

type EntryInsert = Database['public']['Tables']['entries']['Insert']
type EntryUpdate = Database['public']['Tables']['entries']['Update']

export async function fetchTransactions(ym: string, accountId: string) {
  const { start, end } = monthRange(ym)
  const { data, error } = await supabase
    .from('entries')
    .select('*, categories(*)')
    .eq('account_id', accountId)
    .neq('payment_method', 'credit_card')
    .gte('month', start)
    .lt('month', end)
    .order('month').order('type').order('description')
  return { data: (data ?? []) as Transaction[], error }
}

export async function fetchCreditCards(ym: string, accountId: string) {
  const { start, end } = monthRange(ym)
  const { data, error } = await supabase
    .from('entries')
    .select('*, categories(*)')
    .eq('account_id', accountId)
    .eq('payment_method', 'credit_card')
    .gte('month', start)
    .lt('month', end)
    .order('card').order('description')
  return { data: (data ?? []) as CreditCard[], error }
}

export async function fetchAvailableMonths(accountId: string) {
  const { data } = await supabase
    .from('entries')
    .select('month')
    .eq('account_id', accountId)
    .order('month', { ascending: false })
  return [...new Set((data ?? []).map(r => r.month.substring(0, 7)))].sort()
}

export async function updateTransaction(id: string, accountId: string, data: Partial<Transaction>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { categories: _c, id: _id, created_at: _ca, ...clean } = data
  const { error } = await supabase.from('entries').update(clean as EntryUpdate).eq('id', id).eq('account_id', accountId)
  return { error }
}

export async function deleteTransaction(id: string, accountId: string) {
  const { error } = await supabase.from('entries').delete().eq('id', id).eq('account_id', accountId)
  return { error }
}

export async function insertTransaction(row: {
  month: string; description: string; amount: number; type: string; category: string; account_id: string; paid: boolean
}) {
  const insert: EntryInsert = { ...row, payment_method: 'pix', type: row.type as EntryInsert['type'] }
  const { error } = await supabase.from('entries').insert(insert)
  return { error }
}

export async function insertCreditCard(row: {
  month: string; description: string; amount: number; card: string; account_id: string; category?: string
}) {
  const insert: EntryInsert = { ...row, payment_method: 'credit_card', type: 'expense', paid: false }
  const { error } = await supabase.from('entries').insert(insert)
  return { error }
}

export async function toggleTransactionPaid(id: string, accountId: string, currentPaid: boolean) {
  const { error } = await supabase.from('entries').update({ paid: !currentPaid }).eq('id', id).eq('account_id', accountId)
  return { error }
}

export async function fetchAllTransactions(accountId: string) {
  const { data, error } = await supabase
    .from('entries')
    .select('month, amount, type')
    .eq('account_id', accountId)
    .order('month')
  return { data: (data ?? []) as { month: string; amount: number; type: string }[], error }
}

export async function fetchCardInvoice(card: string, month: string, accountId: string) {
  const { data } = await supabase.from('card_invoices').select('paid_amount').eq('card', card).eq('month', `${month}-01`).eq('account_id', accountId).single()
  return data?.paid_amount ?? 0
}

export async function upsertCardInvoice(card: string, month: string, paidAmount: number, accountId: string) {
  const { error } = await supabase.from('card_invoices').upsert(
    { card, month: `${month}-01`, paid_amount: paidAmount, account_id: accountId },
    { onConflict: 'account_id,card,month' }
  )
  return { error }
}

export async function batchMarkTransactionsPaid(ids: string[], accountId: string) {
  const { error } = await supabase
    .from('entries')
    .update({ paid: true })
    .in('id', ids)
    .eq('account_id', accountId)
  return { error }
}
