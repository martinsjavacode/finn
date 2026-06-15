import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAdminAccounts } from '../../hooks/useAdminAccounts'
import { useAdminMembers } from '../../hooks/useAdminMembers'
import { useAuth } from '../../hooks'
import { sortAccountsByName } from '../../utils/adminFilters'
import { confirm } from '../../lib/confirm'
import { toast } from '../../lib/toast'
import { recordActivity } from '../../services/activityLog'
import { supabase } from '../../lib/supabase'
import Button from '../ui/Button'
import AccountCard from './AccountCard'
import AccountFormModal from './AccountFormModal'
import MemberList from './MemberList'
import AddMemberModal from './AddMemberModal'

export default function AccountsTab() {
  const { accounts, isLoading, createAccount, updateAccount, deleteAccount, isCreating, isUpdating } = useAdminAccounts()
  const { session } = useAuth()
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<{
    id: string
    name: string
    color: string
  } | null>(null)

  const actorEmail = session?.user?.email ?? ''

  // Fetch roles from database (UUIDs as IDs)
  const { data: roles = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await supabase.from('roles').select('id, name').order('name')
      return (data ?? []) as { id: string; name: string }[]
    },
  })

  const { members, isLoading: membersLoading, addMember, updateRole, removeMember } = useAdminMembers(expandedAccountId)

  const sortedAccounts = sortAccountsByName(accounts)

  const expandedAccount = sortedAccounts.find(a => a.id === expandedAccountId)

  const handleDelete = async (accountId: string, accountName: string) => {
    const confirmed = await confirm(
      `Tem certeza que deseja excluir a conta '${accountName}'? Todos os dados associados serão removidos permanentemente.`
    )
    if (!confirmed) return

    try {
      await deleteAccount(accountId)
      toast('Conta excluída com sucesso', 'success')
      // Fire-and-forget activity log
      recordActivity({
        actionType: 'account_deleted',
        actorEmail,
        accountId,
        accountName,
        details: { type: 'account_deleted' },
      }).catch(() => {})
    } catch {
      toast('Erro ao excluir conta', 'error')
    }
  }

  const handleFormSubmit = async (data: { name: string; color: string }) => {
    if (editingAccount) {
      try {
        await updateAccount({ id: editingAccount.id, data })
        toast('Conta atualizada com sucesso', 'success')
        recordActivity({
          actionType: 'account_created', // closest type for update — design doesn't define 'account_updated'
          actorEmail,
          accountId: editingAccount.id,
          accountName: data.name,
          details: { type: 'account_created' },
        }).catch(() => {})
        setEditingAccount(null)
      } catch {
        toast('Erro ao atualizar conta', 'error')
      }
    } else {
      try {
        await createAccount(data)
        toast('Conta criada com sucesso', 'success')
        recordActivity({
          actionType: 'account_created',
          actorEmail,
          accountName: data.name,
          details: { type: 'account_created' },
        }).catch(() => {})
        setShowCreateModal(false)
      } catch {
        toast('Erro ao criar conta', 'error')
      }
    }
  }

  const handleAddMember = async (userId: string, roleId: string) => {
    try {
      await addMember.mutateAsync({
        userId,
        roleId,
        actorEmail,
        accountName: expandedAccount?.name,
      })
      toast('Membro adicionado com sucesso', 'success')
      setShowAddMemberModal(false)
    } catch {
      // Error toast is already handled by the hook's onError
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
        accountName: expandedAccount?.name,
        oldRole,
        newRole,
      })
      toast('Papel atualizado com sucesso', 'success')
    } catch {
      // Error toast is already handled by the hook's onError
    }
  }

  const handleRemoveMember = async (userId: string) => {
    const member = members.find(m => m.userId === userId)
    const memberEmail = member?.email ?? userId
    const accountName = expandedAccount?.name ?? ''

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
        accountName: expandedAccount?.name,
        affectedUserEmail: memberEmail,
      })
      toast('Membro removido com sucesso', 'success')
    } catch {
      // Error toast is already handled by the hook's onError
    }
  }

  if (isLoading) {
    return <p className="empty">Carregando contas...</p>
  }

  return (
    <div className="accounts-tab">
      <div className="accounts-tab-header">
        <Button onClick={() => setShowCreateModal(true)}>Nova conta</Button>
      </div>

      <div className="account-card-grid">
        {sortedAccounts.map((account) => (
          <div key={account.id}>
            <AccountCard
              account={account}
              expanded={expandedAccountId === account.id}
              onExpand={() =>
                setExpandedAccountId(
                  expandedAccountId === account.id ? null : account.id
                )
              }
              onEdit={() => setEditingAccount({ id: account.id, name: account.name, color: account.color })}
              onDelete={() => handleDelete(account.id, account.name)}
            />
            {expandedAccountId === account.id && (
              <div className="account-members-section">
                {membersLoading ? (
                  <p className="empty">Carregando membros...</p>
                ) : (
                  <MemberList
                    members={members}
                    roles={roles}
                    onRoleChange={handleRoleChange}
                    onRemove={handleRemoveMember}
                    onAddMember={() => setShowAddMemberModal(true)}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {sortedAccounts.length === 0 && (
        <p className="empty">Nenhuma conta encontrada.</p>
      )}

      {(showCreateModal || editingAccount) && (
        <AccountFormModal
          account={editingAccount}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowCreateModal(false)
            setEditingAccount(null)
          }}
          loading={isCreating || isUpdating}
        />
      )}

      {showAddMemberModal && expandedAccountId && (
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
