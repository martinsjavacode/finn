import { render, screen, fireEvent } from '@testing-library/react'
import MigrationDataTable from '../../components/admin/MigrationDataTable'
import type { MigrationItem } from '../../types/admin'

const entriesItems: MigrationItem[] = [
  { id: '1', description: 'Aluguel', amount: 1500.50, date: '2024-03-15', category: 'Moradia', categoryId: 'cat-1' },
  { id: '2', description: 'Mercado', amount: 320.00, date: '2024-03-10', category: 'Alimentação', categoryId: 'cat-2' },
  { id: '3', description: 'Internet', amount: 99.90, date: '2024-03-01', category: 'Serviços', categoryId: 'cat-3' },
]

const installmentItems: MigrationItem[] = [
  { id: '10', description: 'iPhone 15', amount: 6000, installmentsCount: 12, card: 'Nubank' },
  { id: '11', description: 'Sofá', amount: 3500, installmentsCount: 6, card: 'Itaú' },
]

const budgetItems: MigrationItem[] = [
  { id: '20', description: 'Alimentação', amount: 0, category: 'Alimentação', monthlyLimit: 1200 },
  { id: '21', description: 'Transporte', amount: 0, category: 'Transporte', monthlyLimit: 500 },
]

const defaultProps = {
  items: entriesItems,
  itemType: 'entries' as const,
  selectedIds: new Set<string>(),
  onToggleItem: vi.fn(),
  onSelectAll: vi.fn(),
  onDeselectAll: vi.fn(),
  loading: false,
}

