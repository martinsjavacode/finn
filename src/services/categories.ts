import { supabase } from '../lib/supabase'
import type { Category, CardListItem } from '../types/database'

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('label')
  return { data: (data ?? []) as Category[], error }
}

export async function fetchActiveCards(accountId: string) {
  const { data, error } = await supabase.from('cards').select('name, label, color, closing_day, due_day, closing_rule, days_before_due').eq('account_id', accountId).eq('active', true).order('label')
  return { data: (data ?? []) as CardListItem[], error }
}

export async function fetchBudgets(accountId: string) {
  const { data, error } = await supabase.from('budgets').select('category, monthly_limit').eq('account_id', accountId)
  return { data: (data ?? []) as { category: string; monthly_limit: number }[], error }
}
