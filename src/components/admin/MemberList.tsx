import type { AdminMember } from '../../types/admin'
import Button from '../ui/Button'
import MemberRow from './MemberRow'

interface MemberListProps {
  members: AdminMember[]
  roles: { id: string; name: string }[]
  onRoleChange: (userId: string, newRoleId: string) => void
  onRemove: (userId: string) => void
  onAddMember: () => void
}

export default function MemberList({ members, roles, onRoleChange, onRemove, onAddMember }: MemberListProps) {
  return (
    <div className="member-list">
      <div className="member-list-header">
        <span className="member-list-count">
          {members.length} membro{members.length !== 1 ? 's' : ''}
        </span>
        <Button onClick={onAddMember} className="member-list-add-btn">
          Adicionar membro
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="empty">Nenhum membro nesta conta.</p>
      ) : (
        <div className="member-list-rows">
          {members.map((member) => (
            <MemberRow
              key={member.userId}
              member={member}
              roles={roles}
              onRoleChange={onRoleChange}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}
