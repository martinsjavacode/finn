import { useMutation, useQueryClient } from '@tanstack/react-query'
import { insertTransaction, insertCreditCard, updateTransaction, deleteTransaction, deleteCreditCard, toggleTransactionPaid } from '../services/transactions'
import { showError, toast } from '../lib/toast'

function throwOnError<T extends { error: unknown }>(result: T) {
  if (result.error) throw result.error
  return result
}

export function useTransactionMutations(month: string) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions', month] })
    queryClient.invalidateQueries({ queryKey: ['creditCards', month] })
    queryClient.invalidateQueries({ queryKey: ['months'] })
  }

  const addTransaction = useMutation({
    mutationFn: async (row: Parameters<typeof insertTransaction>[0]) => throwOnError(await insertTransaction(row)),
    onSuccess: () => { toast('Lançamento criado'); invalidate() },
    onError: (e) => showError(e),
  })

  const addCreditCard = useMutation({
    mutationFn: async (row: Parameters<typeof insertCreditCard>[0]) => throwOnError(await insertCreditCard(row)),
    onSuccess: () => { toast('Lançamento criado'); invalidate() },
    onError: (e) => showError(e),
  })

  const editTransaction = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Parameters<typeof updateTransaction>[1] }) => throwOnError(await updateTransaction(id, data)),
    onSuccess: () => invalidate(),
    onError: (e) => showError(e),
  })

  const removeTransaction = useMutation({
    mutationFn: async (id: string) => throwOnError(await deleteTransaction(id)),
    onSuccess: () => invalidate(),
    onError: (e) => showError(e),
  })

  const removeCreditCard = useMutation({
    mutationFn: async (id: string) => throwOnError(await deleteCreditCard(id)),
    onSuccess: () => invalidate(),
    onError: (e) => showError(e),
  })

  const togglePaid = useMutation({
    mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => throwOnError(await toggleTransactionPaid(id, paid)),
    onSuccess: () => invalidate(),
    onError: (e) => showError(e),
  })

  return { addTransaction, addCreditCard, editTransaction, removeTransaction, removeCreditCard, togglePaid }
}
