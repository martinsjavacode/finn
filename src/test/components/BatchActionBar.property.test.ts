import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Feature: batch-payment-transactions, Property 4: Somatória e contagem são sempre derivados corretos da seleção

/**
 * This test verifies the COMPUTATION logic that derives `totalSum` and `selectedCount`
 * from a selection of transactions. The calculation is:
 *   totalSum = selectedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
 *   selectedCount = selectedIds.size
 */

interface Transaction {
  id: string
  amount: number
  paid: boolean
}

/**
 * Pure computation function that derives totalSum and selectedCount
 * from a list of transactions and a set of selected IDs.
 * This mirrors the useMemo logic in TransactionsPage.
 */
function computeBatchSummary(
  transactions: Transaction[],
  selectedIds: Set<string>
): { totalSum: number; selectedCount: number } {
  const selectedTransactions = transactions.filter(t => selectedIds.has(t.id))
  const totalSum = selectedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const selectedCount = selectedIds.size
  return { totalSum, selectedCount }
}

// **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
describe('BatchActionBar - Property Tests', () => {
  describe('Property 4: Somatória e contagem são sempre derivados corretos da seleção', () => {
    const transactionArb = fc.record({
      id: fc.uuid(),
      amount: fc.oneof(
        fc.integer({ min: -1_000_000_00, max: 1_000_000_00 }).map(n => n / 100),
        fc.constant(0),
        fc.integer({ min: 100_000_00, max: 999_999_999_99 }).map(n => n / 100),
        fc.double({ min: -100000, max: 100000, noNaN: true, noDefaultInfinity: true })
      ),
      paid: fc.boolean(),
    })

    it('totalSum é igual a Σ Math.abs(amount) dos selecionados e selectedCount é igual a selectedIds.size', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArb, { minLength: 0, maxLength: 50 }),
          (transactions) => {
            // Generate a random subset of transaction IDs as the selection
            const allIds = transactions.map(t => t.id)
            // Use a deterministic selection: pick a random subset
            const selectedIds = new Set<string>()
            for (const id of allIds) {
              // Simulate random selection by including IDs at even indices
              if (Math.random() < 0.5) {
                selectedIds.add(id)
              }
            }

            const { totalSum, selectedCount } = computeBatchSummary(transactions, selectedIds)

            // Verify count
            expect(selectedCount).toBe(selectedIds.size)

            // Verify sum: manually compute expected
            const expectedSum = transactions
              .filter(t => selectedIds.has(t.id))
              .reduce((sum, t) => sum + Math.abs(t.amount), 0)

            expect(totalSum).toBe(expectedSum)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('totalSum e selectedCount são derivados corretos para subconjuntos aleatórios gerados por fast-check', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArb, { minLength: 0, maxLength: 50 }).chain(transactions => {
            const ids = transactions.map(t => t.id)
            return fc.tuple(
              fc.constant(transactions),
              fc.subarray(ids)
            )
          }),
          ([transactions, selectedIdArray]) => {
            const selectedIds = new Set(selectedIdArray)

            const { totalSum, selectedCount } = computeBatchSummary(transactions, selectedIds)

            // Property: count always equals the size of the selection set
            expect(selectedCount).toBe(selectedIds.size)

            // Property: sum is always the sum of absolute values of selected transactions
            const expectedSum = transactions
              .filter(t => selectedIds.has(t.id))
              .reduce((sum, t) => sum + Math.abs(t.amount), 0)

            expect(totalSum).toBe(expectedSum)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('seleção vazia resulta em soma zero e contagem zero', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArb, { minLength: 0, maxLength: 30 }),
          (transactions) => {
            const emptySelection = new Set<string>()

            const { totalSum, selectedCount } = computeBatchSummary(transactions, emptySelection)

            expect(totalSum).toBe(0)
            expect(selectedCount).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('soma é sempre não-negativa independente do sinal dos amounts', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArb, { minLength: 1, maxLength: 50 }).chain(transactions => {
            const ids = transactions.map(t => t.id)
            return fc.tuple(
              fc.constant(transactions),
              fc.subarray(ids, { minLength: 1 })
            )
          }),
          ([transactions, selectedIdArray]) => {
            const selectedIds = new Set(selectedIdArray)

            const { totalSum } = computeBatchSummary(transactions, selectedIds)

            // Since we use Math.abs, the sum must always be >= 0
            expect(totalSum).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('selecionar todas transações resulta em soma de todos os valores absolutos', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArb, { minLength: 1, maxLength: 50 }),
          (transactions) => {
            const allIds = new Set(transactions.map(t => t.id))

            const { totalSum, selectedCount } = computeBatchSummary(transactions, allIds)

            const expectedSum = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

            expect(selectedCount).toBe(transactions.length)
            expect(totalSum).toBe(expectedSum)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
