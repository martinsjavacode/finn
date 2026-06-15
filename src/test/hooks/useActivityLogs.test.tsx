import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('../../services/activityLog', () => ({
  fetchActivityLogs: vi.fn(),
}))

import { useActivityLogs } from '../../hooks/useActivityLogs'
import { fetchActivityLogs } from '../../services/activityLog'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
)

describe('useActivityLogs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns logs on success', async () => {
    vi.mocked(fetchActivityLogs).mockResolvedValue({
      data: [{ id: '1', action_type: 'migration', actor_email: 'a@b.com', account_id: null, account_name: null, details: {}, created_at: '2026-01-01' }],
      error: null,
      count: 1,
    } as never)

    const { result } = renderHook(() => useActivityLogs({ actionType: null, accountId: null }, 1, 50), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.logs).toHaveLength(1)
    expect(result.current.totalCount).toBe(1)
  })

  it('returns empty array when table does not exist', async () => {
    vi.mocked(fetchActivityLogs).mockResolvedValue({
      data: null,
      error: { message: 'relation "activity_logs" does not exist' },
      count: null,
    } as never)

    const { result } = renderHook(() => useActivityLogs({ actionType: null, accountId: null }, 1), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.logs).toEqual([])
    expect(result.current.totalCount).toBe(0)
  })

  it('throws on non-table-missing errors', async () => {
    vi.mocked(fetchActivityLogs).mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
      count: null,
    } as never)

    const { result } = renderHook(() => useActivityLogs({ actionType: null, accountId: null }, 1), { wrapper })

    await waitFor(() => expect(result.current.error).toBeTruthy())
  })
})
