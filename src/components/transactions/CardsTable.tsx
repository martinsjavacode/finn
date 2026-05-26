import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { CreditCard, CardListItem, Category, Owner } from '../../types/database'
import { confirm } from '../../lib/confirm'
import { showError, toast } from '../../lib/toast'
import { fmt, ownerLabel } from '../../utils/format'
import { fetchCardInvoice, upsertCardInvoice } from '../../services/transactions'
import { useTransactionMutations } from '../../hooks/useTransactionMutations'
import { useModal } from '../../hooks/useModal'
import Button from '../ui/Button'
import Select from '../ui/Select'
import MobileCard from '../ui/MobileCard'
import Pagination from '../ui/Pagination'

interface Props {
  cards: CreditCard[]
  cardsList: CardListItem[]
  categories: Category[]
  month: string
  canUpdate: boolean
  canDelete: boolean
}

export default function CardsTable({ cards, cardsList, categories, month, canUpdate, canDelete }: Props) {
  const canEdit = canUpdate || canDelete
  const queryClient = useQueryClient()
  const { removeCreditCard, removeInstallment } = useTransactionMutations(month)
  const [cardFilter, setCardFilter] = useState('all')
  const [editing, setEditing] = useState<CreditCard | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const getLabel = (name: string) => cardsList.find(c => c.name === name)?.label ?? name
  const getColor = (name: string) => cardsList.find(c => c.name === name)?.color ?? '#888'
  const cardNames = ['all', ...new Set(cards.map(r => r.card!).filter(Boolean))]
  const sorted = [...cards].sort((a, b) => a.month.localeCompare(b.month))
  const filtered = cardFilter === 'all' ? sorted : sorted.filter(r => r.card === cardFilter)

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = page > totalPages ? 1 : page
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const handleDelete = async (r: CreditCard) => {
    if (r.installment_purchase_id) {
      if (!await confirm(`Excluir todas as ${r.total_installments} parcelas deste parcelamento?`)) return
      removeInstallment.mutate(r.installment_purchase_id)
    } else {
      if (!await confirm('Tem certeza que deseja excluir este lançamento de cartão?')) return
      removeCreditCard.mutate(r.id)
    }
  }

  const updatePaidAmount = async (cardName: string, amount: number) => {
    const { error } = await upsertCardInvoice(cardName, month, amount)
    if (error) return showError(error)
    queryClient.invalidateQueries({ queryKey: ['cardInvoices', month] })
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

      {cardFilter !== 'all' && (
        <InvoiceBar
          cardName={cardFilter}
          cardLabel={getLabel(cardFilter)}
          total={filtered.reduce((s, r) => s + +r.amount, 0)}
          month={month}
          canUpdate={canUpdate}
          onUpdate={updatePaidAmount}
        />
      )}

      <table className="desktop-table">
        <thead><tr><th>Data</th><th>Descrição</th><th>Cartão</th><th>Categoria</th><th>Parcela</th><th>Valor</th><th>Resp.</th>{canEdit && <th></th>}</tr></thead>
        <tbody>
          {filtered.length ? paginated.map(r => (
            <tr key={r.id}>
              <td>{new Date(r.month + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
              <td>{r.description}</td>
              <td><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: getColor(r.card!), marginRight: 6 }} />{getLabel(r.card!)}</td>
              <td>{categories.find(c => c.id === r.category)?.label ?? '-'}</td>
              <td>{r.current_installment && r.total_installments ? `${r.current_installment}/${r.total_installments}` : '-'}</td>
              <td>{fmt(+r.amount)}</td>
              <td><span className={`badge ${r.owner === 'personal' ? 'badge-success' : 'badge-danger'}`}>{ownerLabel(r.owner)}</span></td>
              {canEdit && (
                <td>
                  {canUpdate && !r.installment_purchase_id && <Button variant="icon" aria-label="Editar" onClick={() => setEditing(r)}><Pencil size={14} /></Button>}
                  {canDelete && <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(r)}><Trash2 size={14} /></Button>}
                </td>
              )}
            </tr>
          )) : <tr><td colSpan={canEdit ? 8 : 7} className="empty">Nenhum lançamento</td></tr>}
        </tbody>
      </table>

      <div className="mobile-cards">
        {filtered.length ? paginated.map(r => (
          <MobileCard
            key={r.id}
            title={r.description}
            value={fmt(+r.amount)}
            subtitle={<>{new Date(r.month + 'T12:00:00').toLocaleDateString('pt-BR')} · {getLabel(r.card!)} · {categories.find(c => c.id === r.category)?.label ?? ''} · {ownerLabel(r.owner)}{r.current_installment ? ` · ${r.current_installment}/${r.total_installments}` : ''}</>}
            onTap={canUpdate && !r.installment_purchase_id ? () => setEditing(r) : canDelete ? () => handleDelete(r) : undefined}
            style={{ borderLeft: `3px solid ${getColor(r.card!)}` }}
          />
        )) : <p className="empty">Nenhum lançamento</p>}
      </div>
      <Pagination currentPage={safePage} totalPages={totalPages} totalItems={filtered.length} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} />

      {editing && canUpdate && createPortal(
        <EditCardModal
          card={editing}
          cardsList={cardsList}
          categories={categories}
          onClose={() => setEditing(null)}
        />,
        document.body
      )}
    </section>
  )
}

