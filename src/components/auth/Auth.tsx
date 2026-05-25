import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './Auth.css'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'login' | 'code'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data } = await supabase.from('access_control').select('id').eq('email', email).single()
    if (!data) { setError('Email não autorizado.'); setLoading(false); return }

    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setError(error.message)
    else setStep('code')
    setLoading(false)
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleGitHub = () => {
    supabase.auth.signInWithOAuth({ provider: 'github' })
  }

  if (step === 'code') {
    return (
      <div className="auth">
        <h1>💰 Finn</h1>
        <form onSubmit={handleVerify}>
          <p className="auth-msg">Código enviado para <strong>{email}</strong></p>
          <input type="text" placeholder="Digite o código" value={code} onChange={e => setCode(e.target.value)} required autoFocus />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Verificando...' : 'Verificar'}</button>
          <button type="button" className="auth-github" onClick={() => { setStep('login'); setError('') }}>Voltar</button>
        </form>
      </div>
    )
  }

  return (
    <div className="auth">
      <h1>💰 Finn</h1>
      <form onSubmit={handleSendCode}>
        <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar código'}</button>
        <div className="auth-divider">ou</div>
        <button type="button" className="auth-github" onClick={handleGitHub}>Entrar com GitHub</button>
      </form>
    </div>
  )
}
