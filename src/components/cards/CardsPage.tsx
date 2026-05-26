import { Pencil, Trash2, Check, Circle } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import { fmt, getEffectiveClosingDay } from '../../utils/format'
import type { ClosingRule } from '../../types/database'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import MobileCard from '../ui/MobileCard'
import Badge from '../ui/Badge'
import { TableSkeleton } from '../ui/Skeleton'

interface CardInfo { id: string; name: string; label: string; credit_limit: number; closing_day: number; due_day: number; closing_rule: ClosingRule; days_before_due: number; color: string; active: boolean }

export default function CardsPage() {
  const { can } = useAuth()
  const queryClient = useQueryClient()
  const canCreate = can('cards', 'create')
  const canUpdate = can('cards', 'update')
  const canDelete = can('cards', 'delete')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [limit, setLimit] = useState('')
  const [closingDay, setClosingDay] = useState(1)
  const [dueDay, setDueDay] = useState(10)
  const [color, setColor] = useState('#667eea')
  const [ruleType, setRuleType] = useState<'fixed' | 'relative'>('fixed')
  const [daysBeforeDue, setDaysBeforeDue] = useState(7)

  const { data: cards = [], isLoading } = useQuery<CardInfo[]>({
    queryKey: ['cards-page'],
    queryFn: async () => (await supabase.from('cards').select('*').order('label')).data as CardInfo[] ?? [],
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cards-page'] })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from('cards').update({ label, credit_limit: +limit, closing_day: closingDay, due_day: dueDay, color, closing_rule: ruleType, days_before_due: daysBeforeDue }).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('cards').insert({ name: name.toLowerCase().replace(/\s+/g, '_'), label, credit_limit: +limit, closing_day: closingDay, due_day: dueDay, color, active: true, closing_rule: ruleType, days_before_due: daysBeforeDue })
        if (error) throw error
      }
    },
    onSuccess: () => { invalidate(); setShowForm(false); toast(editingId ? 'Cartão atualizado' : 'Cartão criado') },
    onError: (e) => showError(e),
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => { const { error } = await supabase.from('cards').update({ active: !active }).eq('id', id); if (error) throw error },
    onSuccess: () => invalidate(),
    onError: (e) => showError(e),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('cards').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { invalidate(); toast('Cartão excluído') },
    onError: (e) => showError(e),
  })

  const openNew = () => { setEditingId(null); setName(''); setLabel(''); setLimit(''); setClosingDay(1); setDueDay(10); setColor('#667eea'); setRuleType('fixed'); setDaysBeforeDue(7); setShowForm(true) }
  const openEdit = (c: CardInfo) => { setEditingId(c.id); setName(c.name); setLabel(c.label); setLimit(String(c.credit_limit)); setClosingDay(c.closing_day); setDueDay(c.due_day); setColor(c.color); setRuleType(c.closing_rule); setDaysBeforeDue(c.days_before_due); setShowForm(true) }
  const handleDelete = async (id: string) => { if (await confirm('Tem certeza que deseja excluir este cartão?')) deleteMutation.mutate(id) }

  if (isLoading) return <div><div className="page-header"><h2>Cartões</h2></div><TableSkeleton rows={4} cols={6} /></div>

  return (
    <div>
      <div className="page-header">
        <h2>Cartões</h2>
        {canCreate && <Button onClick={openNew}>+ Novo</Button>}
      </div>

      {showForm && (
        <Modal title={editingId ? 'Editar Cartão' : 'Novo Cartão'} onClose={() => setShowForm(false)} onSubmit={e => { e.preventDefault(); saveMutation.mutate() }}>
          {!editingId && <label className="form-label">Nome (identificador)<input type="text" placeholder="ex: nubank" value={name} onChange={e => setName(e.target.value)} required /></label>}
          <label className="form-label">Label (exibição)<input type="text" placeholder="ex: Nubank" value={label} onChange={e => setLabel(e.target.value)} required /></label>
          <label className="form-label">Limite de crédito (R$)<input type="number" step="0.01" placeholder="0.00" value={limit} onChange={e => setLimit(e.target.value)} required /></label>
          <label className="form-label">Regra de fechamento
            <select value={ruleType} onChange={e => setRuleType(e.target.value as 'fixed' | 'relative')}><option value="fixed">Data fixa</option><option value="relative">Relativo ao vencimento</option></select>
          </label>
          {ruleType === 'fixed'
            ? <label className="form-label">Dia de fechamento<input type="number" min={1} max={31} value={closingDay} onChange={e => setClosingDay(+e.target.value)} required /></label>
            : <label className="form-label">Dias antes do vencimento<input type="number" min={1} max={28} value={daysBeforeDue} onChange={e => setDaysBeforeDue(+e.target.value)} required /></label>
          }
          <label className="form-label">Dia de vencimento<input type="number" min={1} max={31} value={dueDay} onChange={e => setDueDay(+e.target.value)} required /></label>
          {ruleType === 'relative' && <div className="form-preview"><span>Fechamento efetivo:</span><strong>Dia {getEffectiveClosingDay({ closing_day: closingDay, due_day: dueDay, closing_rule: 'relative', days_before_due: daysBeforeDue })}</strong></div>}
          <label className="form-label">Cor<input type="color" value={color} onChange={e => setColor(e.target.value)} /></label>
        </Modal>
      )}

      <section>
        <table className="desktop-table">
          <thead><tr><th></th><th>Cartão</th><th>Limite</th><th>Fechamento</th><th>Vencimento</th><th>Ativo</th>{(canUpdate || canDelete) && <th></th>}</tr></thead>
          <tbody>
            {cards.map(c => (
              <tr key={c.id} className={!c.active ? 'row-paid' : ''}>
                <td><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: c.color }} /></td>
                <td>{c.label}</td>
                <td>{fmt(c.credit_limit)}</td>
                <td>Dia {getEffectiveClosingDay(c)}</td>
                <td>Dia {c.due_day}</td>
                <td>{canUpdate ? <button className={`paid-btn ${c.active ? 'paid' : ''}`} aria-label={c.active ? 'Desativar' : 'Ativar'} onClick={() => toggleMutation.mutate({ id: c.id, active: c.active })}>{c.active ? <Check size={14} /> : <Circle size={14} />}</button> : <Badge variant={c.active ? 'success' : 'danger'}>{c.active ? 'Ativo' : 'Inativo'}</Badge>}</td>
                {(canUpdate || canDelete) && (
                  <td>
                    {canUpdate && <Button variant="icon" aria-label="Editar" onClick={() => openEdit(c)}><Pencil size={14} /></Button>}
                    {canDelete && <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></Button>}
                  </td>
                )}
              </tr>
            ))}
            {!cards.length && <tr><td colSpan={(canUpdate || canDelete) ? 7 : 6} className="empty">Nenhum cartão cadastrado</td></tr>}
          </tbody>
        </table>
        <div className="mobile-cards">
          {cards.length ? cards.map(c => (
            <MobileCard key={c.id} className={!c.active ? 'row-paid' : ''} status={canUpdate ? <button className={`paid-btn ${c.active ? 'paid' : ''}`} aria-label={c.active ? 'Desativar' : 'Ativar'} onClick={e => { e.stopPropagation(); toggleMutation.mutate({ id: c.id, active: c.active }) }}>{c.active ? <Check size={14} /> : <Circle size={14} />}</button> : <Badge variant={c.active ? 'success' : 'danger'}>{c.active ? 'Ativo' : 'Inativo'}</Badge>} title={<><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c.color, marginRight: 6 }} />{c.label}</>} value={fmt(c.credit_limit)} subtitle={<>Fecha dia {getEffectiveClosingDay(c)} · Vence dia {c.due_day}</>} onTap={canUpdate ? () => openEdit(c) : undefined} />
          )) : <p className="empty">Nenhum cartão cadastrado</p>}
        </div>
      </section>
    </div>
  )
}
