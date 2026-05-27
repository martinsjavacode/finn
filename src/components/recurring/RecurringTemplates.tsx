import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth, useAppData } from '../../hooks'
import { useIsMobile } from '../../hooks/useMediaQuery'
import type { Card } from '../../types/database'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import MobileCard from '../ui/MobileCard'
import Badge from '../ui/Badge'
import { TableSkeleton } from '../ui/Skeleton'
import { fmt, categoryOptions } from '../../utils/format'

interface Template { id: string; description: string; amount: number; type: string; target: 'pix' | 'credit_card'; category: string | null; card: string | null; account_id: string; day: number; active: boolean }

export default function RecurringPage() {
  const { can, activeAccountId } = useAuth()
  const { categories, cardsList } = useAppData(true)
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const canCreate = can('recurring_templates', 'create')
  const canUpdate = can('recurring_templates', 'update')
  const canDelete = can('recurring_templates', 'delete')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genMonth, setGenMonth] = useState(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}` })

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [target, setTarget] = useState<'pix' | 'credit_card'>('pix')
  const [category, setCategory] = useState(categories[0]?.id ?? '')
  const [card, setCard] = useState<Card>(cardsList[0]?.name ?? '')
  const [day, setDay] = useState(1)

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['recurring-templates', activeAccountId],
    queryFn: async () => {
      const { data } = await supabase.from('recurring_templates').select('*').eq('account_id', activeAccountId!).order('day').order('description')
      return data ?? []
    },
    enabled: !!activeAccountId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['recurring-templates'] })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { description, amount: +amount, type, target, category: target === 'pix' ? category : null, card: target === 'credit_card' ? card : null, account_id: activeAccountId!, day }
      if (editingId) {
        const { error } = await supabase.from('recurring_templates').update(payload).eq('id', editingId); if (error) throw error
      } else {
        const { error } = await supabase.from('recurring_templates').insert({ ...payload, active: true }); if (error) throw error
      }
    },
    onSuccess: () => { invalidate(); setShowForm(false); toast(editingId ? 'Template atualizado' : 'Template criado') },
    onError: (e) => showError(e),
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => { const { error } = await supabase.from('recurring_templates').update({ active: !active }).eq('id', id); if (error) throw error },
    onSuccess: () => invalidate(),
    onError: (e) => showError(e),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('recurring_templates').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { invalidate(); toast('Template excluído') },
    onError: (e) => showError(e),
  })

  const openNew = () => {
    setEditingId(null); setDescription(''); setAmount(''); setType('expense'); setTarget('pix')
    setCategory(categories[0]?.id ?? ''); setCard(cardsList[0]?.name ?? ''); setDay(1)
    setShowForm(true)
  }

  const openEdit = (t: Template) => {
    setEditingId(t.id); setDescription(t.description); setAmount(String(t.amount)); setType(t.type); setTarget(t.target)
    setCategory(t.category ?? categories[0]?.id ?? ''); setCard(t.card ?? cardsList[0]?.name ?? ''); setDay(t.day)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => { if (await confirm('Tem certeza que deseja excluir este template?')) deleteMutation.mutate(id) }

  const handleGenerate = async () => {
    if (!activeAccountId) return
    setGenerating(true)
    const { error } = await supabase.rpc('generate_recurring', { target_month: `${genMonth}-01`, p_account_id: activeAccountId })
    setGenerating(false)
    if (error) return showError(error)
    toast(`Lançamentos de ${genMonth} gerados!`)
  }

  const catLabel = (id: string | null) => categories.find(c => c.id === id)?.label ?? '-'
  const totalActive = templates.filter(t => t.active && t.type === 'expense').reduce((s, t) => s + +t.amount, 0)

  if (isLoading) return <div><div className="page-header"><h2>Lançamentos Recorrentes</h2></div><TableSkeleton rows={5} cols={8} /></div>

  return (
    <div>
      <div className="page-header">
        <h2>Lançamentos Recorrentes <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>({templates.length})</span></h2>
        <div className="page-actions">
          <input type="month" value={genMonth} onChange={e => setGenMonth(e.target.value)} className="input-month" />
          <Button onClick={handleGenerate} disabled={generating}>{generating ? 'Gerando...' : '⚡ Gerar'}</Button>
          {canCreate && <Button onClick={openNew}>+ Novo</Button>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2>Total Mensal Recorrente</h2>
        <p className="card-value">{fmt(totalActive)}</p>
      </div>

      {showForm && (
        <Modal title={editingId ? 'Editar Template' : 'Novo Template Recorrente'} onClose={() => setShowForm(false)} onSubmit={e => { e.preventDefault(); saveMutation.mutate() }}>
          <label className="form-label">Descrição<input type="text" placeholder="Ex: Aluguel" value={description} onChange={e => setDescription(e.target.value)} required /></label>
          <label className="form-label">Valor (R$)<input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required /></label>
          <label className="form-label">Dia do vencimento<input type="number" min={1} max={31} value={day} onChange={e => setDay(+e.target.value)} required /></label>
          <label className="form-label">Forma de pagamento</label>
          <div className="form-tabs">
            <Button variant="tab" active={target === 'pix'} onClick={() => setTarget('pix')}>Pix</Button>
            <Button variant="tab" active={target === 'credit_card'} onClick={() => setTarget('credit_card')}>Cartão</Button>
          </div>
          {target === 'pix' && (<>
            <label className="form-label">Tipo</label>
            <div className="form-tabs">
              <Button variant="tab" active={type === 'expense'} onClick={() => setType('expense')}>Despesa</Button>
              <Button variant="tab" active={type === 'income'} onClick={() => setType('income')}>Receita</Button>
            </div>
            <label className="form-label">Categoria<Select value={category} onChange={setCategory} options={categoryOptions(categories)} /></label>
          </>)}
          {target === 'credit_card' && <label className="form-label">Cartão<Select value={card} onChange={v => setCard(v as Card)} options={cardsList.map(c => ({ value: c.name, label: c.label }))} /></label>}
        </Modal>
      )}

      <section>
        {!isMobile && <table className="desktop-table">
          <thead><tr><th>Dia</th><th>Descrição</th><th>Valor</th><th>Destino</th><th>Categoria/Cartão</th><th>Ativo</th>{(canUpdate || canDelete) && <th></th>}</tr></thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} style={!t.active ? { opacity: 0.5 } : undefined}>
                <td>{t.day}</td>
                <td>{t.description}</td>
                <td>{fmt(+t.amount)}</td>
                <td>{t.target === 'credit_card' ? 'Cartão' : t.type === 'income' ? 'Receita' : 'Despesa'}</td>
                <td>{t.target === 'credit_card' ? cardsList.find(c => c.name === t.card)?.label ?? t.card : catLabel(t.category)}</td>
                <td>{canUpdate ? <button className="badge-toggle" role="switch" aria-checked={t.active} onClick={() => toggleMutation.mutate({ id: t.id, active: t.active })}><Badge variant={t.active ? 'success' : 'danger'}>{t.active ? 'Ativo' : 'Inativo'}</Badge></button> : <Badge variant={t.active ? 'success' : 'danger'}>{t.active ? 'Ativo' : 'Inativo'}</Badge>}</td>
                {(canUpdate || canDelete) && (
                  <td>
                    {canUpdate && <Button variant="icon" aria-label="Editar" onClick={() => openEdit(t)}><Pencil size={14} /></Button>}
                    {canDelete && <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(t.id)}><Trash2 size={14} /></Button>}
                  </td>
                )}
              </tr>
            ))}
            {!templates.length && <tr><td colSpan={(canUpdate || canDelete) ? 8 : 7} className="empty">Nenhum template cadastrado</td></tr>}
          </tbody>
        </table>}
        {isMobile && <div className="mobile-cards">
          {templates.length ? templates.map(t => (
            <MobileCard key={t.id} style={!t.active ? { opacity: 0.5 } : undefined} status={canUpdate ? <button className="badge-toggle" role="switch" aria-checked={t.active} onClick={e => { e.stopPropagation(); toggleMutation.mutate({ id: t.id, active: t.active }) }}><Badge variant={t.active ? 'success' : 'danger'}>{t.active ? 'Ativo' : 'Inativo'}</Badge></button> : <Badge variant={t.active ? 'success' : 'danger'}>{t.active ? 'Ativo' : 'Inativo'}</Badge>} title={t.description} value={fmt(+t.amount)} subtitle={<>Dia {t.day} · {t.target === 'credit_card' ? cardsList.find(c => c.name === t.card)?.label ?? t.card : catLabel(t.category)}</>} onTap={canUpdate ? () => openEdit(t) : undefined} />
          )) : <div className="empty-state"><p>Nenhum template cadastrado</p>{canCreate && <Button onClick={openNew}>Cadastrar primeiro template</Button>}</div>}
        </div>}
      </section>
    </div>
  )
}
