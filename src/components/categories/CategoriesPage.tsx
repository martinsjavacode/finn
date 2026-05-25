import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../types/database'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import Button from '../ui/Button'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  useEffect(() => {
    supabase.from('categories').select('*').order('label').then(({ data }) => setCategories((data ?? []) as Category[]))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.from('categories').insert({ name: name.toLowerCase().replace(/\s+/g, '_'), label } as never).select().single()
    if (error) return showError(error)
    if (data) setCategories(prev => [...prev, data as Category])
    setShowForm(false)
    setName(''); setLabel('')
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
    if (!await confirm('Tem certeza que deseja excluir esta categoria?')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return showError(error)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div>
      <div className="page-header">
        <h2>🏷️ Categorias</h2>
        <Button onClick={() => setShowForm(!showForm)}>+ Nova</Button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleAdd}>
            <h2>Nova Categoria</h2>
            <label className="form-label">Nome (identificador)
              <input type="text" placeholder="ex: transport" value={name} onChange={e => setName(e.target.value)} required />
            </label>
            <label className="form-label">Label (exibição)
              <input type="text" placeholder="ex: Transporte" value={label} onChange={e => setLabel(e.target.value)} required />
            </label>
            <div className="form-actions">
              <Button variant="tab" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      )}

      <section>
        <table>
          <thead><tr><th>Nome</th><th>Label</th><th></th></tr></thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>
                  {editing === c.id
                    ? <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} className="inline-input" style={{ width: '150px' }} />
                    : c.label
                  }
                </td>
                <td>
                  {editing === c.id ? (
                    <Button onClick={() => saveEdit(c.id)}>✓</Button>
                  ) : (
                    <>
                      <Button variant="icon" onClick={() => startEdit(c)}>✏️</Button>
                      <Button variant="icon" className="delete-btn" onClick={() => handleDelete(c.id)}>🗑️</Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!categories.length && <tr><td colSpan={3} className="empty">Nenhuma categoria</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  )
}
