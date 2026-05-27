import { supabase } from '../lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc as any

export async function migrateEntries(entryIds: string[], targetAccountId: string) {
  const { data, error } = await rpc('migrate_entries', { entry_ids: entryIds, target_account_id: targetAccountId })
  return { data: data as number, error }
}

export async function migrateBudgets(budgetIds: string[], targetAccountId: string) {
  const { data, error } = await rpc('migrate_budgets', { budget_ids: budgetIds, target_account_id: targetAccountId })
  return { data: data as number, error }
}

export async function migrateInstallmentPurchases(purchaseIds: string[], targetAccountId: string) {
  const { data, error } = await rpc('migrate_installment_purchases', { purchase_ids: purchaseIds, target_account_id: targetAccountId })
  return { data: data as number, error }
}
