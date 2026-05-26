import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Role } from '../types/database'
import { getSession, onAuthChange, getUserRole, signOut } from '../services/auth'
import { usePermissions } from './usePermissions'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<Role | null>(null)
  const [roleId, setRoleId] = useState<string | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    getSession().then(s => { setSession(s); setLoading(false) })
    const sub = onAuthChange(setSession)
    return () => sub.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    getUserRole(session).then(r => {
      if (cancelled) return
      if (r) { setRole(r.name); setRoleId(r.id); setUnauthorized(false) }
      else { setRole(null); setRoleId(null); setUnauthorized(true) }
    })
    return () => { cancelled = true }
  }, [session])

  const { can, loaded: permissionsLoaded } = usePermissions(roleId)

  const isOwner = role === 'owner'
  const isEditor = role === 'editor' || isOwner

  return { session, loading, role, roleId, isEditor, isOwner, unauthorized, can, permissionsLoaded, signOut }
}
