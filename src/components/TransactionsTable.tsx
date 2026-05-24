import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Transaction, Category, Owner, TransactionType } from '../types/database'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const ownerBadge = (o: Owner) => o === 'personal' ? 'Pessoal' : 'Sogra'

interface Props {
  transactions: Transaction[]
  categories: Category[]
  onUpdate: (id: string, data: Partial<Transaction>) => void
  onDelete: (id: string) => void
}

export default function TransactionsTable({ transactions, categories, onUpdate, onDelete }: Props) {
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [catFilter, setCatFilter] = useState('all')
  const [editing, setEditing] = useState<string | null>(null)

  const catLabel = (id: string) => categories.find(c => c.id === id)?.label ?? id
  const getCatLabel = (t: Transaction) => t.categories?.label ?? ''

  const filtered = transactions.filter(r =>
    (typeFilter === 'all' || r.type === typeFilter) &&
    (catFilter === 'all' || r.category === catFilter)
  )

  const usedCats = ['all', ...new Set(transactions.map(r => r.category))]

  const togglePaid = (id: string, paid: boolean) => {
    supabase.from('transactions').update({ paid: !paid } as never).eq('id', id)
    onUpdate(id, { paid: !paid })
  }

  const handleDelete = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    onDelete(id)
    setEditing(null)
  }

  return (
    <section>
      <h2>Lançamentos</h2>
      <div className="tabs">
        {(['all', 'income', 'expense'] as const).map(t => (
          <button key={t} className={`tab ${t === typeFilter ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
            {t === 'all' ? 'Todos' : t === 'income' ? '📈 Receitas' : '📉 Despesas'}
          </button>
        ))}
      </div>
      <div className="tabs">
        {usedCats.map(c => (
          <button key={c} className={`tab ${c === catFilter ? 'active' : ''}`} onClick={() => setCatFilter(c)}>
            {c === 'all' ? 'Todas categorias' : catLabel(c)}
          </button>
        ))}
      </div>
      <table>
        <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Parcela</th><th>Valor</th><th>Resp.</th><th>Pago</th><th></th></tr></thead>
        <tbody>
          {filtered.length ? filtered.map(r => (
            <tr key={r.id} className={r.paid ? 'row-paid' : ''}>
              <td>{new Date(r.month + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
              <td>{r.description}</td>
              <td>{getCatLabel(r)}</td>
              <td>{r.type === 'income' ? '📈 Receita' : '📉 Despesa'}</td>
              <td>{r.current_installment && r.total_installments ? `${r.current_installment}/${r.total_installments}` : '-'}</td>
              <td>{fmt(+r.amount)}</td>
              <td><span className={`badge ${r.owner === 'personal' ? 'badge-personal' : 'badge-sogra'}`}>{ownerBadge(r.owner)}</span></td>
              <td><button className={`paid-btn ${r.paid ? 'paid' : ''}`} onClick={() => togglePaid(r.id, r.paid)}>{r.paid ? '✓' : '○'}</button></td>
              <td>
                {editing === r.id ? (
                  <button className="delete-btn" onClick={() => handleDelete(r.id)}>🗑️</button>
                ) : (
                  <button className="edit-btn" onClick={() => setEditing(r.id)}>⋯</button>
                )}
              </td>
            </tr>
          )) : <tr><td colSpan={9} className="empty">Nenhum lançamento</td></tr>}
        </tbody>
      </table>
    </section>
  )
}
