import type { ActivityLog } from '../types/admin'

export function formatActivityDescription(log: ActivityLog): string {
  const details = log.details as Record<string, string | number>
  switch (log.action_type) {
    case 'migration':
      return `Migrou ${details.itemCount} ${formatItemType(details.itemType as string)} de "${details.sourceAccount}" para "${details.targetAccount}"`
    case 'member_added':
      return `Adicionou ${details.affectedUserEmail} à conta "${log.account_name}"`
    case 'member_removed':
      return `Removeu ${details.affectedUserEmail} da conta "${log.account_name}"`
    case 'role_changed':
      return `Alterou papel de ${details.affectedUserEmail} de "${details.oldRole}" para "${details.newRole}" na conta "${log.account_name}"`
    case 'account_created':
      return `Criou a conta "${log.account_name}"`
    case 'account_deleted':
      return `Excluiu a conta "${log.account_name}"`
    default:
      return 'Ação desconhecida'
  }
}

export function formatItemType(type: string): string {
  switch (type) {
    case 'entries': return 'lançamento(s)'
    case 'installments': return 'parcelamento(s)'
    case 'budgets': return 'orçamento(s)'
    default: return 'item(ns)'
  }
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function formatRelativeDay(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Hoje'
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
}

export function groupLogsByDay(logs: ActivityLog[]): { day: string; entries: ActivityLog[] }[] {
  const groups: Map<string, ActivityLog[]> = new Map()
  for (const log of logs) {
    const day = formatRelativeDay(log.created_at)
    if (!groups.has(day)) groups.set(day, [])
    groups.get(day)!.push(log)
  }
  return Array.from(groups.entries()).map(([day, entries]) => ({ day, entries }))
}
