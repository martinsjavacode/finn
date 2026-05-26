import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth, useAppData, useTransactions } from './hooks'
import type { Owner } from './types/database'
import Auth from './components/auth/Auth'
import Sidebar from './components/ui/Sidebar'
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
import CardsPage from './components/cards/CardsPage'
import RolesPage from './components/roles/RolesPage'
import Button from './components/ui/Button'
import ToastContainer from './components/ui/Toast'
import ConfirmDialog from './components/ui/ConfirmDialog'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './components/ui/ErrorBoundary'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false } },
})

function TransactionsPage() {
  const { session, can } = useAuth()
  const { categories, cardsList } = useAppData(!!session)
  const { month, setMonth, months, transactions, cards } = useTransactions(!!session)
  const [owner, setOwner] = useState<'all' | Owner>('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const ft = transactions.filter(r => (owner === 'all' || r.owner === owner) && (!search || r.description.toLowerCase().includes(search.toLowerCase())))
  const fc = cards.filter(r => (owner === 'all' || r.owner === owner) && (!search || r.description.toLowerCase().includes(search.toLowerCase())))

  const income = ft.filter(r => r.type === 'income').reduce((s, r) => s + +r.amount, 0)
  const expense = ft.filter(r => r.type === 'expense').reduce((s, r) => s + +r.amount, 0)
  const cardTotal = fc.reduce((s, r) => s + +r.amount, 0)

  const canCreate = can('transactions', 'create')
  const canUpdate = can('transactions', 'update')
  const canDelete = can('transactions', 'delete')

  return (
    <>
      <h2 className="dashboard-title">Lançamentos</h2>
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
        {canCreate && <Button onClick={() => setShowAdd(true)}>+ Novo</Button>}
      </div>

      <SummaryCards income={income} expense={expense} cardTotal={cardTotal} />

      <TransactionsTable
        transactions={ft}
        categories={categories}
        month={month}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      <CardsTable
        cards={fc}
        cardsList={cardsList}
        categories={categories}
        month={month}
        canUpdate={can('credit_cards', 'update')}
        canDelete={can('credit_cards', 'delete')}
      />

      {showAdd && (
        <AddTransaction
          categories={categories}
          cardsList={cardsList}
          month={month}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  )
}

function AppLayout() {
  const { session, loading, isOwner, unauthorized, can, signOut: logout } = useAuth()
  const { categories, cardsList } = useAppData(!!session && !unauthorized)
  const navigate = useNavigate()

  if (loading) return <div className="auth"><div className="skeleton" style={{ width: '120px', height: '2rem', margin: '0 auto' }} /><div className="skeleton" style={{ width: '200px', height: '1rem', margin: '1rem auto' }} /></div>
  if (!session) return <Auth />
  if (unauthorized) return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand"><h1>💰 Finn</h1></div>
        <p className="auth-subtitle">Acesso não autorizado</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>O email <strong>{session.user.email}</strong> não está cadastrado no sistema. Solicite acesso ao administrador.</p>
        <button className="auth-btn-primary" onClick={() => { logout(); navigate('/', { replace: true }) }}>Sair</button>
      </div>
    </div>
  )

  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">Pular para conteúdo</a>
      <Sidebar session={session} isOwner={isOwner} can={can} />
      <main className="main" id="main-content">
        <Routes>
          <Route path="/" element={<Dashboard categories={categories} />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/recurring" element={<RecurringPage categories={categories} cardsList={cardsList} />} />
          <Route path="/projection" element={<Projection />} />
          <Route path="/budgets" element={<BudgetsPage categories={categories} />} />
          <Route path="/access" element={<AccessPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/cards" element={<CardsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ToastContainer />
      <ConfirmDialog />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename="/finn">
          <AppLayout />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
