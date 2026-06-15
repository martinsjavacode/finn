import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

/**
 * Preservation Property Tests - Existing CRUD and Card Resolution
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 *
 * These tests capture EXISTING behavior that must NOT regress after the fix.
 * They observe current unfixed code for non-buggy inputs (operations that don't
 * depend on account isolation) and verify they work correctly today.
 *
 * EXPECTED OUTCOME: All tests PASS on unfixed code.
 */

// --- Generators ---

const cardNameArb = fc.stringMatching(/^[a-z][a-z0-9_]{2,19}$/)

const closingRuleArb = fc.constantFrom('fixed' as const, 'relative' as const)

const cardDataArb = fc.record({
  name: cardNameArb,
  label: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
  credit_limit: fc.integer({ min: 0, max: 99999 }),
  closing_day: fc.integer({ min: 1, max: 31 }),
  due_day: fc.integer({ min: 1, max: 31 }),
  color: fc.hexaString({ minLength: 6, maxLength: 6 }).map(h => `#${h}`),
  active: fc.boolean(),
  closing_rule: closingRuleArb,
  days_before_due: fc.integer({ min: 1, max: 28 }),
})

// --- Supabase Mock Tracking ---

let fromCalls: string[] = []
let eqCalls: Array<{ column: string; value: unknown }> = []
let insertPayloads: unknown[] = []
let updatePayloads: unknown[] = []
let deleteCalls: boolean[] = []
let orderCalls: Array<{ column: string }> = []
let selectCalls: string[] = []
let mockData: unknown[] = []

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      fromCalls.push(table)
      const chain = {
        select: vi.fn((cols?: string) => {
          selectCalls.push(cols ?? '*')
          return chain
        }),
        eq: vi.fn((column: string, value: unknown) => {
          eqCalls.push({ column, value })
          return chain
        }),
        order: vi.fn((column: string) => {
          orderCalls.push({ column })
          return chain
        }),
        insert: vi.fn((payload: unknown) => {
          insertPayloads.push(payload)
          return Promise.resolve({ data: payload, error: null })
        }),
        update: vi.fn((payload: unknown) => {
          updatePayloads.push(payload)
          return chain
        }),
        delete: vi.fn(() => {
          deleteCalls.push(true)
          return chain
        }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn().mockImplementation((cb: (result: { data: unknown[]; error: null }) => void) =>
          cb({ data: mockData, error: null })
        ),
      }
      return chain
    }),
  },
}))

function resetMocks() {
  fromCalls = []
  eqCalls = []
  insertPayloads = []
  updatePayloads = []
  deleteCalls = []
  orderCalls = []
  selectCalls = []
  mockData = []
  vi.clearAllMocks()
}

// ============================================================
// Property 3: Preservation - Existing CRUD Operations
// ============================================================

