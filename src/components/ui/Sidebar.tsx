import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from '../../services/auth'
import type { Session } from '@supabase/supabase-js'
import type { Account } from '../../types/database'
import { LayoutDashboard, Receipt, Repeat, TrendingUp, Wallet, Tags, CreditCard, Users, Shield, LogOut, Menu, X, Building2 } from 'lucide-react'

interface Props {
  session: Session
  isSuperadmin: boolean
  can: (resource: string, action: string) => boolean
  accounts: Account[]
  activeAccount: Account | null
  setActiveAccount: (id: string) => void
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
  '/accounts': 'Contas',
}

export default function Sidebar({ session, isSuperadmin, can, accounts, activeAccount, setActiveAccount }: Props) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const link = (to: string, label: React.ReactNode) => (
    <NavLink to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>{label}</NavLink>
  )

  return (
    <>
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setOpen(true)} aria-label="Abrir menu">
          <Menu size={18} />
        </button>
        <span className="mobile-header-title">{pageTitles[location.pathname] ?? 'Finn'}</span>
      </div>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} role="navigation" aria-label="Menu principal">
        <div className="sidebar-header">
          <h1>💰 Finn</h1>
          <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={18} /></button>
        </div>

        {accounts.length > 1 && (
          <div className="account-selector">
            {accounts.map(a => (
              <button
                key={a.id}
                className={`account-chip ${a.id === activeAccount?.id ? 'active' : ''}`}
                style={{ '--account-color': a.color } as React.CSSProperties}
                onClick={() => setActiveAccount(a.id)}
              >
                <span className="account-dot" />
                {a.name}
              </button>
            ))}
          </div>
        )}

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
          {isSuperadmin && link('/accounts', <><Building2 size={16} /> Contas</>)}
          {isSuperadmin && link('/access', <><Users size={16} /> Usuários</>)}
          {isSuperadmin && link('/roles', <><Shield size={16} /> Permissões</>)}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">{session.user.email}</span>
          <button className="tab" onClick={() => { signOut(); navigate('/', { replace: true }) }}><LogOut size={14} /> Sair</button>
        </div>
      </aside>
    </>
  )
}
