import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import { CardGrid, CardItem, Chip } from '../ui/CardGrid'
import { TableSkeleton } from '../ui/Skeleton'

interface RoleOption { id: string; name: string }
interface User { id: string; email: string; display_name: string | null; role_id: string; activated: boolean; roles: { name: string } }

export default function AccessPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [roleId, setRoleId] = useState('')

  const { data: roles = [] } = useQuery<RoleOption[]>({
    queryKey: ['roles-list'],
    queryFn: async () => (await supabase.from('roles').select('id, name').order('name')).data as RoleOption[] ?? [],
  })

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users-page'],
    queryFn: async () => (await supabase.from('users').select('*, roles(name)').order('created_at')).data as User[] ?? [],
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users-page'] })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from('users').update({ display_name: displayName || null, role_id: roleId }).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('users').insert({ email, display_name: displayName || null, role_id: roleId, activated: false })
        if (error) throw error
      }
    },
    onSuccess: () => { invalidate(); setShowForm(false); toast(editingId ? 'Usuário atualizado' : 'Usuário adicionado') },
    onError: (e) => showError(e),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('users').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { invalidate(); toast('Usuário removido') },
    onError: (e) => showError(e),
  })

  const openNew = () => {
    setEditingId(null); setEmail(''); setDisplayName('')
    setRoleId(roles.find(r => r.name === 'viewer')?.id ?? roles[0]?.id ?? '')
    setShowForm(true)
  }

  const openEdit = (u: User) => {
    setEditingId(u.id); setEmail(u.email); setDisplayName(u.display_name ?? ''); setRoleId(u.role_id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (await confirm('Tem certeza que deseja remover este usuário?')) deleteMutation.mutate(id)
  }

  const roleLabel = (name: string) => name === 'owner' ? 'Owner' : name === 'editor' ? 'Editor' : 'Viewer'
  const getRoleName = (u: User) => u.roles?.name ?? ''

  if (isLoading) return <div><div className="page-header"><h2>Usuários</h2></div><TableSkeleton rows={4} cols={5} /></div>

  return (
    <div>
      <div className="page-header">
        <h2>Usuários <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>({users.length})</span></h2>
        <Button onClick={openNew}>+ Novo</Button>
      </div>

      {showForm && (
        <Modal title={editingId ? 'Editar Usuário' : 'Adicionar Usuário'} onClose={() => setShowForm(false)} onSubmit={e => { e.preventDefault(); saveMutation.mutate() }}>
          <label className="form-label">Nome
            <input type="text" placeholder="Ex: João" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </label>
          <label className="form-label">Email
            <input type="email" placeholder="usuario@email.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={!!editingId} />
          </label>
          <label className="form-label">Permissão</label>
          <Select value={roleId} onChange={setRoleId} options={roles.map(r => ({ value: r.id, label: roleLabel(r.name) }))} />
        </Modal>
      )}

      <CardGrid>
        {users.map(u => {
          const roleName = getRoleName(u)
          const color = roleName === 'owner' ? 'var(--purple)' : roleName === 'editor' ? 'var(--green)' : 'var(--blue)'
          return (
            <CardItem
              key={u.id}
              title={<>{u.display_name || u.email} <Badge variant={u.activated ? 'success' : 'warning'}>{u.activated ? 'Ativo' : 'Pendente'}</Badge></>}
              style={{ borderTop: `3px solid ${color}` }}
              actions={<>
                <Button variant="icon" aria-label="Editar" onClick={() => openEdit(u)}><Pencil size={14} /></Button>
                <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(u.id)}><Trash2 size={14} /></Button>
              </>}
            >
              <Chip>{u.email}</Chip>
              <Chip className="cat-chip-highlight">{roleLabel(roleName)}</Chip>
            </CardItem>
          )
        })}
        {!users.length && <div className="empty-state"><p>Nenhum usuário cadastrado</p><Button onClick={openNew}>Adicionar primeiro usuário</Button></div>}
      </CardGrid>
    </div>
  )
}
