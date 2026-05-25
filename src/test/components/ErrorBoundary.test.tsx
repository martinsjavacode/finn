import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../../components/ui/ErrorBoundary'

function ThrowError(): React.ReactNode {
  throw new Error('Test error')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renderiza children quando não há erro', () => {
    render(<ErrorBoundary><p>OK</p></ErrorBoundary>)
    expect(screen.getByText('OK')).toBeInTheDocument()
  })

  it('renderiza fallback quando há erro', () => {
    render(<ErrorBoundary><ThrowError /></ErrorBoundary>)
    expect(screen.getByText('Algo deu errado.')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getByText('Recarregar')).toBeInTheDocument()
  })
})
