import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useAuth } from '../../hooks/useAuth'
import * as authService from '../../services/auth'

vi.mock('../../services/auth')
vi.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true, permissions: [] })
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
    vi.mocked(authService.getUserRole).mockResolvedValue({ name: 'editor', id: 'role-1' })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.session).toBe(session)
  })

  it('define isOwner quando role é owner', async () => {
    const session = { user: { email: 'a@b.com', app_metadata: {} } } as never
    vi.mocked(authService.getSession).mockResolvedValue(session)
    vi.mocked(authService.onAuthChange).mockReturnValue({ unsubscribe: vi.fn() } as never)
    vi.mocked(authService.getUserRole).mockResolvedValue({ name: 'owner', id: 'role-2' })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.isOwner).toBe(true))
    expect(result.current.isEditor).toBe(true)
  })

  it('define unauthorized quando getUserRole retorna null', async () => {
    const session = { user: { email: 'a@b.com', app_metadata: {} } } as never
    vi.mocked(authService.getSession).mockResolvedValue(session)
    vi.mocked(authService.onAuthChange).mockReturnValue({ unsubscribe: vi.fn() } as never)
    vi.mocked(authService.getUserRole).mockResolvedValue(null)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.unauthorized).toBe(true))
  })
})
