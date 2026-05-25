import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Transaction, Category } from '../../types/database'
import './Dashboard.css'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface MonthData { month: string; income: number; expense: number }

interface Props {
  categories: Category[]
}

export default function Dashboard({ categories }: Props) {
  const [monthsData, setMonthsData] = useState<MonthData[]>([])
  const [currentTransactions, setCurrentTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<{ category: string; monthly_limit: number }[]>([])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [{ data }, { data: budgetData }] = await Promise.all([
        supabase.from('transactions').select('month, amount, type').order('month'),
        supabase.from('budgets').select('category, monthly_limit') as never
      ])
      setBudgets((budgetData ?? []) as { category: string; monthly_limit: number }[])
      if (!data) { setLoading(false); return }

      const rows = data as { month: string; amount: number; type: string }[]
      const byMonth: Record<string, { income: number; expense: number }> = {}
      for (const r of rows) {
        const ym = r.month.substring(0, 7)
        if (!byMonth[ym]) byMonth[ym] = { income: 0, expense: 0 }
        if (r.type === 'income') byMonth[ym].income += +r.amount
        else byMonth[ym].expense += +r.amount
      }

      const sorted = Object.entries(byMonth)
        .map(([month, d]) => ({ month, ...d }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12)

      setMonthsData(sorted)
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (!selectedMonth) return
    ;(async () => {
      const start = `${selectedMonth}-01`
      const [y, m] = selectedMonth.split('-').map(Number)
      const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
      const { data } = await supabase.from('transactions').select('*, categories(*)').gte('month', start).lt('month', next)
      setCurrentTransactions((data as Transaction[]) ?? [])
    })()
  }, [selectedMonth])

  if (loading) return <div className="empty">Carregando dashboard...</div>

  // Evolução anual
  const maxValue = Math.max(...monthsData.flatMap(d => [d.income, d.expense]), 1)

  // Percentual por categoria (despesas do mês selecionado)
  const expenses = currentTransactions.filter(r => r.type === 'expense')
  const totalExpense = expenses.reduce((s, r) => s + +r.amount, 0)
  const byCat: Record<string, number> = {}
  for (const r of expenses) {
    const label = r.categories?.label ?? 'Outros'
    byCat[label] = (byCat[label] || 0) + +r.amount
  }
  const catData = Object.entries(byCat).sort((a, b) => b[1] - a[1])

  // Progresso de pagamento
  const totalCount = expenses.length
  const paidCount = expenses.filter(r => r.paid).length
  const paidPercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0

  const monthLabel = (ym: string) => new Date(ym + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })

  const pieColors = ['#667eea', '#764ba2', '#00d68f', '#ff6b6b', '#38bdf8', '#a78bfa', '#f59e0b']

  const buildConicGradient = (data: [string, number][], total: number) => {
    let acc = 0
    const stops = data.map(([, value], i) => {
      const start = acc
      acc += (value / total) * 360
      return `${pieColors[i % pieColors.length]} ${start}deg ${acc}deg`
    })
    return `conic-gradient(${stops.join(', ')})`
  }

  return (
    <div>
      <h2 className="dashboard-title">📊 Dashboard</h2>

      {/* Evolução Anual */}
      <section>
        <h2>Evolução Anual</h2>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot green"></span>Receita</span>
          <span className="legend-item"><span className="legend-dot red"></span>Despesa</span>
        </div>
        <div className="bar-chart">
          {monthsData.map(d => (
            <div key={d.month} className={`bar-group ${d.month === selectedMonth ? 'bar-group-active' : ''}`} onClick={() => setSelectedMonth(d.month)}>
              <div className="bars">
                <div className="bar income" style={{ height: `${(d.income / maxValue) * 100}%` }} title={fmt(d.income)}></div>
                <div className="bar expense" style={{ height: `${(d.expense / maxValue) * 100}%` }} title={fmt(d.expense)}></div>
              </div>
              <span className="bar-label">{monthLabel(d.month)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Filtro de mês */}
      <div className="dashboard-month-filter">
        <span>Detalhes de:</span>
        <input type="month" className="input-month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
      </div>

      {/* Duas colunas */}
      <div className="dashboard-grid">
        {/* Pizza por Categoria */}
        <section>
          <h2>Despesas por Categoria</h2>
          {catData.length ? (
            <div className="pie-container">
              <div className="pie" style={{ background: buildConicGradient(catData, totalExpense) }}></div>
              <div className="pie-legend">
                {catData.map(([label, value], i) => (
                  <div key={label} className="pie-legend-item">
                    <div className="pie-legend-top">
                      <span className="pie-legend-dot" style={{ background: pieColors[i % pieColors.length] }}></span>
                      <span className="pie-legend-label">{label}</span>
                    </div>
                    <span className="pie-legend-value">{fmt(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="empty">Sem despesas</p>}
        </section>

        {/* Orçamento por Categoria */}
        <section>
          <h2>Orçamento por Categoria</h2>
          {budgets.length > 0 ? (
            <div className="budget-list">
              {budgets.map(b => {
                const catName = categories.find(c => c.id === b.category)?.label ?? b.category
                const spent = expenses.filter(r => r.category === b.category).reduce((s, r) => s + +r.amount, 0)
                const pct = Math.min((spent / b.monthly_limit) * 100, 100)
                const over = spent > b.monthly_limit
                return (
                  <div key={b.category} className="budget-row">
                    <div className="budget-header">
                      <span className="budget-cat">{catName}</span>
                      <span className={`budget-values ${over ? 'over' : ''}`}>{fmt(spent)} / {fmt(b.monthly_limit)}</span>
                    </div>
                    <div className="budget-track">
                      <div className={`budget-fill ${over ? 'over' : ''}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="empty">Nenhum orçamento cadastrado. Acesse 💰 Orçamentos para configurar.</p>
          )}
        </section>
      </div>

      {/* Progresso de Pagamento */}
      <section>
        <h2>Progresso de Pagamento</h2>
        <div className="progress-container">
          <div className="progress-info">
            <span>{paidCount} de {totalCount} contas pagas</span>
            <span className="progress-pct">{paidPercent}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${paidPercent}%` }}></div>
          </div>
        </div>
      </section>

      {/* Alertas de Vencimento */}
      {(() => {
        const today = new Date()
        const unpaid = currentTransactions
          .filter(r => r.type === 'expense' && !r.paid)
          .sort((a, b) => a.month.localeCompare(b.month))

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
