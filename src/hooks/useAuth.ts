import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Role } from '../types/database'
import { getSession, onAuthChange, getUserRole } from '../services/auth'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<Role>('viewer')

  useEffect(() => {
    getSession().then(s => { setSession(s); setLoading(false) })
    const sub = onAuthChange(setSession)
    return () => sub.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    getUserRole(session).then(setRole)
  }, [session])

  const isOwner = role === 'owner'
  const isEditor = role === 'editor' || isOwner

  return { session, loading, role, isEditor, isOwner }
}
