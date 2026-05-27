import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Account } from '../../types/database'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Select from '../ui/Select'
import { Pencil, Trash2, Users } from 'lucide-react'

interface Member {
  id: string
  user_id: string
  role_id: string
  users: { email: string; display_name: string | null }
  roles: { name: string }
}

interface RoleOption { id: string; name: string }
interface UserOption { id: string; email: string; display_name: string | null }

export default function AccountsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [membersAccountId, setMembersAccountId] = useState<string | null>(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberUserId, setNewMemberUserId] = useState('')
  const [newMemberRoleId, setNewMemberRoleId] = useState('')

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts-admin'],
    queryFn: async () => (await supabase.from('accounts').select('*').order('name')).data ?? [],
  })

  const { data: roles = [] } = useQuery<RoleOption[]>({
    queryKey: ['roles-list'],
    queryFn: async () => (await supabase.from('roles').select('id, name').order('name')).data ?? [],
  })

  const { data: allUsers = [] } = useQuery<UserOption[]>({
    queryKey: ['users-list'],
    queryFn: async () => (await supabase.from('users').select('id, email, display_name').order('email')).data ?? [],
  })

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ['account-members', membersAccountId],
    queryFn: async () => {
      const { data } = await supabase
        .from('account_members')
        .select('id, user_id, role_id, users(email, display_name), roles(name)')
        .eq('account_id', membersAccountId!)
        .order('created_at')
      return (data ?? []) as unknown as Member[]
    },
    enabled: !!membersAccountId,
  })

  const invalidateMembers = () => queryClient.invalidateQueries({ queryKey: ['account-members', membersAccountId] })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from('accounts').update({ name, color }).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('accounts').insert({ name, color })
        if (error) throw error
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accounts-admin'] }); queryClient.invalidateQueries({ queryKey: ['accounts'] }); setShowForm(false); toast(editingId ? 'Conta atualizada' : 'Conta criada') },
    onError: (e) => showError(e),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('accounts').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accounts-admin'] }); queryClient.invalidateQueries({ queryKey: ['accounts'] }); toast('Conta excluída') },
    onError: (e) => showError(e),
  })

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('account_members').insert({ account_id: membersAccountId!, user_id: newMemberUserId, role_id: newMemberRoleId })
      if (error) throw error
    },
    onSuccess: () => { invalidateMembers(); setShowAddMember(false); toast('Membro adicionado') },
    onError: (e) => showError(e),
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, roleId }: { id: string; roleId: string }) => {
      const { error } = await supabase.from('account_members').update({ role_id: roleId }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { invalidateMembers(); toast('Role atualizada') },
    onError: (e) => showError(e),
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('account_members').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { invalidateMembers(); toast('Membro removido') },
    onError: (e) => showError(e),
  })

  const openNew = () => { setEditingId(null); setName(''); setColor('#6366f1'); setShowForm(true) }
  const openEdit = (a: Account) => { setEditingId(a.id); setName(a.name); setColor(a.color); setShowForm(true) }
  const handleDelete = async (id: string) => { if (await confirm('Excluir esta conta e todos os dados associados?')) deleteMutation.mutate(id) }
  const handleRemoveMember = async (id: string) => { if (await confirm('Remover este membro da conta?')) removeMemberMutation.mutate(id) }

  const openAddMember = () => {
    setNewMemberUserId(allUsers[0]?.id ?? '')
    setNewMemberRoleId(roles.find(r => r.name === 'viewer')?.id ?? roles[0]?.id ?? '')
    setShowAddMember(true)
  }

  const membersAccount = accounts.find(a => a.id === membersAccountId)
  const existingUserIds = members.map(m => m.user_id)
  const availableUsers = allUsers.filter(u => !existingUserIds.includes(u.id))

  return (
    <div>
      <div className="page-header">
        <h2>Contas</h2>
        <Button onClick={openNew}>+ Nova</Button>
      </div>

      <section>
        <table className="desktop-table">
          <thead><tr><th>Cor</th><th>Nome</th><th>Membros</th><th></th></tr></thead>
          <tbody>
            {accounts.map(a => (
              <tr key={a.id}>
                <td><span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', background: a.color }} /></td>
                <td>{a.name}</td>
                <td><Button variant="icon" aria-label="Gerenciar membros" onClick={() => setMembersAccountId(a.id)}><Users size={14} /></Button></td>
                <td>
                  <Button variant="icon" aria-label="Editar" onClick={() => openEdit(a)}><Pencil size={14} /></Button>
                  <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></Button>
                </td>
              </tr>
            ))}
            {!accounts.length && <tr><td colSpan={4} className="empty">Nenhuma conta</td></tr>}
          </tbody>
        </table>
      </section>

      {/* Modal: Membros da conta */}
      {membersAccountId && (
        <Modal title={`Membros — ${membersAccount?.name ?? ''}`} onClose={() => setMembersAccountId(null)}>
          <table className="desktop-table" style={{ marginBottom: '1rem' }}>
            <thead><tr><th>Usuário</th><th>Role</th><th></th></tr></thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>{m.users?.display_name || m.users?.email}</td>
                  <td>
                    <Select
                      value={m.role_id}
                      onChange={v => updateRoleMutation.mutate({ id: m.id, roleId: v })}
                      options={roles.map(r => ({ value: r.id, label: r.name === 'owner' ? 'Owner' : r.name === 'editor' ? 'Editor' : 'Viewer' }))}
                    />
                  </td>
                  <td><Button variant="icon" className="delete-btn" aria-label="Remover" onClick={() => handleRemoveMember(m.id)}><Trash2 size={14} /></Button></td>
                </tr>
              ))}
              {!members.length && <tr><td colSpan={3} className="empty">Nenhum membro</td></tr>}
            </tbody>
          </table>
          {availableUsers.length > 0 && <Button onClick={openAddMember}>+ Adicionar membro</Button>}
        </Modal>
      )}

      {/* Modal: Adicionar membro */}
      {showAddMember && (
        <Modal title="Adicionar Membro" onClose={() => setShowAddMember(false)} onSubmit={e => { e.preventDefault(); addMemberMutation.mutate() }}>
          <label className="form-label">Usuário
            <Select value={newMemberUserId} onChange={setNewMemberUserId} options={availableUsers.map(u => ({ value: u.id, label: u.display_name || u.email }))} />
          </label>
          <label className="form-label">Role
            <Select value={newMemberRoleId} onChange={setNewMemberRoleId} options={roles.map(r => ({ value: r.id, label: r.name === 'owner' ? 'Owner' : r.name === 'editor' ? 'Editor' : 'Viewer' }))} />
          </label>
        </Modal>
      )}

      {/* Modal: Criar/Editar conta */}
      {showForm && (
        <Modal title={editingId ? 'Editar Conta' : 'Nova Conta'} onClose={() => setShowForm(false)} onSubmit={e => { e.preventDefault(); saveMutation.mutate() }}>
          <label className="form-label">Nome
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Pessoal, Empresa..." />
          </label>
          <label className="form-label">Cor
            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 48, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 6 }} />
          </label>
        </Modal>
      )}
    </div>
  )
}
