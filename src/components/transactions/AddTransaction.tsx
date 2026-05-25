import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Category, Owner, TransactionType } from '../../types/database'
import Select from '../ui/Select'
import Button from '../ui/Button'

interface Props {
  categories: Category[]
  cardsList: { name: string; label: string }[]
  onSaved: () => void
  onClose: () => void
}

export default function AddTransaction({ categories, cardsList, onSaved, onClose }: Props) {
  const [target, setTarget] = useState<'transaction' | 'credit_card'>('transaction')
  const [type, setType] = useState<TransactionType>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState(categories[0]?.id ?? '')
  const [owner, setOwner] = useState<Owner>('personal')
  const [card, setCard] = useState(cardsList[0]?.name ?? '')
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
          <Button variant="tab" active={target === 'transaction'} onClick={() => setTarget('transaction')}>Receita/Despesa</Button>
          <Button variant="tab" active={target === 'credit_card'} onClick={() => setTarget('credit_card')}>Cartão</Button>
        </div>

        {target === 'transaction' && (
          <div className="form-tabs">
            <Button variant="tab" active={type === 'income'} onClick={() => setType('income')}>Receita</Button>
            <Button variant="tab" active={type === 'expense'} onClick={() => setType('expense')}>Despesa</Button>
          </div>
        )}

        <input type="date" value={month} onChange={e => setMonth(e.target.value)} required />
        <input type="text" placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} required />
        <input type="number" step="0.01" placeholder="Valor" value={amount} onChange={e => setAmount(e.target.value)} required />

        {target === 'transaction' ? (
          <Select value={category} onChange={setCategory} options={categories.map(c => ({ value: c.id, label: c.label }))} />
        ) : (
          <Select value={card} onChange={v => setCard(v)} options={cardsList.map(c => ({ value: c.name, label: c.label }))} />
        )}

        <Select value={owner} onChange={v => setOwner(v as Owner)} options={[{ value: 'personal', label: 'Pessoal' }, { value: 'mother_in_law', label: 'Sogra' }]} />

        <div className="form-actions">
          <Button variant="tab" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </form>
    </div>
  )
}
