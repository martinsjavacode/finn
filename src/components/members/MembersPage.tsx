import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAdminMembers } from '../../hooks/useAdminMembers'
import { useAuth } from '../../hooks'
import { confirm } from '../../lib/confirm'
import { toast } from '../../lib/toast'
import { supabase } from '../../lib/supabase'
import MemberList from '../admin/MemberList'
import AddMemberModal from '../admin/AddMemberModal'

export default function MembersPage() {
  const { session, activeAccountId, activeAccount } = useAuth()
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)

  const actorEmail = session?.user?.email ?? ''
  const accountName = activeAccount?.name ?? ''

  const { members, isLoading, addMember, updateRole, removeMember } = useAdminMembers(activeAccountId)

  // Fetch roles from database
  const { data: roles = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await supabase.from('roles').select('id, name').order('name')
      return (data ?? []) as { id: string; name: string }[]
    },
  })

  const handleAddMember = async (userId: string, roleId: string) => {
    try {
      await addMember.mutateAsync({
        userId,
        roleId,
        actorEmail,
        accountName,
      })
      toast('Membro adicionado com sucesso', 'success')
      setShowAddMemberModal(false)
    } catch {
      // Error handled by hook
    }
  }

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    const member = members.find(m => m.userId === userId)
    const oldRole = member ? roles.find(r => r.id === member.roleId)?.name ?? member.roleName : ''
    const newRole = roles.find(r => r.id === newRoleId)?.name ?? newRoleId

    try {
      await updateRole.mutateAsync({
        userId,
        roleId: newRoleId,
        actorEmail,
        accountName,
        oldRole,
        newRole,
      })
      toast('Papel atualizado com sucesso', 'success')
    } catch {
      // Error handled by hook
    }
  }

  const handleRemoveMember = async (userId: string) => {
    const member = members.find(m => m.userId === userId)
    const memberEmail = member?.email ?? userId

    let message = `Tem certeza que deseja remover ${memberEmail} da conta ${accountName}?`
    if (members.length <= 1) {
      message += '\n\nEsta ação deixará a conta sem membros.'
    }

    const confirmed = await confirm(message)
    if (!confirmed) return

    try {
      await removeMember.mutateAsync({
        userId,
        actorEmail,
        accountName,
        affectedUserEmail: memberEmail,
      })
      toast('Membro removido com sucesso', 'success')
    } catch {
      // Error handled by hook
    }
  }

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <h2>Membros</h2>
        </div>
        <p className="empty">Carregando membros...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>Membros <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>— {accountName}</span></h2>
      </div>

      <section>
        <MemberList
          members={members}
          roles={roles}
          onRoleChange={handleRoleChange}
          onRemove={handleRemoveMember}
          onAddMember={() => setShowAddMemberModal(true)}
        />
      </section>

      {showAddMemberModal && activeAccountId && (
        <AddMemberModal
          existingMemberUserIds={members.map(m => m.userId)}
          roles={roles}
          onSubmit={handleAddMember}
          onClose={() => setShowAddMemberModal(false)}
          loading={addMember.isPending}
        />
      )}
    </div>
  )
}
