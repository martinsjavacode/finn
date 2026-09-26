import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  fetchNegotiations,
  fetchNegotiatedInvoices,
  fetchNegotiationInstallments,
  createNegotiation,
  cancelNegotiation,
  isInvoiceNegotiated,
  fetchPendingInvoices,
} from '../../services/negotiations'
import { supabase } from '../../lib/supabase'

describe('negotiations service', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('fetchNegotiations', () => {
    it('queries invoice_negotiations by account_id', async () => {
      await fetchNegotiations('acc-1')
      expect(supabase.from).toHaveBeenCalledWith('invoice_negotiations')
    })

    it('returns data array', async () => {
      const { data } = await fetchNegotiations('acc-1')
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('fetchNegotiatedInvoices', () => {
    it('queries negotiated_invoices by negotiation_id', async () => {
      await fetchNegotiatedInvoices('neg-1')
      expect(supabase.from).toHaveBeenCalledWith('negotiated_invoices')
    })

    it('returns data array', async () => {
      const { data } = await fetchNegotiatedInvoices('neg-1')
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('fetchNegotiationInstallments', () => {
    it('queries entries by negotiation_id and account_id', async () => {
      await fetchNegotiationInstallments('neg-1', 'acc-1')
      expect(supabase.from).toHaveBeenCalledWith('entries')
    })

    it('returns data array', async () => {
      const { data } = await fetchNegotiationInstallments('neg-1', 'acc-1')
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('createNegotiation', () => {
    it('inserts into invoice_negotiations', async () => {
      const input = {
        account_id: 'acc-1',
        card: 'nubank',
        total_amount: 5000,
        installments: 12,
        first_month: '2026-10-01',
        invoices: [{ card: 'nubank', month: '2026-07-01' }],
      }

      // Mock para retornar o id da negociação criada
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'neg-1' }, error: null }),
      } as never)

      await createNegotiation(input)
      expect(supabase.from).toHaveBeenCalledWith('invoice_negotiations')
    })

    it('inserts negotiated_invoices after creating negotiation', async () => {
      const input = {
        account_id: 'acc-1',
        card: 'nubank',
        total_amount: 5000,
        installments: 12,
        first_month: '2026-10-01',
        invoices: [
          { card: 'nubank', month: '2026-07-01' },
          { card: 'nubank', month: '2026-08-01' },
        ],
      }

      // Mock para retornar o id da negociação criada
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'neg-1' }, error: null }),
      } as never)

      await createNegotiation(input)
      expect(supabase.from).toHaveBeenCalledWith('negotiated_invoices')
    })

    it('returns error when negotiation insert fails', async () => {
      const input = {
        account_id: 'acc-1',
        card: 'nubank',
        total_amount: 5000,
        installments: 12,
        first_month: '2026-10-01',
        invoices: [{ card: 'nubank', month: '2026-07-01' }],
      }

      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      } as never)

      const result = await createNegotiation(input)
      expect(result.error).toBeTruthy()
    })

    it('rolls back negotiation when inserting invoices fails', async () => {
      const input = {
        account_id: 'acc-1',
        card: 'nubank',
        total_amount: 5000,
        installments: 12,
        first_month: '2026-10-01',
        invoices: [{ card: 'nubank', month: '2026-07-01' }],
      }

      // First call: create negotiation succeeds
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'neg-1' }, error: null }),
      } as never)

      // Second call: insert invoices fails
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: { message: 'Invoice insert failed' } }),
      } as never)

      // Third call: rollback delete
      vi.mocked(supabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      } as never)

      const result = await createNegotiation(input)
      expect(result.error).toBeTruthy()
      expect(supabase.from).toHaveBeenCalledTimes(3)
    })
  })

  describe('cancelNegotiation', () => {
    it('deletes from invoice_negotiations by id and account_id', async () => {
      await cancelNegotiation('neg-1', 'acc-1')
      expect(supabase.from).toHaveBeenCalledWith('invoice_negotiations')
    })
  })

  describe('isInvoiceNegotiated', () => {
    it('queries negotiated_invoices with join to check account', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as never)

      await isInvoiceNegotiated('nubank', '2026-07-01', 'acc-1')
      expect(supabase.from).toHaveBeenCalledWith('negotiated_invoices')
    })

    it('returns false when no data', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as never)

      const result = await isInvoiceNegotiated('nubank', '2026-07-01', 'acc-1')
      expect(result).toBe(false)
    })

    it('returns true when invoice is found', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: 'inv-1' }], error: null }),
      } as never)

      const result = await isInvoiceNegotiated('nubank', '2026-07-01', 'acc-1')
      expect(result).toBe(true)
    })
  })

  describe('fetchPendingInvoices', () => {
    it('returns empty array when no entries found', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as never)

      const result = await fetchPendingInvoices('nubank', 'acc-1')
      expect(result).toEqual([])
    })

    it('returns pending invoices with calculated totals', async () => {
      // Mock entries query
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ 
          data: [{ month: '2026-07-15' }], 
          error: null 
        }),
      } as never)

      // Mock month entries query for total
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ 
          data: [{ amount: 500 }, { amount: 300 }], 
          error: null 
        }),
      } as never)

      // Mock card_invoices query for paid amount
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { paid_amount: 200 }, 
          error: null 
        }),
      } as never)

      // Mock isInvoiceNegotiated check
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as never)

      const result = await fetchPendingInvoices('nubank', 'acc-1')
      expect(result).toHaveLength(1)
      expect(result[0].month).toBe('2026-07-01')
      expect(result[0].total).toBe(600) // 800 - 200 paid
    })

    it('excludes fully paid invoices', async () => {
      // Mock entries query
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ 
          data: [{ month: '2026-07-15' }], 
          error: null 
        }),
      } as never)

      // Mock month entries query - total is 500
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ 
          data: [{ amount: 500 }], 
          error: null 
        }),
      } as never)

      // Mock card_invoices query - fully paid (500)
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { paid_amount: 500 }, 
          error: null 
        }),
      } as never)

      // isInvoiceNegotiated is called regardless of paid status
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as never)

      const result = await fetchPendingInvoices('nubank', 'acc-1')
      expect(result).toHaveLength(0)
    })

    it('handles multiple months with mixed states', async () => {
      // Mock entries query - two different months
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ 
          data: [{ month: '2026-07-15' }, { month: '2026-08-10' }], 
          error: null 
        }),
      } as never)

      // First month: July - total 300, paid 0, not negotiated -> pending
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ 
          data: [{ amount: 300 }], 
          error: null 
        }),
      } as never)

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, // no payment
          error: null 
        }),
      } as never)

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as never)

      // Second month: August - total 200, paid 200, not negotiated -> NOT pending (fully paid)
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ 
          data: [{ amount: 200 }], 
          error: null 
        }),
      } as never)

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { paid_amount: 200 },
          error: null 
        }),
      } as never)

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as never)

      const result = await fetchPendingInvoices('nubank', 'acc-1')
      expect(result).toHaveLength(1)
      expect(result[0].month).toBe('2026-07-01')
      expect(result[0].total).toBe(300)
    })

    it('excludes already negotiated invoices', async () => {
      // Mock entries query
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ 
          data: [{ month: '2026-07-15' }], 
          error: null 
        }),
      } as never)

      // Mock month entries query
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ 
          data: [{ amount: 500 }], 
          error: null 
        }),
      } as never)

      // Mock card_invoices query - not paid
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: null 
        }),
      } as never)

      // Mock isInvoiceNegotiated - already negotiated
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: 'neg-1' }], error: null }),
      } as never)

      const result = await fetchPendingInvoices('nubank', 'acc-1')
      expect(result).toHaveLength(0)
    })
  })
})
