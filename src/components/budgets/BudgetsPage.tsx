import { Pencil, Trash2, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../types/database'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import { fmt } from '../../utils/format'
import Select from '../ui/Select'
import Button from '../ui/Button'
import MobileCard from '../ui/MobileCard'

interface Budget { id: string; category: string; monthly_limit: number }

interface Props { categories: Category[] }

export default function BudgetsPage({ categories }: Props) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editLimit, setEditLimit] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [newLimit, setNewLimit] = useState('')

  useEffect(() => {
    supabase.from('budgets').select('*').then(({ data }) => setBudgets((data ?? []) as Budget[]))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.from('budgets').insert({ category: newCat, monthly_limit: +newLimit } as never).select().single()
    if (error) return showError(error)
    if (data) setBudgets(prev => [...prev, data as Budget])
    setShowForm(false)
    setNewLimit('')
    toast('Orçamento criado')
  }

  const startEdit = (b: Budget) => { setEditing(b.id); setEditLimit(String(b.monthly_limit)) }

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from('budgets').update({ monthly_limit: +editLimit } as never).eq('id', id)
    if (error) return showError(error)
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, monthly_limit: +editLimit } : b))
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!await confirm('Tem certeza que deseja excluir este orçamento?')) return
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) return showError(error)
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  const catLabel = (id: string) => categories.find(c => c.id === id)?.label ?? id
  const usedCats = budgets.map(b => b.category)
  const availableCats = categories.filter(c => !usedCats.includes(c.id))

  return (
    <div>
      <div className="page-header">
        <h2>Orçamentos</h2>
        <Button onClick={() => { setShowForm(!showForm); if (!newCat && availableCats.length) setNewCat(availableCats[0].id) }}>+ Novo</Button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleAdd}>
            <h2>Novo Orçamento</h2>
            <label className="form-label">Categoria
              <Select value={newCat} onChange={setNewCat} options={availableCats.map(c => ({ value: c.id, label: c.label }))} />
            </label>
            <label className="form-label">Limite mensal (R$)
              <input type="number" step="0.01" placeholder="0.00" value={newLimit} onChange={e => setNewLimit(e.target.value)} required />
            </label>
            <div className="form-actions">
              <Button variant="tab" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={!availableCats.length}>Salvar</Button>
            </div>
          </form>
        </div>
      )}

      <section>
        <table className="desktop-table">
          <thead><tr><th>Categoria</th><th>Limite Mensal</th><th></th></tr></thead>
          <tbody>
            {budgets.map(b => (
              <tr key={b.id}>
                <td>{catLabel(b.category)}</td>
                <td>
                  {editing === b.id
                    ? <input type="number" step="0.01" value={editLimit} onChange={e => setEditLimit(e.target.value)} className="inline-input" style={{ width: '120px' }} />
                    : fmt(b.monthly_limit)
                  }
                </td>
                <td>
                  {editing === b.id ? (
                    <Button onClick={() => saveEdit(b.id)}><Check size={14} /></Button>
                  ) : (
                    <>
                      <Button variant="icon" onClick={() => startEdit(b)}><Pencil size={14} /></Button>
                      <Button variant="icon" className="delete-btn" onClick={() => handleDelete(b.id)}><Trash2 size={14} /></Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!budgets.length && <tr><td colSpan={3} className="empty">Nenhum orçamento cadastrado</td></tr>}
          </tbody>
        </table>

        <div className="mobile-cards">
          {budgets.length ? budgets.map(b => (
            <MobileCard
              key={b.id}
              title={catLabel(b.category)}
              value={fmt(b.monthly_limit)}
              subtitle="Limite mensal"
              onTap={() => startEdit(b)}
            />
          )) : <p className="empty">Nenhum orçamento cadastrado</p>}
        </div>
      </section>
    </div>
  )
}
