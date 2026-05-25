import { Pencil, Trash2, Check, Circle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import { fmt } from '../../utils/format'
import Button from '../ui/Button'
import MobileCard from '../ui/MobileCard'

interface CardInfo {
  id: string
  name: string
  label: string
  credit_limit: number
  closing_day: number
  due_day: number
  color: string
  active: boolean
}

export default function CardsPage() {
  const [cards, setCards] = useState<CardInfo[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [limit, setLimit] = useState('')
  const [closingDay, setClosingDay] = useState(1)
  const [dueDay, setDueDay] = useState(10)
  const [color, setColor] = useState('#667eea')

  useEffect(() => {
    supabase.from('cards').select('*').order('label').then(({ data }) => setCards((data ?? []) as CardInfo[]))
  }, [])

  const openNew = () => {
    setEditingId(null); setName(''); setLabel(''); setLimit(''); setClosingDay(1); setDueDay(10); setColor('#667eea')
    setShowForm(true)
  }

  const openEdit = (c: CardInfo) => {
    setEditingId(c.id); setName(c.name); setLabel(c.label); setLimit(String(c.credit_limit))
    setClosingDay(c.closing_day); setDueDay(c.due_day); setColor(c.color)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      const update = { label, credit_limit: +limit, closing_day: closingDay, due_day: dueDay, color }
      const { error } = await supabase.from('cards').update(update as never).eq('id', editingId)
      if (error) return showError(error)
      setCards(prev => prev.map(c => c.id === editingId ? { ...c, ...update } : c))
      toast('Cartão atualizado')
    } else {
      const { data, error } = await supabase.from('cards').insert({
        name: name.toLowerCase().replace(/\s+/g, '_'), label,
        credit_limit: +limit, closing_day: closingDay, due_day: dueDay, color, active: true
      } as never).select().single()
      if (error) return showError(error)
      if (data) setCards(prev => [...prev, data as CardInfo])
      toast('Cartão criado')
    }
    setShowForm(false)
  }

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from('cards').update({ active: !active } as never).eq('id', id)
    if (error) return showError(error)
    setCards(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c))
  }

  const handleDelete = async (id: string) => {
    if (!await confirm('Tem certeza que deseja excluir este cartão?')) return
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) return showError(error)
    setCards(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div>
      <div className="page-header">
        <h2>💳 Cartões</h2>
        <Button onClick={openNew}>+ Novo</Button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>{editingId ? 'Editar Cartão' : 'Novo Cartão'}</h2>
            {!editingId && (
              <label className="form-label">Nome (identificador)
                <input type="text" placeholder="ex: nubank" value={name} onChange={e => setName(e.target.value)} required />
              </label>
            )}
            <label className="form-label">Label (exibição)
              <input type="text" placeholder="ex: Nubank" value={label} onChange={e => setLabel(e.target.value)} required />
            </label>
            <label className="form-label">Limite de crédito (R$)
              <input type="number" step="0.01" placeholder="0.00" value={limit} onChange={e => setLimit(e.target.value)} required />
            </label>
            <label className="form-label">Dia de fechamento
              <input type="number" min={1} max={31} value={closingDay} onChange={e => setClosingDay(+e.target.value)} required />
            </label>
            <label className="form-label">Dia de vencimento
              <input type="number" min={1} max={31} value={dueDay} onChange={e => setDueDay(+e.target.value)} required />
            </label>
            <label className="form-label">Cor
              <input type="color" value={color} onChange={e => setColor(e.target.value)} />
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
          <thead><tr><th></th><th>Cartão</th><th>Limite</th><th>Fechamento</th><th>Vencimento</th><th>Ativo</th><th></th></tr></thead>
          <tbody>
            {cards.map(c => (
              <tr key={c.id} className={!c.active ? 'row-paid' : ''}>
                <td><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: c.color }} /></td>
                <td>{c.label}</td>
                <td>{fmt(c.credit_limit)}</td>
                <td>Dia {c.closing_day}</td>
                <td>Dia {c.due_day}</td>
                <td><button className={`paid-btn ${c.active ? 'paid' : ''}`} onClick={() => toggleActive(c.id, c.active)}>{c.active ? <Check size={14} /> : <Circle size={14} />}</button></td>
                <td>
                  <Button variant="icon" onClick={() => openEdit(c)}><Pencil size={14} /></Button>
                  <Button variant="icon" className="delete-btn" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></Button>
                </td>
              </tr>
            ))}
            {!cards.length && <tr><td colSpan={7} className="empty">Nenhum cartão cadastrado</td></tr>}
          </tbody>
        </table>

        <div className="mobile-cards">
          {cards.length ? cards.map(c => (
            <MobileCard
              key={c.id}
              className={!c.active ? 'row-paid' : ''}
              status={<button className={`paid-btn ${c.active ? 'paid' : ''}`} onClick={(e) => { e.stopPropagation(); toggleActive(c.id, c.active) }}>{c.active ? <Check size={14} /> : <Circle size={14} />}</button>}
              title={<><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c.color, marginRight: 6 }} />{c.label}</>}
              value={fmt(c.credit_limit)}
              subtitle={<>Fecha dia {c.closing_day} · Vence dia {c.due_day}</>}
              onTap={() => openEdit(c)}
            />
          )) : <p className="empty">Nenhum cartão cadastrado</p>}
        </div>
      </section>
    </div>
  )
}
