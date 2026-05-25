import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Button from '../ui/Button'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<CardInfo>>({})
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [limit, setLimit] = useState('')
  const [closingDay, setClosingDay] = useState(1)
  const [dueDay, setDueDay] = useState(10)
  const [color, setColor] = useState('#667eea')

  useEffect(() => {
    supabase.from('cards').select('*').order('label').then(({ data }) => setCards((data ?? []) as CardInfo[]))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data } = await supabase.from('cards').insert({
      name: name.toLowerCase().replace(/\s+/g, '_'), label,
      credit_limit: +limit, closing_day: closingDay, due_day: dueDay, color, active: true
    } as never).select().single()
    if (data) setCards(prev => [...prev, data as CardInfo])
    setShowForm(false)
    setName(''); setLabel(''); setLimit(''); setClosingDay(1); setDueDay(10)
  }

  const startEdit = (c: CardInfo) => {
    setEditing(c.id)
    setEditData({ label: c.label, credit_limit: c.credit_limit, closing_day: c.closing_day, due_day: c.due_day, color: c.color })
  }

  const saveEdit = async (id: string) => {
    await supabase.from('cards').update(editData as never).eq('id', id)
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...editData } : c))
    setEditing(null)
  }

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('cards').update({ active: !active } as never).eq('id', id)
    setCards(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c))
  }

  const handleDelete = async (id: string) => {
    await supabase.from('cards').delete().eq('id', id)
    setCards(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div>
      <div className="page-header">
        <h2>💳 Cartões</h2>
        <Button onClick={() => setShowForm(!showForm)}>+ Novo</Button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleAdd}>
            <h2>Novo Cartão</h2>
            <label className="form-label">Nome (identificador)
              <input type="text" placeholder="ex: nubank" value={name} onChange={e => setName(e.target.value)} required />
            </label>
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
        <table>
          <thead><tr><th></th><th>Cartão</th><th>Limite</th><th>Fechamento</th><th>Vencimento</th><th>Ativo</th><th></th></tr></thead>
          <tbody>
            {cards.map(c => (
              <tr key={c.id} className={!c.active ? 'row-paid' : ''}>
                {editing === c.id ? (
                  <>
                    <td><input type="color" value={editData.color ?? ''} onChange={e => setEditData(d => ({ ...d, color: e.target.value }))} style={{ width: 30, height: 30, border: 'none', background: 'none' }} /></td>
                    <td><input className="inline-input" value={editData.label ?? ''} onChange={e => setEditData(d => ({ ...d, label: e.target.value }))} /></td>
                    <td><input className="inline-input" type="number" step="0.01" value={editData.credit_limit ?? ''} onChange={e => setEditData(d => ({ ...d, credit_limit: +e.target.value }))} style={{ width: '100px' }} /></td>
                    <td><input className="inline-input" type="number" min={1} max={31} value={editData.closing_day ?? ''} onChange={e => setEditData(d => ({ ...d, closing_day: +e.target.value }))} style={{ width: '60px' }} /></td>
                    <td><input className="inline-input" type="number" min={1} max={31} value={editData.due_day ?? ''} onChange={e => setEditData(d => ({ ...d, due_day: +e.target.value }))} style={{ width: '60px' }} /></td>
                    <td><button className={`paid-btn ${c.active ? 'paid' : ''}`} onClick={() => toggleActive(c.id, c.active)}>{c.active ? '✓' : '○'}</button></td>
                    <td><Button onClick={() => saveEdit(c.id)}>✓</Button></td>
                  </>
                ) : (
                  <>
                    <td><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: c.color }} /></td>
                    <td>{c.label}</td>
                    <td>{fmt(c.credit_limit)}</td>
                    <td>Dia {c.closing_day}</td>
                    <td>Dia {c.due_day}</td>
                    <td><button className={`paid-btn ${c.active ? 'paid' : ''}`} onClick={() => toggleActive(c.id, c.active)}>{c.active ? '✓' : '○'}</button></td>
                    <td>
                      <Button variant="icon" onClick={() => startEdit(c)}>✏️</Button>
                      <Button variant="icon" className="delete-btn" onClick={() => handleDelete(c.id)}>🗑️</Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {!cards.length && <tr><td colSpan={7} className="empty">Nenhum cartão cadastrado</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  )
}
