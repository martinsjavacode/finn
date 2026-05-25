import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Auth from '../../components/auth/Auth'
import { supabase } from '../../lib/supabase'

describe('Auth', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renderiza formulário de login', () => {
    render(<Auth />)
    expect(screen.getByText('💰 Finn')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()
    expect(screen.getByText('Enviar código')).toBeInTheDocument()
    expect(screen.getByText('Entrar com GitHub')).toBeInTheDocument()
  })

  it('mostra erro quando email não autorizado', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
    vi.mocked(supabase.from).mockImplementation(mockFrom)

    render(<Auth />)
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'bad@email.com' } })
    fireEvent.click(screen.getByText('Enviar código'))

    await waitFor(() => {
      expect(screen.getByText('Email não autorizado.')).toBeInTheDocument()
    })
  })

  it('avança para tela de código quando email autorizado', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
        }),
      }),
    })
    vi.mocked(supabase.from).mockImplementation(mockFrom)
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: { user: null, session: null }, error: null })

    render(<Auth />)
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'ok@email.com' } })
    fireEvent.click(screen.getByText('Enviar código'))

    await waitFor(() => {
      expect(screen.getByText(/Código enviado para/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Digite o código')).toBeInTheDocument()
    })
  })
})
