import { useEffect, useState } from 'react'
import { subscribeConfirm, type ConfirmState } from '../../lib/confirm'
import Button from './Button'

export default function ConfirmDialog() {
  const [state, setState] = useState<ConfirmState | null>(null)

  useEffect(() => subscribeConfirm(s => setState(s)), [])

  if (!state) return null

  const handle = (confirmed: boolean) => {
    state.resolve(confirmed)
    setState(null)
  }

  return (
    <div className="modal-overlay" onClick={() => handle(false)}>
      <div className="modal" onClick={e => e.stopPropagation()} role="alertdialog" aria-labelledby="confirm-msg">
        <h2>Confirmar exclusão</h2>
        <p id="confirm-msg" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{state.message}</p>
        <div className="form-actions">
          <Button variant="tab" onClick={() => handle(false)}>Cancelar</Button>
          <Button onClick={() => handle(true)} className="delete-btn-confirm">Excluir</Button>
        </div>
      </div>
    </div>
  )
}
