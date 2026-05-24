import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

export default function Sidebar({ session }: { session: Session }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>💰 Finn</h1>
      </div>
      <nav className="sidebar-nav">
        <a className="sidebar-link active" href="#">Dashboard</a>
      </nav>
      <div className="sidebar-footer">
        <span className="sidebar-user">{session.user.email}</span>
        <button className="tab" onClick={() => supabase.auth.signOut()}>Sair</button>
      </div>
    </aside>
  )
}
