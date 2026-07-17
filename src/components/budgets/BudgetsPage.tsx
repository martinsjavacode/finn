import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth, useAppData, useMigration } from '../../hooks'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import { fmt } from '../../utils/format'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { CardGrid, CardItem, Chip } from '../ui/CardGrid'
import { TableSkeleton } from '../ui/Skeleton'
import MigrateModal from '../ui/MigrateModal'

interface Budget { id: string; category: string; monthly_limit: number }

export default function BudgetsPage() {
  const { can, activeAccountId, isSuperadmin, accounts } = useAuth()
  const { categories } = useAppData(true)
  const queryClient = useQueryClient()
  const { migrateBudgets } = useMigration()
  const canCreate = can('budgets', 'create')
  const canUpdate = can('budgets', 'update')
  const canDelete = can('budgets', 'delete')
  const [editing, setEditing] = useState<string | null>(null)
  const [editLimit, setEditLimit] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [newLimit, setNewLimit] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showMigrate, setShowMigrate] = useState(false)

  const toggleSelect = (id: string) => setSelected(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s })

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ['budgets-page', activeAccountId],
    queryFn: async () => {
      const { data } = await supabase.from('budgets').select('*').eq('account_id', activeAccountId!)
      return data as Budget[] ?? []
    },
    enabled: !!activeAccountId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['budgets-page', activeAccountId] })

  const addMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from('budgets').insert({ category: newCat, monthly_limit: +newLimit, account_id: activeAccountId! }); if (error) throw error },
    onSuccess: () => { invalidate(); setShowForm(false); setNewLimit(''); toast('Orçamento criado') },
    onError: (e) => showError(e),
  })

  const updateMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('budgets').update({ monthly_limit: +editLimit }).eq('id', id).eq('account_id', activeAccountId!); if (error) throw error },
    onSuccess: () => { invalidate(); setEditing(null); toast('Orçamento atualizado') },
    onError: (e) => showError(e),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('budgets').delete().eq('id', id).eq('account_id', activeAccountId!); if (error) throw error },
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
        <h2>Orçamentos <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>({budgets.length})</span></h2>
        {isSuperadmin && selected.size > 0 && <Button onClick={() => setShowMigrate(true)}>Migrar ({selected.size})</Button>}
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

      <CardGrid>
        {budgets.map(b => (
          <CardItem
            key={b.id}
            title={catLabel(b.category)}
            actions={<>
              {isSuperadmin && <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)} aria-label={`Selecionar ${catLabel(b.category)}`} />}
              {canUpdate && <Button variant="icon" aria-label="Editar" onClick={() => { setEditing(b.id); setEditLimit(String(b.monthly_limit)) }}><Pencil size={14} /></Button>}
              {canDelete && <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(b.id)}><Trash2 size={14} /></Button>}
            </>}
          >
            <Chip className="cat-chip-highlight">{fmt(b.monthly_limit)}/mês</Chip>
          </CardItem>
        ))}
        {!budgets.length && <div className="empty-state"><p>Nenhum orçamento cadastrado</p>{canCreate && <Button onClick={() => { setShowForm(true); if (!newCat && availableCats.length) setNewCat(availableCats[0].id) }}>Cadastrar primeiro orçamento</Button>}</div>}
      </CardGrid>

      {showMigrate && activeAccountId && (
        <MigrateModal
          accounts={accounts}
          currentAccountId={activeAccountId}
          count={selected.size}
          label="orçamento"
          onClose={() => setShowMigrate(false)}
          onConfirm={targetId => { migrateBudgets.mutate({ ids: [...selected], targetAccountId: targetId }); setSelected(new Set()); setShowMigrate(false) }}
        />
      )}
    </div>
  )
}
