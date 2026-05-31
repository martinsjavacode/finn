import { Pencil, Trash2, Plus } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks'
import { useIsMobile } from '../../hooks/useMediaQuery'
import type { Investment, InvestmentTransaction, InvestmentType, InvestmentTxType } from '../../types/database'
import { fetchInvestments, fetchInvestmentTransactions, updateInvestment, deleteInvestment, addInvestmentTransaction } from '../../services/investments'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import { fmt } from '../../utils/format'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Modal from '../ui/Modal'
import MobileCard from '../ui/MobileCard'
import Badge from '../ui/Badge'
import { TableSkeleton } from '../ui/Skeleton'

const TYPE_LABELS: Record<InvestmentType, string> = { renda_fixa: 'Renda Fixa', renda_variavel: 'Renda Variável', crypto: 'Crypto', fundo: 'Fundo', fii: 'FIIs', fiagro: 'FIAgro', etf: 'ETFs', fundo_multi: 'Fundo Multimercado', fundo_acoes: 'Fundo de Ações' }
const TX_LABELS: Record<InvestmentTxType, string> = { aporte: 'Aporte', resgate: 'Resgate', rendimento: 'Rendimento', dividendo: 'Dividendo' }

export default function InvestmentsPage() {
  const { can, activeAccountId } = useAuth()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const canCreate = can('investments', 'create')
  const canUpdate = can('investments', 'update')
  const canDelete = can('investments', 'delete')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showTx, setShowTx] = useState<Investment | null>(null)
  const [showTxForm, setShowTxForm] = useState<Investment | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState<InvestmentType>('renda_fixa')
  const [broker, setBroker] = useState('')
  const [maturity, setMaturity] = useState('')

  // Tx form state
  const [txType, setTxType] = useState<InvestmentTxType>('aporte')
  const [txAmount, setTxAmount] = useState('')
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [txNote, setTxNote] = useState('')

  const { data: investments = [], isLoading } = useQuery<Investment[]>({
    queryKey: ['investments', activeAccountId],
    queryFn: async () => (await fetchInvestments(activeAccountId!)).data,
    enabled: !!activeAccountId,
  })

  const { data: transactions = [] } = useQuery<InvestmentTransaction[]>({
    queryKey: ['investment-tx', showTx?.id],
    queryFn: async () => (await fetchInvestmentTransactions(showTx!.id)).data,
    enabled: !!showTx,
  })

  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ['investments'] }); queryClient.invalidateQueries({ queryKey: ['investment-tx'] }) }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name, type, broker: broker || null, maturity_date: maturity || null, active: true, account_id: activeAccountId! }
      if (editingId) {
        const { error } = await updateInvestment(editingId, payload); if (error) throw error
      } else {
        const { error } = await supabase.from('investments').insert({ ...payload, current_balance: 0, invested_total: 0 })
        if (error) throw error
      }
    },
    onSuccess: () => { invalidate(); setShowForm(false); toast(editingId ? 'Investimento atualizado' : 'Investimento criado') },
    onError: (e) => showError(e),
  })

  const txMutation = useMutation({
    mutationFn: async () => {
      const { error } = await addInvestmentTransaction(showTxForm!, txType, +txAmount, txDate, txNote)
      if (error) throw error
    },
    onSuccess: () => { invalidate(); setShowTxForm(null); toast('Movimentação registrada') },
    onError: (e) => showError(e),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await deleteInvestment(id); if (error) throw error },
    onSuccess: () => { invalidate(); toast('Investimento excluído') },
    onError: (e) => showError(e),
  })

  const openNew = () => { setEditingId(null); setName(''); setType('renda_fixa'); setBroker(''); setMaturity(''); setShowForm(true) }
  const openEdit = (inv: Investment) => { setEditingId(inv.id); setName(inv.name); setType(inv.type); setBroker(inv.broker ?? ''); setMaturity(inv.maturity_date ?? ''); setShowForm(true) }
  const openTxForm = (inv: Investment) => { setShowTxForm(inv); setTxType('aporte'); setTxAmount(''); setTxDate(new Date().toISOString().slice(0, 10)); setTxNote('') }
  const handleDelete = async (id: string) => { if (await confirm('Excluir investimento e todas as movimentações?')) deleteMutation.mutate(id) }

  // Summary
  const active = investments.filter(i => i.active)
  const totalBalance = active.reduce((s, i) => s + +i.current_balance, 0)
  const totalInvested = active.reduce((s, i) => s + +i.invested_total, 0)
  const totalReturn = totalBalance - totalInvested
  const returnPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

  // Distribution by type
  const byType = active.reduce((acc, inv) => { acc[inv.type] = (acc[inv.type] ?? 0) + +inv.current_balance; return acc }, {} as Record<string, number>)

  if (isLoading) return <div><div className="page-header"><h2>Investimentos</h2></div><TableSkeleton rows={5} cols={6} /></div>

  return (
    <div>
      <div className="page-header">
        <h2>Investimentos <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>({active.length})</span></h2>
        {canCreate && <Button onClick={openNew}>+ Novo</Button>}
      </div>

      {/* Summary Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card"><h3>Saldo Atual</h3><p className="card-value">{fmt(totalBalance)}</p></div>
        <div className="card"><h3>Total Investido</h3><p className="card-value">{fmt(totalInvested)}</p></div>
        <div className="card"><h3>Rendimento</h3><p className="card-value" style={{ color: totalReturn >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(totalReturn)} ({returnPct.toFixed(1)}%)</p></div>
      </div>

      {/* Distribution Chart */}
      {active.length > 0 && totalBalance > 0 && (
        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Distribuição por Tipo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(byType).map(([t, val]) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ minWidth: 110, fontSize: '0.85rem' }}>{TYPE_LABELS[t as InvestmentType]}</span>
                <div style={{ flex: 1, height: 20, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(val / totalBalance) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 4 }} />
                </div>
                <span style={{ minWidth: 90, textAlign: 'right', fontSize: '0.85rem' }}>{fmt(val)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Table */}
      {!isMobile && <table className="desktop-table">
        <thead><tr><th>Nome</th><th>Tipo</th><th>Corretora</th><th>Investido</th><th>Saldo</th><th>Rend.</th><th>Status</th>{(canUpdate || canDelete || canCreate) && <th></th>}</tr></thead>
        <tbody>
          {investments.length ? investments.map(inv => {
            const ret = +inv.current_balance - +inv.invested_total
            return (
              <tr key={inv.id} style={!inv.active ? { opacity: 0.5 } : undefined}>
                <td><button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }} onClick={() => setShowTx(inv)}>{inv.name}</button></td>
                <td>{TYPE_LABELS[inv.type]}</td>
                <td>{inv.broker ?? '-'}</td>
                <td>{fmt(+inv.invested_total)}</td>
                <td>{fmt(+inv.current_balance)}</td>
                <td style={{ color: ret >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(ret)}</td>
                <td><Badge variant={inv.active ? 'success' : 'danger'}>{inv.active ? 'Ativo' : 'Encerrado'}</Badge></td>
                {(canUpdate || canDelete || canCreate) && (
                  <td>
                    {canCreate && inv.active && <Button variant="icon" aria-label="Nova movimentação" onClick={() => openTxForm(inv)}><Plus size={14} /></Button>}
                    {canUpdate && <Button variant="icon" aria-label="Editar" onClick={() => openEdit(inv)}><Pencil size={14} /></Button>}
                    {canDelete && <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(inv.id)}><Trash2 size={14} /></Button>}
                  </td>
                )}
              </tr>
            )
          }) : <tr><td colSpan={8} className="empty">Nenhum investimento cadastrado</td></tr>}
        </tbody>
      </table>}

      {isMobile && <div className="mobile-cards">
        {investments.length ? investments.map(inv => {
          const ret = +inv.current_balance - +inv.invested_total
          return (
            <MobileCard
              key={inv.id}
              title={inv.name}
              value={fmt(+inv.current_balance)}
              subtitle={<>{TYPE_LABELS[inv.type]}{inv.broker ? ` · ${inv.broker}` : ''} · <span style={{ color: ret >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(ret)}</span></>}
              status={<Badge variant={inv.active ? 'success' : 'danger'}>{inv.active ? 'Ativo' : 'Encerrado'}</Badge>}
              onTap={() => setShowTx(inv)}
              style={!inv.active ? { opacity: 0.5 } : undefined}
            />
          )
        }) : <div className="empty-state"><p>Nenhum investimento cadastrado</p>{canCreate && <Button onClick={openNew}>Cadastrar primeiro investimento</Button>}</div>}
      </div>}

      {/* New/Edit Investment Modal */}
      {showForm && (
        <Modal title={editingId ? 'Editar Investimento' : 'Novo Investimento'} onClose={() => setShowForm(false)} onSubmit={e => { e.preventDefault(); saveMutation.mutate() }}>
          <label className="form-label">Nome<input type="text" placeholder="Ex: Tesouro IPCA+ 2029" value={name} onChange={e => setName(e.target.value)} required /></label>
          <label className="form-label">Tipo<Select value={type} onChange={v => setType(v as InvestmentType)} options={Object.entries(TYPE_LABELS).filter(([v]) => v !== 'fundo').map(([v, l]) => ({ value: v, label: l }))} /></label>
          <label className="form-label">Corretora<input type="text" placeholder="Ex: NuInvest" value={broker} onChange={e => setBroker(e.target.value)} /></label>
          <label className="form-label">Vencimento<input type="date" value={maturity} onChange={e => setMaturity(e.target.value)} /></label>
        </Modal>
      )}

      {/* Transaction Form Modal */}
      {showTxForm && (
        <Modal title={`Movimentação: ${showTxForm.name}`} onClose={() => setShowTxForm(null)} onSubmit={e => { e.preventDefault(); txMutation.mutate() }}>
          <label className="form-label">Tipo</label>
          <div className="form-tabs">
            {(Object.entries(TX_LABELS) as [InvestmentTxType, string][]).map(([v, l]) => (
              <Button key={v} variant="tab" active={txType === v} onClick={() => setTxType(v)}>{l}</Button>
            ))}
          </div>
          {(txType === 'aporte' || txType === 'resgate') && <p className="form-hint">{txType === 'aporte' ? 'Gera lançamento de despesa automaticamente.' : 'Gera lançamento de receita automaticamente.'}</p>}
          <label className="form-label">Valor (R$)<input type="number" step="0.01" placeholder="0.00" value={txAmount} onChange={e => setTxAmount(e.target.value)} required /></label>
          <label className="form-label">Data<input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} required /></label>
          <label className="form-label">Observação<input type="text" placeholder="Opcional" value={txNote} onChange={e => setTxNote(e.target.value)} /></label>
        </Modal>
      )}

      {/* Transaction History Modal */}
      {showTx && (
        <Modal title={`Histórico: ${showTx.name}`} onClose={() => setShowTx(null)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span>Investido: <strong>{fmt(+showTx.invested_total)}</strong></span>
            <span>Saldo: <strong>{fmt(+showTx.current_balance)}</strong></span>
          </div>
          {canCreate && showTx.active && <Button onClick={() => { setShowTx(null); openTxForm(showTx) }} style={{ marginBottom: '1rem' }}>+ Nova Movimentação</Button>}
          {transactions.length ? (
            <table className="desktop-table" style={{ fontSize: '0.85rem' }}>
              <thead><tr><th>Data</th><th>Tipo</th><th>Valor</th><th>Nota</th></tr></thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                    <td><Badge variant={tx.type === 'aporte' ? 'info' : tx.type === 'resgate' ? 'warning' : 'success'}>{TX_LABELS[tx.type]}</Badge></td>
                    <td>{fmt(+tx.amount)}</td>
                    <td>{tx.note ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="empty">Nenhuma movimentação registrada</p>}
        </Modal>
      )}
    </div>
  )
}
