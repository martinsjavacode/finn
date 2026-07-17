import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { CreditCard, CardListItem, Category } from '../../types/database'
import { confirm } from '../../lib/confirm'
import { showError, toast } from '../../lib/toast'
import { fmt, categoryOptions } from '../../utils/format'
import { fetchCardInvoice, upsertCardInvoice, batchMarkTransactionsPaid } from '../../services/transactions'
import { useTransactionMutations } from '../../hooks/useTransactionMutations'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { useAuth } from '../../hooks'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Modal from '../ui/Modal'
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
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const { activeAccountId } = useAuth()
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
    const { error } = await upsertCardInvoice(cardName, month, amount, activeAccountId!)
    if (error) return showError(error)
    // Se a fatura ficou totalmente paga, marca os lançamentos como pagos
    const cardTotal = cards.filter(r => r.card === cardName).reduce((s, r) => s + +r.amount, 0)
    if (Math.round((amount - cardTotal) * 100) >= 0) {
      const ids = cards.filter(r => r.card === cardName && !r.paid).map(r => r.id)
      if (ids.length) await batchMarkTransactionsPaid(ids, activeAccountId!)
    }
    queryClient.invalidateQueries({ queryKey: ['cardInvoices', month] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
  }

  return (
    <section>
      <div className="page-header">
        <h2>Cartões de Crédito</h2>
      </div>
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
          accountId={activeAccountId!}
        />
      )}

      {cardFilter === 'all' && filtered.length > 0 && (() => {
        const groups = cardNames.filter(c => c !== 'all').map(name => ({ name, items: filtered.filter(r => r.card === name) })).filter(g => g.items.length)
        const colSpan = canEdit ? 5 : 4
        return !isMobile ? groups.map(g => (
          <table key={g.name} className="desktop-table" style={{ marginBottom: '1.5rem' }}>
            <thead>
              <tr><th colSpan={colSpan} style={{ background: 'var(--bg-card)', borderLeft: `3px solid ${getColor(g.name)}` }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: getColor(g.name), marginRight: 6 }} />
                {getLabel(g.name)} <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>{fmt(g.items.reduce((s, r) => s + +r.amount, 0))}</span>
              </th></tr>
              <tr><th>Descrição</th><th>Categoria</th><th>Parcela</th><th>Valor</th>{canEdit && <th></th>}</tr>
            </thead>
            <tbody>
              {g.items.map(r => (
                <tr key={r.id}>
                  <td>{categories.find(c => c.id === r.category)?.label ?? '-'}</td>
                  <td>{r.current_installment && r.total_installments ? `${r.current_installment}/${r.total_installments}` : '-'}</td>
                  <td>{fmt(+r.amount)}</td>
                  {canEdit && (
                    <td>
                      {canUpdate && !r.installment_purchase_id && <Button variant="icon" aria-label="Editar" onClick={() => setEditing(r)}><Pencil size={14} /></Button>}
                      {canDelete && <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(r)}><Trash2 size={14} /></Button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )) : <div className="mobile-cards">
          {groups.map(g => (
            <div key={g.name}>
              <div className="card-group-header" style={{ borderLeft: `3px solid ${getColor(g.name)}`, padding: '0.5rem 1rem', marginBottom: '0.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: getColor(g.name), marginRight: 6 }} />
                <strong>{getLabel(g.name)}</strong> <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{fmt(g.items.reduce((s, r) => s + +r.amount, 0))}</span>
              </div>
              {g.items.map(r => (
                <MobileCard
                  key={r.id}
                  title={r.description}
                  value={fmt(+r.amount)}
                  subtitle={<>{categories.find(c => c.id === r.category)?.label ?? ''}{r.current_installment ? ` · ${r.current_installment}/${r.total_installments}` : ''}</>}
                  onTap={canUpdate && !r.installment_purchase_id ? () => setEditing(r) : canDelete ? () => handleDelete(r) : undefined}
                  style={{ borderLeft: `3px solid ${getColor(g.name)}` }}
                />
              ))}
            </div>
          ))}
        </div>
      })()}

      {cardFilter === 'all' && !filtered.length && (!isMobile ? <table className="desktop-table"><tbody><tr><td className="empty">Nenhum lançamento</td></tr></tbody></table> : <p className="empty">Nenhum lançamento</p>)}

      {cardFilter !== 'all' && !isMobile && <table className="desktop-table">
        <thead><tr><th>Descrição</th><th>Categoria</th><th>Parcela</th><th>Valor</th>{canEdit && <th></th>}</tr></thead>
        <tbody>
          {filtered.length ? paginated.map(r => (
            <tr key={r.id}>
              <td>{r.description}</td>
              <td>{categories.find(c => c.id === r.category)?.label ?? '-'}</td>
              <td>{r.current_installment && r.total_installments ? `${r.current_installment}/${r.total_installments}` : '-'}</td>
              <td>{fmt(+r.amount)}</td>
              {canEdit && (
                <td>
                  {canUpdate && !r.installment_purchase_id && <Button variant="icon" aria-label="Editar" onClick={() => setEditing(r)}><Pencil size={14} /></Button>}
                  {canDelete && <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(r)}><Trash2 size={14} /></Button>}
                </td>
              )}
            </tr>
          )) : <tr><td colSpan={canEdit ? 5 : 4} className="empty">Nenhum lançamento</td></tr>}
        </tbody>
      </table>}

      {cardFilter !== 'all' && isMobile && <div className="mobile-cards">
        {filtered.length ? paginated.map(r => (
          <MobileCard
            key={r.id}
            title={r.description}
            value={fmt(+r.amount)}
            subtitle={<>{categories.find(c => c.id === r.category)?.label ?? ''}{r.current_installment ? ` · ${r.current_installment}/${r.total_installments}` : ''}</>}
            onTap={canUpdate && !r.installment_purchase_id ? () => setEditing(r) : canDelete ? () => handleDelete(r) : undefined}
            style={{ borderLeft: `3px solid ${getColor(r.card!)}` }}
          />
        )) : <p className="empty">Nenhum lançamento</p>}
      </div>}
      <Pagination currentPage={safePage} totalPages={totalPages} totalItems={filtered.length} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} />

      {editing && canUpdate && (
        <EditCardModal
          card={editing}
          cardsList={cardsList}
          categories={categories}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}

function EditCardModal({ card, cardsList, categories, onClose }: { card: CreditCard; cardsList: CardListItem[]; categories: Category[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [description, setDescription] = useState(card.description)
  const [amount, setAmount] = useState(String(card.amount))
  const [cardName, setCardName] = useState(card.card ?? '')
  const [category, setCategory] = useState(card.category ?? categories[0]?.id ?? '')

  const isInstallment = !!card.installment_purchase_id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const update = { description, amount: +amount, card: cardName, category }

    if (isInstallment) {
      const { error } = await supabase
        .from('entries')
        .update(update)
        .eq('installment_purchase_id', card.installment_purchase_id!)
        .gte('current_installment', card.current_installment!)
      if (error) return showError(error)
      toast(`${card.total_installments! - card.current_installment! + 1} parcelas atualizadas`)
    } else {
      const { error } = await supabase.from('entries').update(update).eq('id', card.id)
      if (error) return showError(error)
      toast('Lançamento atualizado')
    }

    queryClient.invalidateQueries({ queryKey: ['creditCards'] })
    onClose()
  }

  return (
    <Modal title="Editar Lançamento" onClose={onClose} onSubmit={handleSubmit} submitLabel={isInstallment ? 'Atualizar parcelas' : 'Salvar'}>
      {isInstallment && (
        <p className="form-hint">Parcela {card.current_installment}/{card.total_installments} — alterações aplicam desta parcela em diante.</p>
      )}

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

      <label className="form-label">Categoria
        <Select value={category} onChange={setCategory} options={categoryOptions(categories)} />
      </label>
    </Modal>
  )
}

function InvoiceBar({ cardName, cardLabel, total, month, canUpdate, onUpdate, accountId }: { cardName: string; cardLabel: string; total: number; month: string; canUpdate: boolean; onUpdate: (card: string, amount: number) => void; accountId: string }) {
  const { data: paidAmount = 0 } = useQuery({
    queryKey: ['cardInvoices', month, cardName, accountId],
    queryFn: () => fetchCardInvoice(cardName, month, accountId),
  })

  const [inputValue, setInputValue] = useState('')
  const remaining = Math.round((total - paidAmount) * 100) / 100
  const pct = total > 0 ? Math.min(Math.round((paidAmount / total) * 100), 100) : 0
  const isPaid = remaining <= 0

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
