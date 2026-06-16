import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAllAccounts, createAccount, updateAccount, deleteAccount } from '../services/admin'
import { showError } from '../lib/toast'

export function useAdminAccounts() {
  const queryClient = useQueryClient()

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['admin', 'accounts'],
    queryFn: async () => {
      const { data, error } = await fetchAllAccounts()
      if (error) throw error
      return data ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { error } = await createAccount(name, color)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] })
    },
    onError: (err) => showError(err as { message: string }, 'Erro ao criar conta'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; color?: string } }) => {
      const { error } = await updateAccount(id, data)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] })
    },
    onError: (err) => showError(err as { message: string }, 'Erro ao atualizar conta'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteAccount(id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] })
    },
    onError: (err) => showError(err as { message: string }, 'Erro ao excluir conta'),
  })

  return {
    accounts,
    isLoading,
    createAccount: createMutation.mutateAsync,
    updateAccount: updateMutation.mutateAsync,
    deleteAccount: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
