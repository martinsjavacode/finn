import { Pencil, Trash2, Plus } from 'lucide-react'
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
import { CardGrid, CardItem, Chip } from '../ui/CardGrid'
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

  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ['categories-page'] }); queryClient.invalidateQueries({ queryKey: ['categories'] }) }

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('categories').insert({ name: name.toLowerCase().replace(/\s+/g, '_'), label, parent_id: parentId || null })
      if (error) throw error
    },
    onSuccess: () => { invalidate(); setShowForm(false); setName(''); setLabel(''); setParentId(''); toast('Categoria criada') },
    onError: (e) => showError(e),
  })

  const updateMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('categories').update({ label: editLabel }).eq('id', id); if (error) throw error },
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

  const openAdd = (preselectedParent = '') => {
    setName(''); setLabel(''); setParentId(preselectedParent); setShowForm(true)
  }

  const parents = categories.filter(c => !c.parent_id)
  const getChildren = (id: string) => categories.filter(c => c.parent_id === id)

  if (isLoading) return <div><div className="page-header"><h2>Categorias</h2></div><TableSkeleton rows={5} cols={3} /></div>

  return (
    <div>
      <div className="page-header">
        <h2>Categorias <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>({categories.length})</span></h2>
        {canCreate && <Button onClick={() => openAdd()}>+ Nova</Button>}
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
            <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} autoFocus required />
          </label>
        </Modal>
      )}

      <CardGrid>
        {parents.map(p => {
          const children = getChildren(p.id)
          return (
            <CardItem
              key={p.id}
              title={p.label}
              actions={<>
                {canUpdate && <Button variant="icon" aria-label="Editar categoria" onClick={() => { setEditing(p); setEditLabel(p.label) }}><Pencil size={14} /></Button>}
                {canDelete && <Button variant="icon" className="delete-btn" aria-label="Excluir categoria" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></Button>}
              </>}
            >
              {canCreate && (
                <Chip className="cat-chip-add" onClick={() => openAdd(p.id)} ariaLabel={`Adicionar subcategoria em ${p.label}`}>
                  <Plus size={12} /> Adicionar
                </Chip>
              )}
              {!children.length && <span className="cat-empty-hint">Sem subcategorias</span>}
              {children.map(c => (
                <Chip key={c.id}>
                  <span>{c.label}</span>
                  <div className="cat-chip-actions">
                    {canUpdate && <button className="cat-chip-btn" aria-label={`Editar ${c.label}`} onClick={() => { setEditing(c); setEditLabel(c.label) }}><Pencil size={12} /></button>}
                    {canDelete && <button className="cat-chip-btn cat-chip-btn-del" aria-label={`Excluir ${c.label}`} onClick={() => handleDelete(c.id)}><Trash2 size={12} /></button>}
                  </div>
                </Chip>
              ))}
            </CardItem>
          )
        })}
        {!parents.length && <div className="empty-state"><p>Nenhuma categoria cadastrada</p>{canCreate && <Button onClick={() => openAdd()}>Cadastrar primeira categoria</Button>}</div>}
      </CardGrid>
    </div>
  )
}
