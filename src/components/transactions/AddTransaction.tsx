import { useState } from 'react'
import type { Category, Owner, TransactionType, CardListItem } from '../../types/database'
import { useTransactionMutations } from '../../hooks/useTransactionMutations'
import { useModal } from '../../hooks/useModal'
import Select from '../ui/Select'
import Button from '../ui/Button'

interface Props {
  categories: Category[]
  cardsList: CardListItem[]
  month: string
  onClose: () => void
}

export default function AddTransaction({ categories, cardsList, month, onClose }: Props) {
  const modalRef = useModal<HTMLFormElement>(onClose)
  const { addTransaction, addCreditCard } = useTransactionMutations(month)
  const [target, setTarget] = useState<'transaction' | 'credit_card'>('transaction')
  const [type, setType] = useState<TransactionType>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState(categories[0]?.id ?? '')
  const [owner, setOwner] = useState<Owner>('personal')
  const [card, setCard] = useState(cardsList[0]?.name ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (target === 'transaction') {
      addTransaction.mutate({ month: txDate, description, amount: +amount, type, category, owner, paid: false })
    } else {
      addCreditCard.mutate({ month: txDate, description, amount: +amount, card, owner })
    }
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Novo Lançamento">
      <form className="modal" ref={modalRef} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
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

        <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} required />
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
          <Button variant="primary" type="submit">Salvar</Button>
        </div>
      </form>
    </div>
  )
}
