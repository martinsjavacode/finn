import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CreditCard, Card, Owner } from '../types/database'

const cardLabels: Record<Card, string> = { nubank: 'Nubank', bradesco: 'Bradesco', inter: 'Inter', pague_menos: 'Pague Menos', mercado_pago: 'Mercado Pago', neon: 'Neon' }
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const ownerBadge = (o: Owner) => o === 'personal' ? 'Pessoal' : 'Sogra'

interface Props {
  cards: CreditCard[]
  onDelete: (id: string) => void
}

export default function CardsTable({ cards, onDelete }: Props) {
  const [cardFilter, setCardFilter] = useState('all')
  const [editing, setEditing] = useState<string | null>(null)

  const cardNames = ['all', ...new Set(cards.map(r => r.card))]
  const filtered = cardFilter === 'all' ? cards : cards.filter(r => r.card === cardFilter)

  const handleDelete = async (id: string) => {
    await supabase.from('credit_cards').delete().eq('id', id)
    onDelete(id)
    setEditing(null)
  }

  return (
    <section>
      <h2>Cartões de Crédito</h2>
      <div className="tabs">
        {cardNames.map(c => (
          <button key={c} className={`tab ${c === cardFilter ? 'active' : ''}`} onClick={() => setCardFilter(c)}>
            {c === 'all' ? 'Todos' : cardLabels[c as Card] || c}
          </button>
        ))}
      </div>
      <table>
        <thead><tr><th>Descrição</th><th>Cartão</th><th>Parcela</th><th>Valor</th><th>Resp.</th><th></th></tr></thead>
        <tbody>
          {filtered.length ? filtered.map(r => (
            <tr key={r.id}>
              <td>{r.description}</td>
              <td>{cardLabels[r.card]}</td>
              <td>{r.current_installment && r.total_installments ? `${r.current_installment}/${r.total_installments}` : '-'}</td>
              <td>{fmt(+r.amount)}</td>
              <td><span className={`badge ${r.owner === 'personal' ? 'badge-personal' : 'badge-sogra'}`}>{ownerBadge(r.owner)}</span></td>
              <td>
                {editing === r.id ? (
                  <button className="delete-btn" onClick={() => handleDelete(r.id)}>🗑️</button>
                ) : (
                  <button className="edit-btn" onClick={() => setEditing(r.id)}>⋯</button>
                )}
              </td>
            </tr>
          )) : <tr><td colSpan={6} className="empty">Nenhum lançamento</td></tr>}
        </tbody>
      </table>
    </section>
  )
}
