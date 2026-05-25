import { vi } from 'vitest'
import { getSession, getUserRole, isGitHubUser, signOut } from '../../services/auth'
import { supabase } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'

const mockSession = (provider: string): Session => ({
  access_token: 'token',
  refresh_token: 'refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: '1',
    email: 'test@test.com',
    aud: 'authenticated',
    created_at: '',
    app_metadata: { provider },
    user_metadata: {},
    identities: [{ id: '1', user_id: '1', provider, identity_data: {}, created_at: '', updated_at: '', identity_id: '1' }],
  },
})

describe('auth service', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getSession', () => {
    it('retorna session do supabase', async () => {
      const session = mockSession('github')
      vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session }, error: null })
      const result = await getSession()
      expect(result).toBe(session)
    })
  })

  describe('signOut', () => {
    it('chama supabase.auth.signOut', async () => {
      await signOut()
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('isGitHubUser', () => {
    it('retorna true para provider github', () => {
      expect(isGitHubUser(mockSession('github'))).toBe(true)
    })

    it('retorna false para provider email', () => {
      expect(isGitHubUser(mockSession('email'))).toBe(false)
    })
  })

  describe('getUserRole', () => {
    it('retorna editor para GitHub user', async () => {
      const role = await getUserRole(mockSession('github'))
      expect(role).toBe('editor')
    })

    it('consulta access_control para email user', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { role: 'viewer' }, error: null }),
          }),
        }),
      })
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const role = await getUserRole(mockSession('email'))
      expect(role).toBe('viewer')
      expect(mockFrom).toHaveBeenCalledWith('access_control')
    })
  })
})
