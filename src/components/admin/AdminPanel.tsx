import { useSearchParams } from 'react-router-dom'
import { resolveTab } from '../../utils/adminFilters'
import type { AdminTab } from '../../types/admin'
import Button from '../ui/Button'
import AccountsTab from './AccountsTab'
import ActivityTab from './ActivityTab'
import MigrationTab from './MigrationTab'
import PermissionsTab from './PermissionsTab'

const TABS: { value: AdminTab; label: string }[] = [
  { value: 'migration', label: 'Migração' },
  { value: 'accounts', label: 'Contas & Membros' },
  { value: 'permissions', label: 'Permissões' },
  { value: 'activity', label: 'Atividade' },
]

export default function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = resolveTab(searchParams.get('tab'))

  const handleTabChange = (tab: AdminTab) => {
    setSearchParams({ tab })
  }

  return (
    <div className="admin-panel">
      <div className="page-header">
        <h2>Admin</h2>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <Button
            key={t.value}
            variant="tab"
            active={activeTab === t.value}
            onClick={() => handleTabChange(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {activeTab === 'migration' && <MigrationTab />}

      {activeTab === 'accounts' && <AccountsTab />}

      {activeTab === 'permissions' && <PermissionsTab />}

      {activeTab === 'activity' && <ActivityTab />}
    </div>
  )
}
