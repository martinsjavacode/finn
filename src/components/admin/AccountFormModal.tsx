import { useState } from 'react'
import { validateAccountName } from '../../utils/adminFilters'
import Modal from '../ui/Modal'

const COLOR_PALETTE = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
]

interface AccountFormModalProps {
  account?: { id: string; name: string; color: string } | null
  onSubmit: (data: { name: string; color: string }) => void
  onClose: () => void
  loading: boolean
}

export default function AccountFormModal({ account, onSubmit, onClose, loading }: AccountFormModalProps) {
  const isEdit = !!account
  const initialColor = account?.color ?? COLOR_PALETTE[0]
  const initialCustomHex = account && !COLOR_PALETTE.includes(account.color)
    ? account.color.replace('#', '')
    : ''
  const [name, setName] = useState(account?.name ?? '')
  const [color, setColor] = useState(initialColor)
  const [customHex, setCustomHex] = useState(initialCustomHex)
  const [nameError, setNameError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  const validateName = (value: string) => {
    const error = validateAccountName(value)
    setNameError(error)
    return error
  }

  const handleNameBlur = () => {
    setTouched(true)
    validateName(name)
  }

  const handleCustomHexChange = (value: string) => {
    const cleaned = value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
    setCustomHex(cleaned)
    if (cleaned.length === 6) {
      setColor(`#${cleaned}`)
    }
  }

  const handleSelectPreset = (presetColor: string) => {
    setColor(presetColor)
    setCustomHex('')
  }

  const isFormValid = !validateAccountName(name) && /^#[0-9a-fA-F]{6}$/.test(color)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    const error = validateName(name)
    if (error || !isFormValid) return
    onSubmit({ name: name.trim(), color })
  }

  return (
    <Modal
      title={isEdit ? 'Editar conta' : 'Nova conta'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Salvar' : 'Criar'}
      submitDisabled={!isFormValid || loading}
    >
      {/* Name field */}
      <div className="account-form-field">
        <label htmlFor="account-name">Nome</label>
        <input
          id="account-name"
          type="text"
          value={name}
          onChange={e => {
            setName(e.target.value)
            if (touched) validateName(e.target.value)
          }}
          onBlur={handleNameBlur}
          placeholder="Nome da conta"
          autoFocus
        />
        {touched && nameError && (
          <span className="account-form-error">{nameError}</span>
        )}
      </div>

      {/* Color picker */}
      <div className="account-form-field">
        <label>Cor</label>
        <div className="account-form-color-section">
          {/* Preset palette */}
          <div className="account-form-palette">
            {COLOR_PALETTE.map(c => (
              <button
                key={c}
                type="button"
                className={`account-form-color-btn${color === c ? ' selected' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => handleSelectPreset(c)}
                aria-label={`Selecionar cor ${c}`}
              />
            ))}
          </div>

          {/* Custom hex input */}
          <div className="account-form-custom-color">
            <span className="account-form-hex-prefix">#</span>
            <input
              type="text"
              value={customHex}
              onChange={e => handleCustomHexChange(e.target.value)}
              placeholder="hex"
              maxLength={6}
              className="account-form-hex-input"
              aria-label="Cor personalizada em hexadecimal"
            />
          </div>

          {/* Live preview */}
          <div className="account-form-color-preview">
            <span
              className="account-form-preview-dot"
              style={{ backgroundColor: color }}
              aria-label={`Cor selecionada: ${color}`}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
