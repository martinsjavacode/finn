import { vi } from 'vitest'
import { migrateEntries, migrateBudgets, migrateInstallmentPurchases } from '../../services/migration'
import { supabase } from '../../lib/supabase'

describe('migration service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('migrateEntries chama rpc com ids e target', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 3, error: null } as never)
    const { data, error } = await migrateEntries(['id-1', 'id-2'], 'acc-target')
    expect(supabase.rpc).toHaveBeenCalledWith('migrate_entries', { entry_ids: ['id-1', 'id-2'], target_account_id: 'acc-target' })
    expect(data).toBe(3)
    expect(error).toBeNull()
  })

  it('migrateBudgets chama rpc com ids e target', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 2, error: null } as never)
    const { data, error } = await migrateBudgets(['b-1'], 'acc-2')
    expect(supabase.rpc).toHaveBeenCalledWith('migrate_budgets', { budget_ids: ['b-1'], target_account_id: 'acc-2' })
    expect(data).toBe(2)
    expect(error).toBeNull()
  })

  it('migrateInstallmentPurchases chama rpc com ids e target', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 1, error: null } as never)
    const { data, error } = await migrateInstallmentPurchases(['p-1'], 'acc-3')
    expect(supabase.rpc).toHaveBeenCalledWith('migrate_installment_purchases', { purchase_ids: ['p-1'], target_account_id: 'acc-3' })
    expect(data).toBe(1)
    expect(error).toBeNull()
  })

  it('retorna erro quando rpc falha', async () => {
    const mockError = { message: 'Apenas superadmin' }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: mockError } as never)
    const { error } = await migrateEntries(['id-1'], 'acc-x')
    expect(error).toEqual(mockError)
  })
})
