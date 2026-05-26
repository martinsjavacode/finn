import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { showError, toast } from '../../lib/toast'
import { useModal } from '../../hooks/useModal'
import { confirm } from '../../lib/confirm'
import Button from '../ui/Button'
import Select from '../ui/Select'
import MobileCard from '../ui/MobileCard'

interface RoleOption { id: string; name: string }
interface User { id: string; email: string; display_name: string | null; role_id: string; activated: boolean; roles: { name: string } }

export default function AccessPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [showForm, setShowForm] = useState(false)
  const modalRef = useModal<HTMLFormElement>(() => setShowForm(false))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [roleId, setRoleId] = useState('')

  useEffect(() => {
    supabase.from('roles').select('id, name').order('name').then(({ data }) => setRoles((data ?? []) as RoleOption[]))
    supabase.from('users').select('*, roles(name)').order('created_at').then(({ data }) => setUsers((data ?? []) as User[]))
  }, [])

  const openNew = () => {
    setEditingId(null); setEmail(''); setDisplayName('')
    setRoleId(roles.find(r => r.name === 'viewer')?.id ?? roles[0]?.id ?? '')
    setShowForm(true)
  }

  const openEdit = (u: User) => {
    setEditingId(u.id); setEmail(u.email); setDisplayName(u.display_name ?? ''); setRoleId(u.role_id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      const { error } = await supabase.from('users').update({ display_name: displayName || null, role_id: roleId } as never).eq('id', editingId)
      if (error) return showError(error)
      const roleName = roles.find(r => r.id === roleId)?.name ?? ''
      setUsers(prev => prev.map(u => u.id === editingId ? { ...u, display_name: displayName || null, role_id: roleId, roles: { name: roleName } } : u))
      toast('Usuário atualizado')
    } else {
      const { data, error } = await supabase.from('users').insert({ email, display_name: displayName || null, role_id: roleId, activated: false } as never).select('*, roles(name)').single()
      if (error) return showError(error)
      if (data) setUsers(prev => [...prev, data as User])
      toast('Usuário adicionado')
    }
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    if (!await confirm('Tem certeza que deseja remover este usuário?')) return
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) return showError(error)
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  const getRoleName = (u: User) => u.roles?.name ?? ''
  const roleLabel = (name: string) => name === 'owner' ? 'Owner' : name === 'editor' ? 'Editor' : 'Viewer'

  return (
    <div>
      <div className="page-header">
        <h2>Usuários</h2>
        <Button onClick={openNew}>+ Novo</Button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)} role="dialog" aria-modal="true">
          <form className="modal" ref={modalRef} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>{editingId ? 'Editar Usuário' : 'Adicionar Usuário'}</h2>
            <label className="form-label">Nome
              <input type="text" placeholder="Ex: João" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </label>
            <label className="form-label">Email
              <input type="email" placeholder="usuario@email.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={!!editingId} />
            </label>
            <label className="form-label">Permissão</label>
            <Select value={roleId} onChange={setRoleId} options={roles.map(r => ({ value: r.id, label: roleLabel(r.name) }))} />
            <div className="form-actions">
              <Button variant="tab" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      )}

      <section>
        <table className="desktop-table">
          <thead><tr><th>Nome</th><th>Email</th><th>Permissão</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.display_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td>{u.email}</td>
                <td><span className={`badge ${getRoleName(u) !== 'viewer' ? 'badge-success' : 'badge-danger'}`}>{roleLabel(getRoleName(u))}</span></td>
                <td><span className={`badge ${u.activated ? 'badge-success' : 'badge-danger'}`}>{u.activated ? 'Ativo' : 'Pendente'}</span></td>
                <td>
                  <Button variant="icon" aria-label="Editar" onClick={() => openEdit(u)}><Pencil size={14} /></Button>
                  <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(u.id)}><Trash2 size={14} /></Button>
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={5} className="empty">Nenhum usuário cadastrado</td></tr>}
          </tbody>
        </table>

        <div className="mobile-cards">
          {users.length ? users.map(u => (
            <MobileCard
              key={u.id}
              status={<span className={`badge ${u.activated ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.6rem' }}>{u.activated ? '●' : '○'}</span>}
              title={u.display_name || u.email}
              value={<span className={`badge ${getRoleName(u) !== 'viewer' ? 'badge-success' : 'badge-danger'}`}>{roleLabel(getRoleName(u))}</span>}
              subtitle={u.display_name ? u.email : (u.activated ? 'Ativo' : 'Pendente')}
              onTap={() => openEdit(u)}
            />
          )) : <p className="empty">Nenhum usuário cadastrado</p>}
        </div>
      </section>
    </div>
  )
}
