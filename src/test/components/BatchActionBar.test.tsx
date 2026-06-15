import { render, screen, fireEvent } from '@testing-library/react'
import BatchActionBar from '../../components/transactions/BatchActionBar'

const defaultProps = {
  selectedCount: 0,
  totalSum: 0,
  isLoading: false,
  hasPending: true,
  onPaySelected: vi.fn(),
  onSelectAll: vi.fn(),
  onDeselectAll: vi.fn(),
  onCancel: vi.fn(),
}

function renderBar(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides }
  // Reset mocks for each render call
  props.onPaySelected = overrides.onPaySelected ?? vi.fn()
  props.onSelectAll = overrides.onSelectAll ?? vi.fn()
  props.onDeselectAll = overrides.onDeselectAll ?? vi.fn()
  props.onCancel = overrides.onCancel ?? vi.fn()
  return { ...render(<BatchActionBar {...props} />), props }
}

describe('BatchActionBar', () => {
  describe('Botão "Pagar selecionados" - estados desabilitados', () => {
    it('botão desabilitado quando selectedCount === 0', () => {
      renderBar({ selectedCount: 0 })
      const button = screen.getByRole('button', { name: /pagar selecionados/i })
      expect(button).toBeDisabled()
    })

    it('botão desabilitado quando isLoading === true', () => {
      renderBar({ selectedCount: 3, isLoading: true })
      const button = screen.getByRole('button', { name: /pagar selecionados/i })
      expect(button).toBeDisabled()
    })

    it('botão habilitado quando selectedCount > 0 e isLoading === false', () => {
      renderBar({ selectedCount: 2, isLoading: false })
      const button = screen.getByRole('button', { name: /pagar selecionados/i })
      expect(button).not.toBeDisabled()
    })
  })

  describe('Indicador de carregamento (spinner)', () => {
    it('exibe spinner quando isLoading === true', () => {
      renderBar({ selectedCount: 2, isLoading: true })
      const button = screen.getByRole('button', { name: /pagar selecionados/i })
      expect(button.getAttribute('aria-busy')).toBe('true')
      // The SVG spinner should be present inside the button
      const svg = button.querySelector('svg')
      expect(svg).not.toBeNull()
    })

    it('não exibe spinner quando isLoading === false', () => {
      renderBar({ selectedCount: 2, isLoading: false })
      const button = screen.getByRole('button', { name: /pagar selecionados/i })
      expect(button.getAttribute('aria-busy')).toBe('false')
      const svg = button.querySelector('svg')
      expect(svg).toBeNull()
    })
  })

  describe('Mensagem de nenhum lançamento pendente', () => {
    it('exibe mensagem quando hasPending === false', () => {
      renderBar({ hasPending: false })
      expect(
        screen.getByText('Nenhum lançamento pendente para selecionar')
      ).toBeInTheDocument()
    })

    it('não exibe mensagem quando hasPending === true', () => {
      renderBar({ hasPending: true })
      expect(
        screen.queryByText('Nenhum lançamento pendente para selecionar')
      ).not.toBeInTheDocument()
    })
  })

  describe('Formatação da somatória em pt-BR', () => {
    it('exibe valor formatado como R$ 1.234,56', () => {
      renderBar({ selectedCount: 3, totalSum: 1234.56 })
      expect(screen.getByText('R$ 1.234,56')).toBeInTheDocument()
    })

    it('exibe R$ 0,00 quando totalSum é 0', () => {
      renderBar({ selectedCount: 0, totalSum: 0 })
      expect(screen.getByText('R$ 0,00')).toBeInTheDocument()
    })

    it('exibe valor grande sem truncamento (R$ 999.999,99)', () => {
      renderBar({ selectedCount: 5, totalSum: 999999.99 })
      expect(screen.getByText('R$ 999.999,99')).toBeInTheDocument()
    })
  })

  describe('Contagem de selecionados', () => {
    it('exibe "3 selecionados" quando selectedCount é 3', () => {
      renderBar({ selectedCount: 3 })
      expect(screen.getByText('3 selecionados')).toBeInTheDocument()
    })

    it('exibe "1 selecionados" quando selectedCount é 1', () => {
      renderBar({ selectedCount: 1 })
      expect(screen.getByText('1 selecionados')).toBeInTheDocument()
    })
  })

  describe('Callbacks dos botões', () => {
    it('chama onPaySelected ao clicar no botão "Pagar selecionados"', () => {
      const { props } = renderBar({ selectedCount: 2 })
      fireEvent.click(screen.getByRole('button', { name: /pagar selecionados/i }))
      expect(props.onPaySelected).toHaveBeenCalledOnce()
    })

    it('chama onSelectAll ao clicar em "Selecionar todos"', () => {
      const { props } = renderBar()
      fireEvent.click(screen.getByRole('button', { name: /selecionar todos/i }))
      expect(props.onSelectAll).toHaveBeenCalledOnce()
    })

    it('chama onDeselectAll ao clicar em "Desmarcar todos"', () => {
      const { props } = renderBar()
      fireEvent.click(screen.getByRole('button', { name: /desmarcar todos/i }))
      expect(props.onDeselectAll).toHaveBeenCalledOnce()
    })

    it('chama onCancel ao clicar em "Cancelar"', () => {
      const { props } = renderBar()
      fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
      expect(props.onCancel).toHaveBeenCalledOnce()
    })
  })
})
