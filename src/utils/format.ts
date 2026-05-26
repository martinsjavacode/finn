import type { Owner, CardWithRule } from '../types/database'
export type { ClosingRule, CardWithRule } from '../types/database'

export const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const ownerLabel = (o: Owner) =>
  o === 'personal' ? 'Pessoal' : 'Sogra'

export const currentYearMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const monthRange = (ym: string) => {
  const start = `${ym}-01`
  const [y, m] = ym.split('-').map(Number)
  const end = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
  return { start, end }
}

export const toYearMonth = (d: string) => d.substring(0, 7)

export const monthLabel = (ym: string) =>
  new Date(ym + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

export const monthLabelShort = (ym: string) =>
  new Date(ym + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })

export function getEffectiveClosingDay(card: CardWithRule, year?: number, month?: number): number {
  if (card.closing_rule === 'relative') {
    const day = card.due_day - card.days_before_due
    if (day <= 0 && year != null && month != null) {
      // Vai para o mês anterior — pega os dias reais desse mês
      const daysInPrevMonth = new Date(year, month - 1, 0).getDate()
      return daysInPrevMonth + day
    }
    return day <= 0 ? day + 30 : day
  }
  return card.closing_day
}

function clampToMonth(closingDay: number, year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate()
  return Math.min(closingDay, daysInMonth)
}

export function resolveInvoiceMonth(purchaseDate: string, card: CardWithRule): string {
  const date = new Date(purchaseDate + 'T12:00:00')
  const day = date.getDate()
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-based
  const closingDay = clampToMonth(getEffectiveClosingDay(card, year, month), year, month)

  if (day > closingDay) {
    const y = month === 12 ? year + 1 : year
    const m = month === 12 ? 1 : month + 1
    return `${y}-${String(m).padStart(2, '0')}`
  }
  return `${year}-${String(month).padStart(2, '0')}`
}

export const categoryOptions = (categories: { id: string; label: string; parent_id: string | null }[]) => {
  const parents = categories.filter(c => !c.parent_id)
  const result: { value: string; label: string }[] = []
  for (const p of parents) {
    result.push({ value: p.id, label: p.label })
    for (const c of categories.filter(c => c.parent_id === p.id)) {
      result.push({ value: c.id, label: `  ${p.label} > ${c.label}` })
    }
  }
  return result
}
