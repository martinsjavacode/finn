import { vi } from 'vitest'
import { getSession, getUserRole, signOut } from '../../services/auth'
import { supabase } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'

const mockSession = (email: string): Session => ({
  access_token: 'token',
  refresh_token: 'refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: '1',
    email,
    aud: 'authenticated',
    created_at: '',
    app_metadata: {},
    user_metadata: {},
    identities: [],
  },
})

describe('auth service', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getSession', () => {
    it('retorna session do supabase', async () => {
      const session = mockSession('a@b.com')
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

  describe('getUserRole', () => {
    it('retorna role da tabela users via join com roles', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { role_id: 'r1', activated: true, roles: { name: 'editor' } }, error: null }),
          }),
        }),
      })
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await getUserRole(mockSession('test@test.com'))
      expect(result).toEqual({ name: 'editor', id: 'r1' })
      expect(mockFrom).toHaveBeenCalledWith('users')
    })
  })
})
