/**
 * Pure model of the FIXED cards RLS policies.
 *
 * This captures the behavior of the database policies after migration
 * 033-cards-rls-permission.sql is applied:
 *
 * - SELECT: auth.role() = 'authenticated'
 * - INSERT: has_global_permission('cards', 'create')
 * - UPDATE: has_global_permission('cards', 'update')
 * - DELETE: has_global_permission('cards', 'delete')
 *
 * has_global_permission returns true if:
 *   - is_superadmin()
 *   - user has role 'owner' in any account
 *   - user has the corresponding RBAC permission (e.g. 'cards.create')
 *
 * This model is used by property tests to verify correct behavior.
 */

export type Operation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'

export interface User {
  email: string
  is_superadmin: boolean
  is_authenticated: boolean
  role_name: string // 'owner' | 'editor' | 'viewer'
  permissions: string[] // e.g. ['cards.create', 'cards.update', 'cards.delete']
}

/**
 * Simulates the current `is_superadmin()` PostgreSQL function.
 * Returns true if the user has is_superadmin = true.
 */
export function isSuperadmin(user: User): boolean {
  return user.is_superadmin
}

/**
 * Maps an operation to the corresponding RBAC permission string for cards.
 */
function operationToPermission(operation: Operation): string {
  switch (operation) {
    case 'INSERT':
      return 'cards.create'
    case 'UPDATE':
      return 'cards.update'
    case 'DELETE':
      return 'cards.delete'
    default:
      return ''
  }
}

/**
 * Model of the FIXED RLS policy evaluation for the `cards` table.
 * Simulates `has_global_permission(p_resource, p_action)` logic.
 * Returns true if the operation is ALLOWED, false if DENIED.
 */
export function evaluateCardsRlsPolicy(
  user: User,
  operation: Operation
): boolean {
  // Unauthenticated users are blocked from everything
  if (!user.is_authenticated) {
    return false
  }

  // SELECT: any authenticated user can read
  if (operation === 'SELECT') {
    return true
  }

  // INSERT, UPDATE, DELETE: has_global_permission logic
  // 1. Superadmin always has access
  if (isSuperadmin(user)) {
    return true
  }

  // 2. Owner always has access
  if (user.role_name === 'owner') {
    return true
  }

  // 3. User has the corresponding RBAC permission
  const requiredPermission = operationToPermission(operation)
  if (user.permissions.includes(requiredPermission)) {
    return true
  }

  // Otherwise denied
  return false
}
