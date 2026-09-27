import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchNegotiations,
  fetchNegotiatedInvoices,
  fetchNegotiationInstallments,
  createNegotiation,
  cancelNegotiation,
  isInvoiceNegotiated,
  fetchPendingInvoices,
} from '../services/negotiations'
import type { CreateNegotiationInput } from '../types/database'
import { showError, toast } from '../lib/toast'
import { TRANSACTION_KEYS } from './useTransactions'

export const NEGOTIATION_KEYS = {
  all: (accountId: string | null) => ['negotiations', accountId] as const,
  detail: (id: string) => ['negotiation', id] as const,
  invoices: (id: string) => ['negotiation-invoices', id] as const,
  installments: (id: string, accountId: string | null) => ['negotiation-installments', id, accountId] as const,
  isNegotiated: (card: string, month: string, accountId: string | null) => ['is-negotiated', card, month, accountId] as const,
  pending: (card: string, accountId: string | null) => ['pending-invoices', card, accountId] as const,
}

export function useNegotiations(accountId: string | null) {
  return useQuery({
    queryKey: NEGOTIATION_KEYS.all(accountId),
    queryFn: async () => {
      const { data, error } = await fetchNegotiations(accountId!)
      if (error) throw error
      return data
    },
    enabled: !!accountId,
  })
}

export function useNegotiatedInvoices(negotiationId: string | null) {
  return useQuery({
    queryKey: NEGOTIATION_KEYS.invoices(negotiationId ?? ''),
    queryFn: async () => {
      const { data, error } = await fetchNegotiatedInvoices(negotiationId!)
      if (error) throw error
      return data
    },
    enabled: !!negotiationId,
  })
}

export function useNegotiationInstallments(negotiationId: string | null, accountId: string | null) {
  return useQuery({
    queryKey: NEGOTIATION_KEYS.installments(negotiationId ?? '', accountId),
    queryFn: async () => {
      const { data, error } = await fetchNegotiationInstallments(negotiationId!, accountId!)
      if (error) throw error
      return data
    },
    enabled: !!negotiationId && !!accountId,
  })
}

export function useIsInvoiceNegotiated(card: string | null, month: string | null, accountId: string | null) {
  return useQuery({
    queryKey: NEGOTIATION_KEYS.isNegotiated(card ?? '', month ?? '', accountId),
    queryFn: () => isInvoiceNegotiated(card!, month!, accountId!),
    enabled: !!card && !!month && !!accountId,
  })
}

export function usePendingInvoices(card: string | null, accountId: string | null) {
  return useQuery({
    queryKey: NEGOTIATION_KEYS.pending(card ?? '', accountId),
    queryFn: () => fetchPendingInvoices(card!, accountId!),
    enabled: !!card && !!accountId,
  })
}

export function useCreateNegotiation(accountId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateNegotiationInput) => {
      const { data, error } = await createNegotiation(input)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast('Negociação criada com sucesso')
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: NEGOTIATION_KEYS.all(accountId) })
      queryClient.invalidateQueries({ queryKey: ['creditCards'] })
      queryClient.invalidateQueries({ queryKey: ['cardInvoices'] })
      queryClient.invalidateQueries({ queryKey: ['is-negotiated'] })
      queryClient.invalidateQueries({ queryKey: ['pending-invoices'] })
      // Invalidate transactions to show new installments
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.months(accountId) })
    },
    onError: (e) => showError(e),
  })
}

export function useCancelNegotiation(accountId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await cancelNegotiation(id, accountId!)
      if (error) throw error
    },
    onSuccess: () => {
      toast('Negociação cancelada')
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: NEGOTIATION_KEYS.all(accountId) })
      queryClient.invalidateQueries({ queryKey: ['creditCards'] })
      queryClient.invalidateQueries({ queryKey: ['cardInvoices'] })
      queryClient.invalidateQueries({ queryKey: ['is-negotiated'] })
      queryClient.invalidateQueries({ queryKey: ['pending-invoices'] })
      // Invalidate transactions to remove installments
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.months(accountId) })
    },
    onError: (e) => showError(e),
  })
}

// Convenience hook that combines all negotiation functionality
export function useInvoiceNegotiation(accountId: string | null) {
  const negotiations = useNegotiations(accountId)
  const createMutation = useCreateNegotiation(accountId)
  const cancelMutation = useCancelNegotiation(accountId)

  return {
    // Queries
    negotiations: negotiations.data ?? [],
    isLoading: negotiations.isLoading,
    error: negotiations.error,
    
    // Mutations
    createNegotiation: createMutation.mutate,
    cancelNegotiation: cancelMutation.mutate,
    isCreating: createMutation.isPending,
    isCanceling: cancelMutation.isPending,
  }
}
