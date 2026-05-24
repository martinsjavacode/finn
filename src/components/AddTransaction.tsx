import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category, Owner, Card, TransactionType } from '../types/database'

const cards: Card[] = ['nubank', 'bradesco', 'inter', 'pague_menos', 'mercado_pago', 'neon']
const cardLabels: Record<Card, string> = { nubank: 'Nubank', bradesco: 'Bradesco', inter: 'Inter', pague_menos: 'Pague Menos', mercado_pago: 'Mercado Pago', neon: 'Neon' }

interface Props {
  categories: Category[]
  onSaved: () => void
  onClose: () => void
}

export default function AddTransaction({ categories, onSaved, onClose }: Props) {
  const [target, setTarget] = useState<'transaction' | 'credit_card'>('transaction')
  const [type, setType] = useState<TransactionType>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState(categories[0]?.id ?? '')
  const [owner, setOwner] = useState<Owner>('personal')
  const [card, setCard] = useState<Card>('nubank')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (target === 'transaction') {
      await supabase.from('transactions').insert({
        month, description, amount: +amount, type, category, owner, paid: false
      } as never)
    } else {
      await supabase.from('credit_cards').insert({
        month, description, amount: +amount, card, owner
      } as never)
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Novo Lançamento</h2>

        <div className="form-tabs">
          <button type="button" className={`tab ${target === 'transaction' ? 'active' : ''}`} onClick={() => setTarget('transaction')}>Receita/Despesa</button>
          <button type="button" className={`tab ${target === 'credit_card' ? 'active' : ''}`} onClick={() => setTarget('credit_card')}>Cartão</button>
        </div>

        {target === 'transaction' && (
          <div className="form-tabs">
            <button type="button" className={`tab ${type === 'income' ? 'active' : ''}`} onClick={() => setType('income')}>Receita</button>
            <button type="button" className={`tab ${type === 'expense' ? 'active' : ''}`} onClick={() => setType('expense')}>Despesa</button>
          </div>
        )}

        <input type="date" value={month} onChange={e => setMonth(e.target.value)} required />
        <input type="text" placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} required />
        <input type="number" step="0.01" placeholder="Valor" value={amount} onChange={e => setAmount(e.target.value)} required />

        {target === 'transaction' ? (
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        ) : (
          <select value={card} onChange={e => setCard(e.target.value as Card)}>
            {cards.map(c => <option key={c} value={c}>{cardLabels[c]}</option>)}
          </select>
        )}

        <select value={owner} onChange={e => setOwner(e.target.value as Owner)}>
          <option value="personal">Pessoal</option>
          <option value="mother_in_law">Sogra</option>
        </select>

        <div className="form-actions">
          <button type="button" className="tab" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  )
}
