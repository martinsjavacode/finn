/**
 * Preservation Property Tests for cards RLS policies.
 *
 * These tests verify behaviors that MUST NOT change after the bugfix:
 * - Superadmins can always perform INSERT, UPDATE, DELETE on cards
 * - Viewers (without write permissions) are blocked from INSERT, UPDATE, DELETE
 * - Any authenticated user can SELECT cards
 * - Unauthenticated users are blocked from all operations
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 *
 * These tests PASS on the current (unfixed) code and serve as regression guards.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { evaluateCardsRlsPolicy, type User, type Operation } from './cards-rls-model'

// ============================================================
// Generators (Arbitraries)
// ============================================================

/** Generates a superadmin user (always is_superadmin = true, authenticated) */
const superadminArb: fc.Arbitrary<User> = fc.record({
  email: fc.emailAddress(),
  is_superadmin: fc.constant(true),
  is_authenticated: fc.constant(true),
  role_name: fc.constantFrom('owner', 'editor', 'viewer'),
  permissions: fc.constant([
    'cards.create', 'cards.update', 'cards.delete', 'cards.read'
  ]),
})

/** Generates a viewer user (no write permissions, not superadmin, not owner) */
const viewerArb: fc.Arbitrary<User> = fc.record({
  email: fc.emailAddress(),
  is_superadmin: fc.constant(false),
  is_authenticated: fc.constant(true),
  role_name: fc.constant('viewer'),
  permissions: fc.constant(['cards.read']), // viewers only have read permission
})

/** Generates any authenticated user (may or may not be superadmin) */
const authenticatedUserArb: fc.Arbitrary<User> = fc.record({
  email: fc.emailAddress(),
  is_superadmin: fc.boolean(),
  is_authenticated: fc.constant(true),
  role_name: fc.constantFrom('owner', 'editor', 'viewer'),
  permissions: fc.subarray(
    ['cards.read', 'cards.create', 'cards.update', 'cards.delete'],
    { minLength: 1, maxLength: 4 }
  ),
})

/** Generates an unauthenticated user */
const unauthenticatedUserArb: fc.Arbitrary<User> = fc.record({
  email: fc.constant(''),
  is_superadmin: fc.constant(false),
  is_authenticated: fc.constant(false),
  role_name: fc.constant('viewer'),
  permissions: fc.constant([]),
})

/** Write operations (INSERT, UPDATE, DELETE) */
const writeOperationArb: fc.Arbitrary<Operation> = fc.constantFrom('INSERT', 'UPDATE', 'DELETE')

// ============================================================
// Property Tests
// ============================================================

describe('Cards RLS Preservation Properties', () => {
  /**
   * Property 2a: Superadmins can always perform write operations on cards.
   *
   * For all superadmin users and all write operations (INSERT, UPDATE, DELETE),
   * the RLS policy SHALL permit the operation.
   *
   * **Validates: Requirements 3.1**
   */
  it('Property 2a: superadmins can INSERT, UPDATE, DELETE on cards', () => {
    fc.assert(
      fc.property(
        superadminArb,
        writeOperationArb,
        (user, operation) => {
          const allowed = evaluateCardsRlsPolicy(user, operation)
          expect(allowed).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 2b: Viewers (without write permissions) are blocked from write operations.
   *
   * For all viewer users (non-superadmin, only read permissions),
   * INSERT, UPDATE, DELETE SHALL be denied by the RLS policy.
   *
   * **Validates: Requirements 3.2**
   */
  it('Property 2b: viewers are blocked from INSERT, UPDATE, DELETE on cards', () => {
    fc.assert(
      fc.property(
        viewerArb,
        writeOperationArb,
        (user, operation) => {
          const allowed = evaluateCardsRlsPolicy(user, operation)
          expect(allowed).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 2c: Any authenticated user can SELECT cards.
   *
   * For all authenticated users (regardless of role or superadmin status),
   * SELECT SHALL be permitted by the RLS policy.
   *
   * **Validates: Requirements 3.3**
   */
  it('Property 2c: any authenticated user can SELECT cards', () => {
    fc.assert(
      fc.property(
        authenticatedUserArb,
        (user) => {
          const allowed = evaluateCardsRlsPolicy(user, 'SELECT')
          expect(allowed).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 2d: Unauthenticated users are blocked from all operations.
   *
   * For all unauthenticated users and all operations,
   * the RLS policy SHALL deny access.
   *
   * **Validates: Requirements 3.4**
   */
  it('Property 2d: unauthenticated users are blocked from all operations', () => {
    const allOperationsArb: fc.Arbitrary<Operation> = fc.constantFrom('SELECT', 'INSERT', 'UPDATE', 'DELETE')

    fc.assert(
      fc.property(
        unauthenticatedUserArb,
        allOperationsArb,
        (user, operation) => {
          const allowed = evaluateCardsRlsPolicy(user, operation)
          expect(allowed).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 2e: Superadmins can also SELECT cards (full access).
   *
   * Superadmins are authenticated, so they should also be able to read.
   * This ensures superadmin access is truly unrestricted.
   *
   * **Validates: Requirements 3.1**
   */
  it('Property 2e: superadmins can SELECT cards', () => {
    fc.assert(
      fc.property(
        superadminArb,
        (user) => {
          const allowed = evaluateCardsRlsPolicy(user, 'SELECT')
          expect(allowed).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
