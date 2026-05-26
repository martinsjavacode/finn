import { Pencil, Trash2, Check, Circle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { showError, toast } from '../../lib/toast'
import { useModal } from '../../hooks/useModal'
import { confirm } from '../../lib/confirm'
import Button from '../ui/Button'
import MobileCard from '../ui/MobileCard'

interface Role { id: string; name: string; description: string | null }
interface Permission { id: string; resource: string; action: string }
interface RolePermission { role_id: string; permission_id: string }

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([])
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const modalRef = useModal<HTMLFormElement>(() => setShowForm(false))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    supabase.from('roles').select('*').order('name').then(({ data }) => {
      const r = (data ?? []) as Role[]
      setRoles(r)
      if (r.length) setSelectedRole(r[0].id)
    })
    supabase.from('permissions').select('*').order('resource').order('action').then(({ data }) => setPermissions((data ?? []) as Permission[]))
    supabase.from('role_permissions').select('*').then(({ data }) => setRolePermissions((data ?? []) as RolePermission[]))
  }, [])

  const openNew = () => { setEditingId(null); setName(''); setDescription(''); setShowForm(true) }
  const openEdit = (r: Role) => { setEditingId(r.id); setName(r.name); setDescription(r.description ?? ''); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      const { error } = await supabase.from('roles').update({ name, description: description || null } as never).eq('id', editingId)
      if (error) return showError(error)
      setRoles(prev => prev.map(r => r.id === editingId ? { ...r, name, description: description || null } : r))
      toast('Role atualizada')
    } else {
      const { data, error } = await supabase.from('roles').insert({ name, description: description || null } as never).select().single()
      if (error) return showError(error)
      if (data) setRoles(prev => [...prev, data as Role])
      toast('Role criada')
    }
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    if (!await confirm('Excluir esta role? Usuários vinculados perderão acesso.')) return
    const { error } = await supabase.from('roles').delete().eq('id', id)
    if (error) return showError(error)
    setRoles(prev => prev.filter(r => r.id !== id))
    setRolePermissions(prev => prev.filter(rp => rp.role_id !== id))
    if (selectedRole === id) setSelectedRole(null)
  }

  const togglePermission = async (roleId: string, permId: string) => {
    const exists = rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permId)
    if (exists) {
      const { error } = await supabase.from('role_permissions').delete().eq('role_id', roleId).eq('permission_id', permId)
      if (error) return showError(error)
      setRolePermissions(prev => prev.filter(rp => !(rp.role_id === roleId && rp.permission_id === permId)))
    } else {
      const { error } = await supabase.from('role_permissions').insert({ role_id: roleId, permission_id: permId } as never)
      if (error) return showError(error)
      setRolePermissions(prev => [...prev, { role_id: roleId, permission_id: permId }])
    }
  }

  const resources = [...new Set(permissions.map(p => p.resource))].sort()
  const actions = ['read', 'create', 'update', 'delete']
  const hasPerm = (roleId: string, permId: string) => rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permId)
  const getPermId = (resource: string, action: string) => permissions.find(p => p.resource === resource && p.action === action)?.id

  return (
    <div>
      <div className="page-header">
        <h2>Roles e Permissões</h2>
        <Button onClick={openNew}>+ Nova Role</Button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)} role="dialog" aria-modal="true">
          <form className="modal" ref={modalRef} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>{editingId ? 'Editar Role' : 'Nova Role'}</h2>
            <label className="form-label">Nome
              <input type="text" placeholder="ex: manager" value={name} onChange={e => setName(e.target.value)} required />
            </label>
            <label className="form-label">Descrição
              <input type="text" placeholder="ex: Gerente financeiro" value={description} onChange={e => setDescription(e.target.value)} />
            </label>
            <div className="form-actions">
              <Button variant="tab" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de roles */}
      <section>
        <h2>Roles</h2>
        <table className="desktop-table">
          <thead><tr><th>Nome</th><th>Descrição</th><th></th></tr></thead>
          <tbody>
            {roles.map(r => (
              <tr key={r.id} style={{ background: selectedRole === r.id ? 'rgba(167,139,250,0.08)' : undefined }}>
                <td><button className="auth-btn-link" style={{ fontWeight: 600, fontSize: '0.85rem' }} onClick={() => setSelectedRole(selectedRole === r.id ? null : r.id)}>{r.name}</button></td>
                <td style={{ color: 'var(--text-muted)' }}>{r.description || '—'}</td>
                <td>
                  <Button variant="icon" aria-label="Editar" onClick={() => openEdit(r)}><Pencil size={14} /></Button>
                  <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(r.id)}><Trash2 size={14} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mobile-cards">
          {roles.map(r => (
            <MobileCard
              key={r.id}
              title={r.name}
              value=""
              subtitle={r.description || 'Sem descrição'}
              onTap={() => setSelectedRole(selectedRole === r.id ? null : r.id)}
            />
          ))}
        </div>
      </section>

      {/* Matriz de permissões */}
      <section>
        <h2>Permissões por Role</h2>
        <div className="tabs" style={{ marginBottom: '1rem' }}>
          {roles.map(r => (
            <Button key={r.id} variant="tab" active={selectedRole === r.id} onClick={() => setSelectedRole(r.id)}>
              {r.name}
            </Button>
          ))}
        </div>
        {selectedRole && (
          <table>
            <thead><tr><th>Recurso</th>{actions.map(a => <th key={a}>{a}</th>)}</tr></thead>
            <tbody>
              {resources.map(res => (
                <tr key={res}>
                  <td style={{ fontWeight: 500 }}>{res}</td>
                  {actions.map(act => {
                    const permId = getPermId(res, act)
                    if (!permId) return <td key={act}>—</td>
                    const active = hasPerm(selectedRole, permId)
                    return (
                      <td key={act}>
                        <button className={`paid-btn ${active ? 'paid' : ''}`} aria-label={active ? 'Remover permissão' : 'Adicionar permissão'} onClick={() => togglePermission(selectedRole, permId)}>
                          {active ? <Check size={14} /> : <Circle size={14} />}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!selectedRole && <p className="empty">Selecione uma role acima</p>}
      </section>
    </div>
  )
}
