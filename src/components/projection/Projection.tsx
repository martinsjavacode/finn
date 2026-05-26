import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { fmt } from '../../utils/format'
import { TableSkeleton } from '../ui/Skeleton'
import MobileCard from '../ui/MobileCard'
import '../dashboard/Dashboard.css'

interface MonthProjection {
  month: string
  recurring: number
  installments: number
  total: number
}

export default function Projection() {
  const [projections, setProjections] = useState<MonthProjection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        // Tenta usar RPC agregada (migration 009)
        const { data, error } = await supabase.rpc('get_projection', { months_ahead: 6 })

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
  }, [])

  if (loading) return <div><h2 className="dashboard-title">Projeção Futura</h2><TableSkeleton rows={6} cols={4} /></div>

  const monthLabel = (ym: string) => new Date(ym + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div>
      <h2 className="dashboard-title">Projeção Futura</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Valores comprometidos nos próximos 6 meses (recorrentes + parcelamentos)
      </p>

      <section>
        <table className="desktop-table">
          <thead>
            <tr><th>Mês</th><th>Recorrentes</th><th>Parcelamentos</th><th>Total Comprometido</th></tr>
          </thead>
          <tbody>
            {projections.map(p => (
              <tr key={p.month}>
                <td style={{ textTransform: 'capitalize' }}>{monthLabel(p.month)}</td>
                <td>{fmt(p.recurring)}</td>
                <td>{fmt(p.installments)}</td>
                <td style={{ fontWeight: 700 }}>{fmt(p.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mobile-cards">
          {projections.map(p => (
            <MobileCard
              key={p.month}
              title={<span style={{ textTransform: 'capitalize' }}>{monthLabel(p.month)}</span>}
              value={fmt(p.total)}
              subtitle={<>Recorrentes {fmt(p.recurring)} · Parcelas {fmt(p.installments)}</>}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
