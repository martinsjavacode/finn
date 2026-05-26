import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Transaction } from '../../types/database'
import { fetchAllTransactions, fetchTransactions } from '../../services/transactions'
import { fetchBudgets } from '../../services/categories'
import { useAppData } from '../../hooks'
import { fmt } from '../../utils/format'
import { ChartSkeleton, CardsSkeleton } from '../ui/Skeleton'
import LineChart from './LineChart'
import PieChart from './PieChart'
import BudgetProgress from './BudgetProgress'
import './Dashboard.css'

interface MonthData { month: string; income: number; expense: number }

export default function Dashboard() {
  const { categories } = useAppData(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [tooltip, setTooltip] = useState<{ i: number } | null>(null)

  const { data: monthsData = [], isLoading, error } = useQuery<MonthData[]>({
    queryKey: ['dashboard-evolution'],
    queryFn: async () => {
      const { data, error } = await fetchAllTransactions()
      if (error) throw error
      const byMonth: Record<string, { income: number; expense: number }> = {}
      for (const r of data) {
        const ym = r.month.substring(0, 7)
        if (!byMonth[ym]) byMonth[ym] = { income: 0, expense: 0 }
        if (r.type === 'income') byMonth[ym].income += +r.amount
        else byMonth[ym].expense += +r.amount
      }
      return Object.entries(byMonth)
        .map(([month, d]) => ({ month, ...d }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12)
    },
  })

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => { const { data, error } = await fetchBudgets(); if (error) throw error; return data },
  })

  const { data: currentTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ['dashboard-month', selectedMonth],
    queryFn: async () => { const { data, error } = await fetchTransactions(selectedMonth); if (error) throw error; return data },
    enabled: !!selectedMonth,
  })

  const maxValue = useMemo(() => Math.max(...monthsData.flatMap(d => [d.income, d.expense]), 1), [monthsData])
  const trend = useMemo(() => monthsData.map((_, i) => {
    const slice = monthsData.slice(Math.max(0, i - 2), i + 1)
    return slice.reduce((s, d) => s + d.expense, 0) / slice.length
  }), [monthsData])

  const { expenses, totalIncome, totalExpense, balance, catData, paidPercent, paidCount, totalCount } = useMemo(() => {
    const exp = currentTransactions.filter(r => r.type === 'expense')
    const inc = currentTransactions.filter(r => r.type === 'income').reduce((s, r) => s + +r.amount, 0)
    const expTotal = exp.reduce((s, r) => s + +r.amount, 0)
    const byCat: Record<string, number> = {}
    for (const r of exp) { byCat[r.categories?.label ?? 'Outros'] = (byCat[r.categories?.label ?? 'Outros'] || 0) + +r.amount }
    const tCount = exp.length, pCount = exp.filter(r => r.paid).length
    return { expenses: exp, totalIncome: inc, totalExpense: expTotal, balance: inc - expTotal, catData: Object.entries(byCat).sort((a, b) => b[1] - a[1]), paidPercent: tCount > 0 ? Math.round((pCount / tCount) * 100) : 0, paidCount: pCount, totalCount: tCount }
  }, [currentTransactions])

  if (isLoading) return <div><h2 className="dashboard-title">Dashboard</h2><ChartSkeleton /><CardsSkeleton /></div>

  if (error) return (
    <div><h2 className="dashboard-title">Dashboard</h2>
      <section><p className="empty" style={{ color: 'var(--red)' }}>Erro ao carregar dados. Tente novamente mais tarde.</p></section>
    </div>
  )

  if (!monthsData.length) return (
    <div><h2 className="dashboard-title">Dashboard</h2>
      <section><p className="empty">Nenhum dado encontrado. Adicione lançamentos para visualizar o dashboard.</p></section>
    </div>
  )

  const handleChartSelect = (month: string, i: number) => { setSelectedMonth(month); setTooltip(tooltip?.i === i ? null : { i }) }

  return (
    <div>
      <h2 className="dashboard-title">Dashboard</h2>

      <LineChart data={monthsData} trend={trend} maxValue={maxValue} selectedMonth={selectedMonth} tooltip={tooltip} onSelect={handleChartSelect} />

      <div className="dashboard-month-filter">
        <span>Detalhes de:</span>
        <input type="month" className="input-month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
      </div>

      <div className="dashboard-summary">
        <div className="summary-card"><span className="summary-label">Receita</span><span className="summary-value green">{fmt(totalIncome)}</span></div>
        <div className="summary-card"><span className="summary-label">Despesa</span><span className="summary-value red">{fmt(totalExpense)}</span></div>
        <div className="summary-card"><span className="summary-label">Saldo</span><span className={`summary-value ${balance >= 0 ? 'green' : 'red'}`}>{fmt(balance)}</span></div>
      </div>

      <div className="dashboard-grid">
        <PieChart data={catData} total={totalExpense} />
        <BudgetProgress budgets={budgets} expenses={expenses} categories={categories} />
      </div>

      <section>
        <h2>Progresso de Pagamento</h2>
        <div className="progress-container">
          <div className="progress-info"><span>{paidCount} de {totalCount} contas pagas</span><span className="progress-pct">{paidPercent}%</span></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${paidPercent}%` }}></div></div>
        </div>
      </section>

      {(() => {
        const today = new Date()
        const unpaid = currentTransactions.filter(r => r.type === 'expense' && !r.paid).sort((a, b) => a.month.localeCompare(b.month))
        if (!unpaid.length) return null
        return (
          <section className="alerts-section">
            <h2>⚠️ Contas Pendentes</h2>
            <div className="alerts-list">
              {unpaid.map(r => {
                const d = new Date(r.month + 'T12:00:00')
                const overdue = d < today
                return (
                  <div key={r.id} className={`alert-item ${overdue ? 'alert-overdue' : ''}`}>
                    <span className="alert-date">{d.toLocaleDateString('pt-BR')}</span>
                    <span className="alert-desc">{r.description}</span>
                    <span className="alert-amount">{fmt(+r.amount)}</span>
                    {overdue && <span className="alert-badge">Atrasado</span>}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })()}
    </div>
  )
}
