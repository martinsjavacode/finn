import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, Github } from 'lucide-react'
import './Auth.css'

export default function Auth() {
  const navigate = useNavigate()
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
    else navigate('/', { replace: true })
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
    else navigate('/', { replace: true })
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
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
            <Github size={18} />
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
