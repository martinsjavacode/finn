import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('../../services/negotiations', () => ({
  fetchNegotiations: vi.fn().mockResolvedValue({ data: [], error: null }),
  fetchNegotiatedInvoices: vi.fn().mockResolvedValue({ data: [], error: null }),
  fetchNegotiationInstallments: vi.fn().mockResolvedValue({ data: [], error: null }),
  createNegotiation: vi.fn().mockResolvedValue({ data: { id: 'neg-1' }, error: null }),
  cancelNegotiation: vi.fn().mockResolvedValue({ error: null }),
  isInvoiceNegotiated: vi.fn().mockResolvedValue(false),
  fetchPendingInvoices: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../lib/toast', () => ({ toast: vi.fn(), showError: vi.fn() }))

import {
  useNegotiations,
  useNegotiatedInvoices,
  useNegotiationInstallments,
  useIsInvoiceNegotiated,
  usePendingInvoices,
  useCreateNegotiation,
  useCancelNegotiation,
  useInvoiceNegotiation,
} from '../../hooks/useInvoiceNegotiation'
import {
  fetchNegotiations,
  fetchNegotiatedInvoices,
  fetchNegotiationInstallments,
  createNegotiation,
  cancelNegotiation,
  isInvoiceNegotiated,
  fetchPendingInvoices,
} from '../../services/negotiations'
import { toast } from '../../lib/toast'

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useInvoiceNegotiation hooks', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('useNegotiations', () => {
    it('fetches negotiations when accountId is provided', async () => {
      const { result } = renderHook(() => useNegotiations('acc-1'), { wrapper: createWrapper() })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(fetchNegotiations).toHaveBeenCalledWith('acc-1')
      expect(result.current.data).toEqual([])
    })

    it('does not fetch when accountId is null', () => {
      renderHook(() => useNegotiations(null), { wrapper: createWrapper() })
      expect(fetchNegotiations).not.toHaveBeenCalled()
    })
  })

  describe('useNegotiatedInvoices', () => {
    it('fetches invoices when negotiationId is provided', async () => {
      const { result } = renderHook(() => useNegotiatedInvoices('neg-1'), { wrapper: createWrapper() })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(fetchNegotiatedInvoices).toHaveBeenCalledWith('neg-1')
      expect(result.current.data).toEqual([])
    })

    it('does not fetch when negotiationId is null', () => {
      renderHook(() => useNegotiatedInvoices(null), { wrapper: createWrapper() })
      expect(fetchNegotiatedInvoices).not.toHaveBeenCalled()
    })
  })

  describe('useNegotiationInstallments', () => {
    it('fetches installments when both ids are provided', async () => {
      const { result } = renderHook(() => useNegotiationInstallments('neg-1', 'acc-1'), { wrapper: createWrapper() })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(fetchNegotiationInstallments).toHaveBeenCalledWith('neg-1', 'acc-1')
      expect(result.current.data).toEqual([])
    })

    it('does not fetch when negotiationId is null', () => {
      renderHook(() => useNegotiationInstallments(null, 'acc-1'), { wrapper: createWrapper() })
      expect(fetchNegotiationInstallments).not.toHaveBeenCalled()
    })
  })

  describe('useIsInvoiceNegotiated', () => {
    it('checks if invoice is negotiated', async () => {
      const { result } = renderHook(() => useIsInvoiceNegotiated('nubank', '2026-07-01', 'acc-1'), { wrapper: createWrapper() })
      await waitFor(() => expect(isInvoiceNegotiated).toHaveBeenCalledWith('nubank', '2026-07-01', 'acc-1'))
      expect(result.current.data).toBe(false)
    })

    it('does not check when card is null', () => {
      renderHook(() => useIsInvoiceNegotiated(null, '2026-07-01', 'acc-1'), { wrapper: createWrapper() })
      expect(isInvoiceNegotiated).not.toHaveBeenCalled()
    })
  })

  describe('usePendingInvoices', () => {
    it('fetches pending invoices', async () => {
      const { result } = renderHook(() => usePendingInvoices('nubank', 'acc-1'), { wrapper: createWrapper() })
      await waitFor(() => expect(fetchPendingInvoices).toHaveBeenCalledWith('nubank', 'acc-1'))
      expect(result.current.data).toEqual([])
    })

    it('does not fetch when card is null', () => {
      renderHook(() => usePendingInvoices(null, 'acc-1'), { wrapper: createWrapper() })
      expect(fetchPendingInvoices).not.toHaveBeenCalled()
    })
  })

  describe('useCreateNegotiation', () => {
    it('creates negotiation and shows toast on success', async () => {
      const { result } = renderHook(() => useCreateNegotiation('acc-1'), { wrapper: createWrapper() })
      
      act(() => {
        result.current.mutate({
          account_id: 'acc-1',
          card: 'nubank',
          total_amount: 5000,
          installments: 12,
          first_month: '2026-10-01',
          invoices: [{ card: 'nubank', month: '2026-07-01' }],
        })
      })

      await waitFor(() => expect(createNegotiation).toHaveBeenCalled())
      expect(toast).toHaveBeenCalledWith('Negociação criada com sucesso')
    })
  })

  describe('useCancelNegotiation', () => {
    it('cancels negotiation and shows toast on success', async () => {
      const { result } = renderHook(() => useCancelNegotiation('acc-1'), { wrapper: createWrapper() })
      
      act(() => {
        result.current.mutate('neg-1')
      })

      await waitFor(() => expect(cancelNegotiation).toHaveBeenCalledWith('neg-1', 'acc-1'))
      expect(toast).toHaveBeenCalledWith('Negociação cancelada')
    })
  })

  describe('useInvoiceNegotiation (convenience)', () => {
    it('returns negotiations data and mutation functions', async () => {
      const { result } = renderHook(() => useInvoiceNegotiation('acc-1'), { wrapper: createWrapper() })
      
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      
      expect(result.current.negotiations).toEqual([])
      expect(typeof result.current.createNegotiation).toBe('function')
      expect(typeof result.current.cancelNegotiation).toBe('function')
      expect(result.current.isCreating).toBe(false)
      expect(result.current.isCanceling).toBe(false)
    })
  })
})
