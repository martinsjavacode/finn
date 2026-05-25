import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { signOut } from '../../services/auth'
import type { Session } from '@supabase/supabase-js'
import { LayoutDashboard, Receipt, Repeat, TrendingUp, Wallet, Tags, CreditCard, Users, Shield, LogOut, Menu, X } from 'lucide-react'

interface Props {
  session: Session
  isOwner: boolean
  can: (resource: string, action: string) => boolean
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Lançamentos',
  '/recurring': 'Recorrentes',
  '/projection': 'Projeção',
  '/budgets': 'Orçamentos',
  '/categories': 'Categorias',
  '/cards': 'Cartões',
  '/access': 'Usuários',
  '/roles': 'Permissões',
}

export default function Sidebar({ session, isOwner, can }: Props) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const link = (to: string, label: React.ReactNode) => (
    <NavLink to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>{label}</NavLink>
  )

  return (
    <>
      <div className="mobile-header">
        <span className="mobile-header-title">{pageTitles[location.pathname] ?? 'Finn'}</span>
      </div>

      <button className="hamburger" onClick={() => setOpen(true)} aria-label="Abrir menu">
        <Menu size={18} />
      </button>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h1>💰 Finn</h1>
          <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={18} /></button>
        </div>
        <nav className="sidebar-nav">
          <span className="sidebar-group">Financeiro</span>
          {link('/', <><LayoutDashboard size={16} /> Dashboard</>)}
          {can('transactions', 'read') && link('/transactions', <><Receipt size={16} /> Lançamentos</>)}
          {can('recurring_templates', 'read') && link('/recurring', <><Repeat size={16} /> Recorrentes</>)}
          {link('/projection', <><TrendingUp size={16} /> Projeção</>)}

          <span className="sidebar-group">Configurações</span>
          {can('budgets', 'read') && link('/budgets', <><Wallet size={16} /> Orçamentos</>)}
          {can('categories', 'read') && link('/categories', <><Tags size={16} /> Categorias</>)}
          {can('cards', 'read') && link('/cards', <><CreditCard size={16} /> Cartões</>)}
          {isOwner && link('/access', <><Users size={16} /> Usuários</>)}
          {isOwner && link('/roles', <><Shield size={16} /> Permissões</>)}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">{session.user.email}</span>
          <button className="tab" onClick={() => signOut()}><LogOut size={14} /> Sair</button>
        </div>
      </aside>
    </>
  )
}
