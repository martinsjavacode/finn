import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Category, Owner, TransactionType, CardListItem } from '../../types/database'
import { useTransactionMutations } from '../../hooks/useTransactionMutations'
import { showError, toast } from '../../lib/toast'
import { categoryOptions, resolveInvoiceMonth, monthLabel } from '../../utils/format'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface Props {
  categories: Category[]
  cardsList: CardListItem[]
  month: string
  onClose: () => void
}

export default function AddTransaction({ categories, cardsList, month, onClose }: Props) {
  const queryClient = useQueryClient()
  const { addTransaction, addCreditCard } = useTransactionMutations(month)
  const [target, setTarget] = useState<'pix' | 'credit_card'>('pix')
  const [type, setType] = useState<TransactionType>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState(categories[0]?.id ?? '')
  const [owner, setOwner] = useState<Owner>('personal')
  const [card, setCard] = useState(cardsList[0]?.name ?? '')
  const [installment, setInstallment] = useState(false)
  const [installments, setInstallments] = useState('2')

  const toggleInstallment = () => {
    setInstallment(!installment)
    if (!installment) setType('expense')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const resolvedMonth = target === 'credit_card'
      ? resolveInvoiceMonth(txDate, cardsList.find(c => c.name === card)!) + '-01'
      : txDate
    if (installment) {
      const { error } = await supabase.from('installment_purchases').insert({
        start_month: resolvedMonth,
        description,
        total_amount: +amount,
        installments: +installments,
        owner,
        target,
        card: target === 'credit_card' ? card : null,
        category,
      })
      if (error) return showError(error)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['creditCards'] })
      queryClient.invalidateQueries({ queryKey: ['months'] })
      toast(`Parcelamento criado (${installments}x)`)
    } else if (target === 'pix') {
      addTransaction.mutate({ month: txDate, description, amount: +amount, type, category, owner, paid: false })
    } else {
      addCreditCard.mutate({ month: resolvedMonth, description, amount: +amount, card, owner, category })
    }
    onClose()
  }

  return (
    <Modal title="Novo Lançamento" onClose={onClose} onSubmit={handleSubmit}>
      {/* Seção: O quê */}
      <label className="form-label">Descrição
        <input type="text" placeholder="Ex: Aluguel, Netflix..." value={description} onChange={e => setDescription(e.target.value)} required />
      </label>

      <div className="form-row">
        <label className="form-label form-grow">Valor (R$)
          <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
        </label>
        <label className="form-label">Data
          <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} required />
        </label>
      </div>

      <div className="form-divider" />

      {/* Seção: Como */}
      <div className="form-row">
        <div className="form-grow">
          <label className="form-label">Pagamento</label>
          <div className="form-tabs">
            <Button variant="tab" active={target === 'pix'} onClick={() => setTarget('pix')}>Pix</Button>
            <Button variant="tab" active={target === 'credit_card'} onClick={() => setTarget('credit_card')}>Cartão</Button>
          </div>
        </div>

        {target === 'pix' && (
          <div className="form-grow">
            <label className="form-label">Tipo</label>
            <div className="form-tabs">
              <Button variant="tab" active={type === 'expense'} onClick={() => setType('expense')} disabled={installment}>Despesa</Button>
              <Button variant="tab" active={type === 'income'} onClick={() => setType('income')} disabled={installment}>Receita</Button>
            </div>
          </div>
        )}

        {target === 'credit_card' && (
          <label className="form-label form-grow">Cartão
            <Select value={card} onChange={v => setCard(v)} options={cardsList.map(c => ({ value: c.name, label: c.label }))} />
          </label>
        )}
      </div>

      {target === 'credit_card' && txDate && card && (
        <div className="form-preview">
          <span>Fatura de</span>
          <strong>{monthLabel(resolveInvoiceMonth(txDate, cardsList.find(c => c.name === card)!))}</strong>
        </div>
      )}

      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-toggle-group">
          <span className="form-label">Parcelado</span>
          <button type="button" className={`form-toggle-circle ${installment ? 'active' : ''}`} onClick={toggleInstallment} aria-label={installment ? 'Desativar parcelamento' : 'Ativar parcelamento'}>
            ÷
          </button>
        </div>
        <label className={`form-label form-grow form-fade ${installment ? 'visible' : ''}`}>Nº de parcelas
          <input type="number" min="2" max="48" value={installments} onChange={e => setInstallments(e.target.value)} disabled={!installment} required={installment} tabIndex={installment ? 0 : -1} />
        </label>
      </div>

      {installment && +amount > 0 && +installments >= 2 && (
        <div className="form-preview">
          <span>{installments}× de</span>
          <strong>R$ {(+amount / +installments).toFixed(2)}</strong>
        </div>
      )}

      <div className="form-divider" />

      {/* Seção: Classificação */}
      <div className="form-row">
        <label className="form-label form-grow">Categoria
          <Select value={category} onChange={setCategory} options={categoryOptions(categories)} />
        </label>
        <label className="form-label form-grow">Responsável
          <Select value={owner} onChange={v => setOwner(v as Owner)} options={[{ value: 'personal', label: 'Pessoal' }, { value: 'mother_in_law', label: 'Sogra' }]} />
        </label>
      </div>
    </Modal>
  )
}
