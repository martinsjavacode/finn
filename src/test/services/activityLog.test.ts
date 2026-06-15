import { vi } from 'vitest'
import { recordActivity, fetchActivityLogs } from '../../services/activityLog'
import { supabase } from '../../lib/supabase'

describe('activityLog service', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('recordActivity', () => {
    it('inserts into activity_logs with correct params', async () => {
      const mockChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      await recordActivity({
        actionType: 'member_added',
        actorEmail: 'admin@test.com',
        accountId: 'acc-1',
        accountName: 'Pessoal',
        details: { affectedUserEmail: 'user@test.com' },
      })

      expect(supabase.from).toHaveBeenCalledWith('activity_logs')
      expect(mockChain.insert).toHaveBeenCalledWith({
        action_type: 'member_added',
        actor_email: 'admin@test.com',
        account_id: 'acc-1',
        account_name: 'Pessoal',
        details: { affectedUserEmail: 'user@test.com' },
      })
    })

    it('defaults accountId and accountName to null when not provided', async () => {
      const mockChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      await recordActivity({
        actionType: 'migration',
        actorEmail: 'admin@test.com',
        details: {},
      })

      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ account_id: null, account_name: null }),
      )
    })
  })

  describe('fetchActivityLogs', () => {
    it('queries with order, range and no filters', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null, count: 1 }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchActivityLogs({ page: 1, perPage: 10 })

      expect(supabase.from).toHaveBeenCalledWith('activity_logs')
      expect(mockChain.select).toHaveBeenCalledWith('*', { count: 'exact' })
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockChain.range).toHaveBeenCalledWith(0, 9)
      expect(result).toEqual({ data: [{ id: '1' }], error: null, count: 1 })
    })

    it('applies actionType filter', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      await fetchActivityLogs({ actionType: 'migration', page: 1, perPage: 10 })

      expect(mockChain.eq).toHaveBeenCalledWith('action_type', 'migration')
    })

    it('applies accountId filter', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      await fetchActivityLogs({ accountId: 'acc-1', page: 2, perPage: 5 })

      expect(mockChain.eq).toHaveBeenCalledWith('account_id', 'acc-1')
      expect(mockChain.range).toHaveBeenCalledWith(5, 9)
    })
  })
})
