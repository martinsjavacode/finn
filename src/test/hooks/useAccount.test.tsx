import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [{ id: 'acc-1', name: 'Pessoal', color: '#22c55e', created_at: null }, { id: 'acc-2', name: 'Sogra', color: '#f43f5e', created_at: null }] }),
      }),
    }),
  },
}))

import { useAccount } from '../../hooks/useAccount'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
)

describe('useAccount', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks() })

  it('retorna lista vazia quando userId é null', () => {
    const { result } = renderHook(() => useAccount(null), { wrapper })
    expect(result.current.accounts).toEqual([])
    expect(result.current.activeAccountId).toBeNull()
  })

  it('auto-seleciona primeira conta quando nenhuma selecionada', async () => {
    const { result } = renderHook(() => useAccount('user-1'), { wrapper })
    await vi.waitFor(() => expect(result.current.accounts).toHaveLength(2))
    expect(result.current.activeAccount?.name).toBe('Pessoal')
    expect(result.current.activeAccountId).toBe('acc-1')
  })

  it('persiste conta selecionada no localStorage', async () => {
    const { result } = renderHook(() => useAccount('user-1'), { wrapper })
    await vi.waitFor(() => expect(result.current.accounts).toHaveLength(2))

    act(() => result.current.setActiveAccount('acc-2'))

    expect(result.current.activeAccountId).toBe('acc-2')
    expect(localStorage.getItem('finn-active-account')).toBe('acc-2')
  })

  it('restaura conta do localStorage', async () => {
    localStorage.setItem('finn-active-account', 'acc-2')
    const { result } = renderHook(() => useAccount('user-1'), { wrapper })
    await vi.waitFor(() => expect(result.current.accounts).toHaveLength(2))
    expect(result.current.activeAccount?.name).toBe('Sogra')
  })
})
