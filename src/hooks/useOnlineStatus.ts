import { useSyncExternalStore, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { peekAll, dequeue, hasPending } from '../lib/syncQueue'
import { toast } from '../lib/toast'

function subscribe(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb) }
}

function getSnapshot() { return navigator.onLine }

export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true)
}

export function useSyncOnReconnect() {
  const online = useOnlineStatus()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!online || !hasPending()) return

    const replay = async () => {
      const queue = peekAll()
      let synced = 0

      for (const m of queue) {
        try {
          // Dynamic table access requires type bypass for Supabase's strict generics
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const table = supabase.from(m.table as any) as any
          if (m.operation === 'insert') {
            const { error } = await table.insert(m.payload)
            if (error) throw error
          } else if (m.operation === 'update') {
            let q = table.update(m.payload)
            if (m.filters) for (const [k, v] of Object.entries(m.filters)) q = q.eq(k, v)
            const { error } = await q
            if (error) throw error
          } else if (m.operation === 'delete') {
            let q = table.delete()
            if (m.filters) for (const [k, v] of Object.entries(m.filters)) q = q.eq(k, v)
            const { error } = await q
            if (error) throw error
          }
          dequeue(m.id)
          synced++
        } catch {
          break // stop on first failure, retry next time
        }
      }

      if (synced > 0) {
        toast(`${synced} alteração(ões) sincronizada(s)`)
        queryClient.invalidateQueries()
      }
    }

    replay()
  }, [online, queryClient])

  return online
}
