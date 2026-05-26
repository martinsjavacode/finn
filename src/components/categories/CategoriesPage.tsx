import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks'
import type { Category } from '../../types/database'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Modal from '../ui/Modal'
import MobileCard from '../ui/MobileCard'
import { TableSkeleton } from '../ui/Skeleton'

export default function CategoriesPage() {
  const { can } = useAuth()
  const queryClient = useQueryClient()
  const canCreate = can('categories', 'create')
  const canUpdate = can('categories', 'update')
  const canDelete = can('categories', 'delete')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [parentId, setParentId] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories-page'],
    queryFn: async () => (await supabase.from('categories').select('*').order('label')).data as Category[] ?? [],
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories-page'] })

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('categories').insert({ name: name.toLowerCase().replace(/\s+/g, '_'), label, parent_id: parentId || null } as never)
      if (error) throw error
    },
    onSuccess: () => { invalidate(); setShowForm(false); setName(''); setLabel(''); setParentId(''); toast('Categoria criada') },
    onError: (e) => showError(e),
  })

  const updateMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('categories').update({ label: editLabel } as never).eq('id', id); if (error) throw error },
    onSuccess: () => { invalidate(); setEditing(null); toast('Categoria atualizada') },
    onError: (e) => showError(e),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('categories').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { invalidate(); toast('Categoria excluída') },
    onError: (e) => showError(e),
  })

  const handleDelete = async (id: string) => {
    const children = categories.filter(c => c.parent_id === id)
    const msg = children.length ? `Excluir "${categories.find(c => c.id === id)?.label}" e suas ${children.length} subcategorias?` : 'Tem certeza que deseja excluir esta categoria?'
    if (await confirm(msg)) deleteMutation.mutate(id)
  }

  const parents = categories.filter(c => !c.parent_id)
  const getChildren = (id: string) => categories.filter(c => c.parent_id === id)

  if (isLoading) return <div><div className="page-header"><h2>Categorias</h2></div><TableSkeleton rows={5} cols={3} /></div>

  return (
    <div>
      <div className="page-header">
        <h2>Categorias</h2>
        {canCreate && <Button onClick={() => setShowForm(true)}>+ Nova</Button>}
      </div>

      {showForm && (
        <Modal title="Nova Categoria" onClose={() => setShowForm(false)} onSubmit={e => { e.preventDefault(); addMutation.mutate() }}>
          <label className="form-label">Categoria pai (opcional)
            <Select value={parentId} onChange={setParentId} options={[{ value: '', label: 'Nenhuma (raiz)' }, ...parents.map(c => ({ value: c.id, label: c.label }))]} />
          </label>
          <label className="form-label">Nome (identificador)
            <input type="text" placeholder="ex: ead" value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label className="form-label">Label (exibição)
            <input type="text" placeholder="ex: EAD" value={label} onChange={e => setLabel(e.target.value)} required />
          </label>
        </Modal>
      )}

      {editing && (
        <Modal title="Editar Categoria" onClose={() => setEditing(null)} onSubmit={e => { e.preventDefault(); updateMutation.mutate(editing.id) }}>
          <label className="form-label">Label
            <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} autoFocus />
          </label>
        </Modal>
      )}

      <section>
        <table className="desktop-table">
          <thead><tr><th>Categoria</th><th>Subcategorias</th>{(canUpdate || canDelete) && <th></th>}</tr></thead>
          <tbody>
            {parents.map(p => (
              <tr key={p.id}>
                <td><strong>{p.label}</strong></td>
                <td>{getChildren(p.id).map(c => c.label).join(', ') || '—'}</td>
                {(canUpdate || canDelete) && (
                  <td>
                    {canUpdate && <Button variant="icon" aria-label="Editar" onClick={() => { setEditing(p); setEditLabel(p.label) }}><Pencil size={14} /></Button>}
                    {canDelete && <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></Button>}
                  </td>
                )}
              </tr>
            ))}
            {!parents.length && <tr><td colSpan={(canUpdate || canDelete) ? 3 : 2} className="empty">Nenhuma categoria</td></tr>}
          </tbody>
        </table>
        <div className="mobile-cards">
          {parents.length ? parents.map(p => (
            <MobileCard key={p.id} title={p.label} value="" subtitle={getChildren(p.id).map(c => c.label).join(', ') || 'Sem subcategorias'} onTap={canUpdate ? () => { setEditing(p); setEditLabel(p.label) } : undefined} />
          )) : <p className="empty">Nenhuma categoria</p>}
        </div>
      </section>
    </div>
  )
}
