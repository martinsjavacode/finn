import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useAuth } from '../../hooks/useAuth'
import * as authService from '../../services/auth'

vi.mock('../../services/auth')
vi.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true, permissions: [], loaded: true })
}))
vi.mock('../../hooks/useAccount', () => ({
  useAccount: () => ({ accounts: [], activeAccount: null, activeAccountId: null, setActiveAccount: vi.fn() })
}))

describe('useAuth', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inicia com loading true e session null', () => {
    vi.mocked(authService.getSession).mockResolvedValue(null)
    vi.mocked(authService.onAuthChange).mockReturnValue({ unsubscribe: vi.fn() } as never)

    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    expect(result.current.session).toBeNull()
  })

  it('carrega session e define loading false', async () => {
    const session = { user: { email: 'a@b.com', app_metadata: {} } } as never
    vi.mocked(authService.getSession).mockResolvedValue(session)
    vi.mocked(authService.onAuthChange).mockReturnValue({ unsubscribe: vi.fn() } as never)
    vi.mocked(authService.getUser).mockResolvedValue({ id: 'user-1', is_superadmin: false })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.session).toBe(session)
  })

  it('define isSuperadmin quando user é superadmin', async () => {
    const session = { user: { email: 'a@b.com', app_metadata: {} } } as never
    vi.mocked(authService.getSession).mockResolvedValue(session)
    vi.mocked(authService.onAuthChange).mockReturnValue({ unsubscribe: vi.fn() } as never)
    vi.mocked(authService.getUser).mockResolvedValue({ id: 'user-1', is_superadmin: true })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.isSuperadmin).toBe(true))
  })

  it('define unauthorized quando getUser retorna null', async () => {
    const session = { user: { email: 'a@b.com', app_metadata: {} } } as never
    vi.mocked(authService.getSession).mockResolvedValue(session)
    vi.mocked(authService.onAuthChange).mockReturnValue({ unsubscribe: vi.fn() } as never)
    vi.mocked(authService.getUser).mockResolvedValue(null)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.unauthorized).toBe(true))
  })
})
