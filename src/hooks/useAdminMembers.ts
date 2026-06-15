import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchMembers, addMember, updateMemberRole, removeMember } from '../services/admin'
import { recordActivity } from '../services/activityLog'
import { showError, toast } from '../lib/toast'
import type { AdminMember } from '../types/admin'

export function useAdminMembers(accountId: string | null) {
  const queryClient = useQueryClient()

  const { data: members = [], isLoading } = useQuery<AdminMember[]>({
    queryKey: ['admin', 'members', accountId],
    queryFn: async () => {
      const { data, error } = await fetchMembers(accountId!)
      if (error) throw error
      return data ?? []
    },
    enabled: !!accountId,
  })

  const addMemberMutation = useMutation({
    mutationFn: async (params: { userId: string; roleId: string; actorEmail: string; accountName?: string }) => {
      const { data, error } = await addMember(accountId!, params.userId, params.roleId)
      if (error) throw error
      return data
    },
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'members', accountId] })
      try {
        await recordActivity({
          actionType: 'member_added',
          actorEmail: variables.actorEmail,
          accountId: accountId ?? undefined,
          accountName: variables.accountName,
          details: { affectedUserEmail: variables.userId },
        })
      } catch {
        toast('Ação concluída, mas o log de atividade não pôde ser salvo', 'error')
      }
    },
    onError: (error) => {
      showError(error as { message: string })
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: async (params: { userId: string; roleId: string; actorEmail: string; accountName?: string; oldRole?: string; newRole?: string }) => {
      const { data, error } = await updateMemberRole(accountId!, params.userId, params.roleId)
      if (error) throw error
      return data
    },
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'members', accountId] })
      try {
        await recordActivity({
          actionType: 'role_changed',
          actorEmail: variables.actorEmail,
          accountId: accountId ?? undefined,
          accountName: variables.accountName,
          details: {
            affectedUserEmail: variables.userId,
            oldRole: variables.oldRole ?? '',
            newRole: variables.newRole ?? '',
          },
        })
      } catch {
        toast('Ação concluída, mas o log de atividade não pôde ser salvo', 'error')
      }
    },
    onError: (error) => {
      showError(error as { message: string })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (params: { userId: string; actorEmail: string; accountName?: string; affectedUserEmail?: string }) => {
      const { data, error } = await removeMember(accountId!, params.userId)
      if (error) throw error
      return data
    },
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'members', accountId] })
      try {
        await recordActivity({
          actionType: 'member_removed',
          actorEmail: variables.actorEmail,
          accountId: accountId ?? undefined,
          accountName: variables.accountName,
          details: { affectedUserEmail: variables.affectedUserEmail ?? variables.userId },
        })
      } catch {
        toast('Ação concluída, mas o log de atividade não pôde ser salvo', 'error')
      }
    },
    onError: (error) => {
      showError(error as { message: string })
    },
  })

  return {
    members,
    isLoading,
    addMember: addMemberMutation,
    updateRole: updateRoleMutation,
    removeMember: removeMemberMutation,
  }
}
