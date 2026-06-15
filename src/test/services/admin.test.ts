import { vi } from 'vitest'
import { fetchAllAccounts, createAccount, updateAccount, deleteAccount, fetchMembers, addMember, updateMemberRole, removeMember, fetchMigrationItems, searchUsers } from '../../services/admin'
import { supabase } from '../../lib/supabase'

describe('admin service', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('fetchAllAccounts', () => {
    it('returns accounts with member_count', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: 'a1', name: 'Personal', account_members: [{ id: 'm1' }, { id: 'm2' }] }],
          error: null,
        }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchAllAccounts()
      expect(result.data).toEqual([{ id: 'a1', name: 'Personal', account_members: undefined, member_count: 2 }])
    })

    it('returns error when query fails', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchAllAccounts()
      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: 'fail' })
    })
  })

  describe('createAccount', () => {
    it('inserts and returns single', async () => {
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new', name: 'A', color: '#fff' }, error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await createAccount('A', '#fff')
      expect(supabase.from).toHaveBeenCalledWith('accounts')
      expect(mockChain.insert).toHaveBeenCalledWith({ name: 'A', color: '#fff' })
      expect(result.data).toEqual({ id: 'new', name: 'A', color: '#fff' })
    })
  })

  describe('updateAccount', () => {
    it('updates by id', async () => {
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      await updateAccount('a1', { name: 'Updated' })
      expect(mockChain.update).toHaveBeenCalledWith({ name: 'Updated' })
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'a1')
    })
  })

  describe('deleteAccount', () => {
    it('deletes by id', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      await deleteAccount('a1')
      expect(supabase.from).toHaveBeenCalledWith('accounts')
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'a1')
    })
  })

  describe('fetchMembers', () => {
    it('maps members correctly', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{
            user_id: 'u1',
            role_id: 'r1',
            users: { email: 'a@b.com', display_name: 'Alice' },
            roles: { name: 'editor' },
          }],
          error: null,
        }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchMembers('acc-1')
      expect(result.data).toEqual([{
        userId: 'u1',
        email: 'a@b.com',
        displayName: 'Alice',
        roleId: 'r1',
        roleName: 'editor',
      }])
    })

    it('returns error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchMembers('acc-1')
      expect(result.data).toBeNull()
    })
  })

  describe('addMember', () => {
    it('inserts member with correct params', async () => {
      const mockChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      await addMember('acc-1', 'u1', 'r1')
      expect(supabase.from).toHaveBeenCalledWith('account_members')
      expect(mockChain.insert).toHaveBeenCalledWith({ account_id: 'acc-1', user_id: 'u1', role_id: 'r1' })
    })
  })

  describe('updateMemberRole', () => {
    it('updates role for specific account+user', async () => {
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }
      // chain: .eq('account_id').eq('user_id') -> resolve
      mockChain.eq.mockReturnValueOnce(mockChain as never).mockResolvedValueOnce({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      await updateMemberRole('acc-1', 'u1', 'r2')
      expect(mockChain.update).toHaveBeenCalledWith({ role_id: 'r2' })
      expect(mockChain.eq).toHaveBeenCalledWith('account_id', 'acc-1')
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'u1')
    })
  })

  describe('removeMember', () => {
    it('deletes member for specific account+user', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }
      mockChain.eq.mockReturnValueOnce(mockChain as never).mockResolvedValueOnce({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      await removeMember('acc-1', 'u1')
      expect(supabase.from).toHaveBeenCalledWith('account_members')
      expect(mockChain.eq).toHaveBeenCalledWith('account_id', 'acc-1')
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'u1')
    })
  })

  describe('fetchMigrationItems', () => {
    it('fetches entries and maps them', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: 'e1', description: 'Aluguel', amount: '1500.00', month: '2026-03', category: 'cat1', categories: { name: 'Moradia' } }],
          error: null,
        }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchMigrationItems('acc-1', 'entries')
      expect(result.data).toEqual([{
        id: 'e1', description: 'Aluguel', amount: 1500, date: '2026-03', categoryId: 'cat1', category: 'Moradia',
      }])
    })

    it('fetches installments and maps them', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: 'p1', description: 'iPhone', total_amount: '6000', installments: 12, card: 'Nubank', categories: { name: 'Tech' } }],
          error: null,
        }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchMigrationItems('acc-1', 'installments')
      expect(result.data).toEqual([{
        id: 'p1', description: 'iPhone', amount: 6000, installmentsCount: 12, card: 'Nubank', category: 'Tech',
      }])
    })

    it('fetches budgets and maps them', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'b1', monthly_limit: '1200', category: 'cat2', categories: { name: 'Alimentação' } }],
          error: null,
        }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchMigrationItems('acc-1', 'budgets')
      expect(result.data).toEqual([{
        id: 'b1', description: 'Alimentação', amount: 1200, categoryId: 'cat2', category: 'Alimentação', monthlyLimit: 1200,
      }])
    })

    it('returns error on query failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchMigrationItems('acc-1', 'entries')
      expect(result.data).toBeNull()
    })
  })

  describe('searchUsers', () => {
    it('searches users by email with ilike', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: 'u1', email: 'test@a.com' }], error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await searchUsers('test')
      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(mockChain.ilike).toHaveBeenCalledWith('email', '%test%')
      expect(mockChain.limit).toHaveBeenCalledWith(10)
      expect(result.data).toEqual([{ id: 'u1', email: 'test@a.com' }])
    })
  })
})
