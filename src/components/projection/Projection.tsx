import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks'
import { fmt } from '../../utils/format'
import { TableSkeleton } from '../ui/Skeleton'
import '../categories/CategoriesPage.css'
import '../dashboard/Dashboard.css'

interface MonthProjection {
  month: string
  recurring: number
  installments: number
  total: number
}

export default function Projection() {
  const { activeAccountId } = useAuth()
  const [projections, setProjections] = useState<MonthProjection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeAccountId) return
    ;(async () => {
      try {
        // Tenta usar RPC agregada (migration 009)
        const { data, error } = await supabase.rpc('get_projection', { months_ahead: 6, p_account_id: activeAccountId })

        if (!error && data) {
          setProjections((data as { month: string; recurring: number; installments: number }[]).map(r => ({
            ...r, total: +r.recurring + +r.installments
          })))
        } else {
          // Fallback: parallelized
          const { data: templates } = await supabase.from('recurring_templates').select('amount').eq('active', true).eq('type', 'expense') as { data: { amount: number }[] | null }
          const monthlyRecurring = (templates ?? []).reduce((s, t) => s + +t.amount, 0)
          const today = new Date()

          const results = await Promise.all(Array.from({ length: 6 }, async (_, i) => {
            const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
            const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const start = `${ym}-01`
            const nextM = d.getMonth() === 11 ? `${d.getFullYear() + 1}-01-01` : `${d.getFullYear()}-${String(d.getMonth() + 2).padStart(2, '0')}-01`

            const [{ data: cards }, { data: txInstall }] = await Promise.all([
              supabase.from('entries').select('amount').eq('payment_method', 'credit_card').gte('month', start).lt('month', nextM),
              supabase.from('entries').select('amount').neq('payment_method', 'credit_card').gte('month', start).lt('month', nextM).not('total_installments', 'is', null),
            ])

            const installments = (cards ?? []).reduce((s, r) => s + +r.amount, 0) + (txInstall ?? []).reduce((s, r) => s + +r.amount, 0)
            return { month: ym, recurring: monthlyRecurring, installments, total: monthlyRecurring + installments }
          }))
          setProjections(results)
      }
      } finally {
        setLoading(false)
      }
    })()
  }, [activeAccountId])

  if (loading) return <div><h2 className="dashboard-title">Projeção Futura</h2><TableSkeleton rows={6} cols={4} /></div>

  const monthLabel = (ym: string) => new Date(ym + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const maxTotal = Math.max(...projections.map(p => p.total), 1)
  const grandTotal = projections.reduce((s, p) => s + p.total, 0)

  return (
    <div>
      <h2 className="dashboard-title">Projeção Futura</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Valores comprometidos nos próximos 6 meses (recorrentes + parcelamentos)
      </p>

      <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2>Total Comprometido</h2>
        <p className="card-value">{fmt(grandTotal)}</p>
      </div>

      <div className="cat-grid">
        {projections.map((p, i) => (
          <div key={p.month} className="cat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h3 style={{ textTransform: 'capitalize', fontSize: '0.95rem', fontWeight: i === 0 ? 700 : 500 }}>{monthLabel(p.month)}</h3>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{fmt(p.total)}</span>
            </div>
            <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: '0.6rem' }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${(p.total / maxTotal) * 100}%`, background: i === 0 ? 'var(--purple)' : 'var(--gradient-1)' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Recorrentes: {fmt(p.recurring)}</span>
              <span>Parcelas: {fmt(p.installments)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
