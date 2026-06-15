import type { MigrationItemType } from '../../types/admin'
import Button from '../ui/Button'

interface MigrationSummaryBarProps {
  selectedCount: number
  totalSelectedAmount: number
  itemType: MigrationItemType
  sourceAccountName: string
  onMigrate: () => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

function getItemTypeLabel(itemType: MigrationItemType, count: number): string {
  switch (itemType) {
    case 'entries':
      return count === 1 ? 'lançamento selecionado' : 'lançamentos selecionados'
    case 'installments':
      return count === 1 ? 'parcelamento selecionado' : 'parcelamentos selecionados'
    case 'budgets':
      return count === 1 ? 'orçamento selecionado' : 'orçamentos selecionados'
  }
}

export default function MigrationSummaryBar({
  selectedCount,
  totalSelectedAmount,
  itemType,
  sourceAccountName,
  onMigrate,
  onSelectAll,
  onDeselectAll,
}: MigrationSummaryBarProps) {
  if (selectedCount === 0) return null

  const formattedAmount = totalSelectedAmount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const itemLabel = getItemTypeLabel(itemType, selectedCount)

  return (
    <div className="migration-summary-bar" role="toolbar" aria-label="Ações de migração">
      <div className="migration-summary-bar-info">
        <span className="migration-summary-bar-count">
          {selectedCount} {itemLabel}
        </span>
        <span className="migration-summary-bar-amount">{formattedAmount}</span>
        <span className="migration-summary-bar-source">de "{sourceAccountName}"</span>
      </div>

      <div className="migration-summary-bar-actions">
        <button
          type="button"
          className="migration-summary-bar-link"
          onClick={onSelectAll}
        >
          Selecionar todos
        </button>
        <button
          type="button"
          className="migration-summary-bar-link"
          onClick={onDeselectAll}
        >
          Desmarcar
        </button>
        <Button variant="primary" onClick={onMigrate}>
          Migrar →
        </Button>
      </div>
    </div>
  )
}
