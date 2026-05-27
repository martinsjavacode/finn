import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('../../services/transactions', () => ({
  fetchAvailableMonths: vi.fn().mockResolvedValue(['2026-05', '2026-04']),
  fetchTransactions: vi.fn().mockResolvedValue({ data: [{ id: 't1', description: 'Aluguel', amount: 2000, type: 'expense', paid: false }] }),
  fetchCreditCards: vi.fn().mockResolvedValue({ data: [{ id: 'c1', description: 'Netflix', amount: 45, card: 'nubank' }] }),
}))

import { useTransactions } from '../../hooks/useTransactions'

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTransactions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna arrays vazios quando não autenticado', () => {
    const { result } = renderHook(() => useTransactions(false), { wrapper: createWrapper() })
    expect(result.current.transactions).toEqual([])
    expect(result.current.cards).toEqual([])
    expect(result.current.months).toEqual([])
  })

  it('carrega meses, transações e cartões quando autenticado', async () => {
    const { result } = renderHook(() => useTransactions(true, 'acc-1'), { wrapper: createWrapper() })
    await waitFor(() => {
      expect(result.current.months).toEqual(['2026-05', '2026-04'])
      expect(result.current.transactions).toHaveLength(1)
      expect(result.current.transactions[0].description).toBe('Aluguel')
      expect(result.current.cards).toHaveLength(1)
    })
  })

  it('atualiza transação otimisticamente', async () => {
    const { result } = renderHook(() => useTransactions(true, 'acc-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.transactions).toHaveLength(1))

    act(() => result.current.updateTransaction('t1', { paid: true }))

    await waitFor(() => expect(result.current.transactions[0].paid).toBe(true))
  })

  it('remove transação otimisticamente', async () => {
    const { result } = renderHook(() => useTransactions(true, 'acc-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.transactions).toHaveLength(1))

    act(() => result.current.removeTransaction('t1'))

    await waitFor(() => expect(result.current.transactions).toHaveLength(0))
  })
})
