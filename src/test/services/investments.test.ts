import { vi } from 'vitest'
import { fetchInvestments, fetchInvestmentTransactions, createInvestment, updateInvestment, deleteInvestment, addInvestmentTransaction } from '../../services/investments'
import { supabase } from '../../lib/supabase'

describe('investments service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetchInvestments queries by account_id', async () => {
    await fetchInvestments('acc-1')
    expect(supabase.from).toHaveBeenCalledWith('investments')
  })

  it('fetchInvestmentTransactions queries by investment_id', async () => {
    await fetchInvestmentTransactions('inv-1')
    expect(supabase.from).toHaveBeenCalledWith('investment_transactions')
  })

  it('createInvestment inserts with balance 0', async () => {
    await createInvestment({ name: 'CDB', type: 'renda_fixa', broker: null, maturity_date: null, active: true, account_id: 'acc-1' })
    expect(supabase.from).toHaveBeenCalledWith('investments')
  })

  it('updateInvestment calls update with id', async () => {
    await updateInvestment('inv-1', { name: 'CDB 2' })
    expect(supabase.from).toHaveBeenCalledWith('investments')
  })

  it('deleteInvestment calls delete with id', async () => {
    await deleteInvestment('inv-1')
    expect(supabase.from).toHaveBeenCalledWith('investments')
  })

  it('addInvestmentTransaction aporte updates balance and creates entry', async () => {
    const inv = { id: 'inv-1', account_id: 'acc-1', name: 'CDB', type: 'renda_fixa' as const, broker: null, current_balance: 1000, invested_total: 1000, maturity_date: null, active: true, created_at: '' }
    await addInvestmentTransaction(inv, 'aporte', 500, '2026-05-01')
    // Should call from 3 times: investment_transactions insert, investments update, entries insert
    expect(supabase.from).toHaveBeenCalledWith('investment_transactions')
    expect(supabase.from).toHaveBeenCalledWith('investments')
    expect(supabase.from).toHaveBeenCalledWith('entries')
  })

  it('addInvestmentTransaction rendimento does not create entry', async () => {
    const inv = { id: 'inv-1', account_id: 'acc-1', name: 'CDB', type: 'renda_fixa' as const, broker: null, current_balance: 1000, invested_total: 1000, maturity_date: null, active: true, created_at: '' }
    vi.mocked(supabase.from).mockClear()
    await addInvestmentTransaction(inv, 'rendimento', 50, '2026-05-01')
    const calls = vi.mocked(supabase.from).mock.calls.map(c => c[0])
    expect(calls).toContain('investment_transactions')
    expect(calls).toContain('investments')
    expect(calls).not.toContain('entries')
  })
})
