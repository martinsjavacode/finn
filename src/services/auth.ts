import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import type { Role } from '../types/database'

export function onAuthChange(cb: (session: Session | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => cb(s))
  return subscription
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signOut() {
  await supabase.auth.signOut()
}

export function isGitHubUser(session: Session) {
  return session.user.app_metadata?.provider === 'github' ||
    session.user.identities?.some(i => i.provider === 'github') || false
}

export async function getUserRole(session: Session): Promise<Role> {
  if (isGitHubUser(session)) return 'editor'
  const { data } = await supabase
    .from('access_control')
    .select('role')
    .eq('email', session.user.email ?? '')
    .single()
  return ((data as { role: string } | null)?.role as Role) ?? 'viewer'
}
