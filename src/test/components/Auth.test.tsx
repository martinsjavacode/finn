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
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByText('Entrar')).toBeInTheDocument()
    expect(screen.getByText('Entrar com GitHub')).toBeInTheDocument()
  })

  it('mostra erro com credenciais inválidas', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Invalid login credentials' } } as never)

    render(<Auth />)
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '123456' } })
    fireEvent.click(screen.getByText('Entrar'))

    await waitFor(() => {
      expect(screen.getByText('Email ou senha incorretos.')).toBeInTheDocument()
    })
  })

  it('permite alternar para tela de cadastro', () => {
    render(<Auth />)
    fireEvent.click(screen.getByText('Não tem conta? Criar conta'))
    expect(screen.getByText('Criar conta')).toBeInTheDocument()
  })
})
