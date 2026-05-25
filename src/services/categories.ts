import { supabase } from '../lib/supabase'
import type { Category } from '../types/database'

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('label')
  return { data: (data ?? []) as Category[], error }
}

export async function fetchActiveCards() {
  const { data, error } = await supabase.from('cards').select('name, label').eq('active', true).order('label')
  return { data: (data ?? []) as { name: string; label: string }[], error }
}

export async function fetchBudgets() {
  const { data, error } = await supabase.from('budgets').select('category, monthly_limit')
  return { data: (data ?? []) as { category: string; monthly_limit: number }[], error }
}
