import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './Auth.css'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'magic') {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) setError(error.message)
      else setSent(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  const handleGitHub = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' })
  }

  return (
    <div className="auth">
      <h1>💰 Finn</h1>
      {sent ? (
        <p className="auth-msg">Link enviado para <strong>{email}</strong>. Verifique seu email.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          {mode === 'password' && (
            <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
          )}
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : mode === 'password' ? 'Entrar' : 'Enviar Magic Link'}
          </button>
          <button type="button" className="tab" onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}>
            {mode === 'password' ? 'Usar Magic Link' : 'Usar senha'}
          </button>
          <div className="auth-divider">ou</div>
          <button type="button" className="auth-github" onClick={handleGitHub}>Entrar com GitHub</button>
        </form>
      )}
    </div>
  )
}
