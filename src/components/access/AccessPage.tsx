import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import Button from '../ui/Button'
import Select from '../ui/Select'
import MobileCard from '../ui/MobileCard'

interface Access { id: string; email: string; display_name: string | null; role: string; created_at: string }

export default function AccessPage() {
  const [users, setUsers] = useState<Access[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('viewer')

  useEffect(() => {
    supabase.from('access_control').select('*').order('created_at').then(({ data }) => setUsers((data ?? []) as Access[]))
  }, [])

  const openNew = () => { setEditingId(null); setEmail(''); setDisplayName(''); setRole('viewer'); setShowForm(true) }

  const openEdit = (u: Access) => { setEditingId(u.id); setEmail(u.email); setDisplayName(u.display_name ?? ''); setRole(u.role); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      const { error } = await supabase.from('access_control').update({ display_name: displayName || null, role } as never).eq('id', editingId)
      if (error) return showError(error)
      setUsers(prev => prev.map(u => u.id === editingId ? { ...u, display_name: displayName || null, role } : u))
      toast('Acesso atualizado')
    } else {
      const { data, error } = await supabase.from('access_control').insert({ email, display_name: displayName || null, role } as never).select().single()
      if (error) return showError(error)
      if (data) setUsers(prev => [...prev, data as Access])
      toast('Acesso adicionado')
    }
    setShowForm(false)
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
        <Button onClick={openNew}>+ Novo</Button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>{editingId ? 'Editar Acesso' : 'Adicionar Acesso'}</h2>
            <label className="form-label">Nome
              <input type="text" placeholder="Ex: João" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </label>
            <label className="form-label">Email
              <input type="email" placeholder="usuario@email.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={!!editingId} />
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
        <table className="desktop-table">
          <thead><tr><th>Nome</th><th>Email</th><th>Permissão</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.display_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.role === 'editor' ? 'badge-personal' : 'badge-sogra'}`}>{u.role === 'editor' ? 'Editor' : 'Viewer'}</span></td>
                <td>
                  <Button variant="icon" onClick={() => openEdit(u)}>✏️</Button>
                  <Button variant="icon" className="delete-btn" onClick={() => handleDelete(u.id)}>🗑️</Button>
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={4} className="empty">Nenhum acesso cadastrado</td></tr>}
          </tbody>
        </table>

        <div className="mobile-cards">
          {users.length ? users.map(u => (
            <MobileCard
              key={u.id}
              title={u.display_name || u.email}
              value={<span className={`badge ${u.role === 'editor' ? 'badge-personal' : 'badge-sogra'}`}>{u.role === 'editor' ? 'Editor' : 'Viewer'}</span>}
              subtitle={u.display_name ? u.email : ''}
              onTap={() => openEdit(u)}
            />
          )) : <p className="empty">Nenhum acesso cadastrado</p>}
        </div>
      </section>
    </div>
  )
}
