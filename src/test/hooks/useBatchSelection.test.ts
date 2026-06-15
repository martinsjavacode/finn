import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useBatchSelection } from '../../hooks/useBatchSelection'

describe('useBatchSelection', () => {
  it('inicia com selectionMode false e selectedIds vazio', () => {
    const { result } = renderHook(() => useBatchSelection())
    expect(result.current.selectionMode).toBe(false)
    expect(result.current.selectedIds.size).toBe(0)
  })

  it('activateSelection ativa o modo de seleção', () => {
    const { result } = renderHook(() => useBatchSelection())
    act(() => { result.current.activateSelection() })
    expect(result.current.selectionMode).toBe(true)
  })

  it('cancelSelection desativa modo e limpa seleção', () => {
    const { result } = renderHook(() => useBatchSelection())
    act(() => { result.current.activateSelection() })
    act(() => { result.current.toggleItem('t1') })
    act(() => { result.current.cancelSelection() })
    expect(result.current.selectionMode).toBe(false)
    expect(result.current.selectedIds.size).toBe(0)
  })

  it('toggleItem adiciona e remove ids', () => {
    const { result } = renderHook(() => useBatchSelection())
    act(() => { result.current.toggleItem('t1') })
    expect(result.current.selectedIds.has('t1')).toBe(true)
    act(() => { result.current.toggleItem('t1') })
    expect(result.current.selectedIds.has('t1')).toBe(false)
  })

  it('selectAll seleciona todos os ids visíveis', () => {
    const { result } = renderHook(() => useBatchSelection())
    act(() => { result.current.selectAll(['t1', 't2', 't3']) })
    expect(result.current.selectedIds.size).toBe(3)
  })

  it('deselectAll limpa toda a seleção', () => {
    const { result } = renderHook(() => useBatchSelection())
    act(() => { result.current.selectAll(['t1', 't2']) })
    act(() => { result.current.deselectAll() })
    expect(result.current.selectedIds.size).toBe(0)
  })
})
