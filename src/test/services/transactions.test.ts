import { vi } from 'vitest'
import { fetchTransactions, fetchCreditCards, fetchAvailableMonths, toggleTransactionPaid } from '../../services/transactions'
import { supabase } from '../../lib/supabase'

describe('transactions service', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('fetchTransactions', () => {
    it('queries com range correto do mês', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation(cb => cb({ data: [{ id: '1', description: 'Test' }], error: null })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchTransactions('2026-03')
      expect(supabase.from).toHaveBeenCalledWith('transactions')
      expect(mockChain.select).toHaveBeenCalledWith('*, categories(*)')
      expect(mockChain.gte).toHaveBeenCalledWith('month', '2026-03-01')
      expect(mockChain.lt).toHaveBeenCalledWith('month', '2026-04-01')
      expect(result.data).toHaveLength(1)
    })

    it('retorna array vazio quando data é null', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation(cb => cb({ data: null, error: null })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchTransactions('2026-03')
      expect(result.data).toEqual([])
    })
  })

  describe('fetchCreditCards', () => {
    it('queries credit_cards com range correto', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation(cb => cb({ data: [], error: null })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      await fetchCreditCards('2026-12')
      expect(supabase.from).toHaveBeenCalledWith('credit_cards')
      expect(mockChain.gte).toHaveBeenCalledWith('month', '2026-12-01')
      expect(mockChain.lt).toHaveBeenCalledWith('month', '2027-01-01')
    })
  })

  describe('fetchAvailableMonths', () => {
    it('retorna meses únicos ordenados', async () => {
      let callCount = 0
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation(cb => {
          callCount++
          if (callCount === 1) return cb({ data: [{ month: '2026-03-15' }, { month: '2026-01-10' }], error: null })
          return cb({ data: [{ month: '2026-03-20' }, { month: '2026-02-05' }], error: null })
        }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchAvailableMonths()
      expect(result).toEqual(['2026-01', '2026-02', '2026-03'])
    })
  })

  describe('toggleTransactionPaid', () => {
    it('inverte o status paid', async () => {
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      await toggleTransactionPaid('abc', true)
      expect(mockChain.update).toHaveBeenCalledWith({ paid: false })
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'abc')
    })
  })
})
