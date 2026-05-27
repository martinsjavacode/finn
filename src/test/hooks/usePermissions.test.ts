import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { usePermissions } from '../../hooks/usePermissions'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { role_id: 'role-1' } }),
          }),
        }),
      }),
    }),
  },
}))

import { supabase } from '../../lib/supabase'

describe('usePermissions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('superadmin retorna can() true para qualquer recurso', () => {
    const { result } = renderHook(() => usePermissions('acc-1', 'user-1', true))
    expect(result.current.can('transactions', 'read')).toBe(true)
    expect(result.current.can('anything', 'delete')).toBe(true)
    expect(result.current.loaded).toBe(true)
  })

  it('loaded é false quando não tem accountId', () => {
    const { result } = renderHook(() => usePermissions(null, 'user-1', false))
    expect(result.current.loaded).toBe(false)
    expect(result.current.can('transactions', 'read')).toBe(false)
  })

  it('carrega permissões do account_member', async () => {
    const mockPerms = { data: [{ permissions: { resource: 'transactions', action: 'read' } }] }
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'account_members') {
        return { select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role_id: 'r1' } }) }) }) }) } as never
      }
      return { select: () => ({ eq: () => Promise.resolve(mockPerms) }) } as never
    })

    const { result } = renderHook(() => usePermissions('acc-1', 'user-1', false))
    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current.can('transactions', 'read')).toBe(true)
    expect(result.current.can('transactions', 'delete')).toBe(false)
  })
})
