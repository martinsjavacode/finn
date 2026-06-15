import type { AdminMember } from '../../types/admin'

interface MemberRowProps {
  member: AdminMember
  roles: { id: string; name: string }[]
  onRoleChange: (userId: string, newRoleId: string) => void
  onRemove: (userId: string) => void
}

function getInitial(member: AdminMember): string {
  if (member.displayName) {
    return member.displayName.charAt(0).toUpperCase()
  }
  return member.email.charAt(0).toUpperCase()
}

export default function MemberRow({ member, roles, onRoleChange, onRemove }: MemberRowProps) {
  const displayLabel = member.displayName || member.email

  return (
    <div className="member-row">
      <span className="member-row-avatar" aria-hidden="true">
        {getInitial(member)}
      </span>

      <div className="member-row-info">
        <span className="member-row-name">{displayLabel}</span>
        {member.displayName && (
          <span className="member-row-email">{member.email}</span>
        )}
      </div>

      <select
        className="member-row-role-select"
        value={member.roleId}
        onChange={(e) => onRoleChange(member.userId, e.target.value)}
        aria-label={`Papel de ${displayLabel}`}
      >
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="member-row-remove"
        onClick={() => onRemove(member.userId)}
        aria-label={`Remover ${displayLabel}`}
        title="Remover membro"
      >
        ✕
      </button>
    </div>
  )
}
