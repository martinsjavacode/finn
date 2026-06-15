import { useRef, useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from '../../services/auth'
import type { Session } from '@supabase/supabase-js'
import type { Account } from '../../types/database'
import { LayoutDashboard, Receipt, Repeat, TrendingUp, Wallet, Tags, CreditCard, Users, Shield, LogOut, Menu, X, Landmark } from 'lucide-react'

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
  '/investments': 'Investimentos',
  '/members': 'Membros',
  '/admin': 'Admin',
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
          <AccountSelector accounts={accounts} activeAccount={activeAccount} setActiveAccount={setActiveAccount} />
        )}

        <nav className="sidebar-nav">
          <span className="sidebar-group">Financeiro</span>
          {link('/', <><LayoutDashboard size={16} /> Dashboard</>)}
          {can('transactions', 'read') && link('/transactions', <><Receipt size={16} /> Lançamentos</>)}
          {can('recurring_templates', 'read') && link('/recurring', <><Repeat size={16} /> Recorrentes</>)}
          {link('/projection', <><TrendingUp size={16} /> Projeção</>)}
          {can('investments', 'read') && link('/investments', <><Landmark size={16} /> Investimentos</>)}

          <span className="sidebar-group">Configurações</span>
          {can('budgets', 'read') && link('/budgets', <><Wallet size={16} /> Orçamentos</>)}
          {can('categories', 'read') && link('/categories', <><Tags size={16} /> Categorias</>)}
          {can('cards', 'read') && link('/cards', <><CreditCard size={16} /> Cartões</>)}
          {can('users', 'read') && link('/members', <><Users size={16} /> Membros</>)}
          {isSuperadmin && link('/access', <><Users size={16} /> Usuários</>)}
          {isSuperadmin && link('/admin', <><Shield size={16} /> Admin</>)}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">{session.user.email}</span>
          <button className="tab" onClick={() => { signOut(); navigate('/', { replace: true }) }}><LogOut size={14} /> Sair</button>
        </div>
      </aside>
    </>
  )
}

function AccountSelector({ accounts, activeAccount, setActiveAccount }: { accounts: Account[]; activeAccount: Account | null; setActiveAccount: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="account-dropdown" ref={ref}>
      <button className="account-dropdown-trigger" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="listbox">
        <span className="account-dot" style={{ '--account-color': activeAccount?.color } as React.CSSProperties} />
        <span>{activeAccount?.name ?? 'Conta'}</span>
        <span className="account-dropdown-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className="account-dropdown-list" role="listbox">
          {accounts.map(a => (
            <li key={a.id} role="option" aria-selected={a.id === activeAccount?.id} className={a.id === activeAccount?.id ? 'active' : ''} onClick={() => { setActiveAccount(a.id); setOpen(false) }}>
              <span className="account-dot" style={{ '--account-color': a.color } as React.CSSProperties} />
              {a.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
