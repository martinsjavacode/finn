import { supabase } from '../lib/supabase'

export async function generateRecurring(targetMonth: string, accountId: string) {
  const { error } = await supabase.rpc('generate_recurring', { target_month: `${targetMonth}-01`, p_account_id: accountId })
  return { error }
}
