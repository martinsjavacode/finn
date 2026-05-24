import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

export type Page = 'dashboard' | 'recurring'

interface Props {
  session: Session
  page: Page
  onNavigate: (page: Page) => void
}

export default function Sidebar({ session, page, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>💰 Finn</h1>
      </div>
      <nav className="sidebar-nav">
        <button className={`sidebar-link ${page === 'dashboard' ? 'active' : ''}`} onClick={() => onNavigate('dashboard')}>Dashboard</button>
        <button className={`sidebar-link ${page === 'recurring' ? 'active' : ''}`} onClick={() => onNavigate('recurring')}>🔄 Recorrentes</button>
      </nav>
      <div className="sidebar-footer">
        <span className="sidebar-user">{session.user.email}</span>
        <button className="tab" onClick={() => supabase.auth.signOut()}>Sair</button>
      </div>
    </aside>
  )
}
