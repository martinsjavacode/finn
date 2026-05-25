import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './Auth.css'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : error.message)
    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Verifica se email está autorizado
    const { data } = await supabase.from('users').select('id').eq('email', email).single()
    if (!data) { setError('Email não autorizado. Solicite acesso ao administrador.'); setLoading(false); return }

    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/finn/' } })
    if (error) { setError(error.message); setLoading(false); return }

    // Login automático após cadastro
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) setError(loginError.message)
    setLoading(false)
  }

  const handleGitHub = () => {
    supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.origin + '/finn/' } })
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>💰 Finn</h1>
          <p className="auth-subtitle">Controle financeiro pessoal</p>
        </div>
        <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label>Senha</label>
            <div className="auth-password">
              <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              <button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar senha">
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}
          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
          <div className="auth-divider"><span>ou</span></div>
          <button type="button" className="auth-btn-github" onClick={handleGitHub}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            {mode === 'login' ? 'Entrar com GitHub' : 'Cadastrar com GitHub'}
          </button>
        </form>
        <button type="button" className="auth-btn-link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}>
          {mode === 'login' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
