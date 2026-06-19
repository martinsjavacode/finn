import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../hooks/useTransactionMutations', () => ({
  useTransactionMutations: () => ({
    addTransaction: { mutate: vi.fn() },
    addCreditCard: { mutate: vi.fn() },
  }),
}))

vi.mock('../../lib/toast', () => ({
  showError: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('../../utils/format', () => ({
  categoryOptions: (cats: { id: string; name: string }[]) => cats.map(c => ({ value: c.id, label: c.name })),
  resolveInvoiceMonth: () => '2025-02',
  monthLabel: (m: string) => m,
}))

vi.mock('../ui/Select', () => ({
  default: ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <select data-testid="select" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
}))

import AddTransaction from '../../components/transactions/AddTransaction'

const categories = [{ id: 'cat1', name: 'alimentacao', label: 'Alimentação', parent_id: null }]
const cardsList = [{ name: 'nubank', label: 'Nubank', color: '#8a2be2', closing_day: 3, due_day: 10, closing_rule: 'fixed' as const, days_before_due: 7 }]

function renderComponent() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AddTransaction categories={categories} cardsList={cardsList} month="2025-01" accountId="acc1" onClose={vi.fn()} />
    </QueryClientProvider>
  )
}

describe('AddTransaction - Value Mode Toggle', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('não exibe toggle de modo de valor quando parcelado está desativado', () => {
    renderComponent()
    expect(screen.queryByText('Valor total')).not.toBeInTheDocument()
    expect(screen.queryByText('Valor da parcela')).not.toBeInTheDocument()
  })

  it('exibe toggle de modo de valor ao ativar parcelado', () => {
    renderComponent()
    fireEvent.click(screen.getByLabelText('Ativar parcelamento'))
    expect(screen.getByText('Valor total')).toBeInTheDocument()
    expect(screen.getByText('Valor da parcela')).toBeInTheDocument()
  })

  it('modo "Valor total" é o padrão e exibe label correto', () => {
    renderComponent()
    fireEvent.click(screen.getByLabelText('Ativar parcelamento'))
    expect(screen.getByText('Valor total (R$)')).toBeInTheDocument()
  })

  it('alterna para modo "Valor da parcela" e atualiza label', () => {
    renderComponent()
    fireEvent.click(screen.getByLabelText('Ativar parcelamento'))
    fireEvent.click(screen.getByText('Valor da parcela'))
    expect(screen.getByText('Valor da parcela (R$)')).toBeInTheDocument()
  })

  it('preview mostra parcela quando modo é "Valor total"', () => {
    renderComponent()
    fireEvent.click(screen.getByLabelText('Ativar parcelamento'))
    const amountInput = screen.getByPlaceholderText('0.00')
    fireEvent.change(amountInput, { target: { value: '1200' } })
    // Default 2 parcelas: 1200/2 = 600.00
    expect(screen.getByText('R$ 600.00')).toBeInTheDocument()
    expect(screen.getByText('2× de')).toBeInTheDocument()
  })

  it('preview mostra total quando modo é "Valor da parcela"', () => {
    renderComponent()
    fireEvent.click(screen.getByLabelText('Ativar parcelamento'))
    fireEvent.click(screen.getByText('Valor da parcela'))
    const amountInput = screen.getByPlaceholderText('0.00')
    fireEvent.change(amountInput, { target: { value: '49.90' } })
    // 49.90 * 2 = 99.80
    expect(screen.getByText('R$ 99.80')).toBeInTheDocument()
    expect(screen.getByText('Total:')).toBeInTheDocument()
  })

  it('oculta toggle ao desativar parcelado', () => {
    renderComponent()
    fireEvent.click(screen.getByLabelText('Ativar parcelamento'))
    expect(screen.getByText('Valor total')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Desativar parcelamento'))
    expect(screen.queryByText('Valor total')).not.toBeInTheDocument()
  })
})

describe('AddTransaction - Form Order', () => {
  it('campo de pagamento aparece antes do campo de valor', () => {
    renderComponent()
    const form = document.querySelector('form')!
    const labels = Array.from(form.querySelectorAll('.form-label')).map(l => l.textContent?.trim())
    const pagamentoIdx = labels.findIndex(l => l === 'Pagamento')
    const valorIdx = labels.findIndex(l => l?.startsWith('Valor'))
    expect(pagamentoIdx).toBeLessThan(valorIdx)
  })
})
