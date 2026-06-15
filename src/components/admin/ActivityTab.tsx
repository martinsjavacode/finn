import { useState } from 'react'
import { useActivityLogs } from '../../hooks/useActivityLogs'
import { useAdminAccounts } from '../../hooks/useAdminAccounts'
import ActivityTimeline from './ActivityTimeline'
import Pagination from '../ui/Pagination'
import type { ActivityActionType } from '../../types/admin'

const ACTION_TYPE_OPTIONS: { value: ActivityActionType | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'migration', label: 'Migração' },
  { value: 'member_added', label: 'Membro adicionado' },
  { value: 'member_removed', label: 'Membro removido' },
  { value: 'role_changed', label: 'Papel alterado' },
  { value: 'account_created', label: 'Conta criada' },
  { value: 'account_deleted', label: 'Conta excluída' },
]

const PER_PAGE = 50

export default function ActivityTab() {
  const [actionType, setActionType] = useState<ActivityActionType | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const filters = { actionType, accountId }
  const { logs, totalCount, isLoading, error } = useActivityLogs(filters, page, PER_PAGE)
  const { accounts } = useAdminAccounts()

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE))

  const handleActionTypeChange = (value: string) => {
    setActionType(value === '' ? null : (value as ActivityActionType))
    setPage(1)
  }

  const handleAccountChange = (value: string) => {
    setAccountId(value === '' ? null : value)
    setPage(1)
  }

  return (
    <div className="activity-tab">
      <div className="activity-filters">
        <div className="filter-group">
          <label htmlFor="activity-action-type">Tipo de ação</label>
          <select
            id="activity-action-type"
            value={actionType ?? ''}
            onChange={e => handleActionTypeChange(e.target.value)}
          >
            {ACTION_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="activity-account">Conta</label>
          <select
            id="activity-account"
            value={accountId ?? ''}
            onChange={e => handleAccountChange(e.target.value)}
          >
            <option value="">Todas as contas</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ActivityTimeline logs={logs} loading={isLoading} error={!!error} />

      {!isLoading && !error && logs.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          perPage={PER_PAGE}
          onPageChange={setPage}
          onPerPageChange={() => {}}
        />
      )}
    </div>
  )
}
