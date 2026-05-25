import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { CreditCard, Owner } from '../../types/database'
import { showError } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import Button from '../ui/Button'
import MobileCard from '../ui/MobileCard'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const ownerBadge = (o: Owner) => o === 'personal' ? 'Pessoal' : 'Sogra'

interface Props {
  cards: CreditCard[]
  cardsList: { name: string; label: string }[]
  canEdit: boolean
  onDelete: (id: string) => void
}

export default function CardsTable({ cards, cardsList, canEdit, onDelete }: Props) {
  const [cardFilter, setCardFilter] = useState('all')
  const [editing, setEditing] = useState<string | null>(null)

  const getLabel = (name: string) => cardsList.find(c => c.name === name)?.label ?? name
  const cardNames = ['all', ...new Set(cards.map(r => r.card))]
  const filtered = cardFilter === 'all' ? cards : cards.filter(r => r.card === cardFilter)

  const handleDelete = async (id: string) => {
    if (!await confirm('Tem certeza que deseja excluir este lançamento de cartão?')) return
    const { error } = await supabase.from('credit_cards').delete().eq('id', id)
    if (error) return showError(error)
    onDelete(id)
    setEditing(null)
  }

  return (
    <section>
      <h2>Cartões de Crédito</h2>
      <div className="tabs">
        {cardNames.map(c => (
          <Button key={c} variant="tab" active={c === cardFilter} onClick={() => setCardFilter(c)}>
            {c === 'all' ? 'Todos' : getLabel(c)}
          </Button>
        ))}
      </div>

      {/* Desktop */}
      <table className="desktop-table">
        <thead><tr><th>Descrição</th><th>Cartão</th><th>Parcela</th><th>Valor</th><th>Resp.</th>{canEdit && <th></th>}</tr></thead>
        <tbody>
          {filtered.length ? filtered.map(r => (
            <tr key={r.id}>
              <td>{r.description}</td>
              <td>{getLabel(r.card)}</td>
              <td>{r.current_installment && r.total_installments ? `${r.current_installment}/${r.total_installments}` : '-'}</td>
              <td>{fmt(+r.amount)}</td>
              <td><span className={`badge ${r.owner === 'personal' ? 'badge-personal' : 'badge-sogra'}`}>{ownerBadge(r.owner)}</span></td>
              {canEdit && (
                <td>
                  <Button variant="icon" onClick={() => setEditing(editing === r.id ? null : r.id)}>✏️</Button>
                  {editing === r.id && <Button variant="icon" className="delete-btn" onClick={() => handleDelete(r.id)}>🗑️</Button>}
                </td>
              )}
            </tr>
          )) : <tr><td colSpan={canEdit ? 6 : 5} className="empty">Nenhum lançamento</td></tr>}
        </tbody>
      </table>

      {/* Mobile */}
      <div className="mobile-cards">
        {filtered.length ? filtered.map(r => (
          <MobileCard
            key={r.id}
            title={r.description}
            fields={[
              { label: 'Cartão', value: getLabel(r.card) },
              { label: 'Valor', value: <strong>{fmt(+r.amount)}</strong> },
              { label: 'Responsável', value: <span className={`badge ${r.owner === 'personal' ? 'badge-personal' : 'badge-sogra'}`}>{ownerBadge(r.owner)}</span> },
              ...(r.current_installment ? [{ label: 'Parcela', value: `${r.current_installment}/${r.total_installments}` }] : []),
            ]}
            actions={canEdit ? <Button variant="icon" className="delete-btn" onClick={() => handleDelete(r.id)}>🗑️</Button> : undefined}
          />
        )) : <p className="empty">Nenhum lançamento</p>}
      </div>
    </section>
  )
}
