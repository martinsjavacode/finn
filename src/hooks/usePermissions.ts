import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Permission { resource: string; action: string }

export function usePermissions(roleId: string | null) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!roleId) return
    let cancelled = false
    supabase
      .from('role_permissions')
      .select('permissions(resource, action)')
      .eq('role_id', roleId)
      .then(({ data }) => {
        if (cancelled) return
        const perms = (data ?? []).map((r: unknown) => (r as { permissions: Permission }).permissions)
        setPermissions(perms)
        setLoaded(true)
      })
    return () => { cancelled = true }
  }, [roleId])

  const can = (resource: string, action: string) => {
    if (!loaded) return false
    return permissions.some(p => p.resource === resource && p.action === action)
  }

  return { can, permissions, loaded }
}
