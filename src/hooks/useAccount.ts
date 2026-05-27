import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Account } from '../types/database'

const STORAGE_KEY = 'finn-active-account'

export function useAccount(userId: string | null) {
  const [selectedId, setSelectedId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))

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

  const setActiveAccount = (id: string) => {
    setSelectedId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  return { accounts, activeAccount, activeAccountId: activeAccount?.id ?? null, setActiveAccount }
}
