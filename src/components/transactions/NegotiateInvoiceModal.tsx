import { useState, useMemo } from 'react'
import Modal from '../ui/Modal'
import { useCreateNegotiation, usePendingInvoices } from '../../hooks'
import { fmt, monthLabel, currentYearMonth } from '../../utils/format'

interface Props {
  card: string
  cardLabel: string
  accountId: string
  onClose: () => void
}

type SelectionMode = 'range' | 'all'

export default function NegotiateInvoiceModal({ card, cardLabel, accountId, onClose }: Props) {
  const { data: pendingInvoices = [], isLoading: loadingInvoices } = usePendingInvoices(card, accountId)
  const createMutation = useCreateNegotiation(accountId)

  const [selectionMode, setSelectionMode] = useState<SelectionMode>('all')
  const [customStartMonth, setCustomStartMonth] = useState('')
  const [customEndMonth, setCustomEndMonth] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [installments, setInstallments] = useState('12')
  const [firstMonth, setFirstMonth] = useState(() => {
    const now = new Date()
    now.setMonth(now.getMonth() + 1)
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Derive available months from pending invoices
  const availableMonths = useMemo(() => 
    pendingInvoices.map(i => i.month.substring(0, 7)).sort(),
    [pendingInvoices]
  )

  // Use custom values if set, otherwise default to first/last available
  const startMonth = customStartMonth || availableMonths[0] || ''
  const endMonth = customEndMonth || availableMonths[availableMonths.length - 1] || ''

  // Calculate selected invoices based on mode
  const selectedInvoices = useMemo(() => {
    if (selectionMode === 'all') {
      return pendingInvoices
    }
    return pendingInvoices.filter(inv => {
      const ym = inv.month.substring(0, 7)
      return ym >= startMonth && ym <= endMonth
    })
  }, [selectionMode, pendingInvoices, startMonth, endMonth])

  // Calculate totals
  const originalTotal = useMemo(() => 
    selectedInvoices.reduce((sum, inv) => sum + inv.total, 0),
    [selectedInvoices]
  )

  const parsedTotal = parseFloat(totalAmount) || 0
  const parsedInstallments = parseInt(installments) || 0
  const installmentValue = parsedInstallments > 0 ? parsedTotal / parsedInstallments : 0

  // Validation
  const isValidTotal = parsedTotal > 0
  const isValidInstallments = parsedInstallments >= 2 && parsedInstallments <= 24
  const isValidFirstMonth = firstMonth >= currentYearMonth()
  const hasSelectedInvoices = selectedInvoices.length > 0
  const canSubmit = isValidTotal && isValidInstallments && isValidFirstMonth && hasSelectedInvoices && !createMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    createMutation.mutate({
      account_id: accountId,
      card,
      total_amount: parsedTotal,
      installments: parsedInstallments,
      first_month: `${firstMonth}-01`,
      invoices: selectedInvoices.map(inv => ({ card, month: inv.month })),
    }, {
      onSuccess: () => onClose(),
    })
  }

  if (loadingInvoices) {
    return (
      <Modal title={`Negociar Fatura - ${cardLabel}`} onClose={onClose}>
        <p className="empty">Carregando faturas...</p>
      </Modal>
    )
  }

  if (pendingInvoices.length === 0) {
    return (
      <Modal title={`Negociar Fatura - ${cardLabel}`} onClose={onClose}>
        <p className="empty">Nenhuma fatura pendente para negociar.</p>
      </Modal>
    )
  }

  return (
    <Modal 
      title={`Negociar Fatura - ${cardLabel}`} 
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={createMutation.isPending ? 'Criando...' : 'Confirmar Negociação'}
      submitDisabled={!canSubmit}
    >
      {/* Selection mode */}
      <fieldset className="form-fieldset">
        <legend>Faturas a incluir</legend>
        
        <label className="form-radio">
          <input
            type="radio"
            name="selectionMode"
            value="range"
            checked={selectionMode === 'range'}
            onChange={() => setSelectionMode('range')}
          />
          <span>Intervalo de meses</span>
        </label>
        
        {selectionMode === 'range' && (
          <div className="form-row" style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <label className="form-label form-grow">
              De
              <select 
                value={startMonth} 
                onChange={e => setCustomStartMonth(e.target.value)}
                className="form-select"
              >
                {availableMonths.map(ym => (
                  <option key={ym} value={ym}>{monthLabel(ym)}</option>
                ))}
              </select>
            </label>
            <label className="form-label form-grow">
              Até
              <select 
                value={endMonth} 
                onChange={e => setCustomEndMonth(e.target.value)}
                className="form-select"
              >
                {availableMonths.filter(ym => ym >= startMonth).map(ym => (
                  <option key={ym} value={ym}>{monthLabel(ym)}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <label className="form-radio">
          <input
            type="radio"
            name="selectionMode"
            value="all"
            checked={selectionMode === 'all'}
            onChange={() => setSelectionMode('all')}
          />
          <span>Todas as pendentes ({pendingInvoices.length} {pendingInvoices.length === 1 ? 'fatura' : 'faturas'})</span>
        </label>
      </fieldset>

      {/* Selected invoices summary */}
      {selectedInvoices.length > 0 && (
        <div className="negotiate-summary">
          <span className="negotiate-summary-label">
            {selectedInvoices.length} {selectedInvoices.length === 1 ? 'fatura selecionada' : 'faturas selecionadas'}
          </span>
          <span className="negotiate-summary-value">
            Valor original: <strong>{fmt(originalTotal)}</strong>
          </span>
        </div>
      )}

      <div className="form-divider" />

      {/* Negotiation details */}
      <label className="form-label">
        Valor total do parcelamento
        <input
          type="number"
          step="0.01"
          min="0"
          value={totalAmount}
          onChange={e => setTotalAmount(e.target.value)}
          placeholder={fmt(originalTotal)}
          required
        />
        <span className="form-hint">Informe o valor acordado com o banco (já com juros)</span>
      </label>

      <div className="form-row">
        <label className="form-label form-grow">
          Número de parcelas
          <input
            type="number"
            min="2"
            max="24"
            value={installments}
            onChange={e => setInstallments(e.target.value)}
            required
          />
          {!isValidInstallments && installments && (
            <span className="form-error">Entre 2 e 24 parcelas</span>
          )}
        </label>

        <label className="form-label form-grow">
          Primeira parcela em
          <input
            type="month"
            value={firstMonth}
            onChange={e => setFirstMonth(e.target.value)}
            min={currentYearMonth()}
            required
          />
          {!isValidFirstMonth && firstMonth && (
            <span className="form-error">Deve ser a partir do mês atual</span>
          )}
        </label>
      </div>

      {/* Preview */}
      {isValidTotal && isValidInstallments && (
        <div className="negotiate-preview">
          <span className="negotiate-preview-icon">📋</span>
          <span className="negotiate-preview-text">
            <strong>{parsedInstallments}x</strong> de <strong>{fmt(installmentValue)}</strong>
          </span>
        </div>
      )}
    </Modal>
  )
}
