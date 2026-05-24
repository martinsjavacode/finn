import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Transaction, CreditCard, Category, Owner, Card } from './types/database'
import type { Session } from '@supabase/supabase-js'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import Select from './components/Select'
import './App.css'

const cardLabels: Record<Card, string> = { nubank: 'Nubank', bradesco: 'Bradesco', inter: 'Inter', pague_menos: 'Pague Menos', mercado_pago: 'Mercado Pago', neon: 'Neon' }
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const ownerBadge = (o: Owner) => `<span class="badge ${o === 'personal' ? 'badge-personal' : 'badge-sogra'}">${o === 'personal' ? 'Pessoal' : 'Sogra'}</span>`

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState<string[]>([])
  const [month, setMonth] = useState('')
  const [owner, setOwner] = useState<'all' | Owner>('all')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [catFilter, setCatFilter] = useState('all')
  const [cardFilter, setCardFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    ;(async () => {
      const { data: cats } = await supabase.from('categories').select('*')
      setCategories(cats ?? [])

      const { data: t } = await supabase.from('transactions').select('month').order('month', { ascending: false })
      const { data: c } = await supabase.from('credit_cards').select('month').order('month', { ascending: false })
      const tMonths = (t as { month: string }[] | null) ?? []
      const cMonths = (c as { month: string }[] | null) ?? []
      const toYM = (d: string) => d.substring(0, 7)
      const all = [...new Set([...tMonths.map(r => toYM(r.month)), ...cMonths.map(r => toYM(r.month))])].sort().reverse()
      setMonths(all)
      if (all.length) setMonth(all[0])
    })()
  }, [session])

  useEffect(() => {
    if (!month) return
    const start = `${month}-01`
    const [y, m] = month.split('-').map(Number)
    const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
    ;(async () => {
      const { data: t } = await supabase.from('transactions').select('*, categories(*)').gte('month', start).lt('month', nextMonth).order('month').order('type').order('description')
      const { data: c } = await supabase.from('credit_cards').select('*').gte('month', start).lt('month', nextMonth).order('card').order('description')
      setTransactions((t as Transaction[]) ?? [])
      setCards(c ?? [])
    })()
  }, [month])

  const togglePaid = async (id: string, paid: boolean) => {
    await supabase.from('transactions').update({ paid: !paid } as never).eq('id', id)
    setTransactions(prev => prev.map(r => r.id === id ? { ...r, paid: !paid } : r))
  }

  if (loading) return <div className="auth"><p>Carregando...</p></div>
  if (!session) return <Auth />

  const getCatLabel = (t: Transaction) => t.categories?.label ?? ''

  const ft = transactions.filter(r => owner === 'all' || r.owner === owner)
  const fc = cards.filter(r => owner === 'all' || r.owner === owner)

  const income = ft.filter(r => r.type === 'income').reduce((s, r) => s + +r.amount, 0)
  const expense = ft.filter(r => r.type === 'expense').reduce((s, r) => s + +r.amount, 0)
  const cardTotal = fc.reduce((s, r) => s + +r.amount, 0)
  const balance = income - expense - cardTotal

  const usedCats = ['all', ...new Set(ft.map(r => r.category))]
  const cardNames = ['all', ...new Set(fc.map(r => r.card))]
  const filteredT = ft.filter(r => (catFilter === 'all' || r.category === catFilter) && (typeFilter === 'all' || r.type === typeFilter))
  const filteredC = cardFilter === 'all' ? fc : fc.filter(r => r.card === cardFilter)

  const catLabel = (id: string) => categories.find(c => c.id === id)?.label ?? id

  return (
    <div className="layout">
      <Sidebar session={session} />
      <main className="main">
        <div className="controls">
          <Select
            value={month}
            onChange={setMonth}
            options={months.length ? months.map(m => ({ value: m, label: new Date(m + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) })) : [{ value: '', label: 'Sem dados' }]}
          />
          <Select
            value={owner}
            onChange={v => setOwner(v as 'all' | Owner)}
            options={[{ value: 'all', label: 'Todos' }, { value: 'personal', label: 'Pessoal' }, { value: 'mother_in_law', label: 'Sogra' }]}
          />
        </div>

      <div className="grid">
        <div className="card"><h2>Receitas</h2><span className="total positive">{fmt(income)}</span></div>
        <div className="card"><h2>Despesas</h2><span className="total negative">{fmt(expense)}</span></div>
        <div className="card"><h2>Cartões</h2><span className="total negative">{fmt(cardTotal)}</span></div>
        <div className="card"><h2>Saldo</h2><span className={`total ${balance >= 0 ? 'positive' : 'negative'}`}>{fmt(balance)}</span></div>
      </div>

      <section>
        <h2>Lançamentos</h2>
        <div className="tabs">
          {(['all', 'income', 'expense'] as const).map(t => (
            <button key={t} className={`tab ${t === typeFilter ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'Todos' : t === 'income' ? '📈 Receitas' : '📉 Despesas'}
            </button>
          ))}
        </div>
        <div className="tabs">
          {usedCats.map(c => (
            <button key={c} className={`tab ${c === catFilter ? 'active' : ''}`} onClick={() => setCatFilter(c)}>
              {c === 'all' ? 'Todas categorias' : catLabel(c)}
            </button>
          ))}
        </div>
        <table>
          <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Parcela</th><th>Valor</th><th>Resp.</th><th>Pago</th></tr></thead>
          <tbody>
            {filteredT.length ? filteredT.map(r => (
              <tr key={r.id} className={r.paid ? 'row-paid' : ''}>
                <td>{new Date(r.month + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                <td>{r.description}</td>
                <td>{getCatLabel(r)}</td>
                <td>{r.type === 'income' ? '📈 Receita' : '📉 Despesa'}</td>
                <td>{r.current_installment && r.total_installments ? `${r.current_installment}/${r.total_installments}` : '-'}</td>
                <td>{fmt(+r.amount)}</td>
                <td dangerouslySetInnerHTML={{ __html: ownerBadge(r.owner) }} />
                <td><button className={`paid-btn ${r.paid ? 'paid' : ''}`} onClick={() => togglePaid(r.id, r.paid)}>{r.paid ? '✓' : '○'}</button></td>
              </tr>
            )) : <tr><td colSpan={8} className="empty">Nenhum lançamento</td></tr>}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Cartões de Crédito</h2>
        <div className="tabs">
          {cardNames.map(c => (
            <button key={c} className={`tab ${c === cardFilter ? 'active' : ''}`} onClick={() => setCardFilter(c)}>
              {c === 'all' ? 'Todos' : cardLabels[c as Card] || c}
            </button>
          ))}
        </div>
        <table>
          <thead><tr><th>Descrição</th><th>Cartão</th><th>Parcela</th><th>Valor</th><th>Resp.</th></tr></thead>
          <tbody>
            {filteredC.length ? filteredC.map(r => (
              <tr key={r.id}>
                <td>{r.description}</td>
                <td>{cardLabels[r.card]}</td>
                <td>{r.current_installment && r.total_installments ? `${r.current_installment}/${r.total_installments}` : '-'}</td>
                <td>{fmt(+r.amount)}</td>
                <td dangerouslySetInnerHTML={{ __html: ownerBadge(r.owner) }} />
              </tr>
            )) : <tr><td colSpan={5} className="empty">Nenhum lançamento</td></tr>}
          </tbody>
        </table>
      </section>
      </main>
    </div>
  )
}
