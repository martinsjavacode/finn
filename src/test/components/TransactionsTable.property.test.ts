import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Feature: batch-payment-transactions, Property 1: Apenas lançamentos pendentes são selecionáveis

/**
 * This test verifies at the logic level that only transactions with `paid === false`
 * are considered selectable. The computation mirrors TransactionsPage's `visiblePendingIds`:
 *   visiblePendingIds = transactions.filter(r => !r.paid).map(r => r.id)
 *
 * No transaction with `paid === true` should ever appear as selectable.
 */

interface Transaction {
  id: string
  paid: boolean
  type: 'income' | 'expense'
  amount: number
  description: string
}

/**
 * Pure computation that determines which transaction IDs are selectable.
 * This mirrors the `visiblePendingIds` useMemo in TransactionsPage.
 */
function computeSelectableIds(transactions: Transaction[]): string[] {
  return transactions.filter(r => !r.paid).map(r => r.id)
}

// **Validates: Requirements 1.1, 1.3**
describe('TransactionsTable - Property Tests', () => {
  describe('Property 1: Apenas lançamentos pendentes são selecionáveis', () => {
    const transactionArb: fc.Arbitrary<Transaction> = fc.record({
      id: fc.uuid(),
      paid: fc.boolean(),
      type: fc.constantFrom('income' as const, 'expense' as const),
      amount: fc.integer({ min: 1, max: 1_000_000 }).map(n => n / 100),
      description: fc.string({ minLength: 1, maxLength: 50 }),
    })

    it('apenas IDs com paid === false aparecem como selecionáveis', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArb, { minLength: 0, maxLength: 50 }),
          (transactions) => {
            const selectableIds = computeSelectableIds(transactions)
            const selectableSet = new Set(selectableIds)

            // Every selectable ID must correspond to a transaction with paid === false
            for (const id of selectableIds) {
              const tx = transactions.find(t => t.id === id)
              expect(tx).toBeDefined()
              expect(tx!.paid).toBe(false)
            }

            // No transaction with paid === true should be in the selectable set
            for (const tx of transactions) {
              if (tx.paid === true) {
                expect(selectableSet.has(tx.id)).toBe(false)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('nenhuma transação com paid === true aparece como selecionável', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArb, { minLength: 1, maxLength: 50 }),
          (transactions) => {
            const selectableIds = new Set(computeSelectableIds(transactions))
            const paidTransactions = transactions.filter(t => t.paid === true)

            // None of the paid transactions should be selectable
            for (const tx of paidTransactions) {
              expect(selectableIds.has(tx.id)).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('todas as transações pendentes são selecionáveis', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArb, { minLength: 1, maxLength: 50 }),
          (transactions) => {
            const selectableIds = new Set(computeSelectableIds(transactions))
            const pendingTransactions = transactions.filter(t => t.paid === false)

            // All pending transactions must be selectable
            for (const tx of pendingTransactions) {
              expect(selectableIds.has(tx.id)).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('o conjunto de selecionáveis é exatamente o conjunto de pendentes', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArb, { minLength: 0, maxLength: 50 }),
          (transactions) => {
            const selectableIds = computeSelectableIds(transactions)
            const pendingIds = transactions.filter(t => !t.paid).map(t => t.id)

            // The selectable set must be exactly equal to the pending set
            expect(selectableIds.length).toBe(pendingIds.length)
            expect(new Set(selectableIds)).toEqual(new Set(pendingIds))
          }
        ),
        { numRuns: 100 }
      )
    })

    it('lista com apenas transações pagas resulta em zero selecionáveis', () => {
      const paidOnlyArb: fc.Arbitrary<Transaction> = fc.record({
        id: fc.uuid(),
        paid: fc.constant(true as boolean),
        type: fc.constantFrom('income' as const, 'expense' as const),
        amount: fc.integer({ min: 1, max: 1_000_000 }).map(n => n / 100),
        description: fc.string({ minLength: 1, maxLength: 50 }),
      })

      fc.assert(
        fc.property(
          fc.array(paidOnlyArb, { minLength: 1, maxLength: 30 }),
          (transactions) => {
            const selectableIds = computeSelectableIds(transactions)
            expect(selectableIds.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('lista com apenas transações pendentes resulta em todos selecionáveis', () => {
      const pendingOnlyArb: fc.Arbitrary<Transaction> = fc.record({
        id: fc.uuid(),
        paid: fc.constant(false as boolean),
        type: fc.constantFrom('income' as const, 'expense' as const),
        amount: fc.integer({ min: 1, max: 1_000_000 }).map(n => n / 100),
        description: fc.string({ minLength: 1, maxLength: 50 }),
      })

      fc.assert(
        fc.property(
          fc.array(pendingOnlyArb, { minLength: 1, maxLength: 30 }),
          (transactions) => {
            const selectableIds = computeSelectableIds(transactions)
            expect(selectableIds.length).toBe(transactions.length)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
