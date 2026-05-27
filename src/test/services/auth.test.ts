import { vi } from 'vitest'
import { getSession, getUser, signOut, onAuthChange, activateUser } from '../../services/auth'
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

  describe('getUser', () => {
    it('retorna user com is_superadmin da tabela users', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'u1', activated: true, is_superadmin: true }, error: null }),
          }),
        }),
      })
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await getUser(mockSession('test@test.com'))
      expect(result).toEqual({ id: 'u1', is_superadmin: true })
      expect(mockFrom).toHaveBeenCalledWith('users')
    })
  })
})

  describe('onAuthChange', () => {
    it('subscribes to auth state changes', () => {
      const cb = vi.fn()
      const sub = onAuthChange(cb)
      expect(sub).toHaveProperty('unsubscribe')
    })
  })

  describe('activateUser', () => {
    it('atualiza activated para true', async () => {
      const mockChain = { update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }) }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)
      await activateUser('test@test.com')
      expect(mockChain.update).toHaveBeenCalledWith({ activated: true })
    })
  })
