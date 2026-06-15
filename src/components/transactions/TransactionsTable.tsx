import { Pencil, Trash2, Check, TrendingUp, TrendingDown } from 'lucide-react'
import { useState } from 'react'
import type { Transaction, Category, TransactionType } from '../../types/database'
import { confirm } from '../../lib/confirm'
import { fmt, categoryOptions } from '../../utils/format'
import Badge from '../ui/Badge'
import { useTransactionMutations } from '../../hooks/useTransactionMutations'
import { useMigration } from '../../hooks/useMigration'
import { useIsMobile } from '../../hooks/useMediaQuery'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Modal from '../ui/Modal'
import MobileCard from '../ui/MobileCard'
import Pagination from '../ui/Pagination'
import MigrateModal from '../ui/MigrateModal'
import SelectionCheckbox from './SelectionCheckbox'

interface Props {
  transactions: Transaction[]
  categories: Category[]
  month: string
  canUpdate: boolean
  canDelete: boolean
  isSuperadmin?: boolean
  accounts?: { id: string; name: string }[]
  activeAccountId?: string | null
  selectionMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  typeFilter?: 'all' | TransactionType
  onTypeFilterChange?: (v: 'all' | TransactionType) => void
  paidFilter?: 'all' | 'paid' | 'pending'
  onPaidFilterChange?: (v: 'all' | 'paid' | 'pending') => void
}

