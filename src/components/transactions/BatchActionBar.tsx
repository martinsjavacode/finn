interface BatchActionBarProps {
  selectedCount: number
  totalSum: number
  isLoading: boolean
  hasPending: boolean
  onPaySelected: () => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onCancel: () => void
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function BatchActionBar({
  selectedCount,
  totalSum,
  isLoading,
  hasPending,
  onPaySelected,
  onSelectAll,
  onDeselectAll,
  onCancel,
}: BatchActionBarProps) {
  const payDisabled = selectedCount === 0 || isLoading

  return (
    <div
      className="fixed bottom-0 left-0 w-full"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 150,
        background: 'var(--card, #1a1f2e)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.3)',
        padding: '0.75rem 1rem',
        fontSize: '14px',
      }}
      role="toolbar"
      aria-label="Ações de pagamento em lote"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          maxWidth: 'var(--content-max, 1200px)',
          margin: '0 auto',
        }}
      >
        {/* Left section: summary info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {!hasPending ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Nenhum lançamento pendente para selecionar
            </span>
          ) : (
            <>
              <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>
                {formatCurrency(totalSum)}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                {selectedCount} selecionados
              </span>
            </>
          )}
        </div>

        {/* Right section: action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onSelectAll}
            className="min-w-[44px] min-h-[44px] text-[14px]"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              fontSize: '14px',
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            aria-label="Selecionar todos"
          >
            Selecionar todos
          </button>

          <button
            type="button"
            onClick={onDeselectAll}
            className="min-w-[44px] min-h-[44px] text-[14px]"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              fontSize: '14px',
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            aria-label="Desmarcar todos"
          >
            Desmarcar todos
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="min-w-[44px] min-h-[44px] text-[14px]"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              fontSize: '14px',
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            aria-label="Cancelar seleção"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onPaySelected}
            disabled={payDisabled}
            className="min-w-[44px] min-h-[44px] text-[14px]"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              fontSize: '14px',
              padding: '0.5rem 1rem',
              background: payDisabled ? 'var(--surface)' : 'var(--accent, #667eea)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: payDisabled ? 'var(--text-muted)' : '#fff',
              cursor: payDisabled ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: payDisabled ? 0.6 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            aria-label="Pagar selecionados"
            aria-busy={isLoading}
          >
            {isLoading && (
              <svg
                className="animate-spin"
                style={{
                  animation: 'spin 1s linear infinite',
                  width: '16px',
                  height: '16px',
                }}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ opacity: 0.25 }}
                />
                <path
                  d="M4 12a8 8 0 018-8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ opacity: 0.75 }}
                />
              </svg>
            )}
            Pagar selecionados
          </button>
        </div>
      </div>
    </div>
  )
}
