import { supabase } from '../lib/supabase'
import type { Investment, InvestmentTransaction, InvestmentTxType } from '../types/database'

export async function fetchInvestments(accountId: string) {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('account_id', accountId)
    .order('active', { ascending: false })
    .order('name')
  return { data: (data ?? []) as Investment[], error }
}

export async function fetchInvestmentTransactions(investmentId: string) {
  const { data, error } = await supabase
    .from('investment_transactions')
    .select('*')
    .eq('investment_id', investmentId)
    .order('date', { ascending: false })
  return { data: (data ?? []) as InvestmentTransaction[], error }
}

export async function createInvestment(payload: Omit<Investment, 'id' | 'created_at' | 'current_balance' | 'invested_total'>) {
  return supabase.from('investments').insert({ ...payload, current_balance: 0, invested_total: 0 })
}

export async function updateInvestment(id: string, payload: Partial<Pick<Investment, 'name' | 'type' | 'broker' | 'maturity_date' | 'active'>>) {
  return supabase.from('investments').update(payload).eq('id', id)
}

export async function deleteInvestment(id: string) {
  return supabase.from('investments').delete().eq('id', id)
}

export async function addInvestmentTransaction(
  investment: Investment,
  type: InvestmentTxType,
  amount: number,
  date: string,
  note?: string,
) {
  // Insert transaction
  const { error: txError } = await supabase.from('investment_transactions').insert({
    investment_id: investment.id,
    account_id: investment.account_id,
    type,
    amount,
    date,
    note: note || null,
  })
  if (txError) return { error: txError }

  // Update investment balances
  let balanceDelta: number
  let investedDelta = 0
  if (type === 'aporte') { balanceDelta = amount; investedDelta = amount }
  else if (type === 'resgate') { balanceDelta = -amount }
  else { balanceDelta = amount } // rendimento/dividendo

  const { error: updError } = await supabase.from('investments').update({
    current_balance: investment.current_balance + balanceDelta,
    invested_total: investment.invested_total + investedDelta,
  }).eq('id', investment.id)
  if (updError) return { error: updError }

  // Aporte → gera despesa; Resgate → gera receita
  if (type === 'aporte' || type === 'resgate') {
    const { error: entryError } = await supabase.from('entries').insert({
      month: date,
      description: `${type === 'aporte' ? 'Aporte' : 'Resgate'}: ${investment.name}`,
      amount,
      payment_method: 'pix',
      type: type === 'aporte' ? 'expense' : 'income',
      account_id: investment.account_id,
      paid: true,
    })
    if (entryError) return { error: entryError }
  }

  return { error: null }
}
