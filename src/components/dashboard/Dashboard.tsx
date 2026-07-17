import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Transaction } from '../../types/database'
import { fetchAllTransactions, fetchTransactions, fetchCreditCards, fetchCardInvoice } from '../../services/transactions'
import { fetchBudgets } from '../../services/categories'
import { useAppData, useAuth } from '../../hooks'
import { fmt } from '../../utils/format'
import { ChartSkeleton, CardsSkeleton } from '../ui/Skeleton'
import LineChart from './LineChart'
import PieChart from './PieChart'
import BudgetProgress from './BudgetProgress'
import './Dashboard.css'

interface MonthData { month: string; income: number; expense: number }

export default function Dashboard() {
  const { activeAccountId } = useAuth()
  const { categories, cardsList } = useAppData(true, activeAccountId)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [tooltip, setTooltip] = useState<{ i: number } | null>(null)

  const { data: monthsData = [], isLoading, error } = useQuery<MonthData[]>({
    queryKey: ['dashboard-evolution', activeAccountId],
    queryFn: async () => {
      const { data, error } = await fetchAllTransactions(activeAccountId!)
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
    enabled: !!activeAccountId,
  })

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', activeAccountId],
    queryFn: async () => { const { data, error } = await fetchBudgets(activeAccountId!); if (error) throw error; return data },
    enabled: !!activeAccountId,
  })

  const { data: currentTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ['dashboard-month', selectedMonth, activeAccountId],
    queryFn: async () => { const { data, error } = await fetchTransactions(selectedMonth, activeAccountId!); if (error) throw error; return data },
    enabled: !!selectedMonth && !!activeAccountId,
  })

  const { data: cardEntries = [] } = useQuery<Transaction[]>({
    queryKey: ['dashboard-cards', selectedMonth, activeAccountId],
    queryFn: async () => { const { data, error } = await fetchCreditCards(selectedMonth, activeAccountId!); if (error) throw error; return data },
    enabled: !!selectedMonth && !!activeAccountId,
  })

  const { data: pendingCards = [] } = useQuery({
    queryKey: ['dashboard-card-invoices', selectedMonth, activeAccountId, cardEntries],
    queryFn: async () => {
      const byCard: Record<string, number> = {}
      for (const e of cardEntries) { byCard[e.card!] = (byCard[e.card!] || 0) + +e.amount }
      const results: { card: string; label: string; total: number; paid: number; dueDay: number }[] = []
      for (const [cardName, total] of Object.entries(byCard)) {
        const paid = await fetchCardInvoice(cardName, selectedMonth, activeAccountId!)
        if (paid < total) {
          const info = cardsList.find(c => c.name === cardName)
          results.push({ card: cardName, label: info?.label ?? cardName, total, paid, dueDay: info?.due_day ?? 1 })
        }
      }
      return results
    },
    enabled: cardEntries.length > 0 && cardsList.length > 0,
  })

  const maxValue = useMemo(() => Math.max(...monthsData.flatMap(d => [d.income, d.expense]), 1), [monthsData])
  const trend = useMemo(() => monthsData.map((_, i) => {
    const slice = monthsData.slice(Math.max(0, i - 2), i + 1)
    return slice.reduce((s, d) => s + d.expense, 0) / slice.length
  }), [monthsData])

  const { expenses, totalIncome, totalExpense, balance, catData, paidPercent, paidCount, totalCount } = useMemo(() => {
    const exp = currentTransactions.filter(r => r.type === 'expense')
    const inc = currentTransactions.filter(r => r.type === 'income').reduce((s, r) => s + +r.amount, 0)
    const expTotal = exp.reduce((s, r) => s + +r.amount, 0) + cardEntries.reduce((s, r) => s + +r.amount, 0)
    const byCat: Record<string, number> = {}
    for (const r of exp) { byCat[r.categories?.label ?? 'Outros'] = (byCat[r.categories?.label ?? 'Outros'] || 0) + +r.amount }
    for (const r of cardEntries) { byCat[r.categories?.label ?? 'Outros'] = (byCat[r.categories?.label ?? 'Outros'] || 0) + +r.amount }
    const tCount = exp.length, pCount = exp.filter(r => r.paid).length
    return { expenses: exp, totalIncome: inc, totalExpense: expTotal, balance: inc - expTotal, catData: Object.entries(byCat).sort((a, b) => b[1] - a[1]), paidPercent: tCount > 0 ? Math.round((pCount / tCount) * 100) : 0, paidCount: pCount, totalCount: tCount }
  }, [currentTransactions, cardEntries])

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

      {!currentTransactions.length && <p className="empty" style={{ margin: '-1rem 0 1.5rem' }}>Nenhum lançamento neste mês.</p>}

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
        const [year, month] = selectedMonth.split('-').map(Number)
        const unpaidItems = currentTransactions.filter(r => r.type === 'expense' && !r.paid).map(r => {
          const d = new Date(r.month + 'T12:00:00')
          return { key: r.id, date: d, description: r.description, amount: +r.amount, overdue: d < today }
        })
        const cardItems = pendingCards.map(c => {
          const dueDate = new Date(year, month - 1, c.dueDay)
          return { key: `card-${c.card}`, date: dueDate, description: `💳 ${c.label}`, amount: c.total - c.paid, overdue: dueDate < today }
        })
        const allItems = [...unpaidItems, ...cardItems].sort((a, b) => a.date.getTime() - b.date.getTime())
        if (!allItems.length) return currentTransactions.length ? (
          <section><p className="empty" style={{ color: 'var(--green)' }}>✅ Todas as contas estão em dia!</p></section>
        ) : null
        return (
          <section className="alerts-section">
            <h2>⚠️ Contas Pendentes</h2>
            <div className="alerts-list">
              {allItems.map(item => (
                <div key={item.key} className={`alert-item ${item.overdue ? 'alert-overdue' : ''}`}>
                  <span className="alert-date">{item.date.toLocaleDateString('pt-BR')}</span>
                  <span className="alert-desc">{item.description}</span>
                  <span className="alert-amount">{fmt(item.amount)}</span>
                  {item.overdue && <span className="alert-badge">Atrasado</span>}
                </div>
              ))}
            </div>
          </section>
        )
      })()}
    </div>
  )
}
