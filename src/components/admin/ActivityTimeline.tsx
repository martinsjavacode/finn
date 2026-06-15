import { groupLogsByDay } from '../../utils/activityFormatter'
import ActivityEntry from './ActivityEntry'
import type { ActivityLog, ActivityActionType } from '../../types/admin'

interface ActivityTimelineProps {
  logs: ActivityLog[]
  loading: boolean
  error: boolean
}

const ACTION_ICONS: Record<string, { icon: string; color: string }> = {
  migration: { icon: '🔀', color: 'var(--blue, #3b82f6)' },
  member_added: { icon: '👤+', color: 'var(--green, #10b981)' },
  member_removed: { icon: '👤−', color: 'var(--orange, #f97316)' },
  role_changed: { icon: '🔑', color: 'var(--purple, #8b5cf6)' },
  account_created: { icon: '✨', color: 'var(--green, #10b981)' },
  account_deleted: { icon: '🗑️', color: 'var(--red, #ef4444)' },
}

const DESTRUCTIVE_ACTIONS: ActivityActionType[] = ['account_deleted', 'member_removed']

function isDestructiveAction(actionType: string): boolean {
  return DESTRUCTIVE_ACTIONS.includes(actionType as ActivityActionType)
}

function getActionIcon(actionType: string) {
  return ACTION_ICONS[actionType] ?? { icon: '•', color: 'var(--text-secondary)' }
}

export default function ActivityTimeline({ logs, loading, error }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="loading-container">
        <p>Carregando atividades...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error">Erro ao carregar logs de atividade.</p>
      </div>
    )
  }

  if (logs.length === 0) {
    return <p className="empty">Nenhuma atividade registrada ainda. As ações administrativas aparecerão aqui.</p>
  }

  const dayGroups = groupLogsByDay(logs)

  return (
    <div className="activity-timeline">
      {dayGroups.map(group => (
        <div key={group.day} className="activity-day-group">
          <div className="activity-day-header">
            <span className="activity-day-label">{group.day}</span>
            <span className="activity-day-line" />
          </div>
          <div className="activity-day-entries">
            {group.entries.map(log => {
              const { icon, color } = getActionIcon(log.action_type)
              return (
                <ActivityEntry
                  key={log.id}
                  log={log}
                  icon={icon}
                  iconColor={color}
                  isDestructive={isDestructiveAction(log.action_type)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
