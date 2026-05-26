import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { CreditCard, CardListItem } from '../../types/database'
import { showError } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import { fmt, ownerLabel } from '../../utils/format'
import Button from '../ui/Button'
import MobileCard from '../ui/MobileCard'
import Pagination from '../ui/Pagination'

interface Props {
  cards: CreditCard[]
  cardsList: CardListItem[]
  canUpdate: boolean
  canDelete: boolean
  onDelete: (id: string) => void
}

export default function CardsTable({ cards, cardsList, canUpdate, canDelete, onDelete }: Props) {
  const canEdit = canUpdate || canDelete
  const [cardFilter, setCardFilter] = useState('all')
  const [editing, setEditing] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const getLabel = (name: string) => cardsList.find(c => c.name === name)?.label ?? name
  const getColor = (name: string) => cardsList.find(c => c.name === name)?.color ?? '#888'
  const cardNames = ['all', ...new Set(cards.map(r => r.card))]
  const filtered = cardFilter === 'all' ? cards : cards.filter(r => r.card === cardFilter)

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = page > totalPages ? 1 : page
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage)

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
          <Button key={c} variant="tab" active={c === cardFilter} onClick={() => setCardFilter(c)}
            style={c !== 'all' && c === cardFilter ? { boxShadow: `inset 0 -2px 0 ${getColor(c)}` } : undefined}>
            {c === 'all' ? 'Todos' : <><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: getColor(c), marginRight: 6 }} />{getLabel(c)}</>}
          </Button>
        ))}
      </div>

      {/* Desktop */}
      <table className="desktop-table">
        <thead><tr><th>Descrição</th><th>Cartão</th><th>Parcela</th><th>Valor</th><th>Resp.</th>{canEdit && <th></th>}</tr></thead>
        <tbody>
          {filtered.length ? paginated.map(r => (
            <tr key={r.id}>
              <td>{r.description}</td>
              <td><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: getColor(r.card), marginRight: 6 }} />{getLabel(r.card)}</td>
              <td>{r.current_installment && r.total_installments ? `${r.current_installment}/${r.total_installments}` : '-'}</td>
              <td>{fmt(+r.amount)}</td>
              <td><span className={`badge ${r.owner === 'personal' ? 'badge-success' : 'badge-danger'}`}>{ownerLabel(r.owner)}</span></td>
              {canEdit && (
                <td>
                  {canUpdate && <Button variant="icon" onClick={() => setEditing(editing === r.id ? null : r.id)}><Pencil size={14} /></Button>}
                  {editing === r.id && canDelete && <Button variant="icon" className="delete-btn" onClick={() => handleDelete(r.id)}><Trash2 size={14} /></Button>}
                </td>
              )}
            </tr>
          )) : <tr><td colSpan={canEdit ? 6 : 5} className="empty">Nenhum lançamento</td></tr>}
        </tbody>
      </table>

      {/* Mobile */}
      <div className="mobile-cards">
        {filtered.length ? paginated.map(r => (
          <MobileCard
            key={r.id}
            title={r.description}
            value={fmt(+r.amount)}
            subtitle={<>{getLabel(r.card)} · {ownerLabel(r.owner)}{r.current_installment ? ` · ${r.current_installment}/${r.total_installments}` : ''}</>}
            onTap={canDelete ? () => handleDelete(r.id) : undefined}
            style={{ borderLeft: `3px solid ${getColor(r.card)}` }}
          />
        )) : <p className="empty">Nenhum lançamento</p>}
      </div>
      <Pagination currentPage={safePage} totalPages={totalPages} totalItems={filtered.length} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} />
    </section>
  )
}
