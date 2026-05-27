import { vi } from 'vitest'
import { generateRecurring } from '../../services/recurring'
import { supabase } from '../../lib/supabase'

describe('recurring service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama rpc com target_month e p_account_id', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)
    const { error } = await generateRecurring('2026-05', 'acc-1')
    expect(supabase.rpc).toHaveBeenCalledWith('generate_recurring', { target_month: '2026-05-01', p_account_id: 'acc-1' })
    expect(error).toBeNull()
  })

  it('retorna erro quando rpc falha', async () => {
    const mockError = { message: 'RPC failed' }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: mockError } as never)
    const { error } = await generateRecurring('2026-06', 'acc-2')
    expect(error).toEqual(mockError)
  })
})
