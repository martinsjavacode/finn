import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Transaction, Category } from '../../types/database'
import { fetchAllTransactions, fetchTransactions } from '../../services/transactions'
import { fetchBudgets } from '../../services/categories'
import { fmt } from '../../utils/format'
import { ChartSkeleton, CardsSkeleton } from '../ui/Skeleton'
import './Dashboard.css'

interface MonthData { month: string; income: number; expense: number }

interface Props {
  categories: Category[]
}

export default function Dashboard({ categories }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [tooltip, setTooltip] = useState<{ i: number } | null>(null)

  const { data: monthsData = [], isLoading } = useQuery<MonthData[]>({
    queryKey: ['dashboard-evolution'],
    queryFn: async () => {
      const { data } = await fetchAllTransactions()
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
    queryFn: async () => (await fetchBudgets()).data,
  })

  const { data: currentTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ['dashboard-month', selectedMonth],
    queryFn: async () => (await fetchTransactions(selectedMonth)).data,
    enabled: !!selectedMonth,
  })

  if (isLoading) return <div><h2 className="dashboard-title">Dashboard</h2><ChartSkeleton /><CardsSkeleton /></div>

  if (!monthsData.length) return (
    <div className="dashboard-fade">
      <h2 className="dashboard-title">Dashboard</h2>
      <section><p className="empty">Nenhum dado encontrado. Adicione lançamentos para visualizar o dashboard.</p></section>
    </div>
  )

  // Evolução anual
  const maxValue = Math.max(...monthsData.flatMap(d => [d.income, d.expense]), 1)

  // Média móvel 3 meses (tendência de despesas)
  const trend = monthsData.map((_, i) => {
    const slice = monthsData.slice(Math.max(0, i - 2), i + 1)
    return slice.reduce((s, d) => s + d.expense, 0) / slice.length
  })

  // Percentual por categoria (despesas do mês selecionado)
  const expenses = currentTransactions.filter(r => r.type === 'expense')
  const totalIncome = currentTransactions.filter(r => r.type === 'income').reduce((s, r) => s + +r.amount, 0)
  const totalExpense = expenses.reduce((s, r) => s + +r.amount, 0)
  const balance = totalIncome - totalExpense
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
    <div className="dashboard-fade">
      <h2 className="dashboard-title">Dashboard</h2>

      {/* Evolução Anual */}
      <section>
        <h2>Evolução Anual</h2>
        <p className="chart-hint">Clique em um mês para ver detalhes. A linha tracejada indica a tendência: se está subindo, seus gastos estão crescendo; se está descendo, estão diminuindo.</p>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot green"></span>Receita</span>
          <span className="legend-item"><span className="legend-dot red"></span>Despesa</span>
          <span className="legend-item"><span className="legend-dot purple"></span>Tendência</span>
        </div>
        <div className="line-chart-container">
          <svg className="line-chart" viewBox="0 0 840 220">
            {(() => {
              const w = 840
              const pad = 35
              const usable = w - pad * 2
              const getX = (i: number) => monthsData.length === 1 ? w / 2 : (i / (monthsData.length - 1)) * usable + pad
              const getY = (v: number) => 170 - (v / maxValue) * 150
              return (
                <>
                  {/* Grid lines */}
                  {[0.25, 0.5, 0.75].map(p => (
                    <line key={p} x1={pad} y1={p * 160 + 10} x2={w - pad} y2={p * 160 + 10} className="grid-line" />
                  ))}
                  {/* Balance area (income - expense) */}
                  <polygon className="chart-area-balance"
                    points={[
                      ...monthsData.map((d, i) => `${getX(i)},${getY(d.income)}`),
                      ...monthsData.map((_, i) => `${getX(monthsData.length - 1 - i)},${getY(monthsData[monthsData.length - 1 - i].expense)}`)
                    ].join(' ')} />
                  {/* Income line */}
                  <polyline fill="none" className="chart-line income"
                    points={monthsData.map((d, i) => `${getX(i)},${getY(d.income)}`).join(' ')} />
                  {/* Expense line */}
                  <polyline fill="none" className="chart-line expense"
                    points={monthsData.map((d, i) => `${getX(i)},${getY(d.expense)}`).join(' ')} />
                  {/* Trend line */}
                  <polyline fill="none" className="chart-line trend"
                    points={monthsData.map((_, i) => `${getX(i)},${getY(trend[i])}`).join(' ')} />
                  {/* Dots + Labels + Tooltip */}
                  {monthsData.map((d, i) => (
                    <g key={d.month} onClick={() => { setSelectedMonth(d.month); setTooltip(tooltip?.i === i ? null : { i }) }} style={{ cursor: 'pointer' }}>
                      <circle cx={getX(i)} cy={getY(d.income)} r="4" className="chart-dot income" />
                      <circle cx={getX(i)} cy={getY(d.expense)} r="4" className="chart-dot expense" />
                      <text x={getX(i)} y="200" textAnchor="middle" className={`chart-label ${d.month === selectedMonth ? 'active' : ''}`}>{monthLabel(d.month)}</text>
                      {tooltip?.i === i && (() => {
                        const ty = getY(d.income) < 45 ? getY(d.income) + 10 : getY(d.income) - 38
                        return (
                          <g className="chart-tooltip">
                            <rect x={getX(i) - 55} y={ty} width="110" height="32" rx="6" />
                            <text x={getX(i)} y={ty + 14} textAnchor="middle" className="tooltip-income">{fmt(d.income)}</text>
                            <text x={getX(i)} y={ty + 26} textAnchor="middle" className="tooltip-expense">{fmt(d.expense)}</text>
                          </g>
                        )
                      })()}
                    </g>
                  ))}
                </>
              )
            })()}
          </svg>
        </div>
      </section>

      {/* Filtro de mês */}
      <div className="dashboard-month-filter">
        <span>Detalhes de:</span>
        <input type="month" className="input-month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
      </div>

      {/* Resumo do mês */}
      <div className="dashboard-summary">
        <div className="summary-card">
          <span className="summary-label">Receita</span>
          <span className="summary-value green">{fmt(totalIncome)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Despesa</span>
          <span className="summary-value red">{fmt(totalExpense)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Saldo</span>
          <span className={`summary-value ${balance >= 0 ? 'green' : 'red'}`}>{fmt(balance)}</span>
        </div>
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
            <p className="empty">Nenhum orçamento cadastrado. Acesse Orçamentos para configurar.</p>
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
