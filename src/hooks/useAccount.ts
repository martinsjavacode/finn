import { useMemo, useSyncExternalStore, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Account } from '../types/database'

const STORAGE_KEY = 'finn-active-account'

// Shared mutable state + listeners for cross-hook sync
let currentId: string | null = localStorage.getItem(STORAGE_KEY)
const listeners = new Set<() => void>()

function notify() { listeners.forEach(cb => cb()) }

function subscribeAccount(cb: () => void) {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

function getAccountId() { return currentId }

export function useAccount(userId: string | null) {
  const selectedId = useSyncExternalStore(subscribeAccount, getAccountId, () => null)

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts', userId],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('*').order('name')
      return data ?? []
    },
    enabled: !!userId,
  })

  const activeAccount = useMemo(() => {
    if (!accounts.length) return null
    return accounts.find(a => a.id === selectedId) ?? accounts[0]
  }, [accounts, selectedId])

  const setActiveAccount = useCallback((id: string) => {
    currentId = id
    localStorage.setItem(STORAGE_KEY, id)
    notify()
  }, [])

  return { accounts, activeAccount, activeAccountId: activeAccount?.id ?? null, setActiveAccount }
}
