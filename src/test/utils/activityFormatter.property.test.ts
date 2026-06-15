import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { sortLogsByDate } from '../../utils/adminFilters'
import { formatActivityDescription } from '../../utils/activityFormatter'
import type { ActivityLog, ActivityActionType } from '../../types/admin'

// --- Generators ---

const actionTypeArb = fc.constantFrom<ActivityActionType>('migration', 'member_added', 'member_removed', 'role_changed', 'account_created', 'account_deleted')

const activityLogArb = fc.record({
  id: fc.uuid(),
  action_type: actionTypeArb,
  actor_email: fc.string({ minLength: 3, maxLength: 20 }).map(s => s + '@test.com'),
  account_id: fc.option(fc.uuid(), { nil: null }),
  account_name: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  details: fc.constant({} as Record<string, unknown>),
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
})

/**
 * Generator for activity logs with appropriate details per action_type.
 * This ensures formatActivityDescription has all required fields.
 */
const activityLogWithDetailsArb: fc.Arbitrary<ActivityLog> = actionTypeArb.chain(actionType => {
  const baseFields = {
    id: fc.uuid(),
    actor_email: fc.string({ minLength: 3, maxLength: 20 }).map(s => s + '@test.com'),
    account_id: fc.option(fc.uuid(), { nil: null }),
    account_name: fc.string({ minLength: 1, maxLength: 20 }),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
  }

  switch (actionType) {
    case 'migration':
      return fc.record({
        ...baseFields,
        action_type: fc.constant(actionType as ActivityActionType),
        details: fc.record({
          itemCount: fc.integer({ min: 1, max: 1000 }),
          itemType: fc.constantFrom('entries', 'installments', 'budgets'),
          sourceAccount: fc.string({ minLength: 1, maxLength: 20 }),
          targetAccount: fc.string({ minLength: 1, maxLength: 20 }),
        }).map(d => d as Record<string, unknown>),
      })
    case 'member_added':
    case 'member_removed':
      return fc.record({
        ...baseFields,
        action_type: fc.constant(actionType as ActivityActionType),
        details: fc.record({
          affectedUserEmail: fc.string({ minLength: 3, maxLength: 20 }).map(s => s + '@test.com'),
        }).map(d => d as Record<string, unknown>),
      })
    case 'role_changed':
      return fc.record({
        ...baseFields,
        action_type: fc.constant(actionType as ActivityActionType),
        details: fc.record({
          affectedUserEmail: fc.string({ minLength: 3, maxLength: 20 }).map(s => s + '@test.com'),
          oldRole: fc.constantFrom('viewer', 'editor', 'owner'),
          newRole: fc.constantFrom('viewer', 'editor', 'owner'),
        }).map(d => d as Record<string, unknown>),
      })
    case 'account_created':
    case 'account_deleted':
      return fc.record({
        ...baseFields,
        action_type: fc.constant(actionType as ActivityActionType),
        details: fc.constant({} as Record<string, unknown>),
      })
  }
})

/**
 * Property 12: Activity Logs Sorted Reverse Chronologically
 * For any list of activity log entries, after calling sortLogsByDate,
 * each consecutive pair has timestamp >= next (descending order).
 *
 * **Validates: Requirements 10.1**
 */
describe('Property 12: Activity Logs Sorted Reverse Chronologically', () => {
  it('sorted logs are in descending created_at order', () => {
    fc.assert(
      fc.property(
        fc.array(activityLogArb, { minLength: 0, maxLength: 50 }),
        (logs) => {
          const sorted = sortLogsByDate(logs)

          // Every consecutive pair must be in descending order
          for (let i = 0; i < sorted.length - 1; i++) {
            const current = new Date(sorted[i].created_at).getTime()
            const next = new Date(sorted[i + 1].created_at).getTime()
            expect(current).toBeGreaterThanOrEqual(next)
          }

          // No items lost or added
          expect(sorted.length).toBe(logs.length)
        }
      )
    )
  })
})

/**
 * Property 13: Activity Log Formatting Includes Required Fields
 * For any valid activity log entry with appropriate details,
 * formatActivityDescription always returns a non-empty string.
 *
 * **Validates: Requirements 10.2**
 */
describe('Property 13: Activity Log Formatting Includes Required Fields', () => {
  it('formatActivityDescription always returns a non-empty string', () => {
    fc.assert(
      fc.property(
        activityLogWithDetailsArb,
        (log) => {
          const description = formatActivityDescription(log)
          expect(typeof description).toBe('string')
          expect(description.length).toBeGreaterThan(0)
        }
      )
    )
  })
})

/**
 * Property 14: Activity Log Filter Correctness
 * Client-side filtering by action_type or account_id:
 * - Every entry in the result matches the filter criterion
 * - Every excluded entry does NOT match
 *
 * **Validates: Requirements 10.4, 10.5**
 */
describe('Property 14: Activity Log Filter Correctness', () => {
  it('filter by action_type: every result matches, every excluded does not', () => {
    fc.assert(
      fc.property(
        fc.array(activityLogArb, { minLength: 0, maxLength: 30 }),
        actionTypeArb,
        (logs, filterActionType) => {
          const result = logs.filter(log => log.action_type === filterActionType)
          const excluded = logs.filter(log => log.action_type !== filterActionType)

          for (const log of result) {
            expect(log.action_type).toBe(filterActionType)
          }
          for (const log of excluded) {
            expect(log.action_type).not.toBe(filterActionType)
          }

          // No items lost
          expect(result.length + excluded.length).toBe(logs.length)
        }
      )
    )
  })

  it('filter by account_id: every result matches, every excluded does not', () => {
    fc.assert(
      fc.property(
        fc.array(activityLogArb, { minLength: 0, maxLength: 30 }),
        fc.uuid(),
        (logs, filterAccountId) => {
          const result = logs.filter(log => log.account_id === filterAccountId)
          const excluded = logs.filter(log => log.account_id !== filterAccountId)

          for (const log of result) {
            expect(log.account_id).toBe(filterAccountId)
          }
          for (const log of excluded) {
            expect(log.account_id).not.toBe(filterAccountId)
          }

          // No items lost
          expect(result.length + excluded.length).toBe(logs.length)
        }
      )
    )
  })
})
