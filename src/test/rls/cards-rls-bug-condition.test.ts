/**
 * Bug Condition Exploration Test - Cards RLS Non-Owner INSERT
 *
 * **Validates: Requirements 1.1, 1.2**
 *
 * This test encodes the EXPECTED (correct) behavior for users who SHOULD
 * be able to INSERT into the `cards` table but are currently blocked by
 * the buggy RLS policy that uses `is_superadmin()`.
 *
 * Bug Condition:
 *   isBugCondition(input) = input.user.is_superadmin = false
 *     AND (input.user.role = 'owner' OR input.user.hasPermission('cards', 'create'))
 *
 * Expected Behavior: INSERT operation should succeed (return true)
 * Current Behavior: INSERT operation fails with RLS violation
 *
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists.
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { evaluateCardsRlsPolicy, type User } from './cards-rls-model'

/**
 * Checks if the user is in the bug condition:
 * - Not a superadmin
 * - AND (is an owner OR has the 'cards.create' permission)
 */
function isBugCondition(user: User): boolean {
  return (
    !user.is_superadmin &&
    user.is_authenticated &&
    (user.role_name === 'owner' || user.permissions.includes('cards.create'))
  )
}

/**
 * Arbitrary that generates users who satisfy the bug condition:
 * - Non-superadmin
 * - Authenticated
 * - Either owner role OR editor with 'cards.create' permission
 */
const bugConditionUserArbitrary: fc.Arbitrary<User> = fc.oneof(
  // Owner (non-superadmin) - always has all permissions
  fc.record({
    email: fc.emailAddress(),
    is_superadmin: fc.constant(false),
    is_authenticated: fc.constant(true),
    role_name: fc.constant('owner' as string),
    permissions: fc.constant([
      'cards.create',
      'cards.update',
      'cards.delete',
      'cards.read',
    ]),
  }),
  // Editor with cards.create permission (non-superadmin)
  fc.record({
    email: fc.emailAddress(),
    is_superadmin: fc.constant(false),
    is_authenticated: fc.constant(true),
    role_name: fc.constant('editor' as string),
    permissions: fc.constant([
      'cards.create',
      'cards.read',
      'cards.update',
      'cards.delete',
    ]),
  })
)

describe('Cards RLS Bug Condition Exploration', () => {
  /**
   * Property 1: Bug Condition - Usuários com permissão RBAC bloqueados ao operar em cards
   *
   * For any user in the bug condition (non-superadmin owner OR editor with cards.create),
   * the INSERT operation on `cards` should be ALLOWED.
   *
   * This test WILL FAIL on unfixed code because the current policy
   * only allows is_superadmin() for INSERT.
   */
  it('Property 1: owner não-superadmin deve poder INSERT em cards', () => {
    fc.assert(
      fc.property(bugConditionUserArbitrary, (user) => {
        // Precondition: user is in the bug condition
        expect(isBugCondition(user)).toBe(true)

        // Expected behavior: INSERT should be ALLOWED
        // Current behavior: INSERT is DENIED (bug!)
        const result = evaluateCardsRlsPolicy(user, 'INSERT')
        expect(result).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('Property 1: editor com permissão cards.create deve poder INSERT em cards', () => {
    const editorWithPermission: User = {
      email: 'editor@test.com',
      is_superadmin: false,
      is_authenticated: true,
      role_name: 'editor',
      permissions: ['cards.create', 'cards.read'],
    }

    // This assertion encodes the expected behavior
    // It WILL FAIL because evaluateCardsRlsPolicy uses is_superadmin() which returns false
    expect(isBugCondition(editorWithPermission)).toBe(true)
    expect(evaluateCardsRlsPolicy(editorWithPermission, 'INSERT')).toBe(true)
  })

  it('Property 1: owner não-superadmin com qualquer email deve poder INSERT em cards', () => {
    const ownerNonSuperadmin: User = {
      email: 'owner@empresa.com',
      is_superadmin: false,
      is_authenticated: true,
      role_name: 'owner',
      permissions: ['cards.create', 'cards.update', 'cards.delete', 'cards.read'],
    }

    // This assertion encodes the expected behavior
    // It WILL FAIL because evaluateCardsRlsPolicy uses is_superadmin() which returns false
    expect(isBugCondition(ownerNonSuperadmin)).toBe(true)
    expect(evaluateCardsRlsPolicy(ownerNonSuperadmin, 'INSERT')).toBe(true)
  })
})
