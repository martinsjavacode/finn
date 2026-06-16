import { supabase } from '../lib/supabase'
import type { MigrationItemType } from '../types/admin'

// Account operations

export async function fetchAllAccounts() {
  const { data, error } = await supabase
    .from('accounts')
    .select('*, account_members(id)')
    .order('name', { ascending: true })

  if (error) return { data: null, error }

  const accounts = data.map((account) => ({
    ...account,
    member_count: account.account_members?.length ?? 0,
    account_members: undefined,
  }))

  return { data: accounts, error: null }
}

export async function createAccount(name: string, color: string) {
  const { data, error } = await supabase
    .from('accounts')
    .insert({ name, color })
    .select()
    .single()

  return { data, error }
}

export async function updateAccount(id: string, data: { name?: string; color?: string }) {
  const { data: result, error } = await supabase
    .from('accounts')
    .update(data)
    .eq('id', id)

  return { data: result, error }
}

export async function deleteAccount(id: string) {
  const { data, error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)

  return { data, error }
}

// Member operations

export async function fetchMembers(accountId: string) {
  const { data, error } = await supabase
    .from('account_members')
    .select(`
      user_id,
      role_id,
      users (email, display_name),
      roles (name)
    `)
    .eq('account_id', accountId)

  if (error) return { data: null, error }

  const members = data.map((row) => ({
    userId: row.user_id,
    email: (row.users as unknown as { email: string; display_name: string | null })?.email ?? '',
    displayName: (row.users as unknown as { email: string; display_name: string | null })?.display_name ?? null,
    roleId: row.role_id,
    roleName: (row.roles as unknown as { name: string })?.name ?? '',
  }))

  return { data: members, error: null }
}

export async function addMember(accountId: string, userId: string, roleId: string) {
  const { data, error } = await supabase
    .from('account_members')
    .insert({ account_id: accountId, user_id: userId, role_id: roleId })

  return { data, error }
}

export async function updateMemberRole(accountId: string, userId: string, roleId: string) {
  const { data, error } = await supabase
    .from('account_members')
    .update({ role_id: roleId })
    .eq('account_id', accountId)
    .eq('user_id', userId)

  return { data, error }
}

export async function removeMember(accountId: string, userId: string) {
  const { data, error } = await supabase
    .from('account_members')
    .delete()
    .eq('account_id', accountId)
    .eq('user_id', userId)

  return { data, error }
}

// Migration data fetch (for the admin table)

export async function fetchMigrationItems(accountId: string, itemType: MigrationItemType) {
  switch (itemType) {
    case 'entries': {
      const { data, error } = await supabase
        .from('entries')
        .select('id, description, amount, month, category, categories(name)')
        .eq('account_id', accountId)
        .is('installment_purchase_id', null)
        .order('month', { ascending: false })

      if (error) return { data: null, error }

      const items = data.map((entry) => ({
        id: entry.id,
        description: entry.description,
        amount: Number(entry.amount),
        date: entry.month,
        categoryId: entry.category,
        category: (entry.categories as unknown as { name: string })?.name ?? undefined,
      }))

      return { data: items, error: null }
    }

    case 'installments': {
      const { data, error } = await supabase
        .from('installment_purchases')
        .select('id, description, total_amount, installments, card, categories(name)')
        .eq('account_id', accountId)
        .order('start_month', { ascending: false })

      if (error) return { data: null, error }

      const items = data.map((purchase) => ({
        id: purchase.id,
        description: purchase.description,
        amount: Number(purchase.total_amount),
        installmentsCount: purchase.installments,
        card: purchase.card ?? undefined,
        category: (purchase.categories as unknown as { name: string })?.name ?? undefined,
      }))

      return { data: items, error: null }
    }

    case 'budgets': {
      const { data, error } = await supabase
        .from('budgets')
        .select('id, monthly_limit, category, categories(name)')
        .eq('account_id', accountId)

      if (error) return { data: null, error }

      const items = data.map((budget) => ({
        id: budget.id,
        description: (budget.categories as unknown as { name: string })?.name ?? 'Sem categoria',
        amount: Number(budget.monthly_limit),
        categoryId: budget.category,
        category: (budget.categories as unknown as { name: string })?.name ?? undefined,
        monthlyLimit: Number(budget.monthly_limit),
      }))

      return { data: items, error: null }
    }
  }
}

// User search (for adding members)

export async function searchUsers(query: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email')
    .ilike('email', `%${query}%`)
    .limit(10)

  return { data, error }
}
