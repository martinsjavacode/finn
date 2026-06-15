import { useState, useCallback } from 'react'

export interface UseBatchSelectionReturn {
  selectionMode: boolean
  selectedIds: Set<string>
  activateSelection: () => void
  cancelSelection: () => void
  toggleItem: (id: string) => void
  selectAll: (visiblePendingIds: string[]) => void
  deselectAll: () => void
  pruneSelection: (visiblePendingIds: string[]) => void
}

export function useBatchSelection(): UseBatchSelectionReturn {
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const activateSelection = useCallback(() => {
    setSelectionMode(true)
  }, [])

  const cancelSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [])

  const toggleItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback((visiblePendingIds: string[]) => {
    setSelectedIds(new Set(visiblePendingIds))
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const pruneSelection = useCallback((visiblePendingIds: string[]) => {
    setSelectedIds(prev => {
      const visibleSet = new Set(visiblePendingIds)
      const next = new Set<string>()
      for (const id of prev) {
        if (visibleSet.has(id)) {
          next.add(id)
        }
      }
      // Avoid unnecessary re-renders if the set hasn't changed
      if (next.size === prev.size && [...prev].every(id => next.has(id))) {
        return prev
      }
      return next
    })
  }, [])

  return {
    selectionMode,
    selectedIds,
    activateSelection,
    cancelSelection,
    toggleItem,
    selectAll,
    deselectAll,
    pruneSelection,
  }
}
