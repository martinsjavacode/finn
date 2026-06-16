import type { MigrationFilters } from '../types/admin'

export interface FilterableItem {
  id: string
  description: string
  amount: number
  date?: string | null
  categoryId?: string | null
}

export function applyMigrationFilters<T extends FilterableItem>(items: T[], filters: MigrationFilters): T[] {
  return items.filter(item => {
    if (filters.search && !item.description.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.categoryId && item.categoryId !== filters.categoryId) return false
    if (filters.dateFrom && item.date && item.date < filters.dateFrom) return false
    if (filters.dateTo && item.date && item.date > filters.dateTo) return false
    if (filters.amountMin != null && item.amount < filters.amountMin) return false
    if (filters.amountMax != null && item.amount > filters.amountMax) return false
    return true
  })
}

export function paginateItems<T>(items: T[], page: number, perPage: number): { pageItems: T[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const start = (page - 1) * perPage
  return { pageItems: items.slice(start, start + perPage), totalPages }
}

export function resolveTab(param: string | null): 'migration' | 'accounts' | 'permissions' | 'activity' {
  if (param === 'migration' || param === 'accounts' || param === 'permissions' || param === 'activity') return param
  return 'migration'
}

export function validateAccountName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length === 0) return 'Nome é obrigatório'
  if (trimmed.length > 100) return 'Nome deve ter no máximo 100 caracteres'
  return null
}

export function isExistingMember(userId: string, existingMemberUserIds: string[]): boolean {
  return existingMemberUserIds.includes(userId)
}

export function excludeSourceAccount<T extends { id: string; name: string }>(accounts: T[], sourceAccountId: string): T[] {
  return accounts.filter(a => a.id !== sourceAccountId)
}

export function sortAccountsByName<T extends { name: string }>(accounts: T[]): T[] {
  return [...accounts].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function sortLogsByDate<T extends { created_at: string }>(logs: T[]): T[] {
  return [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}
