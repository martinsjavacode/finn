import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('../../services/admin', () => ({
  fetchMigrationItems: vi.fn(),
}))

import { useAdminMigration } from '../../hooks/useAdminMigration'
import { fetchMigrationItems } from '../../services/admin'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
)

describe('useAdminMigration', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches migration items when accountId is provided', async () => {
    vi.mocked(fetchMigrationItems).mockResolvedValue({
      data: [{ id: 'e1', description: 'Test', amount: 100 }],
      error: null,
    } as never)

    const { result } = renderHook(() => useAdminMigration('acc-1', 'entries'), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(1)
    expect(fetchMigrationItems).toHaveBeenCalledWith('acc-1', 'entries')
  })

  it('does not fetch when accountId is null', async () => {
    const { result } = renderHook(() => useAdminMigration(null, 'entries'), { wrapper })
    expect(result.current.data).toEqual([])
    expect(fetchMigrationItems).not.toHaveBeenCalled()
  })

  it('returns error on failure', async () => {
    vi.mocked(fetchMigrationItems).mockResolvedValue({ data: null, error: { message: 'fail' } } as never)

    const { result } = renderHook(() => useAdminMigration('acc-1', 'budgets'), { wrapper })

    await waitFor(() => expect(result.current.error).toBeTruthy())
  })
})
