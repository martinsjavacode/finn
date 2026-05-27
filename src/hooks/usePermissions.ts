import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Permission { resource: string; action: string }

export function usePermissions(accountId: string | null, userId: string | null, isSuperadmin: boolean) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (isSuperadmin || !accountId || !userId) return
    let cancelled = false

    supabase
      .from('account_members')
      .select('role_id')
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (cancelled || !data) { if (!cancelled) { setPermissions([]); setFetched(true) }; return }
        return supabase
          .from('role_permissions')
          .select('permissions(resource, action)')
          .eq('role_id', data.role_id)
          .then(({ data: rp }) => {
            if (cancelled) return
            const perms = (rp ?? []).map((r: unknown) => (r as { permissions: Permission }).permissions)
            setPermissions(perms)
            setFetched(true)
          })
      })

    return () => { cancelled = true }
  }, [accountId, userId, isSuperadmin])

  const loaded = isSuperadmin || fetched

  const can = (resource: string, action: string) => {
    if (isSuperadmin) return true
    if (!loaded) return false
    return permissions.some(p => p.resource === resource && p.action === action)
  }

  return { can, permissions, loaded }
}
