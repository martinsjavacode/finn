import { Pencil, Trash2, Check, Circle } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Transaction, Category, Owner, TransactionType } from '../../types/database'
import { showError } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import { fmt, ownerLabel } from '../../utils/format'
import Button from '../ui/Button'
import Select from '../ui/Select'
import MobileCard from '../ui/MobileCard'

interface Props {
  transactions: Transaction[]
  categories: Category[]
  canEdit: boolean
  onUpdate: (id: string, data: Partial<Transaction>) => void
  onDelete: (id: string) => void
}

export default function TransactionsTable({ transactions, categories, canEdit, onUpdate, onDelete }: Props) {
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [catFilter, setCatFilter] = useState('all')
  const [paidFilter, setPaidFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Transaction>>({})

  const catLabel = (id: string) => categories.find(c => c.id === id)?.label ?? id
  const getCatLabel = (t: Transaction) => t.categories?.label ?? ''

  const filtered = transactions.filter(r =>
    (typeFilter === 'all' || r.type === typeFilter) &&
    (catFilter === 'all' || r.category === catFilter) &&
    (paidFilter === 'all' || (paidFilter === 'paid' ? r.paid : !r.paid))
  )

  const usedCats = ['all', ...new Set(transactions.map(r => r.category))]

  const togglePaid = async (id: string, paid: boolean) => {
    const { error } = await supabase.from('transactions').update({ paid: !paid } as never).eq('id', id)
    if (error) return showError(error)
    onUpdate(id, { paid: !paid })
  }

  const startEdit = (r: Transaction) => {
    setEditing(r.id)
    setEditData({ description: r.description, amount: r.amount, category: r.category, owner: r.owner, month: r.month })
  }

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from('transactions').update(editData as never).eq('id', id)
    if (error) return showError(error)
    onUpdate(id, editData)
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!await confirm('Tem certeza que deseja excluir este lançamento?')) return
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) return showError(error)
    onDelete(id)
    setEditing(null)
  }

  return (
    <section>
      <h2>Lançamentos</h2>
      <div className="tabs">
        {(['all', 'income', 'expense'] as const).map(t => (
          <Button key={t} variant="tab" active={t === typeFilter} onClick={() => setTypeFilter(t)}>
            {t === 'all' ? 'Todos' : t === 'income' ? '📈 Receitas' : '📉 Despesas'}
          </Button>
        ))}
      </div>
      <div className="tabs">
        {usedCats.map(c => (
          <Button key={c} variant="tab" active={c === catFilter} onClick={() => setCatFilter(c)}>
            {c === 'all' ? 'Todas categorias' : catLabel(c)}
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
          {filtered.length ? filtered.map(r => (
            <tr key={r.id} className={r.paid ? 'row-paid' : ''}>
              {editing === r.id ? (
                <>
                  <td><input className="inline-input" type="date" value={editData.month ?? r.month} onChange={e => setEditData(d => ({ ...d, month: e.target.value }))} /></td>
                  <td><input className="inline-input" value={editData.description ?? ''} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} /></td>
                  <td><Select value={editData.category ?? ''} onChange={v => setEditData(d => ({ ...d, category: v }))} options={categories.map(c => ({ value: c.id, label: c.label }))} /></td>
                  <td>{r.type === 'income' ? '📈' : '📉'}</td>
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
                  <td>{r.type === 'income' ? '📈 Receita' : '📉 Despesa'}</td>
                  <td>{r.current_installment && r.total_installments ? `${r.current_installment}/${r.total_installments}` : '-'}</td>
                  <td>{fmt(+r.amount)}</td>
                  <td><span className={`badge ${r.owner === 'personal' ? 'badge-personal' : 'badge-sogra'}`}>{ownerLabel(r.owner)}</span></td>
                  <td>{canEdit && <button className={`paid-btn ${r.paid ? 'paid' : ''}`} onClick={() => togglePaid(r.id, r.paid)}>{r.paid ? <Check size={14} /> : <Circle size={14} />}</button>}</td>
                  {canEdit && (
                    <td>
                      <Button variant="icon" onClick={() => startEdit(r)}><Pencil size={14} /></Button>
                      <Button variant="icon" className="delete-btn" onClick={() => handleDelete(r.id)}><Trash2 size={14} /></Button>
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
        {filtered.length ? filtered.map(r => (
          <MobileCard
            key={r.id}
            className={r.paid ? 'row-paid' : ''}
            status={canEdit && <button className={`paid-btn ${r.paid ? 'paid' : ''}`} onClick={(e) => { e.stopPropagation(); togglePaid(r.id, r.paid) }}>{r.paid ? <Check size={14} /> : <Circle size={14} />}</button>}
            title={r.description}
            value={fmt(+r.amount)}
            subtitle={<>{getCatLabel(r)} · {new Date(r.month + 'T12:00:00').toLocaleDateString('pt-BR')} · {ownerLabel(r.owner)}{r.current_installment ? ` · ${r.current_installment}/${r.total_installments}` : ''}</>}
            onTap={canEdit ? () => startEdit(r) : undefined}
          />
        )) : <p className="empty">Nenhum lançamento</p>}
      </div>
    </section>
  )
}
