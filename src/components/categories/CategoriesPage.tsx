import { Pencil, Trash2, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks'
import type { Category } from '../../types/database'
import { showError, toast } from '../../lib/toast'
import { useModal } from '../../hooks/useModal'
import { confirm } from '../../lib/confirm'
import Button from '../ui/Button'
import Select from '../ui/Select'
import MobileCard from '../ui/MobileCard'

export default function CategoriesPage() {
  const { can } = useAuth()
  const canCreate = can('categories', 'create')
  const canUpdate = can('categories', 'update')
  const canDelete = can('categories', 'delete')
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const modalRef = useModal<HTMLFormElement>(() => setShowForm(false))
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [parentId, setParentId] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  useEffect(() => {
    supabase.from('categories').select('*').order('label').then(({ data }) => setCategories((data ?? []) as Category[]))
  }, [])

  const parents = categories.filter(c => !c.parent_id)
  const getChildren = (id: string) => categories.filter(c => c.parent_id === id)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.from('categories').insert({
      name: name.toLowerCase().replace(/\s+/g, '_'),
      label,
      parent_id: parentId || null,
    } as never).select().single()
    if (error) return showError(error)
    if (data) setCategories(prev => [...prev, data as Category])
    setShowForm(false)
    setName(''); setLabel(''); setParentId('')
    toast('Categoria criada')
  }

  const startEdit = (c: Category) => { setEditing(c.id); setEditLabel(c.label) }

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from('categories').update({ label: editLabel } as never).eq('id', id)
    if (error) return showError(error)
    setCategories(prev => prev.map(c => c.id === id ? { ...c, label: editLabel } : c))
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    const children = getChildren(id)
    const msg = children.length
      ? `Excluir "${categories.find(c => c.id === id)?.label}" e suas ${children.length} subcategorias?`
      : 'Tem certeza que deseja excluir esta categoria?'
    if (!await confirm(msg)) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return showError(error)
    setCategories(prev => prev.filter(c => c.id !== id && c.parent_id !== id))
  }

  return (
    <div>
      <div className="page-header">
        <h2>Categorias</h2>
        {canCreate && <Button onClick={() => setShowForm(!showForm)}>+ Nova</Button>}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)} role="dialog" aria-modal="true">
          <form className="modal" ref={modalRef} onClick={e => e.stopPropagation()} onSubmit={handleAdd}>
            <h2>Nova Categoria</h2>
            <label className="form-label">Categoria pai (opcional)
              <Select value={parentId} onChange={setParentId} options={[{ value: '', label: 'Nenhuma (raiz)' }, ...parents.map(c => ({ value: c.id, label: c.label }))]} />
            </label>
            <label className="form-label">Nome (identificador)
              <input type="text" placeholder="ex: ead" value={name} onChange={e => setName(e.target.value)} required />
            </label>
            <label className="form-label">Label (exibição)
              <input type="text" placeholder="ex: EAD" value={label} onChange={e => setLabel(e.target.value)} required />
            </label>
            <div className="form-actions">
              <Button variant="tab" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      )}

      <section>
        <table className="desktop-table">
          <thead><tr><th>Categoria</th><th>Subcategorias</th>{(canUpdate || canDelete) && <th></th>}</tr></thead>
          <tbody>
            {parents.map(p => (
              <tr key={p.id}>
                <td>
                  {editing === p.id
                    ? <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} className="inline-input" style={{ width: '150px' }} />
                    : <strong>{p.label}</strong>
                  }
                </td>
                <td>{getChildren(p.id).map(c => c.label).join(', ') || '—'}</td>
                {(canUpdate || canDelete) && (
                  <td>
                    {editing === p.id ? (
                      <Button onClick={() => saveEdit(p.id)}><Check size={14} /></Button>
                    ) : (
                      <>
                        {canUpdate && <Button variant="icon" aria-label="Editar" onClick={() => startEdit(p)}><Pencil size={14} /></Button>}
                        {canDelete && <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></Button>}
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {categories.filter(c => c.parent_id && !parents.find(p => getChildren(p.id).includes(c))).length === 0 && !parents.length && (
              <tr><td colSpan={(canUpdate || canDelete) ? 3 : 2} className="empty">Nenhuma categoria</td></tr>
            )}
          </tbody>
        </table>

        <div className="mobile-cards">
          {parents.length ? parents.map(p => (
            <MobileCard
              key={p.id}
              title={p.label}
              value=""
              subtitle={getChildren(p.id).map(c => c.label).join(', ') || 'Sem subcategorias'}
              onTap={canUpdate ? () => startEdit(p) : undefined}
            />
          )) : <p className="empty">Nenhuma categoria</p>}
        </div>
      </section>
    </div>
  )
}
