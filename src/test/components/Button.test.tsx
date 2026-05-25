import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../../components/ui/Button'

describe('Button', () => {
  it('renderiza com texto', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('chama onClick ao clicar', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('aplica classe active quando active=true', () => {
    render(<Button variant="tab" active>Tab</Button>)
    expect(screen.getByText('Tab')).toHaveClass('active')
  })

  it('fica desabilitado quando disabled=true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })
})
