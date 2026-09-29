import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ReactNode } from 'react'

const mockPendingInvoices = [
  { month: '2026-07-01', total: 1500 },
  { month: '2026-08-01', total: 2000 },
  { month: '2026-09-01', total: 1000 },
]

const mockCreateMutation = {
  mutate: vi.fn(),
  isPending: false,
}

vi.mock('../../hooks', () => ({
  usePendingInvoices: vi.fn(() => ({
    data: mockPendingInvoices,
    isLoading: false,
  })),
  useCreateNegotiation: vi.fn(() => mockCreateMutation),
}))

vi.mock('../../lib/toast', () => ({ toast: vi.fn(), showError: vi.fn() }))

import NegotiateInvoiceModal from '../../components/transactions/NegotiateInvoiceModal'
import { usePendingInvoices, useCreateNegotiation } from '../../hooks'

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const defaultProps = {
  card: 'nubank',
  cardLabel: 'Nubank',
  accountId: 'acc-1',
  onClose: vi.fn(),
}

describe('NegotiateInvoiceModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePendingInvoices).mockReturnValue({
      data: mockPendingInvoices,
      isLoading: false,
    } as ReturnType<typeof usePendingInvoices>)
    vi.mocked(useCreateNegotiation).mockReturnValue(mockCreateMutation as unknown as ReturnType<typeof useCreateNegotiation>)
  })

  it('renders modal with card label in title', () => {
    render(<NegotiateInvoiceModal {...defaultProps} />, { wrapper: createWrapper() })
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Negociar Fatura - Nubank')
  })

  it('shows loading state when fetching invoices', () => {
    vi.mocked(usePendingInvoices).mockReturnValue({
      data: [],
      isLoading: true,
    } as unknown as ReturnType<typeof usePendingInvoices>)
    
    render(<NegotiateInvoiceModal {...defaultProps} />, { wrapper: createWrapper() })
    expect(screen.getByText('Carregando faturas...')).toBeInTheDocument()
  })

  it('shows empty state when no pending invoices', () => {
    vi.mocked(usePendingInvoices).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof usePendingInvoices>)
    
    render(<NegotiateInvoiceModal {...defaultProps} />, { wrapper: createWrapper() })
    expect(screen.getByText('Nenhuma fatura pendente para negociar.')).toBeInTheDocument()
  })

  it('shows selection options when invoices exist', () => {
    render(<NegotiateInvoiceModal {...defaultProps} />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Intervalo de meses')).toBeInTheDocument()
    expect(screen.getByText(/Todas as pendentes/)).toBeInTheDocument()
  })

  it('shows number of pending invoices', () => {
    render(<NegotiateInvoiceModal {...defaultProps} />, { wrapper: createWrapper() })
    expect(screen.getAllByText(/3 faturas/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows form fields for negotiation details', () => {
    render(<NegotiateInvoiceModal {...defaultProps} />, { wrapper: createWrapper() })
    
    // "Valor total do parcelamento" appears twice: in radio label and in input label
    expect(screen.getAllByText('Valor total do parcelamento').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Número de parcelas')).toBeInTheDocument()
    expect(screen.getByText('Primeira parcela em')).toBeInTheDocument()
  })

  it('calculates and shows preview when valid values entered', async () => {
    render(<NegotiateInvoiceModal {...defaultProps} />, { wrapper: createWrapper() })
    
    const totalInput = screen.getByPlaceholderText(/R\$/)
    fireEvent.change(totalInput, { target: { value: '6000' } })
    
    await waitFor(() => {
      expect(screen.getByText(/12x/)).toBeInTheDocument()
      expect(screen.getByText(/R\$ 500,00/)).toBeInTheDocument()
    })
  })

  it('shows error for invalid installments', async () => {
    render(<NegotiateInvoiceModal {...defaultProps} />, { wrapper: createWrapper() })
    
    const installmentsInput = screen.getByDisplayValue('12')
    fireEvent.change(installmentsInput, { target: { value: '30' } })
    
    await waitFor(() => {
      expect(screen.getByText('Entre 2 e 24 parcelas')).toBeInTheDocument()
    })
  })

  it('disables submit when form is invalid', () => {
    render(<NegotiateInvoiceModal {...defaultProps} />, { wrapper: createWrapper() })
    
    const submitButton = screen.getByRole('button', { name: /Confirmar Negociação/ })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit when form is valid', async () => {
    render(<NegotiateInvoiceModal {...defaultProps} />, { wrapper: createWrapper() })
    
    const totalInput = screen.getByPlaceholderText(/R\$/)
    fireEvent.change(totalInput, { target: { value: '5000' } })
    
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Confirmar Negociação/ })
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('calls createNegotiation on valid submit', async () => {
    render(<NegotiateInvoiceModal {...defaultProps} />, { wrapper: createWrapper() })
    
    const totalInput = screen.getByPlaceholderText(/R\$/)
    fireEvent.change(totalInput, { target: { value: '5000' } })
    
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Confirmar Negociação/ })
      expect(submitButton).not.toBeDisabled()
    })
    
    const form = screen.getByRole('dialog').querySelector('form')!
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(mockCreateMutation.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          account_id: 'acc-1',
          card: 'nubank',
          total_amount: 5000,
          installments: 12,
        }),
        expect.any(Object)
      )
    })
  })

  it('calls onClose when cancel is clicked', () => {
    render(<NegotiateInvoiceModal {...defaultProps} />, { wrapper: createWrapper() })
    
    const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
    fireEvent.click(cancelButton)
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('shows range selectors when range mode is selected', async () => {
    render(<NegotiateInvoiceModal {...defaultProps} />, { wrapper: createWrapper() })
    
    const rangeRadio = screen.getByLabelText('Intervalo de meses')
    fireEvent.click(rangeRadio)
    
    await waitFor(() => {
      expect(screen.getByText('De')).toBeInTheDocument()
      expect(screen.getByText('Até')).toBeInTheDocument()
    })
  })
})
