import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Transaction, CreditCard, Owner, Category, Card } from './types/database'
import './App.css'

const categoryLabels: Record<Category, string> = { house: 'Casa', business: 'Empresa', education: 'Estudos', misc: 'Diversas' }
const cardLabels: Record<Card, string> = { nubank: 'Nubank', bradesco: 'Bradesco', inter: 'Inter', pague_menos: 'Pague Menos', mercado_pago: 'Mercado Pago', neon: 'Neon' }
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function App() {
  const [months, setMonths] = useState<string[]>([])
  const [month, setMonth] = useState('')
  const [owner, setOwner] = useState<'all' | Owner>('all')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [catFilter, setCatFilter] = useState('all')
  const [cardFilter, setCardFilter] = useState('all')

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from('transactions').select('month').order('month', { ascending: false })
      const { data: c } = await supabase.from('credit_cards').select('month').order('month', { ascending: false })
      const tMonths = (t as { month: string }[] | null) ?? []
      const cMonths = (c as { month: string }[] | null) ?? []
      const all = [...new Set([...tMonths.map(r => r.month), ...cMonths.map(r => r.month)])].sort().reverse()
      setMonths(all)
      if (all.length) setMonth(all[0])
    })()
  }, [])

  useEffect(() => {
    if (!month) return
    ;(async () => {
      const { data: t } = await supabase.from('transactions').select('*').eq('month', month).order('type').order('category').order('description')
      const { data: c } = await supabase.from('credit_cards').select('*').eq('month', month).order('card').order('description')
      setTransactions(t || [])
      setCards(c || [])
    })()
  }, [month])

  const ft = transactions.filter(r => owner === 'all' || r.owner === owner)
  const fc = cards.filter(r => owner === 'all' || r.owner === owner)

  const income = ft.filter(r => r.type === 'income').reduce((s, r) => s + +r.amount, 0)
  const expense = ft.filter(r => r.type === 'expense').reduce((s, r) => s + +r.amount, 0)
  const cardTotal = fc.reduce((s, r) => s + +r.amount, 0)
  const balance = income - expense - cardTotal

  const categories = ['all', ...new Set(ft.map(r => r.category))]
  const cardNames = ['all', ...new Set(fc.map(r => r.card))]
  const filteredT = catFilter === 'all' ? ft : ft.filter(r => r.category === catFilter)
  const filteredC = cardFilter === 'all' ? fc : fc.filter(r => r.card === cardFilter)

  return (
    <div className="app">
      <h1>💰 Controle Financeiro</h1>

      <div className="controls">
        <select value={month} onChange={e => setMonth(e.target.value)}>
          {months.map(m => (
            <option key={m} value={m}>{new Date(m + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</option>
          ))}
          {!months.length && <option>Sem dados</option>}
        </select>
        <select value={owner} onChange={e => setOwner(e.target.value as 'all' | Owner)}>
          <option value="all">Todos</option>
          <option value="personal">Pessoal</option>
          <option value="mother_in_law">Sogra</option>
        </select>
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
          {categories.map(c => (
            <button key={c} className={`tab ${c === catFilter ? 'active' : ''}`} onClick={() => setCatFilter(c)}>
              {c === 'all' ? 'Todos' : categoryLabels[c as Category] || c}
            </button>
          ))}
        </div>
        <table>
          <thead><tr><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th>Resp.</th></tr></thead>
          <tbody>
            {filteredT.length ? filteredT.map(r => (
              <tr key={r.id}>
                <td>{r.description}</td>
                <td>{categoryLabels[r.category]}</td>
                <td>{r.type === 'income' ? '📈 Receita' : '📉 Despesa'}</td>
                <td>{fmt(+r.amount)}</td>
                <td><span className={`badge ${r.owner === 'personal' ? 'badge-personal' : 'badge-sogra'}`}>{r.owner === 'personal' ? 'Pessoal' : 'Sogra'}</span></td>
              </tr>
            )) : <tr><td colSpan={5} className="empty">Nenhum lançamento</td></tr>}
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
                <td><span className={`badge ${r.owner === 'personal' ? 'badge-personal' : 'badge-sogra'}`}>{r.owner === 'personal' ? 'Pessoal' : 'Sogra'}</span></td>
              </tr>
            )) : <tr><td colSpan={5} className="empty">Nenhum lançamento</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  )
}
