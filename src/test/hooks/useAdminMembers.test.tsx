import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('../../services/admin', () => ({
  fetchMembers: vi.fn(),
  addMember: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
}))

vi.mock('../../services/activityLog', () => ({
  recordActivity: vi.fn().mockResolvedValue({ data: null, error: null }),
}))

vi.mock('../../lib/toast', () => ({ toast: vi.fn(), showError: vi.fn() }))

import { useAdminMembers } from '../../hooks/useAdminMembers'
import { fetchMembers, addMember, updateMemberRole, removeMember } from '../../services/admin'
import { recordActivity } from '../../services/activityLog'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
)

describe('useAdminMembers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches members when accountId is provided', async () => {
    vi.mocked(fetchMembers).mockResolvedValue({
      data: [{ userId: 'u1', email: 'a@b.com', displayName: 'A', roleId: 'r1', roleName: 'editor' }],
      error: null,
    })

    const { result } = renderHook(() => useAdminMembers('acc-1'), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.members).toHaveLength(1)
  })

  it('does not fetch when accountId is null', async () => {
    const { result } = renderHook(() => useAdminMembers(null), { wrapper })
    expect(result.current.members).toEqual([])
    expect(fetchMembers).not.toHaveBeenCalled()
  })

  it('addMember calls service and records activity', async () => {
    vi.mocked(fetchMembers).mockResolvedValue({ data: [], error: null })
    vi.mocked(addMember).mockResolvedValue({ data: null, error: null })

    const { result } = renderHook(() => useAdminMembers('acc-1'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      result.current.addMember.mutate({ userId: 'u2', roleId: 'r1', actorEmail: 'admin@x.com', accountName: 'Test' })
    })

    await waitFor(() => expect(addMember).toHaveBeenCalledWith('acc-1', 'u2', 'r1'))
    expect(recordActivity).toHaveBeenCalledWith(expect.objectContaining({ actionType: 'member_added' }))
  })

  it('updateRole calls service and records activity', async () => {
    vi.mocked(fetchMembers).mockResolvedValue({ data: [], error: null })
    vi.mocked(updateMemberRole).mockResolvedValue({ data: null, error: null })

    const { result } = renderHook(() => useAdminMembers('acc-1'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      result.current.updateRole.mutate({ userId: 'u1', roleId: 'r2', actorEmail: 'admin@x.com' })
    })

    await waitFor(() => expect(updateMemberRole).toHaveBeenCalledWith('acc-1', 'u1', 'r2'))
    expect(recordActivity).toHaveBeenCalledWith(expect.objectContaining({ actionType: 'role_changed' }))
  })

  it('removeMember calls service and records activity', async () => {
    vi.mocked(fetchMembers).mockResolvedValue({ data: [], error: null })
    vi.mocked(removeMember).mockResolvedValue({ data: null, error: null })

    const { result } = renderHook(() => useAdminMembers('acc-1'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      result.current.removeMember.mutate({ userId: 'u1', actorEmail: 'admin@x.com' })
    })

    await waitFor(() => expect(removeMember).toHaveBeenCalledWith('acc-1', 'u1'))
    expect(recordActivity).toHaveBeenCalledWith(expect.objectContaining({ actionType: 'member_removed' }))
  })

  it('shows error on addMember failure', async () => {
    vi.mocked(fetchMembers).mockResolvedValue({ data: [], error: null })
    vi.mocked(addMember).mockResolvedValue({ data: null, error: { message: 'conflict' } } as never)

    const { result } = renderHook(() => useAdminMembers('acc-1'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      result.current.addMember.mutate({ userId: 'u2', roleId: 'r1', actorEmail: 'admin@x.com' })
    })

    const { showError } = await import('../../lib/toast')
    await waitFor(() => expect(showError).toHaveBeenCalled())
  })

  it('shows toast when recordActivity fails', async () => {
    vi.mocked(fetchMembers).mockResolvedValue({ data: [], error: null })
    vi.mocked(addMember).mockResolvedValue({ data: null, error: null })
    vi.mocked(recordActivity).mockRejectedValueOnce(new Error('network'))

    const { result } = renderHook(() => useAdminMembers('acc-1'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      result.current.addMember.mutate({ userId: 'u2', roleId: 'r1', actorEmail: 'admin@x.com' })
    })

    const { toast } = await import('../../lib/toast')
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.stringContaining('log de atividade'), 'error'))
  })
})
