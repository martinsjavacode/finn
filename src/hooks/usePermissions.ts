import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Permission { resource: string; action: string }

export function usePermissions(roleId: string | null) {
  const [permissions, setPermissions] = useState<Permission[]>([])

  useEffect(() => {
    if (!roleId) return
    supabase
      .from('role_permissions')
      .select('permissions(resource, action)')
      .eq('role_id', roleId)
      .then(({ data }) => {
        const perms = (data ?? []).map((r: unknown) => (r as { permissions: Permission }).permissions)
        setPermissions(perms)
      })
  }, [roleId])

  const can = (resource: string, action: string) =>
    permissions.some(p => p.resource === resource && p.action === action)

  return { can, permissions }
}