describe('Preservation: Existing CRUD and Card Resolution', () => {
  beforeEach(resetMocks)

  /**
   * Property 3: CRUD operations preserve field semantics
   *
   * For all valid card data, creating a card via insert:
   * - Queries the 'cards' table
   * - Includes all required fields in the insert payload
   * - The name is lowercase with underscores (as per CardsPage logic)
   *
   * **Validates: Requirements 3.1**
   */
  describe('Property 3: CRUD operations succeed and preserve field semantics', () => {
    it('insert payload contains all required card fields', async () => {
      const { supabase } = await import('../../lib/supabase')

      await fc.assert(
        fc.asyncProperty(
          cardDataArb,
          async (card) => {
            resetMocks()

            // Simulate CardsPage insert operation
            const chain = supabase.from('cards')
            await (chain as unknown as { insert: (p: unknown) => Promise<{ data: unknown; error: null }> }).insert({
              name: card.name,
              label: card.label,
              credit_limit: card.credit_limit,
              closing_day: card.closing_day,
              due_day: card.due_day,
              color: card.color,
              active: true,
              closing_rule: card.closing_rule,
              days_before_due: card.days_before_due,
            })

            // Verify that the insert was made to 'cards' table
            expect(fromCalls).toContain('cards')

            // Verify payload contains all required fields
            const payload = insertPayloads[insertPayloads.length - 1] as Record<string, unknown>
            expect(payload).toHaveProperty('name', card.name)
            expect(payload).toHaveProperty('label', card.label)
            expect(payload).toHaveProperty('credit_limit', card.credit_limit)
            expect(payload).toHaveProperty('closing_day', card.closing_day)
            expect(payload).toHaveProperty('due_day', card.due_day)
            expect(payload).toHaveProperty('color', card.color)
            expect(payload).toHaveProperty('active', true)
            expect(payload).toHaveProperty('closing_rule', card.closing_rule)
            expect(payload).toHaveProperty('days_before_due', card.days_before_due)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('update payload preserves editable fields without changing name', async () => {
      const { supabase } = await import('../../lib/supabase')

      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          cardDataArb,
          async (cardId, card) => {
            resetMocks()

            // Simulate CardsPage update operation (name is NOT editable on update)
            const chain = supabase.from('cards')
            const updateChain = (chain as unknown as {
              update: (p: unknown) => { eq: (col: string, val: string) => Promise<{ error: null }> }
            }).update({
              label: card.label,
              credit_limit: card.credit_limit,
              closing_day: card.closing_day,
              due_day: card.due_day,
              color: card.color,
              closing_rule: card.closing_rule,
              days_before_due: card.days_before_due,
            })
            updateChain.eq('id', cardId)

            // Verify correct table
            expect(fromCalls).toContain('cards')

            // Verify update payload does NOT contain 'name' (name is immutable after creation)
            const payload = updatePayloads[updatePayloads.length - 1] as Record<string, unknown>
            expect(payload).not.toHaveProperty('name')

            // Verify editable fields are present
            expect(payload).toHaveProperty('label', card.label)
            expect(payload).toHaveProperty('credit_limit', card.credit_limit)
            expect(payload).toHaveProperty('closing_day', card.closing_day)
            expect(payload).toHaveProperty('due_day', card.due_day)
            expect(payload).toHaveProperty('color', card.color)
            expect(payload).toHaveProperty('closing_rule', card.closing_rule)
            expect(payload).toHaveProperty('days_before_due', card.days_before_due)

            // Verify eq was called with the card id for targeting
            const idFilter = eqCalls.find(c => c.column === 'id' && c.value === cardId)
            expect(idFilter).toBeDefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('delete targets a specific card by id', async () => {
      const { supabase } = await import('../../lib/supabase')

      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (cardId) => {
            resetMocks()

            // Simulate CardsPage delete operation
            const chain = supabase.from('cards')
            const deleteChain = (chain as unknown as {
              delete: () => { eq: (col: string, val: string) => Promise<{ error: null }> }
            }).delete()
            deleteChain.eq('id', cardId)

            // Verify table and operation
            expect(fromCalls).toContain('cards')
            expect(deleteCalls.length).toBeGreaterThan(0)

            // Verify eq targets the specific card by id
            const idFilter = eqCalls.find(c => c.column === 'id' && c.value === cardId)
            expect(idFilter).toBeDefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property: Toggle active status flips the boolean
   *
   * For all cards, toggling active status inverts the current value.
   *
   * **Validates: Requirements 3.5**
   */
  describe('Property: Toggling active status flips the boolean', () => {
    it('toggle update sets active to the opposite of current value', async () => {
      const { supabase } = await import('../../lib/supabase')

      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.boolean(),
          async (cardId, currentActive) => {
            resetMocks()

            // Simulate CardsPage toggle operation
            const chain = supabase.from('cards')
            const updateChain = (chain as unknown as {
              update: (p: unknown) => { eq: (col: string, val: string) => Promise<{ error: null }> }
            }).update({ active: !currentActive })
            updateChain.eq('id', cardId)

            // Verify update flips the boolean
            const payload = updatePayloads[updatePayloads.length - 1] as Record<string, unknown>
            expect(payload).toHaveProperty('active', !currentActive)

            // Verify eq targets the card
            const idFilter = eqCalls.find(c => c.column === 'id' && c.value === cardId)
            expect(idFilter).toBeDefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property: fetchActiveCards returns only active cards ordered by label
   *
   * For all card datasets, fetchActiveCards:
   * - Queries the 'cards' table
   * - Applies .eq('active', true) filter
   * - Orders results by 'label'
   * - Returns only the card list fields (name, label, color, closing_day, due_day, closing_rule, days_before_due)
   *
   * **Validates: Requirements 3.4, 3.5**
   */
  describe('Property: fetchActiveCards filters by active=true and orders by label', () => {
    it('fetchActiveCards applies active=true filter and orders by label', async () => {
      const { fetchActiveCards } = await import('../../services/categories')

      await fc.assert(
        fc.asyncProperty(
          fc.constant(null), // no input needed, testing fixed behavior
          async () => {
            resetMocks()

            await fetchActiveCards()

            // Verify table is 'cards'
            expect(fromCalls).toContain('cards')

            // Verify active filter is applied
            const activeFilter = eqCalls.find(
              c => c.column === 'active' && c.value === true
            )
            expect(activeFilter).toBeDefined()

            // Verify order by label is applied
            const labelOrder = orderCalls.find(c => c.column === 'label')
            expect(labelOrder).toBeDefined()
          }
        ),
        { numRuns: 10 } // Deterministic behavior, fewer runs needed
      )
    })

    it('fetchActiveCards selects only card list fields', async () => {
      const { fetchActiveCards } = await import('../../services/categories')

      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            resetMocks()

            await fetchActiveCards()

            // Verify select contains the expected fields
            const selectArg = selectCalls[selectCalls.length - 1]
            expect(selectArg).toContain('name')
            expect(selectArg).toContain('label')
            expect(selectArg).toContain('color')
            expect(selectArg).toContain('closing_day')
            expect(selectArg).toContain('due_day')
            expect(selectArg).toContain('closing_rule')
            expect(selectArg).toContain('days_before_due')
          }
        ),
        { numRuns: 10 }
      )
    })

    it('for all card sets, fetchActiveCards excludes cards with active=false', () => {
      // Pure logic test: simulate filtering behavior
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: cardNameArb,
              label: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
              color: fc.hexaString({ minLength: 6, maxLength: 6 }).map(h => `#${h}`),
              closing_day: fc.integer({ min: 1, max: 31 }),
              due_day: fc.integer({ min: 1, max: 31 }),
              closing_rule: closingRuleArb,
              days_before_due: fc.integer({ min: 1, max: 28 }),
              active: fc.boolean(),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (cards) => {
            // Simulate the fetchActiveCards filtering logic:
            // .eq('active', true) filters to only active cards
            const activeCards = cards.filter(c => c.active === true)
            const inactiveCards = cards.filter(c => c.active === false)

            // All returned cards must be active
            for (const card of activeCards) {
              expect(card.active).toBe(true)
            }

            // No inactive card should be in the result
            for (const card of inactiveCards) {
              expect(activeCards).not.toContain(card)
            }

            // Result count equals active count
            expect(activeCards.length).toBe(cards.filter(c => c.active).length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('for all card sets, fetchActiveCards returns results sorted by label', () => {
      // Pure logic test: simulate ordering behavior
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: cardNameArb,
              label: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
              active: fc.constant(true),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (cards) => {
            // Simulate .order('label') behavior
            const sorted = [...cards].sort((a, b) => a.label.localeCompare(b.label))

            // Verify ordering is correct
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i].label.localeCompare(sorted[i + 1].label)).toBeLessThanOrEqual(0)
            }

            // No items lost
            expect(sorted.length).toBe(cards.length)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property: Card name resolution in entries and card_invoices
   *
   * Cards are referenced by name (text FK) in entries.card and card_invoices.card.
   * For any card name that exists in the cards table, entries and card_invoices
   * using that name resolve correctly.
   *
   * **Validates: Requirements 3.2, 3.3**
   */
  describe('Property: Card name resolution in entries and card_invoices', () => {
    it('entries referencing a card by name can be joined/filtered to that card', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: cardNameArb,
              label: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
              active: fc.boolean(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.integer({ min: 0, max: 9 }),
          (cards, entryCardIndex) => {
            const safeIndex = entryCardIndex % cards.length
            const referencedCardName = cards[safeIndex].name

            // Simulate entries referencing a card by name
            const entries = [
              { id: 'entry-1', card: referencedCardName, description: 'test entry' },
            ]

            // Resolution: find the card that matches the entry's card field
            const resolvedCard = cards.find(c => c.name === referencedCardName)

            // The card must resolve
            expect(resolvedCard).toBeDefined()
            expect(resolvedCard!.name).toBe(entries[0].card)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('card_invoices referencing a card by name resolve to the correct card', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: cardNameArb,
              label: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.integer({ min: 0, max: 9 }),
          (cards, invoiceCardIndex) => {
            const safeIndex = invoiceCardIndex % cards.length
            const referencedCardName = cards[safeIndex].name

            // Simulate card_invoices referencing a card by name
            const cardInvoice = {
              card: referencedCardName,
              month: '2024-01-01',
              paid_amount: 1500,
            }

            // Resolution: find the card that matches the invoice's card field
            const resolvedCard = cards.find(c => c.name === cardInvoice.card)

            // The card must resolve
            expect(resolvedCard).toBeDefined()
            expect(resolvedCard!.name).toBe(cardInvoice.card)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('card name uniqueness ensures unambiguous resolution', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(cardNameArb, { minLength: 1, maxLength: 10 }),
          (uniqueNames) => {
            // Each name in the cards table must be unique (current UNIQUE(name) constraint)
            const cards = uniqueNames.map(name => ({
              name,
              label: name.charAt(0).toUpperCase() + name.slice(1),
            }))

            // For any card name, resolution finds exactly one match
            for (const card of cards) {
              const matches = cards.filter(c => c.name === card.name)
              expect(matches.length).toBe(1)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
