import { render, screen, fireEvent } from '@testing-library/react'
import MigrationFilters from '../../components/admin/MigrationFilters'
import type { MigrationFilters as MigrationFiltersType } from '../../types/admin'

const defaultFilters: MigrationFiltersType = {
  search: '',
  categoryId: null,
  dateFrom: null,
  dateTo: null,
  amountMin: null,
  amountMax: null,
}

const categories = [
  { id: 'cat-1', name: 'Alimentação' },
  { id: 'cat-2', name: 'Transporte' },
  { id: 'cat-3', name: 'Lazer' },
]

function renderFilters(overrides: { filters?: Partial<MigrationFiltersType>; itemType?: 'entries' | 'installments' | 'budgets' } = {}) {
  const onFiltersChange = vi.fn()
  const filters = { ...defaultFilters, ...overrides.filters }
  const result = render(
    <MigrationFilters
      filters={filters}
      onFiltersChange={onFiltersChange}
      categories={categories}
      itemType={overrides.itemType ?? 'entries'}
    />
  )
  return { ...result, onFiltersChange, filters }
}

describe('MigrationFilters', () => {
  describe('Text search input', () => {
    it('renders search input with correct placeholder', () => {
      renderFilters()
      expect(screen.getByPlaceholderText('Buscar por descrição...')).toBeInTheDocument()
    })

    it('calls onFiltersChange with updated search on input', () => {
      const { onFiltersChange } = renderFilters()
      fireEvent.change(screen.getByPlaceholderText('Buscar por descrição...'), { target: { value: 'teste' } })
      expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, search: 'teste' })
    })

    it('displays current search value', () => {
      renderFilters({ filters: { search: 'aluguel' } })
      expect(screen.getByPlaceholderText('Buscar por descrição...')).toHaveValue('aluguel')
    })
  })

  describe('Category dropdown', () => {
    it('renders all categories plus default option', () => {
      renderFilters()
      const select = screen.getByLabelText('Filtrar por categoria')
      expect(select).toBeInTheDocument()
      expect(screen.getByText('Todas as categorias')).toBeInTheDocument()
      expect(screen.getByText('Alimentação')).toBeInTheDocument()
      expect(screen.getByText('Transporte')).toBeInTheDocument()
      expect(screen.getByText('Lazer')).toBeInTheDocument()
    })

    it('calls onFiltersChange with categoryId on selection', () => {
      const { onFiltersChange } = renderFilters()
      fireEvent.change(screen.getByLabelText('Filtrar por categoria'), { target: { value: 'cat-2' } })
      expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, categoryId: 'cat-2' })
    })

    it('calls onFiltersChange with null when default option selected', () => {
      const { onFiltersChange } = renderFilters({ filters: { categoryId: 'cat-1' } })
      fireEvent.change(screen.getByLabelText('Filtrar por categoria'), { target: { value: '' } })
      expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, categoryId: null })
    })
  })

  describe('Date range inputs', () => {
    it('renders date inputs for entries', () => {
      renderFilters({ itemType: 'entries' })
      expect(screen.getByLabelText('Data inicial')).toBeInTheDocument()
      expect(screen.getByLabelText('Data final')).toBeInTheDocument()
    })

    it('renders date inputs for installments', () => {
      renderFilters({ itemType: 'installments' })
      expect(screen.getByLabelText('Data inicial')).toBeInTheDocument()
      expect(screen.getByLabelText('Data final')).toBeInTheDocument()
    })

    it('does NOT render date inputs for budgets', () => {
      renderFilters({ itemType: 'budgets' })
      expect(screen.queryByLabelText('Data inicial')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Data final')).not.toBeInTheDocument()
    })

    it('calls onFiltersChange with dateFrom on change', () => {
      const { onFiltersChange } = renderFilters()
      fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2024-01-01' } })
      expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, dateFrom: '2024-01-01' })
    })

    it('calls onFiltersChange with dateTo on change', () => {
      const { onFiltersChange } = renderFilters()
      fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2024-12-31' } })
      expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, dateTo: '2024-12-31' })
    })

    it('calls onFiltersChange with null when date cleared', () => {
      const { onFiltersChange } = renderFilters({ filters: { dateFrom: '2024-01-01' } })
      fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '' } })
      expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, dateFrom: null })
    })
  })

  describe('Amount range inputs', () => {
    it('renders amount inputs with correct placeholders', () => {
      renderFilters()
      expect(screen.getByPlaceholderText('Mín')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Máx')).toBeInTheDocument()
    })

    it('calls onFiltersChange with amountMin as number', () => {
      const { onFiltersChange } = renderFilters()
      fireEvent.change(screen.getByPlaceholderText('Mín'), { target: { value: '100' } })
      expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, amountMin: 100 })
    })

    it('calls onFiltersChange with amountMax as number', () => {
      const { onFiltersChange } = renderFilters()
      fireEvent.change(screen.getByPlaceholderText('Máx'), { target: { value: '5000' } })
      expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, amountMax: 5000 })
    })

    it('calls onFiltersChange with null when amount cleared', () => {
      const { onFiltersChange } = renderFilters({ filters: { amountMin: 100 } })
      fireEvent.change(screen.getByPlaceholderText('Mín'), { target: { value: '' } })
      expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, amountMin: null })
    })
  })

  describe('Clear all button', () => {
    it('does not show clear button when no filters active', () => {
      renderFilters()
      expect(screen.queryByText('Limpar filtros')).not.toBeInTheDocument()
    })

    it('shows clear button when search is active', () => {
      renderFilters({ filters: { search: 'teste' } })
      expect(screen.getByText('Limpar filtros')).toBeInTheDocument()
    })

    it('shows clear button when categoryId is active', () => {
      renderFilters({ filters: { categoryId: 'cat-1' } })
      expect(screen.getByText('Limpar filtros')).toBeInTheDocument()
    })

    it('resets all filters to defaults on click', () => {
      const { onFiltersChange } = renderFilters({ filters: { search: 'teste', categoryId: 'cat-1', amountMin: 50 } })
      fireEvent.click(screen.getByText('Limpar filtros'))
      expect(onFiltersChange).toHaveBeenCalledWith(defaultFilters)
    })
  })
})
