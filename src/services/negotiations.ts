import { supabase } from '../lib/supabase'
import type { InvoiceNegotiation, NegotiatedInvoice, CreateNegotiationInput } from '../types/database'

// Note: These tables are not yet in supabase-generated.ts
// They will be added after running `supabase gen types typescript`
// For now, we use type assertions to work around the type errors

export async function fetchNegotiations(accountId: string) {
  const { data, error } = await (supabase
    .from('invoice_negotiations' as never)
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false }) as unknown as Promise<{ data: InvoiceNegotiation[] | null; error: unknown }>)
  return { data: (data ?? []) as InvoiceNegotiation[], error }
}

export async function fetchNegotiatedInvoices(negotiationId: string) {
  const { data, error } = await (supabase
    .from('negotiated_invoices' as never)
    .select('*')
    .eq('negotiation_id', negotiationId)
    .order('month') as unknown as Promise<{ data: NegotiatedInvoice[] | null; error: unknown }>)
  return { data: (data ?? []) as NegotiatedInvoice[], error }
}

export async function fetchNegotiationInstallments(negotiationId: string, accountId: string) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('negotiation_id' as never, negotiationId as never)
    .eq('account_id', accountId)
    .order('month')
  return { data: data ?? [], error }
}

export async function createNegotiation(input: CreateNegotiationInput) {
  const { invoices, ...negotiationData } = input

  // Insert negotiation (trigger will generate installments)
  const { data, error } = await (supabase
    .from('invoice_negotiations' as never)
    .insert(negotiationData as never)
    .select()
    .single() as unknown as Promise<{ data: InvoiceNegotiation | null; error: unknown }>)
  
  if (error || !data) return { error: error || new Error('Failed to create negotiation') }

  // Insert negotiated invoices
  const negotiatedInvoices = invoices.map(inv => ({
    negotiation_id: data.id,
    card: inv.card,
    month: inv.month,
  }))

  const { error: invoicesError } = await (supabase
    .from('negotiated_invoices' as never)
    .insert(negotiatedInvoices as never) as unknown as Promise<{ error: unknown }>)

  if (invoicesError) {
    // Rollback: delete the negotiation (cascade will remove installments)
    await supabase.from('invoice_negotiations' as never).delete().eq('id' as never, data.id as never)
    return { error: invoicesError }
  }

  return { data, error: null }
}

export async function cancelNegotiation(id: string, accountId: string) {
  const { error } = await (supabase
    .from('invoice_negotiations' as never)
    .delete()
    .eq('id' as never, id as never)
    .eq('account_id' as never, accountId as never) as unknown as Promise<{ error: unknown }>)
  return { error }
}

export async function isInvoiceNegotiated(card: string, month: string, accountId: string): Promise<boolean> {
  const { data } = await (supabase
    .from('negotiated_invoices' as never)
    .select('id, invoice_negotiations!inner(account_id)')
    .eq('card' as never, card as never)
    .eq('month' as never, month as never)
    .eq('invoice_negotiations.account_id' as never, accountId as never)
    .limit(1) as unknown as Promise<{ data: { id: string }[] | null }>)
  return (data?.length ?? 0) > 0
}

export async function fetchPendingInvoices(card: string, accountId: string) {
  // Get all months with credit card entries for this card
  const { data: entries } = await supabase
    .from('entries')
    .select('month')
    .eq('card', card)
    .eq('account_id', accountId)
    .eq('payment_method', 'credit_card')
    .is('negotiation_id', null)

  if (!entries?.length) return []

  // Get unique months
  const months = [...new Set(entries.map(e => e.month.substring(0, 7)))]
    .sort()
    .map(ym => `${ym}-01`)

  // Filter out fully paid invoices
  const pendingMonths: { month: string; total: number }[] = []
  
  for (const month of months) {
    const ym = month.substring(0, 7)
    const [year, monthNum] = ym.split('-').map(Number)
    
    // Calculate next month for range query
    const nextMonth = monthNum === 12 
      ? `${year + 1}-01-01` 
      : `${year}-${String(monthNum + 1).padStart(2, '0')}-01`
    
    // Get total for this invoice
    const { data: monthEntries } = await supabase
      .from('entries')
      .select('amount')
      .eq('card', card)
      .eq('account_id', accountId)
      .eq('payment_method', 'credit_card')
      .gte('month', `${ym}-01`)
      .lt('month', nextMonth)
      .is('negotiation_id', null)

    const total = monthEntries?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0
    
    // Get paid amount (use maybeSingle to avoid error when no record exists)
    const { data: invoice } = await supabase
      .from('card_invoices')
      .select('paid_amount')
      .eq('card', card)
      .eq('account_id', accountId)
      .eq('month', `${ym}-01`)
      .maybeSingle()

    const paidAmount = invoice?.paid_amount ?? 0
    
    // Check if already negotiated
    const isNegotiated = await isInvoiceNegotiated(card, `${ym}-01`, accountId)
    
    if (total > paidAmount && !isNegotiated) {
      pendingMonths.push({ month: `${ym}-01`, total: total - paidAmount })
    }
  }

  return pendingMonths
}
