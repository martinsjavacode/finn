import { render, screen } from '@testing-library/react'
import SummaryCards from '../../components/dashboard/SummaryCards'

describe('SummaryCards', () => {
  it('renderiza receitas, despesas, cartões e saldo', () => {
    render(<SummaryCards income={5000} expense={3000} cardTotal={500} />)

    expect(screen.getByText('Receitas')).toBeInTheDocument()
    expect(screen.getByText('Despesas')).toBeInTheDocument()
    expect(screen.getByText('Cartões')).toBeInTheDocument()
    expect(screen.getByText('Saldo')).toBeInTheDocument()
  })

  it('calcula saldo positivo corretamente', () => {
    const { container } = render(<SummaryCards income={5000} expense={2000} cardTotal={1000} />)
    const saldoEl = container.querySelectorAll('.total')[3]
    expect(saldoEl).toHaveClass('positive')
  })

  it('calcula saldo negativo corretamente', () => {
    const { container } = render(<SummaryCards income={1000} expense={3000} cardTotal={500} />)
    const saldoEl = container.querySelectorAll('.total')[3]
    expect(saldoEl).toHaveClass('negative')
  })
})
