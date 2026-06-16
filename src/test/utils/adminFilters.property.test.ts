import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  resolveTab,
  paginateItems,
  applyMigrationFilters,
  excludeSourceAccount,
  sortAccountsByName,
  validateAccountName,
  isExistingMember,
} from '../../utils/adminFilters'
import type { FilterableItem } from '../../utils/adminFilters'
import type { MigrationFilters } from '../../types/admin'

/**
 * Property 1: Invalid Tab Parameter Fallback
 * For any string that is NOT "migration", "accounts", or "activity",
 * resolveTab returns "migration". Also null → "migration".
 *
 * **Validates: Requirements 2.5**
 */
describe('Property 1: Invalid Tab Parameter Fallback', () => {
  it('returns "migration" for any invalid string', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s !== 'migration' && s !== 'accounts' && s !== 'permissions' && s !== 'activity'),
        (input) => {
          expect(resolveTab(input)).toBe('migration')
        }
      )
    )
  })

  it('returns "migration" for null input', () => {
    expect(resolveTab(null)).toBe('migration')
  })

  it('returns the valid tab for valid inputs', () => {
    const validTabs = ['migration', 'accounts', 'permissions', 'activity'] as const
    for (const tab of validTabs) {
      expect(resolveTab(tab)).toBe(tab)
    }
  })
})

/**
 * Property 5: Pagination Constraint
 * For any list of N items (0 to 200) and page size 50:
 *   - Each page has at most 50 items
 *   - Total pages = max(1, ceil(N/50))
 *   - Union of all pages equals the original list
 *
 * **Validates: Requirements 4.8, 10.3**
 */
describe('Property 5: Pagination Constraint', () => {
  it('each page has at most 50 items, correct total pages, and union equals original', () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat(), { minLength: 0, maxLength: 200 }),
        (items) => {
          const perPage = 50
          const expectedTotalPages = Math.max(1, Math.ceil(items.length / perPage))

          const { totalPages } = paginateItems(items, 1, perPage)
          expect(totalPages).toBe(expectedTotalPages)

          // Collect all pages and verify constraints
          const allPageItems: number[] = []
          for (let page = 1; page <= totalPages; page++) {
            const { pageItems } = paginateItems(items, page, perPage)
            expect(pageItems.length).toBeLessThanOrEqual(perPage)
            allPageItems.push(...pageItems)
          }

          // Union of all pages equals the original list
          expect(allPageItems).toEqual(items)
        }
      )
    )
  })
})

// --- Generators for FilterableItem ---

const filterableItemArb: fc.Arbitrary<FilterableItem> = fc.record({
  id: fc.uuid(),
  description: fc.string({ minLength: 0, maxLength: 50 }),
  amount: fc.float({ min: -10000, max: 10000, noNaN: true }),
  date: fc.option(
    fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString().slice(0, 10)),
    { nil: null }
  ),
  categoryId: fc.option(fc.uuid(), { nil: null }),
})

/**
 * Property 6: Individual Filter Correctness
 * For each filter independently, every item in the filtered result satisfies
 * the filter condition, and every excluded item does NOT satisfy it.
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
 */