function EditCardModal({ card, cardsList, categories, onClose }: { card: CreditCard; cardsList: CardListItem[]; categories: Category[]; onClose: () => void }) {
  const modalRef = useModal<HTMLFormElement>(onClose)
  const queryClient = useQueryClient()
  const [description, setDescription] = useState(card.description)
  const [amount, setAmount] = useState(String(card.amount))
  const [cardName, setCardName] = useState(card.card ?? '')
  const [category, setCategory] = useState(card.category ?? categories[0]?.id ?? '')
  const [owner, setOwner] = useState<Owner>(card.owner)

  const isInstallment = !!card.installment_purchase_id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const update = { description, amount: +amount, card: cardName, category, owner }

    if (isInstallment) {
      const { error } = await supabase
        .from('credit_cards')
        .update(update as never)
        .eq('installment_purchase_id', card.installment_purchase_id!)
        .gte('current_installment', card.current_installment!)
      if (error) return showError(error)
      toast(`${card.total_installments! - card.current_installment! + 1} parcelas atualizadas`)
    } else {
      const { error } = await supabase.from('credit_cards').update(update as never).eq('id', card.id)
      if (error) return showError(error)
      toast('Lançamento atualizado')
    }

    queryClient.invalidateQueries({ queryKey: ['creditCards'] })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Editar Lançamento">
      <form className="modal" ref={modalRef} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Editar Lançamento</h2>

        {isInstallment && (
          <p className="form-hint">Parcela {card.current_installment}/{card.total_installments} — alterações aplicam desta parcela em diante.</p>
        )}

        {/* Seção: O quê */}
        <label className="form-label">Descrição
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} required />
        </label>

        <div className="form-row">
          <label className="form-label form-grow">Valor (R$)
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
          </label>
          <label className="form-label form-grow">Cartão
            <Select value={cardName} onChange={setCardName} options={cardsList.map(c => ({ value: c.name, label: c.label }))} />
          </label>
        </div>

        <div className="form-divider" />

        {/* Seção: Classificação */}
        <div className="form-row">
          <label className="form-label form-grow">Categoria
            <Select value={category} onChange={setCategory} options={categories.map(c => ({ value: c.id, label: c.label }))} />
          </label>
          <label className="form-label form-grow">Responsável
            <Select value={owner} onChange={v => setOwner(v as Owner)} options={[{ value: 'personal', label: 'Pessoal' }, { value: 'mother_in_law', label: 'Sogra' }]} />
          </label>
        </div>

        <div className="form-actions">
          <Button variant="tab" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">{isInstallment ? 'Atualizar parcelas' : 'Salvar'}</Button>
        </div>
      </form>
    </div>
  )
}

function InvoiceBar({ cardName, cardLabel, total, month, canUpdate, onUpdate }: { cardName: string; cardLabel: string; total: number; month: string; canUpdate: boolean; onUpdate: (card: string, amount: number) => void }) {
  const { data: paidAmount = 0 } = useQuery({
    queryKey: ['cardInvoices', month, cardName],
    queryFn: () => fetchCardInvoice(cardName, month),
  })

  const [inputValue, setInputValue] = useState('')
  const remaining = total - paidAmount
  const pct = total > 0 ? Math.min(Math.round((paidAmount / total) * 100), 100) : 0
  const isPaid = paidAmount >= total

  const handlePay = () => {
    onUpdate(cardName, paidAmount + (+inputValue || remaining))
    setInputValue('')
  }

  return (
    <div className={`invoice-bar ${isPaid ? 'invoice-paid' : ''}`}>
      <div className="invoice-info">
        <span>Fatura {cardLabel}: <strong>{fmt(total)}</strong></span>
        <span className="invoice-detail">
          Pago: {fmt(paidAmount)} ({pct}%){remaining > 0 && <> · Restante: <strong>{fmt(remaining)}</strong></>}
        </span>
      </div>
      {canUpdate && !isPaid && (
        <div className="invoice-action">
          <input type="number" step="0.01" placeholder={fmt(remaining)} value={inputValue} onChange={e => setInputValue(e.target.value)} className="invoice-input" />
          <button className="btn-invoice" onClick={handlePay}>Pagar</button>
          <button className="btn-invoice" onClick={() => { onUpdate(cardName, total); setInputValue('') }}>Pagar tudo</button>
        </div>
      )}
      {isPaid && <span className="badge badge-success">✓ Paga</span>}
    </div>
  )
}
