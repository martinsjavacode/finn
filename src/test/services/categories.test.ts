import { vi } from 'vitest'
import { fetchCategories, fetchActiveCards, fetchBudgets } from '../../services/categories'
import { supabase } from '../../lib/supabase'

describe('categories service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetchCategories retorna categorias ordenadas', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [{ id: '1', name: 'casa', label: 'Casa', parent_id: null }], error: null }),
      }),
    } as never)
    const { data } = await fetchCategories()
    expect(data).toHaveLength(1)
    expect(data[0].label).toBe('Casa')
  })

  it('fetchActiveCards retorna cartões ativos', async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: [{ name: 'nubank', label: 'Nubank', color: '#8b5cf6' }], error: null })
    const eqActive = vi.fn().mockReturnValue({ order: orderMock })
    const eqAccount = vi.fn().mockReturnValue({ eq: eqActive })
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: eqAccount,
      }),
    } as never)
    const { data } = await fetchActiveCards('acc-1')
    expect(eqAccount).toHaveBeenCalledWith('account_id', 'acc-1')
    expect(eqActive).toHaveBeenCalledWith('active', true)
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('nubank')
  })

  it('fetchBudgets filtra por accountId', async () => {
    const eqMock = vi.fn().mockResolvedValue({ data: [{ category: 'c1', monthly_limit: 500 }], error: null })
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqMock }),
    } as never)
    const { data } = await fetchBudgets('acc-1')
    expect(eqMock).toHaveBeenCalledWith('account_id', 'acc-1')
    expect(data).toHaveLength(1)
  })
})
