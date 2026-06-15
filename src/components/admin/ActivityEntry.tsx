import type { ActivityLog } from '../../types/admin'
import { formatActivityDescription, formatTimestamp } from '../../utils/activityFormatter'

interface ActivityEntryProps {
  log: ActivityLog
  icon: string
  iconColor: string
  isDestructive: boolean
}

export default function ActivityEntry({ log, icon, iconColor, isDestructive }: ActivityEntryProps) {
  return (
    <div
      className="activity-entry"
      style={isDestructive ? { background: 'rgba(239, 68, 68, 0.05)' } : undefined}
    >
      <span className="activity-entry-icon" style={{ color: iconColor }}>
        {icon}
      </span>
      <div className="activity-entry-content">
        <span className="activity-entry-description">
          {formatActivityDescription(log)}
        </span>
        <span className="activity-entry-meta">
          {log.actor_email} · {formatTimestamp(log.created_at)}
        </span>
      </div>
    </div>
  )
}
