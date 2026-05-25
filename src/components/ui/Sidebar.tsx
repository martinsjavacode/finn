import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { signOut } from '../../services/auth'
import type { Session } from '@supabase/supabase-js'

interface Props {
  session: Session
  isOwner: boolean
}

const pageTitles: Record<string, string> = {
  '/': '📊 Dashboard',
  '/transactions': '📋 Lançamentos',
  '/recurring': '🔄 Recorrentes',
  '/projection': '📈 Projeção',
  '/budgets': '💰 Orçamentos',
  '/categories': '🏷️ Categorias',
  '/cards': '💳 Cartões',
  '/access': '👥 Acessos',
}

export default function Sidebar({ session, isOwner }: Props) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const link = (to: string, label: string) => (
    <NavLink to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>{label}</NavLink>
  )

  return (
    <>
      <div className="mobile-header">
        <span className="mobile-header-title">{pageTitles[location.pathname] ?? 'Finn'}</span>
      </div>

      <button className="hamburger" onClick={() => setOpen(true)} aria-label="Abrir menu">
        <span /><span /><span />
      </button>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h1>💰 Finn</h1>
          <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Fechar menu">✕</button>
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
    </>
  )
}
