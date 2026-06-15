import type { MigrationFilters as MigrationFiltersType, MigrationItemType } from '../../types/admin'
import Button from '../ui/Button'

interface MigrationFiltersProps {
  filters: MigrationFiltersType
  onFiltersChange: (filters: MigrationFiltersType) => void
  categories: { id: string; name: string }[]
  itemType: MigrationItemType
}

const DEFAULT_FILTERS: MigrationFiltersType = {
  search: '',
  categoryId: null,
  dateFrom: null,
  dateTo: null,
  amountMin: null,
  amountMax: null,
}

export default function MigrationFilters({ filters, onFiltersChange, categories, itemType }: MigrationFiltersProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.categoryId !== null ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.amountMin !== null ||
    filters.amountMax !== null

  return (
    <div className="migration-filters">
      <input
        type="text"
        className="search-input"
        placeholder="Buscar por descrição..."
        value={filters.search}
        onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
        aria-label="Buscar por descrição"
      />

      <select
        className="migration-filter-select"
        value={filters.categoryId ?? ''}
        onChange={e => onFiltersChange({ ...filters, categoryId: e.target.value || null })}
        aria-label="Filtrar por categoria"
      >
        <option value="">Todas as categorias</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      {itemType !== 'budgets' && (
        <div className="migration-filter-range">
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={e => onFiltersChange({ ...filters, dateFrom: e.target.value || null })}
            aria-label="Data inicial"
          />
          <input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={e => onFiltersChange({ ...filters, dateTo: e.target.value || null })}
            aria-label="Data final"
          />
        </div>
      )}

      <div className="migration-filter-range">
        <input
          type="number"
          placeholder="Mín"
          value={filters.amountMin ?? ''}
          onChange={e => onFiltersChange({ ...filters, amountMin: e.target.value ? Number(e.target.value) : null })}
          aria-label="Valor mínimo"
        />
        <input
          type="number"
          placeholder="Máx"
          value={filters.amountMax ?? ''}
          onChange={e => onFiltersChange({ ...filters, amountMax: e.target.value ? Number(e.target.value) : null })}
          aria-label="Valor máximo"
        />
      </div>

      {hasActiveFilters && (
        <Button onClick={() => onFiltersChange(DEFAULT_FILTERS)} className="migration-filter-clear">
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
