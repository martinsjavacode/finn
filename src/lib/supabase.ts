import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const payload = JSON.parse(atob(anonKey.split('.')[1]))
const ref = payload.ref ?? payload.iss?.split('//')[1]?.split('.')[0]
const url = `https://${ref}.supabase.co`

export const supabase = createClient<Database>(url, anonKey)
