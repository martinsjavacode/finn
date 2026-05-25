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

export async function getUserRole(session: Session): Promise<Role> {
  const { data } = await supabase
    .from('users')
    .select('roles(name)')
    .eq('email', session.user.email ?? '')
    .single()
  const roleName = (data as { roles: { name: string } } | null)?.roles?.name
  return (roleName as Role) ?? 'viewer'
}
