import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth, useAppData } from '../../hooks'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import { fmt } from '../../utils/format'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import MobileCard from '../ui/MobileCard'
import { TableSkeleton } from '../ui/Skeleton'

interface Budget { id: string; category: string; monthly_limit: number }

export default function BudgetsPage() {
  const { can } = useAuth()
  const { categories } = useAppData(true)
  const queryClient = useQueryClient()
  const canCreate = can('budgets', 'create')
  const canUpdate = can('budgets', 'update')
  const canDelete = can('budgets', 'delete')
  const [editing, setEditing] = useState<string | null>(null)
  const [editLimit, setEditLimit] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [newLimit, setNewLimit] = useState('')

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ['budgets-page'],
    queryFn: async () => (await supabase.from('budgets').select('*')).data as Budget[] ?? [],
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['budgets-page'] })

  const addMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from('budgets').insert({ category: newCat, monthly_limit: +newLimit } as never); if (error) throw error },
    onSuccess: () => { invalidate(); setShowForm(false); setNewLimit(''); toast('Orçamento criado') },
    onError: (e) => showError(e),
  })

  const updateMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('budgets').update({ monthly_limit: +editLimit } as never).eq('id', id); if (error) throw error },
    onSuccess: () => { invalidate(); setEditing(null); toast('Orçamento atualizado') },
    onError: (e) => showError(e),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('budgets').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { invalidate(); toast('Orçamento excluído') },
    onError: (e) => showError(e),
  })

  const handleDelete = async (id: string) => {
    if (await confirm('Tem certeza que deseja excluir este orçamento?')) deleteMutation.mutate(id)
  }

  const catLabel = (id: string) => categories.find(c => c.id === id)?.label ?? id
  const usedCats = budgets.map(b => b.category)
  const availableCats = categories.filter(c => !usedCats.includes(c.id))

  if (isLoading) return <div><div className="page-header"><h2>Orçamentos</h2></div><TableSkeleton rows={4} cols={3} /></div>

  return (
    <div>
      <div className="page-header">
        <h2>Orçamentos</h2>
        {canCreate && <Button onClick={() => { setShowForm(true); if (!newCat && availableCats.length) setNewCat(availableCats[0].id) }}>+ Novo</Button>}
      </div>

      {showForm && (
        <Modal title="Novo Orçamento" onClose={() => setShowForm(false)} onSubmit={e => { e.preventDefault(); addMutation.mutate() }} submitDisabled={!availableCats.length}>
          <label className="form-label">Categoria
            <Select value={newCat} onChange={setNewCat} options={availableCats.map(c => ({ value: c.id, label: c.label }))} />
          </label>
          <label className="form-label">Limite mensal (R$)
            <input type="number" step="0.01" placeholder="0.00" value={newLimit} onChange={e => setNewLimit(e.target.value)} required />
          </label>
        </Modal>
      )}

      {editing && (
        <Modal title="Editar Orçamento" onClose={() => setEditing(null)} onSubmit={e => { e.preventDefault(); updateMutation.mutate(editing) }}>
          <label className="form-label">Limite mensal (R$)
            <input type="number" step="0.01" value={editLimit} onChange={e => setEditLimit(e.target.value)} autoFocus />
          </label>
        </Modal>
      )}

      <section>
        <table className="desktop-table">
          <thead><tr><th>Categoria</th><th>Limite Mensal</th>{(canUpdate || canDelete) && <th></th>}</tr></thead>
          <tbody>
            {budgets.map(b => (
              <tr key={b.id}>
                <td>{catLabel(b.category)}</td>
                <td>{fmt(b.monthly_limit)}</td>
                {(canUpdate || canDelete) && (
                  <td>
                    {canUpdate && <Button variant="icon" aria-label="Editar" onClick={() => { setEditing(b.id); setEditLimit(String(b.monthly_limit)) }}><Pencil size={14} /></Button>}
                    {canDelete && <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(b.id)}><Trash2 size={14} /></Button>}
                  </td>
                )}
              </tr>
            ))}
            {!budgets.length && <tr><td colSpan={(canUpdate || canDelete) ? 3 : 2} className="empty">Nenhum orçamento cadastrado</td></tr>}
          </tbody>
        </table>
        <div className="mobile-cards">
          {budgets.length ? budgets.map(b => (
            <MobileCard key={b.id} title={catLabel(b.category)} value={fmt(b.monthly_limit)} subtitle="Limite mensal" onTap={canUpdate ? () => { setEditing(b.id); setEditLimit(String(b.monthly_limit)) } : undefined} />
          )) : <p className="empty">Nenhum orçamento cadastrado</p>}
        </div>
      </section>
    </div>
  )
}
