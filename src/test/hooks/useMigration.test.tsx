import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('../../services/migration', () => ({
  migrateEntries: vi.fn().mockResolvedValue({ data: 2, error: null }),
  migrateBudgets: vi.fn().mockResolvedValue({ data: 1, error: null }),
  migrateInstallmentPurchases: vi.fn().mockResolvedValue({ data: 1, error: null }),
}))

vi.mock('../../lib/toast', () => ({ toast: vi.fn(), showError: vi.fn() }))

import { useMigration } from '../../hooks/useMigration'
import { migrateEntries, migrateBudgets, migrateInstallmentPurchases } from '../../services/migration'
import { toast } from '../../lib/toast'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
)

describe('useMigration', () => {
  beforeEach(() => vi.clearAllMocks())

  it('migrateEntries chama service e exibe toast', async () => {
    const { result } = renderHook(() => useMigration(), { wrapper })
    act(() => { result.current.migrateEntries.mutate({ ids: ['e1', 'e2'], targetAccountId: 'acc-2' }) })
    await waitFor(() => expect(migrateEntries).toHaveBeenCalledWith(['e1', 'e2'], 'acc-2'))
    expect(toast).toHaveBeenCalledWith('2 lançamento(s) migrado(s)')
  })

  it('migrateBudgets chama service e exibe toast', async () => {
    const { result } = renderHook(() => useMigration(), { wrapper })
    act(() => { result.current.migrateBudgets.mutate({ ids: ['b1'], targetAccountId: 'acc-3' }) })
    await waitFor(() => expect(migrateBudgets).toHaveBeenCalledWith(['b1'], 'acc-3'))
    expect(toast).toHaveBeenCalledWith('1 orçamento(s) migrado(s)')
  })

  it('migrateInstallments chama service e exibe toast', async () => {
    const { result } = renderHook(() => useMigration(), { wrapper })
    act(() => { result.current.migrateInstallments.mutate({ ids: ['p1'], targetAccountId: 'acc-4' }) })
    await waitFor(() => expect(migrateInstallmentPurchases).toHaveBeenCalledWith(['p1'], 'acc-4'))
    expect(toast).toHaveBeenCalledWith('1 parcelamento(s) migrado(s)')
  })

  it('exibe erro quando service falha', async () => {
    vi.mocked(migrateEntries).mockResolvedValueOnce({ data: 0, error: { message: 'Apenas superadmin' } })
    const { result } = renderHook(() => useMigration(), { wrapper })
    const { showError } = await import('../../lib/toast')
    act(() => { result.current.migrateEntries.mutate({ ids: ['e1'], targetAccountId: 'acc-x' }) })
    await waitFor(() => expect(showError).toHaveBeenCalled())
  })
})
