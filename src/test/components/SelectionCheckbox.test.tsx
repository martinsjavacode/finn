import { render, screen, fireEvent } from '@testing-library/react'
import SelectionCheckbox from '../../components/transactions/SelectionCheckbox'

describe('SelectionCheckbox', () => {
  it('renderiza checkbox desmarcado', () => {
    render(<SelectionCheckbox checked={false} onChange={() => {}} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('renderiza checkbox marcado quando checked=true', () => {
    render(<SelectionCheckbox checked={true} onChange={() => {}} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('chama onChange ao clicar', () => {
    const onChange = vi.fn()
    render(<SelectionCheckbox checked={false} onChange={onChange} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('fica desabilitado quando disabled=true', () => {
    render(<SelectionCheckbox checked={false} onChange={() => {}} disabled />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('checkbox desabilitado possui atributo disabled', () => {
    const onChange = vi.fn()
    render(<SelectionCheckbox checked={false} onChange={onChange} disabled />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeDisabled()
    expect(checkbox).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
  })

  it('possui área de toque mínima de 44x44px', () => {
    render(<SelectionCheckbox checked={false} onChange={() => {}} />)
    const label = screen.getByRole('checkbox').closest('label')
    expect(label).toHaveClass('min-w-[44px]', 'min-h-[44px]')
  })

  it('possui aria-label acessível', () => {
    render(<SelectionCheckbox checked={false} onChange={() => {}} />)
    expect(screen.getByLabelText('Selecionar lançamento')).toBeInTheDocument()
  })
})
