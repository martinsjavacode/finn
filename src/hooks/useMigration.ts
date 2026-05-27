import { useMutation, useQueryClient } from '@tanstack/react-query'
import { migrateEntries, migrateBudgets, migrateInstallmentPurchases } from '../services/migration'
import { toast, showError } from '../lib/toast'

export function useMigration() {
  const queryClient = useQueryClient()
  const invalidateAll = () => queryClient.invalidateQueries()

  const entries = useMutation({
    mutationFn: ({ ids, targetAccountId }: { ids: string[]; targetAccountId: string }) => migrateEntries(ids, targetAccountId).then(r => { if (r.error) throw r.error; return r.data }),
    onSuccess: (n) => { toast(`${n} lançamento(s) migrado(s)`); invalidateAll() },
    onError: (e) => showError(e as { message: string }),
  })

  const budgets = useMutation({
    mutationFn: ({ ids, targetAccountId }: { ids: string[]; targetAccountId: string }) => migrateBudgets(ids, targetAccountId).then(r => { if (r.error) throw r.error; return r.data }),
    onSuccess: (n) => { toast(`${n} orçamento(s) migrado(s)`); invalidateAll() },
    onError: (e) => showError(e as { message: string }),
  })

  const installments = useMutation({
    mutationFn: ({ ids, targetAccountId }: { ids: string[]; targetAccountId: string }) => migrateInstallmentPurchases(ids, targetAccountId).then(r => { if (r.error) throw r.error; return r.data }),
    onSuccess: (n) => { toast(`${n} parcelamento(s) migrado(s)`); invalidateAll() },
    onError: (e) => showError(e as { message: string }),
  })

  return { migrateEntries: entries, migrateBudgets: budgets, migrateInstallments: installments }
}
