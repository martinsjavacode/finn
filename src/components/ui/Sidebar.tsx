import { supabase } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'


export type Page = 'dashboard' | 'transactions' | 'recurring' | 'projection' | 'budgets' | 'access' | 'categories' | 'cards'

interface Props {
  session: Session
  page: Page
  isOwner: boolean
  onNavigate: (page: Page) => void
}

export default function Sidebar({ session, page, isOwner, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>💰 Finn</h1>
      </div>
      <nav className="sidebar-nav">
        <span className="sidebar-group">Financeiro</span>
        <button className={`sidebar-link ${page === 'dashboard' ? 'active' : ''}`} onClick={() => onNavigate('dashboard')}>📊 Dashboard</button>
        <button className={`sidebar-link ${page === 'transactions' ? 'active' : ''}`} onClick={() => onNavigate('transactions')}>📋 Lançamentos</button>
        <button className={`sidebar-link ${page === 'recurring' ? 'active' : ''}`} onClick={() => onNavigate('recurring')}>🔄 Recorrentes</button>
        <button className={`sidebar-link ${page === 'projection' ? 'active' : ''}`} onClick={() => onNavigate('projection')}>📈 Projeção</button>

        <span className="sidebar-group">Configurações</span>
        <button className={`sidebar-link ${page === 'budgets' ? 'active' : ''}`} onClick={() => onNavigate('budgets')}>💰 Orçamentos</button>
        <button className={`sidebar-link ${page === 'categories' ? 'active' : ''}`} onClick={() => onNavigate('categories')}>🏷️ Categorias</button>
        <button className={`sidebar-link ${page === 'cards' ? 'active' : ''}`} onClick={() => onNavigate('cards')}>💳 Cartões</button>
        {isOwner && <button className={`sidebar-link ${page === 'access' ? 'active' : ''}`} onClick={() => onNavigate('access')}>👥 Acessos</button>}
      </nav>
      <div className="sidebar-footer">
        <span className="sidebar-user">{session.user.email}</span>
        <button className="tab" onClick={() => supabase.auth.signOut()}>Sair</button>
      </div>
    </aside>
  )
}
