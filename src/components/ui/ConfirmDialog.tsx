import { useEffect, useRef, useState } from 'react'
import { subscribeConfirm, type ConfirmState } from '../../lib/confirm'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import Button from './Button'

export default function ConfirmDialog() {
  const [state, setState] = useState<ConfirmState | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useFocusTrap(modalRef, !!state)

  useEffect(() => subscribeConfirm(s => setState(s)), [])

  const handle = (confirmed: boolean) => {
    state?.resolve(confirmed)
    setState(null)
  }

  useEffect(() => {
    if (!state) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handle(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  })

  if (!state) return null

  return (
    <div className="modal-overlay" onClick={() => handle(false)}>
      <div className="modal" ref={modalRef} onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="confirm-msg">
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
