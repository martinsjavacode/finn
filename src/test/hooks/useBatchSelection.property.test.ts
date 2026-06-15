import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { useBatchSelection } from '../../hooks/useBatchSelection'

// Feature: batch-payment-transactions, Property 6: Seleção é sempre subconjunto dos pendentes visíveis após mudança de filtro

describe('useBatchSelection - Property Tests', () => {
  // **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  describe('Property 6: Seleção é sempre subconjunto dos pendentes visíveis após mudança de filtro', () => {
    it('pruneSelection retorna exatamente a interseção da seleção original com os pendentes visíveis', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.uuid(), { minLength: 0, maxLength: 30 }),
          fc.uniqueArray(fc.uuid(), { minLength: 0, maxLength: 30 }),
          (initialSelection, visiblePendingIds) => {
            const { result } = renderHook(() => useBatchSelection())

            // Activate selection mode
            act(() => {
              result.current.activateSelection()
            })

            // Set up initial selection by toggling each ID
            act(() => {
              for (const id of initialSelection) {
                result.current.toggleItem(id)
              }
            })

            // Verify initial selection is set correctly
            const selectionBefore = new Set(result.current.selectedIds)
            expect(selectionBefore.size).toBe(initialSelection.length)

            // Call pruneSelection with the new visible pending IDs
            act(() => {
              result.current.pruneSelection(visiblePendingIds)
            })

            // Compute expected intersection
            const visibleSet = new Set(visiblePendingIds)
            const expectedIntersection = new Set(
              initialSelection.filter(id => visibleSet.has(id))
            )

            // Verify result is exactly the intersection
            const resultSet = result.current.selectedIds
            expect(resultSet.size).toBe(expectedIntersection.size)
            for (const id of expectedIntersection) {
              expect(resultSet.has(id)).toBe(true)
            }
            // Verify no extra IDs are present
            for (const id of resultSet) {
              expect(expectedIntersection.has(id)).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('pruneSelection com visíveis vazio resulta em seleção vazia', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.uuid(), { minLength: 1, maxLength: 20 }),
          (initialSelection) => {
            const { result } = renderHook(() => useBatchSelection())

            act(() => {
              result.current.activateSelection()
            })

            act(() => {
              for (const id of initialSelection) {
                result.current.toggleItem(id)
              }
            })

            // Prune with empty visible list
            act(() => {
              result.current.pruneSelection([])
            })

            expect(result.current.selectedIds.size).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('pruneSelection com seleção vazia sempre resulta em seleção vazia', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.uuid(), { minLength: 0, maxLength: 20 }),
          (visiblePendingIds) => {
            const { result } = renderHook(() => useBatchSelection())

            act(() => {
              result.current.activateSelection()
            })

            // Don't select anything, just prune
            act(() => {
              result.current.pruneSelection(visiblePendingIds)
            })

            expect(result.current.selectedIds.size).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
