import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import Button from '../ui/Button'
import Select from '../ui/Select'

interface Access { id: string; email: string; role: string; created_at: string }

export default function AccessPage() {
  const [users, setUsers] = useState<Access[]>([])
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const [editing, setEditing] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')

  useEffect(() => {
    supabase.from('access_control').select('*').order('created_at').then(({ data }) => setUsers((data ?? []) as Access[]))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.from('access_control').insert({ email, role } as never).select().single()
    if (error) return showError(error)
    if (data) setUsers(prev => [...prev, data as Access])
    setShowForm(false)
    setEmail('')
    toast('Acesso adicionado')
  }

  const startEdit = (u: Access) => { setEditing(u.id); setEditRole(u.role) }

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from('access_control').update({ role: editRole } as never).eq('id', id)
    if (error) return showError(error)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: editRole } : u))
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!await confirm('Tem certeza que deseja remover este acesso?')) return
    const { error } = await supabase.from('access_control').delete().eq('id', id)
    if (error) return showError(error)
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  return (
    <div>
      <div className="page-header">
        <h2>👥 Controle de Acesso</h2>
        <Button onClick={() => setShowForm(!showForm)}>+ Novo</Button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleAdd}>
            <h2>Adicionar Acesso</h2>
            <label className="form-label">Email
              <input type="email" placeholder="usuario@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
            <label className="form-label">Permissão</label>
            <Select value={role} onChange={setRole} options={[{ value: 'viewer', label: 'Viewer' }, { value: 'editor', label: 'Editor' }]} />
            <div className="form-actions">
              <Button variant="tab" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      )}

      <section>
        <table>
          <thead><tr><th>Email</th><th>Permissão</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>
                  {editing === u.id ? (
                    <Select value={editRole} onChange={setEditRole} options={[{ value: 'viewer', label: 'Viewer' }, { value: 'editor', label: 'Editor' }]} />
                  ) : (
                    <span className={`badge ${u.role === 'editor' ? 'badge-personal' : 'badge-sogra'}`}>{u.role === 'editor' ? 'Editor' : 'Viewer'}</span>
                  )}
                </td>
                <td>
                  {editing === u.id ? (
                    <Button onClick={() => saveEdit(u.id)}>✓</Button>
                  ) : (
                    <>
                      <Button variant="icon" onClick={() => startEdit(u)}>✏️</Button>
                      <Button variant="icon" className="delete-btn" onClick={() => handleDelete(u.id)}>🗑️</Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={3} className="empty">Nenhum acesso cadastrado</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  )
}
