import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Badge from '../ui/Badge'

interface Role { id: string; name: string; description: string | null }
interface Permission { id: string; resource: string; action: string }
interface RolePermission { role_id: string; permission_id: string }

const RESOURCE_LABELS: Record<string, string> = {
  transactions: 'Lançamentos',
  credit_cards: 'Cartões de Crédito',
  recurring_templates: 'Recorrentes',
  budgets: 'Orçamentos',
  categories: 'Categorias',
  cards: 'Cartões',
  users: 'Usuários',
  investments: 'Investimentos',
}

const ACTIONS = ['read', 'create', 'update', 'delete']

export default function PermissionsTab() {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ['roles-page'],
    queryFn: async () => {
      const { data } = await supabase.from('roles').select('*').order('name')
      const roles = (data ?? []) as Role[]
      if (roles.length && !selectedRole) setSelectedRole(roles[0].id)
      return roles
    },
  })

  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () =>
      (await supabase.from('permissions').select('*').order('resource').order('action')).data as Permission[] ?? [],
  })

  const { data: rolePermissions = [] } = useQuery<RolePermission[]>({
    queryKey: ['role-permissions'],
    queryFn: async () =>
      (await supabase.from('role_permissions').select('*')).data as RolePermission[] ?? [],
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['roles-page'] })
    queryClient.invalidateQueries({ queryKey: ['role-permissions'] })
    queryClient.invalidateQueries({ queryKey: ['roles'] })
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from('roles').update({ name, description: description || null }).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('roles').insert({ name, description: description || null })
        if (error) throw error
      }
    },
    onSuccess: () => { invalidate(); setShowForm(false); toast(editingId ? 'Role atualizada' : 'Role criada') },
    onError: (e) => showError(e),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('roles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, id) => { invalidate(); if (selectedRole === id) setSelectedRole(null); toast('Role excluída') },
    onError: (e) => showError(e),
  })

  const togglePermMutation = useMutation({
    mutationFn: async ({ roleId, permId, exists }: { roleId: string; permId: string; exists: boolean }) => {
      if (exists) {
        const { error } = await supabase.from('role_permissions').delete().eq('role_id', roleId).eq('permission_id', permId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('role_permissions').insert({ role_id: roleId, permission_id: permId })
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['role-permissions'] }),
    onError: (e) => showError(e),
  })

  const openNew = () => { setEditingId(null); setName(''); setDescription(''); setShowForm(true) }
  const openEdit = (r: Role) => { setEditingId(r.id); setName(r.name); setDescription(r.description ?? ''); setShowForm(true) }
  const handleDelete = async (id: string) => {
    if (await confirm('Excluir esta role? Usuários vinculados perderão acesso.')) deleteMutation.mutate(id)
  }

  const resources = [...new Set(permissions.map(p => p.resource))].sort()
  const hasPerm = (roleId: string, permId: string) => rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permId)
  const getPermId = (resource: string, action: string) => permissions.find(p => p.resource === resource && p.action === action)?.id
  const selectedRoleObj = roles.find(r => r.id === selectedRole)

  if (isLoading) {
    return <p className="empty">Carregando permissões...</p>
  }

  return (
    <div className="permissions-tab">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Button onClick={openNew}>+ Nova Role</Button>
      </div>

      {showForm && (
        <Modal title={editingId ? 'Editar Role' : 'Nova Role'} onClose={() => setShowForm(false)} onSubmit={e => { e.preventDefault(); saveMutation.mutate() }}>
          <label className="form-label">Nome<input type="text" placeholder="ex: manager" value={name} onChange={e => setName(e.target.value)} required /></label>
          <label className="form-label">Descrição<input type="text" placeholder="ex: Gerente financeiro" value={description} onChange={e => setDescription(e.target.value)} /></label>
        </Modal>
      )}

      <div className="tabs" style={{ marginBottom: '1rem' }}>
        {roles.map(r => (
          <Button key={r.id} variant="tab" active={selectedRole === r.id} onClick={() => setSelectedRole(r.id)}>
            {r.name}
          </Button>
        ))}
      </div>

      {selectedRoleObj && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedRoleObj.description || 'Sem descrição'}</span>
          <Button variant="icon" aria-label="Editar role" onClick={() => openEdit(selectedRoleObj)}><Pencil size={14} /></Button>
          <Button variant="icon" className="delete-btn" aria-label="Excluir role" onClick={() => handleDelete(selectedRoleObj.id)}><Trash2 size={14} /></Button>
        </div>
      )}

      {selectedRole && (
        <table>
          <thead>
            <tr>
              <th>Recurso</th>
              {ACTIONS.map(a => <th key={a} style={{ textAlign: 'center' }}>{a}</th>)}
            </tr>
          </thead>
          <tbody>
            {resources.map(res => (
              <tr key={res}>
                <td style={{ fontWeight: 500 }}>{RESOURCE_LABELS[res] ?? res}</td>
                {ACTIONS.map(act => {
                  const permId = getPermId(res, act)
                  if (!permId) return <td key={act} style={{ textAlign: 'center' }}>—</td>
                  const active = hasPerm(selectedRole, permId)
                  return (
                    <td key={act} style={{ textAlign: 'center' }}>
                      <button
                        className="badge-toggle"
                        role="switch"
                        aria-checked={active}
                        onClick={() => togglePermMutation.mutate({ roleId: selectedRole, permId, exists: active })}
                      >
                        <Badge variant={active ? 'success' : 'danger'}>{active ? '✓' : '✗'}</Badge>
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
    </div>
  )
}
