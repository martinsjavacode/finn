import { Pencil, Trash2, Check, Circle, TrendingUp, TrendingDown } from 'lucide-react'
import { useState } from 'react'
import type { Transaction, Category, Owner, TransactionType } from '../../types/database'
import { confirm } from '../../lib/confirm'
import { fmt, ownerLabel, categoryOptions } from '../../utils/format'
import { useTransactionMutations } from '../../hooks/useTransactionMutations'
import Button from '../ui/Button'
import Select from '../ui/Select'
import MobileCard from '../ui/MobileCard'
import Pagination from '../ui/Pagination'

interface Props {
  transactions: Transaction[]
  categories: Category[]
  month: string
  canUpdate: boolean
  canDelete: boolean
}

export default function TransactionsTable({ transactions, categories, month, canUpdate, canDelete }: Props) {
  const canEdit = canUpdate || canDelete
  const { togglePaid: togglePaidMutation, editTransaction, removeTransaction, removeInstallment } = useTransactionMutations(month)
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [paidFilter, setPaidFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Transaction>>({})
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const getCatLabel = (t: Transaction) => t.categories?.label ?? ''

  const filtered = transactions.filter(r =>
    (typeFilter === 'all' || r.type === typeFilter) &&
    (paidFilter === 'all' || (paidFilter === 'paid' ? r.paid : !r.paid))
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = page > totalPages ? 1 : page
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const togglePaid = (id: string, paid: boolean) => togglePaidMutation.mutate({ id, paid })

  const startEdit = (r: Transaction) => {
    setEditing(r.id)
    setEditData({ description: r.description, amount: r.amount, category: r.category, owner: r.owner, month: r.month })
  }

  const saveEdit = (id: string) => {
    editTransaction.mutate({ id, data: editData })
    setEditing(null)
  }

  const handleDelete = async (r: Transaction) => {
    if (r.installment_purchase_id) {
      if (!await confirm(`Excluir todas as ${r.total_installments} parcelas deste parcelamento?`)) return
      removeInstallment.mutate(r.installment_purchase_id)
    } else {
      if (!await confirm('Tem certeza que deseja excluir este lançamento?')) return
      removeTransaction.mutate(r.id)
    }
    setEditing(null)
  }

  return (
    <section>
      <h2>Lançamentos</h2>
      <div className="tabs">
        {(['all', 'income', 'expense'] as const).map(t => (
          <Button key={t} variant="tab" active={t === typeFilter} onClick={() => setTypeFilter(t)}>
            {t === 'all' ? 'Todos' : t === 'income' ? <><TrendingUp size={14} /> Receitas</> : <><TrendingDown size={14} /> Despesas</>}
          </Button>
        ))}
      </div>
      <div className="tabs">
        {(['all', 'pending', 'paid'] as const).map(s => (
          <Button key={s} variant="tab" active={s === paidFilter} onClick={() => setPaidFilter(s)}>
            {s === 'all' ? 'Todos status' : s === 'paid' ? '✓ Pagos' : '○ Pendentes'}
          </Button>
        ))}
      </div>

      {/* Desktop */}
      <table className="desktop-table">
        <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Parcela</th><th>Valor</th><th>Resp.</th><th>Pago</th>{canEdit && <th></th>}</tr></thead>
        <tbody>
          {filtered.length ? paginated.map(r => (
            <tr key={r.id} className={r.paid ? 'row-paid' : ''}>
              {editing === r.id ? (
                <>
                  <td><input className="inline-input" type="date" value={editData.month ?? r.month} onChange={e => setEditData(d => ({ ...d, month: e.target.value }))} /></td>
                  <td><input className="inline-input" value={editData.description ?? ''} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} /></td>
                  <td><Select value={editData.category ?? ''} onChange={v => setEditData(d => ({ ...d, category: v }))} options={categoryOptions(categories)} /></td>
                  <td>{r.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}</td>
                  <td>{r.current_installment && r.total_installments ? `${r.current_installment}/${r.total_installments}` : '-'}</td>
                  <td><input className="inline-input" type="number" step="0.01" value={editData.amount ?? ''} onChange={e => setEditData(d => ({ ...d, amount: +e.target.value }))} style={{ width: '100px' }} /></td>
                  <td><Select value={editData.owner ?? ''} onChange={v => setEditData(d => ({ ...d, owner: v as Owner }))} options={[{ value: 'personal', label: 'Pessoal' }, { value: 'mother_in_law', label: 'Sogra' }]} /></td>
                  <td></td>
                  <td><Button onClick={() => saveEdit(r.id)}><Check size={14} /></Button></td>
                </>
              ) : (
                <>
                  <td>{new Date(r.month + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td>{r.description}</td>
                  <td>{getCatLabel(r)}</td>
                  <td>{r.type === 'income' ? 'Receita' : 'Despesa'}</td>
                  <td>{r.current_installment && r.total_installments ? `${r.current_installment}/${r.total_installments}` : '-'}</td>
                  <td>{fmt(+r.amount)}</td>
                  <td><span className={`badge ${r.owner === 'personal' ? 'badge-success' : 'badge-danger'}`}>{ownerLabel(r.owner)}</span></td>
                  <td>{canUpdate ? <button className={`paid-btn ${r.paid ? 'paid' : ''}`} aria-label={r.paid ? 'Marcar como pendente' : 'Marcar como pago'} onClick={() => togglePaid(r.id, r.paid)}>{r.paid ? <Check size={14} /> : <Circle size={14} />}</button> : <span className={`badge ${r.paid ? 'badge-success' : 'badge-danger'}`}>{r.paid ? 'Pago' : 'Pendente'}</span>}</td>
                  {canEdit && (
                    <td>
                      {canUpdate && !r.installment_purchase_id && <Button variant="icon" aria-label="Editar" onClick={() => startEdit(r)}><Pencil size={14} /></Button>}
                      {canDelete && <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(r)}><Trash2 size={14} /></Button>}
                    </td>
                  )}
                </>
              )}
            </tr>
          )) : <tr><td colSpan={canEdit ? 9 : 8} className="empty">Nenhum lançamento</td></tr>}
        </tbody>
      </table>

      {/* Mobile */}
      <div className="mobile-cards">
        {filtered.length ? paginated.map(r => (
          <MobileCard
            key={r.id}
            className={r.paid ? 'row-paid' : ''}
            status={canUpdate ? <button className={`paid-btn ${r.paid ? 'paid' : ''}`} aria-label={r.paid ? 'Marcar como pendente' : 'Marcar como pago'} onClick={(e) => { e.stopPropagation(); togglePaid(r.id, r.paid) }}>{r.paid ? <Check size={14} /> : <Circle size={14} />}</button> : <span className={`badge ${r.paid ? 'badge-success' : 'badge-danger'}`}>{r.paid ? 'Pago' : 'Pendente'}</span>}
            title={r.description}
            value={fmt(+r.amount)}
            subtitle={<>{getCatLabel(r)} · {new Date(r.month + 'T12:00:00').toLocaleDateString('pt-BR')} · {ownerLabel(r.owner)}{r.current_installment ? ` · ${r.current_installment}/${r.total_installments}` : ''}</>}
            onTap={canUpdate && !r.installment_purchase_id ? () => startEdit(r) : undefined}
          />
        )) : <p className="empty">Nenhum lançamento</p>}
      </div>
      <Pagination currentPage={safePage} totalPages={totalPages} totalItems={filtered.length} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} />

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)} role="dialog" aria-modal="true">
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); saveEdit(editing) }}>
            <h2>Editar Lançamento</h2>
            <label className="form-label">Descrição
              <input type="text" value={editData.description ?? ''} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} autoFocus required />
            </label>
            <div className="form-row">
              <label className="form-label form-grow">Valor (R$)
                <input type="number" step="0.01" value={editData.amount ?? ''} onChange={e => setEditData(d => ({ ...d, amount: +e.target.value }))} required />
              </label>
              <label className="form-label">Data
                <input type="date" value={editData.month ?? ''} onChange={e => setEditData(d => ({ ...d, month: e.target.value }))} required />
              </label>
            </div>
            <div className="form-row">
              <label className="form-label form-grow">Categoria
                <Select value={editData.category ?? ''} onChange={v => setEditData(d => ({ ...d, category: v }))} options={categoryOptions(categories)} />
              </label>
              <label className="form-label form-grow">Responsável
                <Select value={editData.owner ?? ''} onChange={v => setEditData(d => ({ ...d, owner: v as Owner }))} options={[{ value: 'personal', label: 'Pessoal' }, { value: 'mother_in_law', label: 'Sogra' }]} />
              </label>
            </div>
            <div className="form-actions">
              <Button variant="tab" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button variant="primary" type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
