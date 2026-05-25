import { NavLink } from 'react-router-dom'
import { signOut } from '../../services/auth'
import type { Session } from '@supabase/supabase-js'

interface Props {
  session: Session
  isOwner: boolean
}

export default function Sidebar({ session, isOwner }: Props) {
  const link = (to: string, label: string) => (
    <NavLink to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>{label}</NavLink>
  )

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>💰 Finn</h1>
      </div>
      <nav className="sidebar-nav">
        <span className="sidebar-group">Financeiro</span>
        {link('/', '📊 Dashboard')}
        {link('/transactions', '📋 Lançamentos')}
        {link('/recurring', '🔄 Recorrentes')}
        {link('/projection', '📈 Projeção')}

        <span className="sidebar-group">Configurações</span>
        {link('/budgets', '💰 Orçamentos')}
        {link('/categories', '🏷️ Categorias')}
        {link('/cards', '💳 Cartões')}
        {isOwner && link('/access', '👥 Acessos')}
      </nav>
      <div className="sidebar-footer">
        <span className="sidebar-user">{session.user.email}</span>
        <button className="tab" onClick={() => signOut()}>Sair</button>
      </div>
    </aside>
  )
}
