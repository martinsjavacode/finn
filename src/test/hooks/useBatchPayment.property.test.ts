import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Feature: batch-payment-transactions, Property 5: Batch payment inclui apenas itens efetivamente pendentes

/**
 * Tests the filtering logic used in TransactionsPage.handlePaySelected:
 *
 *   const unpaidIds = Array.from(selectedIds).filter(id =>
 *     transactions.find(t => t.id === id && !t.paid)
 *   )
 *
 * This ensures that even if selectedIds contains IDs of already-paid transactions
 * (e.g., due to a race condition), only unpaid ones are sent to the batch mutation.
 */

interface Transaction {
  id: string
  paid: boolean
  amount: number
  description: string
  type: 'income' | 'expense'
}

// Pure filtering logic extracted from TransactionsPage.handlePaySelected
function filterUnpaidIds(selectedIds: Set<string>, transactions: Transaction[]): string[] {
  return Array.from(selectedIds).filter(id =>
    transactions.find(t => t.id === id && !t.paid)
  )
}

// Generator for a list of transactions with mixed paid states, plus a selection from those
const batchScenarioArb = fc
  .array(
    fc.record({
      id: fc.uuid(),
      paid: fc.boolean(),
      amount: fc.float({ min: Math.fround(0.01), max: Math.fround(99999), noNaN: true }),
      type: fc.constantFrom('income' as const, 'expense' as const),
    }),
    { minLength: 1, maxLength: 30 }
  )
  .chain(items => {
    const transactions: Transaction[] = items.map((item, i) => ({
      ...item,
      description: `tx-${i}`,
    }))
    const ids = transactions.map(t => t.id)
    // Generate a random subset of IDs to select (including potentially paid ones)
    return fc.subarray(ids, { minLength: 1 }).map(selected => ({
      transactions,
      selectedIds: new Set(selected),
    }))
  })

describe('useBatchPayment - Property Tests', () => {
  // **Validates: Requirements 4.1, 4.7**
  describe('Property 5: Batch payment inclui apenas itens efetivamente pendentes', () => {
    it('filtragem de batch inclui apenas transações com paid === false', () => {
      fc.assert(
        fc.property(
          batchScenarioArb,
          ({ transactions, selectedIds }) => {
            const result = filterUnpaidIds(selectedIds, transactions)

            // Every ID in result must correspond to a transaction with paid === false
            for (const id of result) {
              const tx = transactions.find(t => t.id === id)
              expect(tx).toBeDefined()
              expect(tx!.paid).toBe(false)
            }

            // Every selected ID that has paid === false must be in the result
            for (const id of selectedIds) {
              const tx = transactions.find(t => t.id === id)
              if (tx && !tx.paid) {
                expect(result).toContain(id)
              }
            }

            // No ID with paid === true should be in the result
            for (const id of result) {
              const tx = transactions.find(t => t.id === id)
              expect(tx!.paid).not.toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('quando todos os selecionados já estão pagos, resultado é vazio', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.uuid(), { minLength: 1, maxLength: 20 }),
          (ids) => {
            // All transactions are paid
            const transactions: Transaction[] = ids.map(id => ({
              id,
              paid: true,
              amount: 100,
              description: 'paid-tx',
              type: 'expense' as const,
            }))
            const selectedIds = new Set(ids)

            const result = filterUnpaidIds(selectedIds, transactions)

            expect(result).toHaveLength(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('quando todos os selecionados estão pendentes, todos são incluídos no batch', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.uuid(), { minLength: 1, maxLength: 20 }),
          (ids) => {
            // All transactions are unpaid
            const transactions: Transaction[] = ids.map(id => ({
              id,
              paid: false,
              amount: 50,
              description: 'pending-tx',
              type: 'income' as const,
            }))
            const selectedIds = new Set(ids)

            const result = filterUnpaidIds(selectedIds, transactions)

            expect(result).toHaveLength(ids.length)
            for (const id of ids) {
              expect(result).toContain(id)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('IDs selecionados que não existem na lista de transações são excluídos', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.uuid(), { minLength: 1, maxLength: 10 }),
          fc.uniqueArray(fc.uuid(), { minLength: 1, maxLength: 10 }),
          (existingIds, extraIds) => {
            // Create unpaid transactions only for existingIds
            const transactions: Transaction[] = existingIds.map(id => ({
              id,
              paid: false,
              amount: 75,
              description: 'existing-tx',
              type: 'expense' as const,
            }))

            // Select both existing and non-existing IDs
            const selectedIds = new Set([...existingIds, ...extraIds])

            const result = filterUnpaidIds(selectedIds, transactions)

            // Only existing (and unpaid) IDs should be in the result
            for (const id of result) {
              expect(existingIds).toContain(id)
            }
            // No extra IDs should be present
            for (const id of extraIds) {
              if (!existingIds.includes(id)) {
                expect(result).not.toContain(id)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
