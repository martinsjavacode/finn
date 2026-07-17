import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase-generated'

const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const url = import.meta.env.VITE_SUPABASE_URL

if (!url || !anonKey) {
  throw new Error('Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias no .env')
}

export const supabase = createClient<Database>(url, anonKey)
