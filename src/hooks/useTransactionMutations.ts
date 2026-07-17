import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { insertTransaction, insertCreditCard, updateTransaction, deleteTransaction, toggleTransactionPaid, batchMarkTransactionsPaid } from '../services/transactions'
import { showError, toast } from '../lib/toast'
import { useAuth } from './index'

function throwOnError<T extends { error: unknown }>(result: T) {
  if (result.error) throw result.error
  return result
}

export function useTransactionMutations(month: string) {
  const queryClient = useQueryClient()
  const { activeAccountId } = useAuth()
  const accountId = activeAccountId!

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
    mutationFn: async ({ id, data }: { id: string; data: Partial<Parameters<typeof updateTransaction>[2]> }) => throwOnError(await updateTransaction(id, accountId, data)),
    onSuccess: () => invalidate(),
    onError: (e) => showError(e),
  })

  const removeTransaction = useMutation({
    mutationFn: async (id: string) => throwOnError(await deleteTransaction(id, accountId)),
    onSuccess: () => invalidate(),
    onError: (e) => showError(e),
  })

  const removeCreditCard = useMutation({
    mutationFn: async (id: string) => throwOnError(await deleteTransaction(id, accountId)),
    onSuccess: () => invalidate(),
    onError: (e) => showError(e),
  })

  const togglePaid = useMutation({
    mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => throwOnError(await toggleTransactionPaid(id, accountId, paid)),
    onSuccess: () => invalidate(),
    onError: (e) => showError(e),
  })

  const removeInstallment = useMutation({
    mutationFn: async (id: string) => throwOnError(await supabase.from('installment_purchases').delete().eq('id', id).eq('account_id', accountId)),
    onSuccess: () => invalidate(),
    onError: (e) => showError(e),
  })

  const batchMarkPaid = useMutation({
    mutationFn: async (ids: string[]) => {
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Tempo limite excedido (30s). Tente novamente.')), 30_000)
      })
      const operation = batchMarkTransactionsPaid(ids, accountId)
      const { error } = await Promise.race([operation, timeout])
      if (error) throw error
      return { count: ids.length }
    },
    onSuccess: ({ count }) => {
      toast(`${count} lançamentos pagos`)
      invalidate()
    },
    onError: (e: unknown) => {
      const err = e as { message?: string; code?: string } | null
      const message = err?.message ?? ''
      const code = err?.code ?? ''
      if (code === '42501' || /permission|rls|insufficient_privilege/i.test(message)) {
        toast('Permissão insuficiente para atualizar lançamentos', 'error')
      } else {
        showError(err as { message: string } | null)
      }
    },
  })

  return { addTransaction, addCreditCard, editTransaction, removeTransaction, removeCreditCard, removeInstallment, togglePaid, batchMarkPaid }
}
