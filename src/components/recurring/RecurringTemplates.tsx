import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Category, Owner, Card } from '../../types/database'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import Select from '../ui/Select'
import Button from '../ui/Button'
import MobileCard from '../ui/MobileCard'
import { fmt } from '../../utils/format'

interface Template {
  id: string
  description: string
  amount: number
  type: string
  target: string
  category: string | null
  card: string | null
  owner: string
  day: number
  active: boolean
}

interface Props {
  categories: Category[]
  cardsList: { name: string; label: string }[]
}

export default function RecurringPage({ categories, cardsList }: Props) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genMonth, setGenMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Form state
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [target, setTarget] = useState('transaction')
  const [category, setCategory] = useState(categories[0]?.id ?? '')
  const [card, setCard] = useState<Card>(cardsList[0]?.name ?? '')
  const [owner, setOwner] = useState<Owner>('personal')
  const [day, setDay] = useState(1)

  useEffect(() => {
    supabase.from('recurring_templates').select('*').order('day').order('description').then(({ data }) => setTemplates(data ?? []))
  }, [])

  const openNew = () => {
    setEditingId(null); setDescription(''); setAmount(''); setType('expense'); setTarget('transaction')
    setCategory(categories[0]?.id ?? ''); setCard(cardsList[0]?.name ?? ''); setOwner('personal'); setDay(1)
    setShowForm(true)
  }

  const openEdit = (t: Template) => {
    setEditingId(t.id); setDescription(t.description); setAmount(String(t.amount)); setType(t.type); setTarget(t.target)
    setCategory(t.category ?? categories[0]?.id ?? ''); setCard(t.card ?? cardsList[0]?.name ?? ''); setOwner(t.owner as Owner); setDay(t.day)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      description, amount: +amount, type, target,
      category: target === 'transaction' ? category : null,
      card: target === 'credit_card' ? card : null,
      owner, day,
    }

    if (editingId) {
      const { error } = await supabase.from('recurring_templates').update(payload as never).eq('id', editingId)
      if (error) return showError(error)
      setTemplates(prev => prev.map(t => t.id === editingId ? { ...t, ...payload } : t))
      toast('Template atualizado')
    } else {
      const { data, error } = await supabase.from('recurring_templates').insert({ ...payload, active: true } as never).select().single()
      if (error) return showError(error)
      if (data) setTemplates(prev => [...prev, data as Template])
      toast('Template criado')
    }
    setShowForm(false)
  }

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from('recurring_templates').update({ active: !active } as never).eq('id', id)
    if (error) return showError(error)
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !active } : t))
  }

  const handleDelete = async (id: string) => {
    if (!await confirm('Tem certeza que deseja excluir este template?')) return
    const { error } = await supabase.from('recurring_templates').delete().eq('id', id)
    if (error) return showError(error)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  const handleGenerate = async () => {
    setGenerating(true)
    const { error } = await supabase.rpc('generate_recurring' as never, { target_month: `${genMonth}-01` } as never)
    setGenerating(false)
    if (error) return showError(error)
    toast(`Lançamentos de ${genMonth} gerados!`)
  }

  const catLabel = (id: string | null) => categories.find(c => c.id === id)?.label ?? '-'

  return (
    <div>
      <div className="page-header">
        <h2>🔄 Lançamentos Recorrentes</h2>
        <div className="page-actions">
          <input type="month" value={genMonth} onChange={e => setGenMonth(e.target.value)} className="input-month" />
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? 'Gerando...' : '⚡ Gerar'}
          </Button>
          <Button onClick={openNew}>+ Novo</Button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>{editingId ? 'Editar Template' : 'Novo Template Recorrente'}</h2>

            <label className="form-label">Descrição
              <input type="text" placeholder="Ex: Aluguel" value={description} onChange={e => setDescription(e.target.value)} required />
            </label>

            <label className="form-label">Valor (R$)
              <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
            </label>

            <label className="form-label">Dia do vencimento
              <input type="number" min={1} max={31} value={day} onChange={e => setDay(+e.target.value)} required />
            </label>

            <label className="form-label">Forma de pagamento</label>
            <div className="form-tabs">
              <Button variant="tab" active={target === 'transaction'} onClick={() => setTarget('transaction')}>Boleto/Pix</Button>
              <Button variant="tab" active={target === 'credit_card'} onClick={() => setTarget('credit_card')}>Cartão</Button>
            </div>

            {target === 'transaction' && (
              <>
                <label className="form-label">Tipo</label>
                <div className="form-tabs">
                  <Button variant="tab" active={type === 'expense'} onClick={() => setType('expense')}>Despesa</Button>
                  <Button variant="tab" active={type === 'income'} onClick={() => setType('income')}>Receita</Button>
                </div>
                <label className="form-label">Categoria
                  <Select value={category} onChange={setCategory} options={categories.map(c => ({ value: c.id, label: c.label }))} />
                </label>
              </>
            )}

            {target === 'credit_card' && (
              <label className="form-label">Cartão
                <Select value={card} onChange={v => setCard(v as Card)} options={cardsList.map(c => ({ value: c.name, label: c.label }))} />
              </label>
            )}

            <label className="form-label">Responsável
              <Select value={owner} onChange={v => setOwner(v as Owner)} options={[{ value: 'personal', label: 'Pessoal' }, { value: 'mother_in_law', label: 'Sogra' }]} />
            </label>

            <div className="form-actions">
              <Button variant="tab" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      )}

      <section>
        <table className="desktop-table">
          <thead>
            <tr><th>Dia</th><th>Descrição</th><th>Valor</th><th>Destino</th><th>Categoria/Cartão</th><th>Resp.</th><th>Ativo</th><th></th></tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} className={!t.active ? 'row-paid' : ''}>
                <td>{t.day}</td>
                <td>{t.description}</td>
                <td>{fmt(+t.amount)}</td>
                <td>{t.target === 'credit_card' ? '💳 Cartão' : t.type === 'income' ? '📈 Receita' : '📉 Despesa'}</td>
                <td>{t.target === 'credit_card' ? cardsList.find(c => c.name === t.card)?.label ?? t.card : catLabel(t.category)}</td>
                <td><span className={`badge ${t.owner === 'personal' ? 'badge-personal' : 'badge-sogra'}`}>{t.owner === 'personal' ? 'Pessoal' : 'Sogra'}</span></td>
                <td><button className={`paid-btn ${t.active ? 'paid' : ''}`} onClick={() => toggleActive(t.id, t.active)}>{t.active ? '✓' : '○'}</button></td>
                <td>
                  <Button variant="icon" onClick={() => openEdit(t)}>✏️</Button>
                  <Button variant="icon" className="delete-btn" onClick={() => handleDelete(t.id)}>🗑️</Button>
                </td>
              </tr>
            ))}
            {!templates.length && <tr><td colSpan={8} className="empty">Nenhum template cadastrado</td></tr>}
          </tbody>
        </table>

        <div className="mobile-cards">
          {templates.length ? templates.map(t => (
            <MobileCard
              key={t.id}
              className={!t.active ? 'row-paid' : ''}
              status={<button className={`paid-btn ${t.active ? 'paid' : ''}`} onClick={(e) => { e.stopPropagation(); toggleActive(t.id, t.active) }}>{t.active ? '✓' : '○'}</button>}
              title={t.description}
              value={fmt(+t.amount)}
              subtitle={<>Dia {t.day} · {t.target === 'credit_card' ? `💳 ${cardsList.find(c => c.name === t.card)?.label ?? t.card}` : catLabel(t.category)} · {t.owner === 'personal' ? 'Pessoal' : 'Sogra'}</>}
              onTap={() => openEdit(t)}
            />
          )) : <p className="empty">Nenhum template cadastrado</p>}
        </div>
      </section>
    </div>
  )
}
