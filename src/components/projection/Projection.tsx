import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import '../dashboard/Dashboard.css'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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
      // Buscar recorrentes ativos
      const { data: templates } = await supabase.from('recurring_templates').select('amount').eq('active', true).eq('type', 'expense') as { data: { amount: number }[] | null }
      const monthlyRecurring = (templates ?? []).reduce((s, t) => s + +t.amount, 0)

      // Buscar parcelas futuras (credit_cards e transactions com installments)
      const today = new Date()
      const futureMonths: MonthProjection[] = []

      for (let i = 0; i < 6; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const start = `${ym}-01`
        const nextM = d.getMonth() === 11 ? `${d.getFullYear() + 1}-01-01` : `${d.getFullYear()}-${String(d.getMonth() + 2).padStart(2, '0')}-01`

        // Parcelas de cartão já geradas
        const { data: cards } = await supabase.from('credit_cards').select('amount').gte('month', start).lt('month', nextM)
        const cardTotal = (cards ?? []).reduce((s, r) => s + +(r as { amount: number }).amount, 0)

        // Parcelas de transactions já geradas (com installment)
        const { data: txInstall } = await supabase.from('transactions').select('amount').gte('month', start).lt('month', nextM).not('total_installments', 'is', null)
        const txInstallTotal = (txInstall ?? []).reduce((s, r) => s + +(r as { amount: number }).amount, 0)

        futureMonths.push({
          month: ym,
          recurring: monthlyRecurring,
          installments: cardTotal + txInstallTotal,
          total: monthlyRecurring + cardTotal + txInstallTotal
        })
      }

      setProjections(futureMonths)
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="empty">Carregando projeção...</div>

  const monthLabel = (ym: string) => new Date(ym + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div>
      <h2 className="dashboard-title">📈 Projeção Futura</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Valores comprometidos nos próximos 6 meses (recorrentes + parcelamentos)
      </p>

      <section>
        <table>
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
      </section>
    </div>
  )
}
