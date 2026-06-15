import { vi } from 'vitest'
import { fetchTransactions, fetchCreditCards, fetchAvailableMonths, toggleTransactionPaid, insertTransaction, insertCreditCard, updateTransaction, deleteTransaction, batchMarkTransactionsPaid } from '../../services/transactions'
import { supabase } from '../../lib/supabase'

describe('transactions service', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('fetchTransactions', () => {
    it('queries entries com range correto do mês', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation(cb => cb({ data: [{ id: '1', description: 'Test' }], error: null })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchTransactions('2026-03')
      expect(supabase.from).toHaveBeenCalledWith('entries')
      expect(mockChain.neq).toHaveBeenCalledWith('payment_method', 'credit_card')
      expect(mockChain.gte).toHaveBeenCalledWith('month', '2026-03-01')
      expect(mockChain.lt).toHaveBeenCalledWith('month', '2026-04-01')
      expect(result.data).toHaveLength(1)
    })

    it('retorna array vazio quando data é null', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
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
    it('queries entries com payment_method credit_card', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation(cb => cb({ data: [], error: null })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      await fetchCreditCards('2026-12')
      expect(supabase.from).toHaveBeenCalledWith('entries')
      expect(mockChain.eq).toHaveBeenCalledWith('payment_method', 'credit_card')
    })
  })

  describe('fetchAvailableMonths', () => {
    it('retorna meses únicos ordenados', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation(cb => cb({ data: [{ month: '2026-03-15' }, { month: '2026-01-10' }, { month: '2026-03-20' }], error: null })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchAvailableMonths()
      expect(supabase.from).toHaveBeenCalledWith('entries')
      expect(result).toEqual(['2026-01', '2026-03'])
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
      expect(supabase.from).toHaveBeenCalledWith('entries')
      expect(mockChain.update).toHaveBeenCalledWith({ paid: false })
    })
  })
})

  describe('insertTransaction', () => {
    it('insere entry com payment_method pix', async () => {
      const mockChain = { insert: vi.fn().mockResolvedValue({ error: null }) }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const { error } = await insertTransaction({ month: '2026-05-01', description: 'Aluguel', amount: 2000, type: 'expense', category: 'c1', account_id: 'acc-1', paid: false })
      expect(error).toBeNull()
      expect(mockChain.insert).toHaveBeenCalledWith(expect.objectContaining({ payment_method: 'pix', account_id: 'acc-1' }))
    })
  })

  describe('insertCreditCard', () => {
    it('insere entry com payment_method credit_card', async () => {
      const mockChain = { insert: vi.fn().mockResolvedValue({ error: null }) }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const { error } = await insertCreditCard({ month: '2026-05-01', description: 'Netflix', amount: 45, card: 'nubank', account_id: 'acc-1' })
      expect(error).toBeNull()
      expect(mockChain.insert).toHaveBeenCalledWith(expect.objectContaining({ payment_method: 'credit_card', type: 'expense', account_id: 'acc-1' }))
    })
  })

  describe('updateTransaction', () => {
    it('atualiza entry por id', async () => {
      const mockChain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      await updateTransaction('t1', { description: 'Novo', amount: 100 })
      expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({ description: 'Novo', amount: 100 }))
      expect(mockChain.eq).toHaveBeenCalledWith('id', 't1')
    })
  })

  describe('deleteTransaction', () => {
    it('deleta entry por id', async () => {
      const mockChain = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      await deleteTransaction('t1')
      expect(supabase.from).toHaveBeenCalledWith('entries')
      expect(mockChain.eq).toHaveBeenCalledWith('id', 't1')
    })
  })

  describe('fetchAllTransactions', () => {
    it('filtra por accountId', async () => {
      const { fetchAllTransactions } = await import('../../services/transactions')
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ month: '2026-05-01', amount: 100, type: 'expense' }], error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)
      const { data } = await fetchAllTransactions('acc-1')
      expect(data).toHaveLength(1)
      expect(mockChain.eq).toHaveBeenCalledWith('account_id', 'acc-1')
    })
  })

  describe('upsertCardInvoice', () => {
    it('faz upsert com account_id', async () => {
      const { upsertCardInvoice } = await import('../../services/transactions')
      const upsertMock = vi.fn().mockResolvedValue({ error: null })
      vi.mocked(supabase.from).mockReturnValue({ upsert: upsertMock } as never)
      const { error } = await upsertCardInvoice('nubank', '2026-05', 500, 'acc-1')
      expect(error).toBeNull()
      expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ account_id: 'acc-1', paid_amount: 500 }), expect.anything())
    })
  })

  describe('batchMarkTransactionsPaid', () => {
    it('atualiza múltiplos entries como pagos', async () => {
      const mockChain = { update: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ error: null }) }
      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const { error } = await batchMarkTransactionsPaid(['t1', 't2', 't3'])
      expect(error).toBeNull()
      expect(supabase.from).toHaveBeenCalledWith('entries')
      expect(mockChain.update).toHaveBeenCalledWith({ paid: true })
      expect(mockChain.in).toHaveBeenCalledWith('id', ['t1', 't2', 't3'])
    })
  })
