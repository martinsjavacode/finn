import { useState, useRef, useEffect } from 'react'

interface AccountCardProps {
  account: {
    id: string
    name: string
    color: string
    member_count: number
    created_at: string | null
    members?: { email: string; display_name: string | null }[]
  }
  expanded: boolean
  onExpand: () => void
  onEdit: () => void
  onDelete: () => void
}

function getInitials(member: { email: string; display_name: string | null }): string {
  if (member.display_name) {
    return member.display_name.charAt(0).toUpperCase()
  }
  return member.email.charAt(0).toUpperCase()
}

export default function AccountCard({ account, expanded, onExpand, onEdit, onDelete }: AccountCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const members = account.members ?? []
  const visibleMembers = members.slice(0, 5)
  const overflowCount = account.member_count - visibleMembers.length

  const formattedDate = account.created_at
    ? new Date(account.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—'

  return (
    <div
      className={`account-card-item${expanded ? ' expanded' : ''}`}
      style={{ borderLeftColor: account.color || 'var(--purple)' }}
    >
      <div className="account-card-item-header">
        <span
          className="account-card-dot"
          style={{ background: account.color || 'var(--purple)' }}
        />
        <span className="account-card-name">{account.name}</span>

        <div className="account-card-menu" ref={menuRef}>
          <button
            type="button"
            className="account-card-menu-trigger"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            aria-label="Ações da conta"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            ⋯
          </button>
          {menuOpen && (
            <ul className="account-card-menu-dropdown" role="menu">
              <li
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onEdit()
                }}
              >
                Editar
              </li>
              <li
                role="menuitem"
                className="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onDelete()
                }}
              >
                Excluir
              </li>
            </ul>
          )}
        </div>
      </div>

      {visibleMembers.length > 0 && (
        <div className="account-card-avatars">
          {visibleMembers.map((member, i) => (
            <span
              key={i}
              className="account-card-avatar"
              style={{ background: account.color || 'var(--purple)' }}
              title={member.display_name || member.email}
            >
              {getInitials(member)}
            </span>
          ))}
          {overflowCount > 0 && (
            <span className="account-card-avatar-overflow">+{overflowCount}</span>
          )}
        </div>
      )}

      <div className="account-card-meta">
        <span>{account.member_count} membro{account.member_count !== 1 ? 's' : ''}</span>
        <span>Criada em {formattedDate}</span>
      </div>

      <button
        type="button"
        className="account-card-expand-toggle"
        onClick={(e) => {
          e.stopPropagation()
          onExpand()
        }}
      >
        {expanded ? '▲ Recolher' : '▼ Expandir membros'}
      </button>
    </div>
  )
}
