import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'

// Feature: batch-payment-transactions
// Integration tests for the complete batch payment flow

// --- Mock state for controlling hook behavior across tests ---
let mockSelectionMode = false
let mockSelectedIds = new Set<string>()
const mockActivateSelection = vi.fn()
const mockCancelSelection = vi.fn()
const mockToggleItem = vi.fn()
const mockSelectAll = vi.fn()
const mockDeselectAll = vi.fn()
const mockPruneSelection = vi.fn()
const mockMutateAsync = vi.fn()
let mockIsPending = false

const mockTransactions = [
  { id: 't1', description: 'Aluguel', amount: '1500.00', type: 'expense', paid: false, category: 'moradia', month: '2025-01' },
  { id: 't2', description: 'Internet', amount: '120.00', type: 'expense', paid: false, category: 'serviços', month: '2025-01' },
  { id: 't3', description: 'Salário', amount: '5000.00', type: 'income', paid: true, category: 'salário', month: '2025-01' },
]

vi.mock('../../hooks', () => ({
  useAuth: () => ({
    session: { user: { id: 'test-user' } },
    can: (resource: string, action: string) => {
      if (resource === 'transactions' && (action === 'update' || action === 'create' || action === 'delete')) return true
      return false
    },
    activeAccountId: 'test-account-id',
    isSuperadmin: false,
    accounts: [],
  }),
  useAppData: () => ({
    categories: [],
    cardsList: [],
  }),
  useTransactions: () => ({
    month: '2025-01',
    setMonth: vi.fn(),
    months: ['2025-01'],
    transactions: mockTransactions,
    cards: [],
  }),
  useTransactionMutations: () => ({
    batchMarkPaid: {
      mutateAsync: mockMutateAsync,
      isPending: mockIsPending,
    },
  }),
  useBatchSelection: () => ({
    selectionMode: mockSelectionMode,
    selectedIds: mockSelectedIds,
    activateSelection: mockActivateSelection,
    cancelSelection: mockCancelSelection,
    toggleItem: mockToggleItem,
    selectAll: mockSelectAll,
    deselectAll: mockDeselectAll,
    pruneSelection: mockPruneSelection,
  }),
}))

// Mock child components - keep minimal but functional
vi.mock('../../components/ui/Select', () => ({
  default: ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <select value={value} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}>
      {options.map((o: { value: string; label: string }) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
}))

vi.mock('../../components/dashboard/SummaryCards', () => ({
  default: () => <div data-testid="summary-cards" />,
}))

vi.mock('../../components/transactions/TransactionsTable', () => ({
  default: () => <div data-testid="transactions-table" />,
}))

vi.mock('../../components/transactions/CardsTable', () => ({
  default: () => <div data-testid="cards-table" />,
}))

vi.mock('../../components/transactions/AddTransaction', () => ({
  default: () => <div data-testid="add-transaction" />,
}))

vi.mock('../../components/ui/Button', () => ({
  default: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}))

import TransactionsPage from '../../components/transactions/TransactionsPage'

// Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
describe('BatchPaymentFlow - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
    // Reset mutable test state
    mockSelectionMode = false
    mockSelectedIds = new Set<string>()
    mockIsPending = false
  })

  describe('Fluxo de sucesso: ativar seleção → selecionar → pagar → seleção limpa', () => {
    it('deve chamar mutateAsync com IDs pendentes e cancelSelection ao concluir com sucesso', async () => {
      // Simulate: selection mode active with 2 items selected
      mockSelectionMode = true
      mockSelectedIds = new Set(['t1', 't2'])
      mockMutateAsync.mockResolvedValueOnce({ count: 2 })

      render(<TransactionsPage />)

      // The BatchActionBar should be rendered (selectionMode = true)
      const payButton = screen.getByLabelText('Pagar selecionados')
      expect(payButton).toBeInTheDocument()
      expect(payButton).not.toBeDisabled()

      // Click pay
      await act(async () => {
        fireEvent.click(payButton)
      })

      // Verify mutation was called with the unpaid selected IDs
      expect(mockMutateAsync).toHaveBeenCalledTimes(1)
      const calledIds = mockMutateAsync.mock.calls[0][0] as string[]
      expect(calledIds).toContain('t1')
      expect(calledIds).toContain('t2')
      expect(calledIds).toHaveLength(2)

      // On success, cancelSelection should have been called to clear selection mode
      expect(mockCancelSelection).toHaveBeenCalledTimes(1)
    })

    it('deve filtrar lançamentos já pagos antes de enviar ao mutation', async () => {
      // Simulate: selection includes t3 which is already paid
      mockSelectionMode = true
      mockSelectedIds = new Set(['t1', 't3'])
      mockMutateAsync.mockResolvedValueOnce({ count: 1 })

      render(<TransactionsPage />)

      const payButton = screen.getByLabelText('Pagar selecionados')
      await act(async () => {
        fireEvent.click(payButton)
      })

      // Only t1 should be sent (t3 is already paid)
      expect(mockMutateAsync).toHaveBeenCalledTimes(1)
      const calledIds = mockMutateAsync.mock.calls[0][0] as string[]
      expect(calledIds).toContain('t1')
      expect(calledIds).not.toContain('t3')
      expect(calledIds).toHaveLength(1)
    })
  })

  describe('Fluxo de erro: ativar seleção → selecionar → pagar → erro → seleção mantida', () => {
    it('em caso de erro, cancelSelection NÃO deve ser chamado (seleção mantida)', async () => {
      mockSelectionMode = true
      mockSelectedIds = new Set(['t1', 't2'])
      mockMutateAsync.mockRejectedValueOnce(new Error('Network error'))

      render(<TransactionsPage />)

      const payButton = screen.getByLabelText('Pagar selecionados')
      await act(async () => {
        fireEvent.click(payButton)
      })

      // Mutation was called
      expect(mockMutateAsync).toHaveBeenCalledTimes(1)

      // cancelSelection should NOT be called — selection is preserved on error
      expect(mockCancelSelection).not.toHaveBeenCalled()
    })
  })

  describe('Loading state: botão desabilitado durante operação', () => {
    it('deve desabilitar o botão "Pagar selecionados" quando isPending é true', () => {
      mockSelectionMode = true
      mockSelectedIds = new Set(['t1'])
      mockIsPending = true

      render(<TransactionsPage />)

      const payButton = screen.getByLabelText('Pagar selecionados')
      expect(payButton).toBeDisabled()
    })

    it('deve exibir indicador de carregamento quando isPending é true', () => {
      mockSelectionMode = true
      mockSelectedIds = new Set(['t1'])
      mockIsPending = true

      render(<TransactionsPage />)

      const payButton = screen.getByLabelText('Pagar selecionados')
      expect(payButton).toHaveAttribute('aria-busy', 'true')
    })

    it('botão habilitado quando isPending é false e há seleção', () => {
      mockSelectionMode = true
      mockSelectedIds = new Set(['t1'])
      mockIsPending = false

      render(<TransactionsPage />)

      const payButton = screen.getByLabelText('Pagar selecionados')
      expect(payButton).not.toBeDisabled()
    })
  })
})
