import { useState } from 'react'
import type { MigrationItemType } from '../../types/admin'
import { formatItemType } from '../../utils/activityFormatter'
import { fmt } from '../../utils/format'
import Modal from '../ui/Modal'
import Select from '../ui/Select'

interface MigrateConfirmModalProps {
  sourceAccount: { id: string; name: string; color: string }
  targetAccounts: { id: string; name: string; color: string }[]
  selectedCount: number
  totalAmount: number
  itemType: MigrationItemType
  onConfirm: (targetAccountId: string) => void
  onClose: () => void
  loading: boolean
}

export default function MigrateConfirmModal({
  sourceAccount,
  targetAccounts,
  selectedCount,
  totalAmount,
  itemType,
  onConfirm,
  onClose,
  loading,
}: MigrateConfirmModalProps) {
  const [targetAccountId, setTargetAccountId] = useState('')

  const title = `Migrar ${selectedCount} ${formatItemType(itemType)}`

  const targetOptions = [
    { value: '', label: 'Selecione a conta destino...' },
    ...targetAccounts.map(a => ({ value: a.id, label: a.name })),
  ]

  const selectedTarget = targetAccounts.find(a => a.id === targetAccountId)
  const canConfirm = !!targetAccountId && !loading

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canConfirm) {
      onConfirm(targetAccountId)
    }
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={loading ? 'Migrando...' : 'Confirmar Migração'}
      submitDisabled={!canConfirm}
    >
      <div className="migrate-confirm-flow">
        {/* Source account */}
        <div className="migrate-confirm-account">
          <span
            className="account-color-dot"
            style={{ backgroundColor: sourceAccount.color }}
            aria-hidden="true"
          />
          <span className="migrate-confirm-account-name">{sourceAccount.name}</span>
        </div>

        {/* Arrow */}
        <div className="migrate-confirm-arrow" aria-hidden="true">→</div>

        {/* Target account selector */}
        <div className="migrate-confirm-account">
          {selectedTarget && (
            <span
              className="account-color-dot"
              style={{ backgroundColor: selectedTarget.color }}
              aria-hidden="true"
            />
          )}
          <Select
            value={targetAccountId}
            onChange={setTargetAccountId}
            options={targetOptions}
            aria-label="Selecionar conta destino"
          />
        </div>
      </div>

      {/* Total amount */}
      <p className="migrate-confirm-amount">
        Total: <strong>{fmt(totalAmount)}</strong>
      </p>
    </Modal>
  )
}
