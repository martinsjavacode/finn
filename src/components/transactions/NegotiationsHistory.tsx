import { useState } from 'react'
import { useNegotiations, useNegotiatedInvoices, useCancelNegotiation } from '../../hooks'
import { confirm } from '../../lib/confirm'
import { fmt, monthLabel } from '../../utils/format'
import type { InvoiceNegotiation } from '../../types/database'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import Button from '../ui/Button'

interface Props {
  accountId: string
  cardsList: { name: string; label: string; color: string | null }[]
  canDelete: boolean
}

export default function NegotiationsHistory({ accountId, cardsList, canDelete }: Props) {
  const { data: negotiations = [], isLoading } = useNegotiations(accountId)
  const cancelMutation = useCancelNegotiation(accountId)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getCardLabel = (name: string) => cardsList.find(c => c.name === name)?.label ?? name
  const getCardColor = (name: string) => cardsList.find(c => c.name === name)?.color ?? '#888'

  const handleCancel = async (negotiation: InvoiceNegotiation) => {
    const confirmed = await confirm(
      `Cancelar negociação de ${fmt(negotiation.total_amount)} em ${negotiation.installments}x?\n\nAs parcelas serão removidas e as faturas originais voltarão como pendentes.`
    )
    if (confirmed) {
      cancelMutation.mutate(negotiation.id)
    }
  }

  if (isLoading) {
    return (
      <section className="negotiations-history">
        <h2>Histórico de Negociações</h2>
        <p className="empty">Carregando...</p>
      </section>
    )
  }

  if (negotiations.length === 0) {
    return (
      <section className="negotiations-history">
        <h2>Histórico de Negociações</h2>
        <p className="empty">Nenhuma negociação realizada.</p>
      </section>
    )
  }

  return (
    <section className="negotiations-history">
      <h2>Histórico de Negociações</h2>
      <div className="negotiations-list">
        {negotiations.map(neg => (
          <NegotiationCard
            key={neg.id}
            negotiation={neg}
            cardLabel={getCardLabel(neg.card)}
            cardColor={getCardColor(neg.card)}
            expanded={expandedId === neg.id}
            onToggle={() => setExpandedId(expandedId === neg.id ? null : neg.id)}
            onCancel={() => handleCancel(neg)}
            canDelete={canDelete}
            isCanceling={cancelMutation.isPending}
          />
        ))}
      </div>
    </section>
  )
}

interface NegotiationCardProps {
  negotiation: InvoiceNegotiation
  cardLabel: string
  cardColor: string
  expanded: boolean
  onToggle: () => void
  onCancel: () => void
  canDelete: boolean
  isCanceling: boolean
}

function NegotiationCard({ 
  negotiation, 
  cardLabel, 
  cardColor, 
  expanded, 
  onToggle, 
  onCancel,
  canDelete,
  isCanceling,
}: NegotiationCardProps) {
  const createdDate = new Date(negotiation.created_at).toLocaleDateString('pt-BR')
  const installmentValue = negotiation.total_amount / negotiation.installments

  return (
    <div className="negotiation-card">
      <div className="negotiation-card-header" onClick={onToggle}>
        <div className="negotiation-card-info">
          <span className="negotiation-card-date">{createdDate}</span>
          <span className="negotiation-card-dot" style={{ background: cardColor }} />
          <span className="negotiation-card-label">{cardLabel}</span>
          <span className="negotiation-card-amount">
            {fmt(negotiation.total_amount)} em {negotiation.installments}x
          </span>
        </div>
        <div className="negotiation-card-actions">
          {canDelete && (
            <Button 
              variant="icon" 
              className="delete-btn" 
              aria-label="Cancelar negociação"
              onClick={() => onCancel()}
              disabled={isCanceling}
            >
              <Trash2 size={14} />
            </Button>
          )}
          <button className="negotiation-expand-btn" aria-label={expanded ? 'Recolher' : 'Expandir'}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <NegotiationDetails 
          negotiation={negotiation} 
          installmentValue={installmentValue}
        />
      )}
    </div>
  )
}

function NegotiationDetails({ negotiation, installmentValue }: { negotiation: InvoiceNegotiation; installmentValue: number }) {
  const { data: invoices = [], isLoading } = useNegotiatedInvoices(negotiation.id)

  // Calculate installment months
  const firstMonth = negotiation.first_month.substring(0, 7)
  const lastMonth = (() => {
    const [year, month] = firstMonth.split('-').map(Number)
    const totalMonths = month + negotiation.installments - 1
    const newYear = year + Math.floor((totalMonths - 1) / 12)
    const newMonth = ((totalMonths - 1) % 12) + 1
    return `${newYear}-${String(newMonth).padStart(2, '0')}`
  })()

  return (
    <div className="negotiation-details">
      <div className="negotiation-detail-section">
        <span className="negotiation-detail-label">Faturas incluídas:</span>
        {isLoading ? (
          <span className="negotiation-detail-value">Carregando...</span>
        ) : (
          <span className="negotiation-detail-value">
            {invoices.map(inv => monthLabel(inv.month.substring(0, 7))).join(', ') || 'Nenhuma'}
          </span>
        )}
      </div>
      <div className="negotiation-detail-section">
        <span className="negotiation-detail-label">Parcelas:</span>
        <span className="negotiation-detail-value">
          {monthLabel(firstMonth)} a {monthLabel(lastMonth)} ({negotiation.installments}x {fmt(installmentValue)})
        </span>
      </div>
    </div>
  )
}
