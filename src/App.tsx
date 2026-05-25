import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Transaction, CreditCard, Category, Owner } from './types/database'
import type { Session } from '@supabase/supabase-js'
import Auth from './components/auth/Auth'
import Sidebar, { type Page } from './components/ui/Sidebar'
import Select from './components/ui/Select'
import SummaryCards from './components/dashboard/SummaryCards'
import TransactionsTable from './components/transactions/TransactionsTable'
import CardsTable from './components/transactions/CardsTable'
import AddTransaction from './components/transactions/AddTransaction'
import RecurringPage from './components/recurring/RecurringTemplates'
import Dashboard from './components/dashboard/Dashboard'
import Projection from './components/projection/Projection'
import BudgetsPage from './components/budgets/BudgetsPage'
import AccessPage from './components/access/AccessPage'
import CategoriesPage from './components/categories/CategoriesPage'
import Button from './components/ui/Button'
import './App.css'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState<string[]>([])
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [owner, setOwner] = useState<'all' | Owner>('all')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [page, setPage] = useState<Page>('dashboard')
  const [userRole, setUserRole] = useState<'editor' | 'viewer'>('viewer')
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    ;(async () => {
      const { data: cats } = await supabase.from('categories').select('*')
      setCategories(cats ?? [])

      // Carregar role do usuário (GitHub = sempre editor)
      const isGitHub = session.user.app_metadata?.provider === 'github' || session.user.identities?.some(i => i.provider === 'github')
      if (isGitHub) {
        setUserRole('editor')
      } else {
        const { data: access } = await supabase.from('access_control').select('role').eq('email', session.user.email ?? '').single() as { data: { role: string } | null }
        setUserRole((access?.role as 'editor' | 'viewer') ?? 'viewer')
      }

      const { data: t } = await supabase.from('transactions').select('month').order('month', { ascending: false })
      const { data: c } = await supabase.from('credit_cards').select('month').order('month', { ascending: false })
      const tMonths = (t as { month: string }[] | null) ?? []
      const cMonths = (c as { month: string }[] | null) ?? []
      const toYM = (d: string) => d.substring(0, 7)
      const all = [...new Set([...tMonths.map(r => toYM(r.month)), ...cMonths.map(r => toYM(r.month))])].sort()
      setMonths(all)
    })()
  }, [session])

  const loadData = async () => {
    if (!month) return
    const start = `${month}-01`
    const [y, m] = month.split('-').map(Number)
    const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
    const { data: t } = await supabase.from('transactions').select('*, categories(*)').gte('month', start).lt('month', nextMonth).order('month').order('type').order('description')
    const { data: c } = await supabase.from('credit_cards').select('*').gte('month', start).lt('month', nextMonth).order('card').order('description')
    setTransactions((t as Transaction[]) ?? [])
    setCards(c ?? [])
  }

  useEffect(() => { loadData() }, [month])

  if (loading) return <div className="auth"><p>Carregando...</p></div>
  if (!session) return <Auth />

  const ft = transactions.filter(r => (owner === 'all' || r.owner === owner) && (!search || r.description.toLowerCase().includes(search.toLowerCase())))
  const fc = cards.filter(r => (owner === 'all' || r.owner === owner) && (!search || r.description.toLowerCase().includes(search.toLowerCase())))

  const income = ft.filter(r => r.type === 'income').reduce((s, r) => s + +r.amount, 0)
  const expense = ft.filter(r => r.type === 'expense').reduce((s, r) => s + +r.amount, 0)
  const cardTotal = fc.reduce((s, r) => s + +r.amount, 0)

  const isEditor = userRole === 'editor'
  const isOwner = session.user.app_metadata?.provider === 'github' || session.user.identities?.some(i => i.provider === 'github') || false

  return (
    <div className="layout">
      <Sidebar session={session} page={page} isOwner={isOwner} onNavigate={setPage} />
      <main className="main">
        {page === 'dashboard' && (
          <Dashboard categories={categories} />
        )}

        {page === 'transactions' && (
          <>
            <div className="controls">
              <Select
                value={month}
                onChange={setMonth}
                options={months.length ? months.map(m => ({ value: m, label: new Date(m + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) })) : [{ value: '', label: 'Sem dados' }]}
              />
              <Select
                value={owner}
                onChange={v => setOwner(v as 'all' | Owner)}
                options={[{ value: 'all', label: 'Todos' }, { value: 'personal', label: 'Pessoal' }, { value: 'mother_in_law', label: 'Sogra' }]}
              />
              <input type="text" className="search-input" placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
              {isEditor && <Button onClick={() => setShowAdd(true)}>+ Novo</Button>}
            </div>

            <SummaryCards income={income} expense={expense} cardTotal={cardTotal} />

            <TransactionsTable
              transactions={ft}
              categories={categories}
              canEdit={isEditor}
              onUpdate={(id, data) => setTransactions(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))}
              onDelete={id => setTransactions(prev => prev.filter(r => r.id !== id))}
            />

            <CardsTable
              cards={fc}
              canEdit={isEditor}
              onDelete={id => setCards(prev => prev.filter(r => r.id !== id))}
            />
          </>
        )}

        {page === 'recurring' && (
          <RecurringPage categories={categories} />
        )}

        {page === 'projection' && (
          <Projection />
        )}

        {page === 'budgets' && (
          <BudgetsPage categories={categories} />
        )}

        {page === 'access' && (
          <AccessPage />
        )}

        {page === 'categories' && (
          <CategoriesPage />
        )}
      </main>

      {showAdd && (
        <AddTransaction
          categories={categories}
          onSaved={loadData}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
