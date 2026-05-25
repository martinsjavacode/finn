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

export async function getUserRole(session: Session): Promise<{ name: Role; id: string } | null> {
  const { data } = await supabase
    .from('users')
    .select('role_id, roles(name)')
    .eq('email', session.user.email ?? '')
    .single()
  if (!data) return null
  const row = data as { role_id: string; roles: { name: string } }
  return { name: row.roles.name as Role, id: row.role_id }
}
