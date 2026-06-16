import type { MigrationItem, MigrationItemType } from '../../types/admin'

interface MigrationDataTableProps {
  items: MigrationItem[]
  itemType: MigrationItemType
  selectedIds: Set<string>
  onToggleItem: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onDeselectAll: () => void
  loading: boolean
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')

export default function MigrationDataTable({
  items,
  itemType,
  selectedIds,
  onToggleItem,
  onSelectAll,
  onDeselectAll,
  loading,
}: MigrationDataTableProps) {
  const allSelected = items.length > 0 && items.every(item => selectedIds.has(item.id))

  const handleSelectAllToggle = () => {
    if (allSelected) {
      onDeselectAll()
    } else {
      onSelectAll(items.map(item => item.id))
    }
  }

  if (loading) {
    return (
      <div className="loading-indicator" style={{ padding: '2rem', textAlign: 'center' }}>
        <span className="btn-spinner" /> Carregando...
      </div>
    )
  }

  if (items.length === 0) {
    return <p className="empty">Nenhum item encontrado</p>
  }

  return (
    <table>
      <thead>
        <tr>
          <th style={{ width: '44px' }}>
            <label className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAllToggle}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                aria-label="Selecionar todos"
              />
            </label>
          </th>
          {itemType === 'entries' && (
            <>
              <th>Data</th>
              <th>Descrição</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th>Categoria</th>
            </>
          )}
          {itemType === 'installments' && (
            <>
              <th>Descrição</th>
              <th style={{ textAlign: 'right' }}>Valor Total</th>
              <th>Parcelas</th>
              <th>Cartão</th>
            </>
          )}
          {itemType === 'budgets' && (
            <>
              <th>Categoria</th>
              <th style={{ textAlign: 'right' }}>Limite Mensal</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {items.map(item => {
          const isSelected = selectedIds.has(item.id)
          return (
            <tr
              key={item.id}
              className={isSelected ? 'selected' : ''}
              style={isSelected ? { background: 'rgba(59, 130, 246, 0.08)' } : undefined}
            >
              <td>
                <label className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleItem(item.id)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    aria-label={`Selecionar ${item.description}`}
                  />
                </label>
              </td>
              {itemType === 'entries' && (
                <>
                  <td>{item.date ? formatDate(item.date) : '-'}</td>
                  <td>{item.description}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
                  <td>{item.category ?? '-'}</td>
                </>
              )}
              {itemType === 'installments' && (
                <>
                  <td>{item.description}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
                  <td>{item.installmentsCount ?? '-'}</td>
                  <td>{item.card ?? '-'}</td>
                </>
              )}
              {itemType === 'budgets' && (
                <>
                  <td>{item.category ?? '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {item.monthlyLimit != null ? formatCurrency(item.monthlyLimit) : '-'}
                  </td>
                </>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
