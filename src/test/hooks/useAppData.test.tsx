import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('../../services/categories', () => ({
  fetchCategories: vi.fn().mockResolvedValue({ data: [{ id: '1', name: 'casa', label: 'Casa' }] }),
  fetchActiveCards: vi.fn().mockResolvedValue({ data: [{ name: 'nubank', label: 'Nubank', color: '#820ad1' }] }),
}))

import { useAppData } from '../../hooks/useAppData'

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAppData', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna arrays vazios quando não autenticado', () => {
    const { result } = renderHook(() => useAppData(false), { wrapper: createWrapper() })
    expect(result.current.categories).toEqual([])
    expect(result.current.cardsList).toEqual([])
  })

  it('carrega categorias e cartões quando autenticado', async () => {
    const { result } = renderHook(() => useAppData(true), { wrapper: createWrapper() })
    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1)
      expect(result.current.categories[0].label).toBe('Casa')
      expect(result.current.cardsList).toHaveLength(1)
      expect(result.current.cardsList[0].name).toBe('nubank')
    })
  })
})