describe('Property 6: Individual Filter Correctness', () => {
  const baseFilters: MigrationFilters = {
    search: '',
    categoryId: null,
    dateFrom: null,
    dateTo: null,
    amountMin: null,
    amountMax: null,
  }

  it('search filter: included items contain search text, excluded do not', () => {
    fc.assert(
      fc.property(
        fc.array(filterableItemArb, { minLength: 0, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (items, search) => {
          const filters: MigrationFilters = { ...baseFilters, search }
          const result = applyMigrationFilters(items, filters)
          const excluded = items.filter(i => !result.includes(i))

          for (const item of result) {
            expect(item.description.toLowerCase()).toContain(search.toLowerCase())
          }
          for (const item of excluded) {
            expect(item.description.toLowerCase()).not.toContain(search.toLowerCase())
          }
        }
      )
    )
  })

  it('category filter: included items match categoryId, excluded do not', () => {
    fc.assert(
      fc.property(
        fc.array(filterableItemArb, { minLength: 0, maxLength: 30 }),
        fc.uuid(),
        (items, categoryId) => {
          const filters: MigrationFilters = { ...baseFilters, categoryId }
          const result = applyMigrationFilters(items, filters)
          const excluded = items.filter(i => !result.includes(i))

          for (const item of result) {
            expect(item.categoryId).toBe(categoryId)
          }
          for (const item of excluded) {
            expect(item.categoryId).not.toBe(categoryId)
          }
        }
      )
    )
  })

  it('dateFrom filter: included items have date >= dateFrom or null date', () => {
    fc.assert(
      fc.property(
        fc.array(filterableItemArb, { minLength: 0, maxLength: 30 }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString().slice(0, 10)),
        (items, dateFrom) => {
          const filters: MigrationFilters = { ...baseFilters, dateFrom }
          const result = applyMigrationFilters(items, filters)
          const excluded = items.filter(i => !result.includes(i))

          for (const item of result) {
            // Items pass if they have no date OR date >= dateFrom
            if (item.date) {
              expect(item.date >= dateFrom).toBe(true)
            }
          }
          for (const item of excluded) {
            // Excluded items must have a date that is < dateFrom
            expect(item.date).not.toBeNull()
            expect(item.date! < dateFrom).toBe(true)
          }
        }
      )
    )
  })

  it('dateTo filter: included items have date <= dateTo or null date', () => {
    fc.assert(
      fc.property(
        fc.array(filterableItemArb, { minLength: 0, maxLength: 30 }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString().slice(0, 10)),
        (items, dateTo) => {
          const filters: MigrationFilters = { ...baseFilters, dateTo }
          const result = applyMigrationFilters(items, filters)
          const excluded = items.filter(i => !result.includes(i))

          for (const item of result) {
            if (item.date) {
              expect(item.date <= dateTo).toBe(true)
            }
          }
          for (const item of excluded) {
            expect(item.date).not.toBeNull()
            expect(item.date! > dateTo).toBe(true)
          }
        }
      )
    )
  })

  it('amountMin filter: included items have amount >= amountMin', () => {
    fc.assert(
      fc.property(
        fc.array(filterableItemArb, { minLength: 0, maxLength: 30 }),
        fc.float({ min: -10000, max: 10000, noNaN: true }),
        (items, amountMin) => {
          const filters: MigrationFilters = { ...baseFilters, amountMin }
          const result = applyMigrationFilters(items, filters)
          const excluded = items.filter(i => !result.includes(i))

          for (const item of result) {
            expect(item.amount).toBeGreaterThanOrEqual(amountMin)
          }
          for (const item of excluded) {
            expect(item.amount).toBeLessThan(amountMin)
          }
        }
      )
    )
  })

  it('amountMax filter: included items have amount <= amountMax', () => {
    fc.assert(
      fc.property(
        fc.array(filterableItemArb, { minLength: 0, maxLength: 30 }),
        fc.float({ min: -10000, max: 10000, noNaN: true }),
        (items, amountMax) => {
          const filters: MigrationFilters = { ...baseFilters, amountMax }
          const result = applyMigrationFilters(items, filters)
          const excluded = items.filter(i => !result.includes(i))

          for (const item of result) {
            expect(item.amount).toBeLessThanOrEqual(amountMax)
          }
          for (const item of excluded) {
            expect(item.amount).toBeGreaterThan(amountMax)
          }
        }
      )
    )
  })
})

/**
 * Property 7: Composite Filter AND Logic
 * Applying multiple filters simultaneously produces the same result as
 * intersecting each filter applied independently.
 *
 * **Validates: Requirements 5.5**
 */
describe('Property 7: Composite Filter AND Logic', () => {
  const migrationFiltersArb: fc.Arbitrary<MigrationFilters> = fc.record({
    search: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 5 })),
    categoryId: fc.option(fc.uuid(), { nil: null }),
    dateFrom: fc.option(
      fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().slice(0, 10)),
      { nil: null }
    ),
    dateTo: fc.option(
      fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString().slice(0, 10)),
      { nil: null }
    ),
    amountMin: fc.option(fc.float({ min: -10000, max: 10000, noNaN: true }), { nil: null }),
    amountMax: fc.option(fc.float({ min: -10000, max: 10000, noNaN: true }), { nil: null }),
  })

  const baseFilters: MigrationFilters = {
    search: '',
    categoryId: null,
    dateFrom: null,
    dateTo: null,
    amountMin: null,
    amountMax: null,
  }

  it('combined filters equal intersection of individual filters', () => {
    fc.assert(
      fc.property(
        fc.array(filterableItemArb, { minLength: 0, maxLength: 30 }),
        migrationFiltersArb,
        (items, filters) => {
          // Apply all filters at once
          const combined = applyMigrationFilters(items, filters)

          // Apply each filter independently and intersect
          const bySearch = applyMigrationFilters(items, { ...baseFilters, search: filters.search })
          const byCategory = applyMigrationFilters(items, { ...baseFilters, categoryId: filters.categoryId })
          const byDateFrom = applyMigrationFilters(items, { ...baseFilters, dateFrom: filters.dateFrom })
          const byDateTo = applyMigrationFilters(items, { ...baseFilters, dateTo: filters.dateTo })
          const byAmountMin = applyMigrationFilters(items, { ...baseFilters, amountMin: filters.amountMin })
          const byAmountMax = applyMigrationFilters(items, { ...baseFilters, amountMax: filters.amountMax })

          // Intersection: items that appear in ALL individual results
          const intersection = items.filter(
            item =>
              bySearch.includes(item) &&
              byCategory.includes(item) &&
              byDateFrom.includes(item) &&
              byDateTo.includes(item) &&
              byAmountMin.includes(item) &&
              byAmountMax.includes(item)
          )

          expect(combined).toEqual(intersection)
        }
      )
    )
  })
})