describe('MigrationDataTable', () => {
  describe('Loading state', () => {
    it('shows spinner when loading', () => {
      render(<MigrationDataTable {...defaultProps} loading={true} />)
      expect(screen.getByText('Carregando...')).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    it('shows empty message when no items', () => {
      render(<MigrationDataTable {...defaultProps} items={[]} />)
      expect(screen.getByText('Nenhum item encontrado')).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('Entries columns', () => {
    it('renders date, description, amount, category columns', () => {
      render(<MigrationDataTable {...defaultProps} />)
      expect(screen.getByText('Data')).toBeInTheDocument()
      expect(screen.getByText('Descrição')).toBeInTheDocument()
      expect(screen.getByText('Valor')).toBeInTheDocument()
      expect(screen.getByText('Categoria')).toBeInTheDocument()
    })

    it('displays items with formatted data', () => {
      render(<MigrationDataTable {...defaultProps} />)
      expect(screen.getByText('Aluguel')).toBeInTheDocument()
      expect(screen.getByText('Mercado')).toBeInTheDocument()
      expect(screen.getByText('Moradia')).toBeInTheDocument()
      // Currency formatting may use regular space or non-breaking space depending on locale impl
      expect(screen.getByText((_content, element) =>
        element?.tagName === 'TD' && /R\$\s*1[.\s]500,50/.test(element.textContent ?? '')
      )).toBeInTheDocument()
    })

    it('formats dates in pt-BR locale', () => {
      render(<MigrationDataTable {...defaultProps} />)
      expect(screen.getByText('15/03/2024')).toBeInTheDocument()
      expect(screen.getByText('10/03/2024')).toBeInTheDocument()
    })
  })

  describe('Installments columns', () => {
    it('renders description, total amount, installments count, card columns', () => {
      render(<MigrationDataTable {...defaultProps} items={installmentItems} itemType="installments" />)
      expect(screen.getByText('Descrição')).toBeInTheDocument()
      expect(screen.getByText('Valor Total')).toBeInTheDocument()
      expect(screen.getByText('Parcelas')).toBeInTheDocument()
      expect(screen.getByText('Cartão')).toBeInTheDocument()
    })

    it('displays installment data correctly', () => {
      render(<MigrationDataTable {...defaultProps} items={installmentItems} itemType="installments" />)
      expect(screen.getByText('iPhone 15')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('Nubank')).toBeInTheDocument()
      expect(screen.getByText((_content, element) =>
        element?.tagName === 'TD' && /R\$\s*6[.\s]000,00/.test(element.textContent ?? '')
      )).toBeInTheDocument()
    })
  })

  describe('Budgets columns', () => {
    it('renders category and monthly limit columns', () => {
      render(<MigrationDataTable {...defaultProps} items={budgetItems} itemType="budgets" />)
      expect(screen.getByText('Categoria')).toBeInTheDocument()
      expect(screen.getByText('Limite Mensal')).toBeInTheDocument()
    })

    it('displays budget data correctly', () => {
      render(<MigrationDataTable {...defaultProps} items={budgetItems} itemType="budgets" />)
      expect(screen.getByText('Alimentação')).toBeInTheDocument()
      expect(screen.getByText('Transporte')).toBeInTheDocument()
      expect(screen.getByText((_content, element) =>
        element?.tagName === 'TD' && /R\$\s*1[.\s]200,00/.test(element.textContent ?? '')
      )).toBeInTheDocument()
      expect(screen.getByText((_content, element) =>
        element?.tagName === 'TD' && /R\$\s*500,00/.test(element.textContent ?? '')
      )).toBeInTheDocument()
    })
  })

  describe('Selection - select all checkbox', () => {
    it('renders select all checkbox in header', () => {
      render(<MigrationDataTable {...defaultProps} />)
      expect(screen.getByLabelText('Selecionar todos')).toBeInTheDocument()
    })

    it('calls onSelectAll with all item ids when none selected', () => {
      const onSelectAll = vi.fn()
      render(<MigrationDataTable {...defaultProps} onSelectAll={onSelectAll} />)
      fireEvent.click(screen.getByLabelText('Selecionar todos'))
      expect(onSelectAll).toHaveBeenCalledWith(['1', '2', '3'])
    })

    it('calls onDeselectAll when all items already selected', () => {
      const onDeselectAll = vi.fn()
      render(
        <MigrationDataTable
          {...defaultProps}
          selectedIds={new Set(['1', '2', '3'])}
          onDeselectAll={onDeselectAll}
        />
      )
      fireEvent.click(screen.getByLabelText('Selecionar todos'))
      expect(onDeselectAll).toHaveBeenCalled()
    })

    it('select all checkbox is checked when all items selected', () => {
      render(
        <MigrationDataTable
          {...defaultProps}
          selectedIds={new Set(['1', '2', '3'])}
        />
      )
      expect(screen.getByLabelText('Selecionar todos')).toBeChecked()
    })

    it('select all checkbox is unchecked when not all items selected', () => {
      render(
        <MigrationDataTable
          {...defaultProps}
          selectedIds={new Set(['1'])}
        />
      )
      expect(screen.getByLabelText('Selecionar todos')).not.toBeChecked()
    })
  })

  describe('Selection - individual checkboxes', () => {
    it('renders a checkbox for each item', () => {
      render(<MigrationDataTable {...defaultProps} />)
      const checkboxes = screen.getAllByRole('checkbox')
      // 1 select-all + 3 individual
      expect(checkboxes).toHaveLength(4)
    })

    it('calls onToggleItem with id when row checkbox clicked', () => {
      const onToggleItem = vi.fn()
      render(<MigrationDataTable {...defaultProps} onToggleItem={onToggleItem} />)
      fireEvent.click(screen.getByLabelText('Selecionar Aluguel'))
      expect(onToggleItem).toHaveBeenCalledWith('1')
    })

    it('checked state reflects selectedIds', () => {
      render(
        <MigrationDataTable {...defaultProps} selectedIds={new Set(['2'])} />
      )
      expect(screen.getByLabelText('Selecionar Mercado')).toBeChecked()
      expect(screen.getByLabelText('Selecionar Aluguel')).not.toBeChecked()
    })
  })

  describe('Selected row highlighting', () => {
    it('applies selected styling to selected rows', () => {
      const { container } = render(
        <MigrationDataTable {...defaultProps} selectedIds={new Set(['1'])} />
      )
      const rows = container.querySelectorAll('tbody tr')
      expect(rows[0]).toHaveClass('selected')
      expect(rows[1]).not.toHaveClass('selected')
    })
  })

  describe('Currency formatting', () => {
    it('formats amounts as R$ currency with pt-BR locale', () => {
      const { container } = render(<MigrationDataTable {...defaultProps} />)
      const amountCells = container.querySelectorAll('tbody tr td:nth-child(4)')
      // Each amount cell should contain R$ formatted values
      expect(amountCells[0].textContent).toMatch(/R\$\s*1[.\s]500,50/)
      expect(amountCells[1].textContent).toMatch(/R\$\s*320,00/)
      expect(amountCells[2].textContent).toMatch(/R\$\s*99,90/)
    })

    it('right-aligns amount column', () => {
      const { container } = render(<MigrationDataTable {...defaultProps} />)
      const amountHeader = screen.getByText('Valor')
      expect(amountHeader).toHaveStyle({ textAlign: 'right' })
      // Check first data row amount cell
      const firstRow = container.querySelectorAll('tbody tr')[0]
      const cells = firstRow.querySelectorAll('td')
      // cells: checkbox, date, description, amount, category
      expect(cells[3]).toHaveStyle({ textAlign: 'right' })
    })
  })
})
