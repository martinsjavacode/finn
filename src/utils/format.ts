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
