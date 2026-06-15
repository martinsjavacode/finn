import { render, screen, fireEvent } from '@testing-library/react'
import MigrationSummaryBar from '../../components/admin/MigrationSummaryBar'
import type { MigrationItemType } from '../../types/admin'

const defaultProps: {
  selectedCount: number
  totalSelectedAmount: number
  itemType: MigrationItemType
  sourceAccountName: string
  onMigrate: ReturnType<typeof vi.fn>
  onSelectAll: ReturnType<typeof vi.fn>
  onDeselectAll: ReturnType<typeof vi.fn>
} = {
  selectedCount: 3,
  totalSelectedAmount: 4520,
  itemType: 'entries',
  sourceAccountName: 'Conta Pessoal',
  onMigrate: vi.fn(),
  onSelectAll: vi.fn(),
  onDeselectAll: vi.fn(),
}

function renderBar(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides }
  props.onMigrate = overrides.onMigrate ?? vi.fn()
  props.onSelectAll = overrides.onSelectAll ?? vi.fn()
  props.onDeselectAll = overrides.onDeselectAll ?? vi.fn()
  return { ...render(<MigrationSummaryBar {...props} />), props }
}

describe('MigrationSummaryBar', () => {
  describe('Visibilidade', () => {
    it('não renderiza quando selectedCount === 0', () => {
      const { container } = renderBar({ selectedCount: 0 })
      expect(container.innerHTML).toBe('')
    })

    it('renderiza quando selectedCount > 0', () => {
      renderBar({ selectedCount: 1 })
      expect(screen.getByRole('toolbar')).toBeInTheDocument()
    })
  })

  describe('Label do tipo de item em pt-BR', () => {
    it('exibe "lançamentos selecionados" para entries (plural)', () => {
      renderBar({ itemType: 'entries', selectedCount: 3 })
      expect(screen.getByText('3 lançamentos selecionados')).toBeInTheDocument()
    })

    it('exibe "lançamento selecionado" para entries (singular)', () => {
      renderBar({ itemType: 'entries', selectedCount: 1 })
      expect(screen.getByText('1 lançamento selecionado')).toBeInTheDocument()
    })

    it('exibe "parcelamentos selecionados" para installments (plural)', () => {
      renderBar({ itemType: 'installments', selectedCount: 2 })
      expect(screen.getByText('2 parcelamentos selecionados')).toBeInTheDocument()
    })

    it('exibe "parcelamento selecionado" para installments (singular)', () => {
      renderBar({ itemType: 'installments', selectedCount: 1 })
      expect(screen.getByText('1 parcelamento selecionado')).toBeInTheDocument()
    })

    it('exibe "orçamentos selecionados" para budgets (plural)', () => {
      renderBar({ itemType: 'budgets', selectedCount: 5 })
      expect(screen.getByText('5 orçamentos selecionados')).toBeInTheDocument()
    })

    it('exibe "orçamento selecionado" para budgets (singular)', () => {
      renderBar({ itemType: 'budgets', selectedCount: 1 })
      expect(screen.getByText('1 orçamento selecionado')).toBeInTheDocument()
    })
  })

  describe('Formatação de moeda', () => {
    it('exibe valor formatado como R$ 4.520,00', () => {
      renderBar({ totalSelectedAmount: 4520 })
      const amountEl = screen.getByText((_content, element) => {
        return element?.classList.contains('migration-summary-bar-amount') === true &&
          element.textContent?.includes('4.520,00') === true
      })
      expect(amountEl).toBeInTheDocument()
    })

    it('exibe valor com centavos (R$ 1.234,56)', () => {
      renderBar({ totalSelectedAmount: 1234.56 })
      const amountEl = screen.getByText((_content, element) => {
        return element?.classList.contains('migration-summary-bar-amount') === true &&
          element.textContent?.includes('1.234,56') === true
      })
      expect(amountEl).toBeInTheDocument()
    })
  })

  describe('Nome da conta de origem', () => {
    it('exibe nome da conta de origem', () => {
      renderBar({ sourceAccountName: 'Empresa' })
      expect(screen.getByText('de "Empresa"')).toBeInTheDocument()
    })
  })

  describe('Callbacks dos botões', () => {
    it('chama onMigrate ao clicar em "Migrar →"', () => {
      const { props } = renderBar()
      fireEvent.click(screen.getByRole('button', { name: /migrar/i }))
      expect(props.onMigrate).toHaveBeenCalledOnce()
    })

    it('chama onSelectAll ao clicar em "Selecionar todos"', () => {
      const { props } = renderBar()
      fireEvent.click(screen.getByRole('button', { name: /selecionar todos/i }))
      expect(props.onSelectAll).toHaveBeenCalledOnce()
    })

    it('chama onDeselectAll ao clicar em "Desmarcar"', () => {
      const { props } = renderBar()
      fireEvent.click(screen.getByRole('button', { name: /desmarcar/i }))
      expect(props.onDeselectAll).toHaveBeenCalledOnce()
    })
  })
})
