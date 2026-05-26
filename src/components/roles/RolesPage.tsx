import { Pencil, Trash2, Check, Circle } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import MobileCard from '../ui/MobileCard'
import { TableSkeleton } from '../ui/Skeleton'

interface Role { id: string; name: string; description: string | null }
interface Permission { id: string; resource: string; action: string }
interface RolePermission { role_id: string; permission_id: string }

export default function RolesPage() {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ['roles-page'],
    queryFn: async () => { const { data } = await supabase.from('roles').select('*').order('name'); const roles = (data ?? []) as Role[]; if (roles.length && !selectedRole) setSelectedRole(roles[0].id); return roles },
  })

  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => (await supabase.from('permissions').select('*').order('resource').order('action')).data as Permission[] ?? [],
  })

  const { data: rolePermissions = [] } = useQuery<RolePermission[]>({
    queryKey: ['role-permissions'],
    queryFn: async () => (await supabase.from('role_permissions').select('*')).data as RolePermission[] ?? [],
  })

  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ['roles-page'] }); queryClient.invalidateQueries({ queryKey: ['role-permissions'] }) }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) { const { error } = await supabase.from('roles').update({ name, description: description || null }).eq('id', editingId); if (error) throw error }
      else { const { error } = await supabase.from('roles').insert({ name, description: description || null }); if (error) throw error }
    },
    onSuccess: () => { invalidate(); setShowForm(false); toast(editingId ? 'Role atualizada' : 'Role criada') },
    onError: (e) => showError(e),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('roles').delete().eq('id', id); if (error) throw error },
    onSuccess: (_, id) => { invalidate(); if (selectedRole === id) setSelectedRole(null); toast('Role excluída') },
    onError: (e) => showError(e),
  })

  const togglePermMutation = useMutation({
    mutationFn: async ({ roleId, permId, exists }: { roleId: string; permId: string; exists: boolean }) => {
      if (exists) { const { error } = await supabase.from('role_permissions').delete().eq('role_id', roleId).eq('permission_id', permId); if (error) throw error }
      else { const { error } = await supabase.from('role_permissions').insert({ role_id: roleId, permission_id: permId }); if (error) throw error }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['role-permissions'] }),
    onError: (e) => showError(e),
  })

  const openNew = () => { setEditingId(null); setName(''); setDescription(''); setShowForm(true) }
  const openEdit = (r: Role) => { setEditingId(r.id); setName(r.name); setDescription(r.description ?? ''); setShowForm(true) }
  const handleDelete = async (id: string) => { if (await confirm('Excluir esta role? Usuários vinculados perderão acesso.')) deleteMutation.mutate(id) }

  const resources = [...new Set(permissions.map(p => p.resource))].sort()
  const actions = ['read', 'create', 'update', 'delete']
  const hasPerm = (roleId: string, permId: string) => rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permId)
  const getPermId = (resource: string, action: string) => permissions.find(p => p.resource === resource && p.action === action)?.id

  if (isLoading) return <div><div className="page-header"><h2>Roles e Permissões</h2></div><TableSkeleton rows={4} cols={3} /></div>

  return (
    <div>
      <div className="page-header">
        <h2>Roles e Permissões</h2>
        <Button onClick={openNew}>+ Nova Role</Button>
      </div>

      {showForm && (
        <Modal title={editingId ? 'Editar Role' : 'Nova Role'} onClose={() => setShowForm(false)} onSubmit={e => { e.preventDefault(); saveMutation.mutate() }}>
          <label className="form-label">Nome<input type="text" placeholder="ex: manager" value={name} onChange={e => setName(e.target.value)} required /></label>
          <label className="form-label">Descrição<input type="text" placeholder="ex: Gerente financeiro" value={description} onChange={e => setDescription(e.target.value)} /></label>
        </Modal>
      )}

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
          {roles.map(r => <MobileCard key={r.id} title={r.name} value="" subtitle={r.description || 'Sem descrição'} onTap={() => setSelectedRole(selectedRole === r.id ? null : r.id)} />)}
        </div>
      </section>

      <section>
        <h2>Permissões por Role</h2>
        <div className="tabs" style={{ marginBottom: '1rem' }}>
          {roles.map(r => <Button key={r.id} variant="tab" active={selectedRole === r.id} onClick={() => setSelectedRole(r.id)}>{r.name}</Button>)}
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
                        <button className={`paid-btn ${active ? 'paid' : ''}`} aria-label={active ? 'Remover permissão' : 'Adicionar permissão'} onClick={() => togglePermMutation.mutate({ roleId: selectedRole, permId, exists: active })}>
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
