import { useState } from 'react'
import Modal from '../ui/Modal'
import Select from '../ui/Select'

interface Props {
  accounts: { id: string; name: string }[]
  currentAccountId: string
  count: number
  label: string
  onConfirm: (targetAccountId: string) => void
  onClose: () => void
}

export default function MigrateModal({ accounts, currentAccountId, count, label, onConfirm, onClose }: Props) {
  const [target, setTarget] = useState('')
  const options = accounts.filter(a => a.id !== currentAccountId).map(a => ({ value: a.id, label: a.name }))

  return (
    <Modal title="Migrar para outra conta" onClose={onClose} onSubmit={e => { e.preventDefault(); onConfirm(target) }} submitLabel="Migrar" submitDisabled={!target}>
      <p>{count} {label} selecionado(s)</p>
      <label className="form-label">Conta destino
        <Select value={target} onChange={setTarget} options={[{ value: '', label: 'Selecione...' }, ...options]} />
      </label>
    </Modal>
  )
}
