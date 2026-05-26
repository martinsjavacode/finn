import type { Owner } from '../types/database'

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
