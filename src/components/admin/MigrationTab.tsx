import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminMigration } from '../../hooks/useAdminMigration'
import { useAuth, useAppData, useBatchSelection } from '../../hooks'
import { migrateEntries, migrateBudgets, migrateInstallmentPurchases } from '../../services/migration'
import { recordActivity } from '../../services/activityLog'
import { applyMigrationFilters, excludeSourceAccount } from '../../utils/adminFilters'
import { toast, showError } from '../../lib/toast'
import type { MigrationItemType, MigrationFilters as MigrationFiltersType } from '../../types/admin'
import MigrationFilters from './MigrationFilters'
import MigrationDataTable from './MigrationDataTable'
import MigrationSummaryBar from './MigrationSummaryBar'
import MigrateConfirmModal from './MigrateConfirmModal'
import Button from '../ui/Button'

const ITEM_TYPE_TABS: { value: MigrationItemType; label: string }[] = [
  { value: 'entries', label: 'Lançamentos' },
  { value: 'installments', label: 'Parcelamentos' },
  { value: 'budgets', label: 'Orçamentos' },
]

const DEFAULT_FILTERS: MigrationFiltersType = {
  search: '',
  categoryId: null,
  dateFrom: null,
  dateTo: null,
  amountMin: null,
  amountMax: null,
}

export default function MigrationTab() {
  const { session, accounts, activeAccountId } = useAuth()
  const { categories } = useAppData(!!session)
  const queryClient = useQueryClient()

  const [sourceAccountId, setSourceAccountId] = useState<string>(activeAccountId ?? '')
  const [itemType, setItemType] = useState<MigrationItemType>('entries')
  const [filters, setFilters] = useState<MigrationFiltersType>(DEFAULT_FILTERS)
  const [showMigrateModal, setShowMigrateModal] = useState(false)
  const [migrating, setMigrating] = useState(false)

  const { selectedIds, toggleItem, selectAll, deselectAll } = useBatchSelection()

  const { data, isLoading, error } = useAdminMigration(sourceAccountId || null, itemType)

  // Clear selection when item type changes
  useEffect(() => {
    deselectAll()
  }, [itemType, deselectAll])

  // Clear selection when filters change
  useEffect(() => {
    deselectAll()
  }, [filters, deselectAll])

  // Clear selection when source account changes
  useEffect(() => {
    deselectAll()
  }, [sourceAccountId, deselectAll])

  // Apply filters to data
  const filteredItems = useMemo(() => {
    return applyMigrationFilters(data, filters)
  }, [data, filters])

  const handleItemTypeChange = (type: MigrationItemType) => {
    setItemType(type)
  }

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSourceAccountId(e.target.value)
  }

  const handleFiltersChange = useCallback((newFilters: MigrationFiltersType) => {
    setFilters(newFilters)
  }, [])

  // Calculate total amount of selected items
  const totalSelectedAmount = useMemo(() => {
    return filteredItems
      .filter(item => selectedIds.has(item.id))
      .reduce((sum, item) => sum + item.amount, 0)
  }, [filteredItems, selectedIds])

  // Source account details
  const sourceAccount = useMemo(
    () => accounts.find(a => a.id === sourceAccountId),
    [accounts, sourceAccountId]
  )

  // Target accounts (exclude source)
  const targetAccounts = useMemo(
    () => excludeSourceAccount(accounts, sourceAccountId),
    [accounts, sourceAccountId]
  )

  // Categories formatted for filters
  const categoryOptions = useMemo(
    () => categories.map(c => ({ id: c.id, name: c.label })),
    [categories]
  )

  const handleMigrate = () => {
    setShowMigrateModal(true)
  }

  const handleConfirmMigration = async (targetAccountId: string) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    setMigrating(true)
    try {
      let result: { data: number; error: unknown }

      switch (itemType) {
        case 'entries':
          result = await migrateEntries(ids, targetAccountId)
          break
        case 'budgets':
          result = await migrateBudgets(ids, targetAccountId)
          break
        case 'installments':
          result = await migrateInstallmentPurchases(ids, targetAccountId)
          break
      }

      if (result.error) {
        showError(result.error as { message: string } | null, 'Erro ao migrar itens')
        return
      }

      const count = result.data ?? ids.length
      const targetAccount = accounts.find(a => a.id === targetAccountId)

      toast(`${count} item(ns) migrado(s) com sucesso para "${targetAccount?.name ?? 'conta destino'}"`)

      // Fire-and-forget activity log
      const actorEmail = session?.user?.email ?? 'unknown'
      recordActivity({
        actionType: 'migration',
        actorEmail,
        accountId: sourceAccountId || undefined,
        accountName: sourceAccount?.name,
        details: {
          type: 'migration',
          sourceAccount: sourceAccount?.name ?? sourceAccountId,
          targetAccount: targetAccount?.name ?? targetAccountId,
          itemType,
          itemCount: count,
        },
      }).catch(() => {
        // Non-blocking: activity log failure doesn't affect user flow
      })

      // Invalidate migration query to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'migration', sourceAccountId, itemType] })

      // Clear selection and close modal
      deselectAll()
      setShowMigrateModal(false)
    } catch (err) {
      showError(err instanceof Error ? err : null, 'Erro inesperado ao migrar')
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="migration-tab">
      {/* Source account selector */}
      <label className="form-label">
        Conta de origem
        <select
          className="pagination-select"
          value={sourceAccountId}
          onChange={handleSourceChange}
          aria-label="Selecionar conta de origem"
        >
          <option value="" disabled>Selecione uma conta</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              ● {account.name}
            </option>
          ))}
        </select>
      </label>

      {/* Item type sub-tabs */}
      <div className="tabs" style={{ marginTop: '1rem' }}>
        {ITEM_TYPE_TABS.map(tab => (
          <Button
            key={tab.value}
            variant="tab"
            active={itemType === tab.value}
            onClick={() => handleItemTypeChange(tab.value)}
          >
            {tab.label} ({itemType === tab.value ? data.length : '…'})
          </Button>
        ))}
      </div>

      {/* Filters */}
      <MigrationFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        categories={categoryOptions}
        itemType={itemType}
      />

      {/* Content area */}
      {error && !isLoading && (
        <p className="error" style={{ padding: '1rem' }}>
          Erro ao carregar dados: {error instanceof Error ? error.message : 'Erro desconhecido'}
        </p>
      )}

      {!error && (
        <MigrationDataTable
          items={filteredItems}
          itemType={itemType}
          selectedIds={selectedIds}
          onToggleItem={toggleItem}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          loading={isLoading}
        />
      )}

      {/* Summary bar (sticky bottom) */}
      <MigrationSummaryBar
        selectedCount={selectedIds.size}
        totalSelectedAmount={totalSelectedAmount}
        itemType={itemType}
        sourceAccountName={sourceAccount?.name ?? ''}
        onMigrate={handleMigrate}
        onSelectAll={() => selectAll(filteredItems.map(i => i.id))}
        onDeselectAll={deselectAll}
      />

      {/* Migrate confirm modal */}
      {showMigrateModal && sourceAccount && (
        <MigrateConfirmModal
          sourceAccount={{ id: sourceAccount.id, name: sourceAccount.name, color: sourceAccount.color }}
          targetAccounts={targetAccounts.map(a => ({ id: a.id, name: a.name, color: a.color }))}
          selectedCount={selectedIds.size}
          totalAmount={totalSelectedAmount}
          itemType={itemType}
          onConfirm={handleConfirmMigration}
          onClose={() => setShowMigrateModal(false)}
          loading={migrating}
        />
      )}
    </div>
  )
}
