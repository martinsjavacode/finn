import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('../../services/transactions', () => ({
  insertTransaction: vi.fn().mockResolvedValue({ error: null }),
  insertCreditCard: vi.fn().mockResolvedValue({ error: null }),
  updateTransaction: vi.fn().mockResolvedValue({ error: null }),
  deleteTransaction: vi.fn().mockResolvedValue({ error: null }),
  toggleTransactionPaid: vi.fn().mockResolvedValue({ error: null }),
  batchMarkTransactionsPaid: vi.fn().mockResolvedValue({ error: null }),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn().mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }) }) },
}))

vi.mock('../../lib/toast', () => ({ toast: vi.fn(), showError: vi.fn() }))

vi.mock('../../hooks/index', () => ({
  useAuth: () => ({ activeAccountId: 'test-account-id' }),
}))

import { useTransactionMutations } from '../../hooks/useTransactionMutations'
import { insertTransaction, insertCreditCard, updateTransaction, deleteTransaction, toggleTransactionPaid } from '../../services/transactions'
import { toast, showError } from '../../lib/toast'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
)

describe('useTransactionMutations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('addTransaction chama insertTransaction e toast', async () => {
    const { result } = renderHook(() => useTransactionMutations('2026-05'), { wrapper })
    act(() => { result.current.addTransaction.mutate({ month: '2026-05-01', description: 'Test', amount: 100, type: 'expense', category: 'c1', account_id: 'a1', paid: false }) })
    await waitFor(() => expect(insertTransaction).toHaveBeenCalled())
    expect(toast).toHaveBeenCalledWith('Lançamento criado')
  })

  it('addCreditCard chama insertCreditCard', async () => {
    const { result } = renderHook(() => useTransactionMutations('2026-05'), { wrapper })
    act(() => { result.current.addCreditCard.mutate({ month: '2026-05-01', description: 'Netflix', amount: 45, card: 'nu', account_id: 'a1' }) })
    await waitFor(() => expect(insertCreditCard).toHaveBeenCalled())
  })

  it('editTransaction chama updateTransaction', async () => {
    const { result } = renderHook(() => useTransactionMutations('2026-05'), { wrapper })
    act(() => { result.current.editTransaction.mutate({ id: 't1', data: { description: 'Novo' } }) })
    await waitFor(() => expect(updateTransaction).toHaveBeenCalledWith('t1', 'test-account-id', { description: 'Novo' }))
  })

  it('removeTransaction chama deleteTransaction', async () => {
    const { result } = renderHook(() => useTransactionMutations('2026-05'), { wrapper })
    act(() => { result.current.removeTransaction.mutate('t1') })
    await waitFor(() => expect(deleteTransaction).toHaveBeenCalledWith('t1', 'test-account-id'))
  })

  it('togglePaid chama toggleTransactionPaid', async () => {
    const { result } = renderHook(() => useTransactionMutations('2026-05'), { wrapper })
    act(() => { result.current.togglePaid.mutate({ id: 't1', paid: true }) })
    await waitFor(() => expect(toggleTransactionPaid).toHaveBeenCalledWith('t1', 'test-account-id', true))
  })

  it('batchMarkPaid chama batchMarkTransactionsPaid e toast com contagem', async () => {
    const { batchMarkTransactionsPaid } = await import('../../services/transactions')
    const { result } = renderHook(() => useTransactionMutations('2026-05'), { wrapper })
    act(() => { result.current.batchMarkPaid.mutate(['t1', 't2', 't3']) })
    await waitFor(() => expect(batchMarkTransactionsPaid).toHaveBeenCalledWith(['t1', 't2', 't3'], 'test-account-id'))
    expect(toast).toHaveBeenCalledWith('3 lançamentos pagos')
  })

  it('batchMarkPaid exibe toast de permissão em erro 42501', async () => {
    const { batchMarkTransactionsPaid } = await import('../../services/transactions')
    vi.mocked(batchMarkTransactionsPaid).mockResolvedValueOnce({ error: { message: 'permission denied', code: '42501', details: '', hint: '' } as never })
    const { result } = renderHook(() => useTransactionMutations('2026-05'), { wrapper })
    act(() => { result.current.batchMarkPaid.mutate(['t1']) })
    await waitFor(() => expect(toast).toHaveBeenCalledWith('Permissão insuficiente para atualizar lançamentos', 'error'))
  })

  it('batchMarkPaid chama showError em erro genérico', async () => {
    const { batchMarkTransactionsPaid } = await import('../../services/transactions')
    vi.mocked(batchMarkTransactionsPaid).mockResolvedValueOnce({ error: { message: 'network error', code: '', details: '', hint: '' } as never })
    const { result } = renderHook(() => useTransactionMutations('2026-05'), { wrapper })
    act(() => { result.current.batchMarkPaid.mutate(['t1']) })
    await waitFor(() => expect(showError).toHaveBeenCalled())
  })
})
