import { supabase } from '../lib/supabase'

export async function generateRecurring(targetMonth: string) {
  const { error } = await supabase.rpc('generate_recurring', { target_month: `${targetMonth}-01` } as never)
  return { error }
}