/**
 * Property 8: Source Account Excluded from Target Options
 * For any set of accounts and any source ID from that set,
 * excludeSourceAccount never includes the source.
 *
 * **Validates: Requirements 6.3**
 */
describe('Property 8: Source Account Excluded from Target Options', () => {
  it('source account is never in the result', () => {
    const accountArb = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 30 }),
    })

    fc.assert(
      fc.property(
        fc.array(accountArb, { minLength: 1, maxLength: 20 }),
        fc.nat(),
        (accounts, indexSeed) => {
          // Pick a source from the accounts
          const sourceIndex = indexSeed % accounts.length
          const sourceId = accounts[sourceIndex].id

          const result = excludeSourceAccount(accounts, sourceId)

          // Source should never appear in result
          for (const account of result) {
            expect(account.id).not.toBe(sourceId)
          }

          // All non-source accounts should be present
          const expectedLength = accounts.filter(a => a.id !== sourceId).length
          expect(result.length).toBe(expectedLength)
        }
      )
    )
  })
})

/**
 * Property 9: Accounts Sorted Alphabetically
 * sortAccountsByName produces a list where each consecutive pair is in pt-BR locale order.
 *
 * **Validates: Requirements 7.1**
 */
describe('Property 9: Accounts Sorted Alphabetically', () => {
  it('consecutive pairs are in pt-BR locale order', () => {
    const accountArb = fc.record({
      name: fc.string({ minLength: 1, maxLength: 30 }),
    })

    fc.assert(
      fc.property(
        fc.array(accountArb, { minLength: 0, maxLength: 30 }),
        (accounts) => {
          const sorted = sortAccountsByName(accounts)

          for (let i = 0; i < sorted.length - 1; i++) {
            const cmp = sorted[i].name.localeCompare(sorted[i + 1].name, 'pt-BR')
            expect(cmp).toBeLessThanOrEqual(0)
          }

          // Same length as input (no items lost)
          expect(sorted.length).toBe(accounts.length)
        }
      )
    )
  })
})

/**
 * Property 10: Account Name Validation
 * Empty or >100 char strings → non-null error
 * 1-100 char strings (after trim) → null (valid)
 *
 * **Validates: Requirements 7.4**
 */
describe('Property 10: Account Name Validation', () => {
  it('returns error for empty strings (after trim)', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constant(' '), { minLength: 0, maxLength: 20 }),
        (whitespace) => {
          // All-whitespace strings (including empty) should return error
          const result = validateAccountName(whitespace)
          expect(result).not.toBeNull()
        }
      )
    )
  })

  it('returns error for strings > 100 chars after trim', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 101, maxLength: 200 }).filter(s => s.trim().length > 100),
        (longName) => {
          const result = validateAccountName(longName)
          expect(result).not.toBeNull()
        }
      )
    )
  })

  it('returns null for valid strings (1-100 chars after trim)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
          const trimmed = s.trim()
          return trimmed.length >= 1 && trimmed.length <= 100
        }),
        (validName) => {
          const result = validateAccountName(validName)
          expect(result).toBeNull()
        }
      )
    )
  })
})

/**
 * Property 11: Duplicate Member Detection
 * isExistingMember returns true iff userId is in the existing members array.
 *
 * **Validates: Requirements 8.4**
 */
describe('Property 11: Duplicate Member Detection', () => {
  it('returns true when userId is in the list', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
        fc.nat(),
        (memberIds, indexSeed) => {
          const index = indexSeed % memberIds.length
          const userId = memberIds[index]
          expect(isExistingMember(userId, memberIds)).toBe(true)
        }
      )
    )
  })

  it('returns false when userId is NOT in the list', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 0, maxLength: 20 }),
        fc.uuid(),
        (memberIds, userId) => {
          fc.pre(!memberIds.includes(userId))
          expect(isExistingMember(userId, memberIds)).toBe(false)
        }
      )
    )
  })
})
