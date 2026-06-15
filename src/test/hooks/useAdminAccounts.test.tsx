import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('../../services/admin', () => ({
  fetchAllAccounts: vi.fn(),
  createAccount: vi.fn(),
  updateAccount: vi.fn(),
  deleteAccount: vi.fn(),
}))

vi.mock('../../lib/toast', () => ({ toast: vi.fn(), showError: vi.fn() }))

import { useAdminAccounts } from '../../hooks/useAdminAccounts'
import { fetchAllAccounts, createAccount, updateAccount, deleteAccount } from '../../services/admin'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
)

describe('useAdminAccounts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches accounts on mount', async () => {
    vi.mocked(fetchAllAccounts).mockResolvedValue({ data: [{ id: 'a1', name: 'Test', color: '#fff', member_count: 2 }], error: null } as never)

    const { result } = renderHook(() => useAdminAccounts(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.accounts).toHaveLength(1)
  })

  it('createAccount calls service', async () => {
    vi.mocked(fetchAllAccounts).mockResolvedValue({ data: [], error: null })
    vi.mocked(createAccount).mockResolvedValue({ data: { id: 'new' }, error: null } as never)

    const { result } = renderHook(() => useAdminAccounts(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.createAccount({ name: 'New', color: '#000' }))
    expect(createAccount).toHaveBeenCalledWith('New', '#000')
  })

  it('updateAccount calls service', async () => {
    vi.mocked(fetchAllAccounts).mockResolvedValue({ data: [], error: null })
    vi.mocked(updateAccount).mockResolvedValue({ data: null, error: null })

    const { result } = renderHook(() => useAdminAccounts(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.updateAccount({ id: 'a1', data: { name: 'X' } }))
    expect(updateAccount).toHaveBeenCalledWith('a1', { name: 'X' })
  })

  it('deleteAccount calls service', async () => {
    vi.mocked(fetchAllAccounts).mockResolvedValue({ data: [], error: null })
    vi.mocked(deleteAccount).mockResolvedValue({ data: null, error: null })

    const { result } = renderHook(() => useAdminAccounts(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.deleteAccount('a1'))
    expect(deleteAccount).toHaveBeenCalledWith('a1')
  })

  it('shows error toast on create failure', async () => {
    vi.mocked(fetchAllAccounts).mockResolvedValue({ data: [], error: null })
    vi.mocked(createAccount).mockResolvedValue({ data: null, error: { message: 'dup' } } as never)

    const { result } = renderHook(() => useAdminAccounts(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      try { await result.current.createAccount({ name: 'X', color: '#f00' }) } catch { /* expected */ }
    })

    const { showError } = await import('../../lib/toast')
    expect(showError).toHaveBeenCalled()
  })
})
