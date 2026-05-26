import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks'
import Auth from './components/auth/Auth'
import Sidebar from './components/ui/Sidebar'
import ToastContainer from './components/ui/Toast'
import ConfirmDialog from './components/ui/ConfirmDialog'
import { TableSkeleton } from './components/ui/Skeleton'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './components/ui/ErrorBoundary'
import './App.css'

const Dashboard = lazy(() => import('./components/dashboard/Dashboard'))
const TransactionsPage = lazy(() => import('./components/transactions/TransactionsPage'))
const RecurringPage = lazy(() => import('./components/recurring/RecurringTemplates'))
const Projection = lazy(() => import('./components/projection/Projection'))
const BudgetsPage = lazy(() => import('./components/budgets/BudgetsPage'))
const AccessPage = lazy(() => import('./components/access/AccessPage'))
const CategoriesPage = lazy(() => import('./components/categories/CategoriesPage'))
const CardsPage = lazy(() => import('./components/cards/CardsPage'))
const RolesPage = lazy(() => import('./components/roles/RolesPage'))

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false } },
})

function ProtectedRoute({ children, allowed }: { children: ReactNode; allowed: boolean }) {
  if (!allowed) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppLayout() {
  const { session, loading, isOwner, unauthorized, can, signOut: logout } = useAuth()
  const navigate = useNavigate()

  if (loading) return <div className="auth"><div className="skeleton" style={{ width: '120px', height: '2rem', margin: '0 auto' }} aria-hidden="true" /><div className="skeleton" style={{ width: '200px', height: '1rem', margin: '1rem auto' }} aria-hidden="true" /></div>
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
        <ErrorBoundary>
          <Suspense fallback={<TableSkeleton />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<ProtectedRoute allowed={can('transactions', 'read')}><TransactionsPage /></ProtectedRoute>} />
              <Route path="/recurring" element={<ProtectedRoute allowed={can('recurring_templates', 'read')}><RecurringPage /></ProtectedRoute>} />
              <Route path="/projection" element={<Projection />} />
              <Route path="/budgets" element={<ProtectedRoute allowed={can('budgets', 'read')}><BudgetsPage /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute allowed={can('categories', 'read')}><CategoriesPage /></ProtectedRoute>} />
              <Route path="/cards" element={<ProtectedRoute allowed={can('cards', 'read')}><CardsPage /></ProtectedRoute>} />
              <Route path="/access" element={<ProtectedRoute allowed={isOwner}><AccessPage /></ProtectedRoute>} />
              <Route path="/roles" element={<ProtectedRoute allowed={isOwner}><RolesPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
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