export default function TransactionsTable({ transactions, categories, month, canUpdate, canDelete, isSuperadmin, accounts, activeAccountId, selectionMode, selectedIds, onToggleSelect, typeFilter: externalTypeFilter, onTypeFilterChange, paidFilter: externalPaidFilter, onPaidFilterChange }: Props) {
  const canEdit = canUpdate || canDelete
  const isMobile = useIsMobile()
  const { togglePaid: togglePaidMutation, editTransaction, removeTransaction, removeInstallment } = useTransactionMutations(month)
  const [internalTypeFilter, setInternalTypeFilter] = useState<'all' | TransactionType>('all')
  const [internalPaidFilter, setInternalPaidFilter] = useState<'all' | 'paid' | 'pending'>('all')

  const typeFilter = externalTypeFilter ?? internalTypeFilter
  const setTypeFilter = onTypeFilterChange ?? setInternalTypeFilter
  const paidFilter = externalPaidFilter ?? internalPaidFilter
  const setPaidFilter = onPaidFilterChange ?? setInternalPaidFilter
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Transaction>>({})
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showMigrate, setShowMigrate] = useState(false)
  const { migrateEntries } = useMigration()

  const toggleSelect = (id: string) => setSelected(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s })
  const toggleAll = () => setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)))

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
    setEditData({ description: r.description, amount: r.amount, category: r.category, month: r.month })
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
      <div className="page-header">
        <h2>Lançamentos</h2>
        {isSuperadmin && selected.size > 0 && <Button onClick={() => setShowMigrate(true)}>Migrar ({selected.size})</Button>}
      </div>
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
      {!isMobile && <table className="desktop-table">
        <thead><tr>{selectionMode && <th></th>}{isSuperadmin && <th><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} aria-label="Selecionar todos" /></th>}<th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Parcela</th><th>Valor</th><th>Pago</th>{canEdit && <th></th>}</tr></thead>
        <tbody>
          {filtered.length ? paginated.map(r => (
            <tr key={r.id} className={`${r.paid ? 'row-paid' : ''}${selectedIds?.has(r.id) ? ' bg-blue-50 dark:bg-blue-900/20' : ''}`}>
              {selectionMode && <td>{!r.paid && onToggleSelect ? <SelectionCheckbox checked={selectedIds?.has(r.id) ?? false} onChange={() => onToggleSelect(r.id)} /> : null}</td>}
              {isSuperadmin && <td><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} aria-label={`Selecionar ${r.description}`} /></td>}
              {editing === r.id ? (
                <>
                  <td><input className="inline-input" type="date" value={editData.month ?? r.month} onChange={e => setEditData(d => ({ ...d, month: e.target.value }))} /></td>
                  <td><input className="inline-input" value={editData.description ?? ''} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} /></td>
                  <td><Select value={editData.category ?? ''} onChange={v => setEditData(d => ({ ...d, category: v }))} options={categoryOptions(categories)} /></td>
                  <td>{r.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}</td>
                  <td>{r.current_installment && r.total_installments ? `${r.current_installment}/${r.total_installments}` : '-'}</td>
                  <td><input className="inline-input" type="number" step="0.01" value={editData.amount ?? ''} onChange={e => setEditData(d => ({ ...d, amount: +e.target.value }))} style={{ width: '100px' }} /></td>
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
                  <td>{canUpdate ? <button className="badge-toggle" role="switch" aria-checked={r.paid} onClick={() => togglePaid(r.id, r.paid)}><Badge variant={r.paid ? 'success' : 'danger'}>{r.paid ? 'Pago' : 'Pendente'}</Badge></button> : <Badge variant={r.paid ? 'success' : 'danger'}>{r.paid ? 'Pago' : 'Pendente'}</Badge>}</td>
                  {canEdit && (
                    <td>
                      {canUpdate && !r.installment_purchase_id && <Button variant="icon" aria-label="Editar" onClick={() => startEdit(r)}><Pencil size={14} /></Button>}
                      {canDelete && <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(r)}><Trash2 size={14} /></Button>}
                    </td>
                  )}
                </>
              )}
            </tr>
          )) : <tr><td colSpan={(canEdit ? 8 : 7) + (isSuperadmin ? 1 : 0) + (selectionMode ? 1 : 0)} className="empty">Nenhum lançamento encontrado</td></tr>}
        </tbody>
      </table>}

      {/* Mobile */}
      {isMobile && <div className="mobile-cards">
        {filtered.length ? paginated.map(r => (
          <div key={r.id} className={`flex items-center gap-2${selectedIds?.has(r.id) ? ' bg-blue-50 dark:bg-blue-900/20 rounded-lg' : ''}`}>
            {selectionMode && !r.paid && onToggleSelect && (
              <SelectionCheckbox checked={selectedIds?.has(r.id) ?? false} onChange={() => onToggleSelect(r.id)} />
            )}
            {selectionMode && r.paid && <div className="min-w-[44px]" />}
            <div className="flex-1">
              <MobileCard
                className={r.paid ? 'row-paid' : ''}
                status={canUpdate ? <button className="badge-toggle" role="switch" aria-checked={r.paid} onClick={(e) => { e.stopPropagation(); togglePaid(r.id, r.paid) }}><Badge variant={r.paid ? 'success' : 'danger'}>{r.paid ? 'Pago' : 'Pendente'}</Badge></button> : <Badge variant={r.paid ? 'success' : 'danger'}>{r.paid ? 'Pago' : 'Pendente'}</Badge>}
                title={r.description}
                value={fmt(+r.amount)}
                subtitle={<>{getCatLabel(r)} · {new Date(r.month + 'T12:00:00').toLocaleDateString('pt-BR')}{r.current_installment ? ` · ${r.current_installment}/${r.total_installments}` : ''}</>}
                onTap={canUpdate && !r.installment_purchase_id ? () => startEdit(r) : undefined}
              />
            </div>
          </div>
        )) : <p className="empty">Nenhum lançamento encontrado</p>}
      </div>}
      <Pagination currentPage={safePage} totalPages={totalPages} totalItems={filtered.length} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} />

      {editing && (
        <Modal title="Editar Lançamento" onClose={() => setEditing(null)} onSubmit={e => { e.preventDefault(); saveEdit(editing) }}>
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
          </div>
        </Modal>
      )}

      {showMigrate && accounts && activeAccountId && (
        <MigrateModal
          accounts={accounts}
          currentAccountId={activeAccountId}
          count={selected.size}
          label="lançamento"
          onClose={() => setShowMigrate(false)}
          onConfirm={targetId => { migrateEntries.mutate({ ids: [...selected], targetAccountId: targetId }); setSelected(new Set()); setShowMigrate(false) }}
        />
      )}
    </section>
  )
}
