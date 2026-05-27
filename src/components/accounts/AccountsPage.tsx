import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Account } from '../../types/database'
import { showError, toast } from '../../lib/toast'
import { confirm } from '../../lib/confirm'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { Pencil, Trash2 } from 'lucide-react'

export default function AccountsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts-admin'],
    queryFn: async () => (await supabase.from('accounts').select('*').order('name')).data ?? [],
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from('accounts').update({ name, color }).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('accounts').insert({ name, color })
        if (error) throw error
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accounts-admin'] }); queryClient.invalidateQueries({ queryKey: ['accounts'] }); setShowForm(false); toast(editingId ? 'Conta atualizada' : 'Conta criada') },
    onError: (e) => showError(e),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('accounts').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accounts-admin'] }); queryClient.invalidateQueries({ queryKey: ['accounts'] }); toast('Conta excluída') },
    onError: (e) => showError(e),
  })

  const openNew = () => { setEditingId(null); setName(''); setColor('#6366f1'); setShowForm(true) }
  const openEdit = (a: Account) => { setEditingId(a.id); setName(a.name); setColor(a.color); setShowForm(true) }
  const handleDelete = async (id: string) => { if (await confirm('Excluir esta conta e todos os dados associados?')) deleteMutation.mutate(id) }

  return (
    <div>
      <div className="page-header">
        <h2>Contas</h2>
        <Button onClick={openNew}>+ Nova</Button>
      </div>

      <section>
        <table className="desktop-table">
          <thead><tr><th>Cor</th><th>Nome</th><th></th></tr></thead>
          <tbody>
            {accounts.map(a => (
              <tr key={a.id}>
                <td><span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', background: a.color }} /></td>
                <td>{a.name}</td>
                <td>
                  <Button variant="icon" aria-label="Editar" onClick={() => openEdit(a)}><Pencil size={14} /></Button>
                  <Button variant="icon" className="delete-btn" aria-label="Excluir" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></Button>
                </td>
              </tr>
            ))}
            {!accounts.length && <tr><td colSpan={3} className="empty">Nenhuma conta</td></tr>}
          </tbody>
        </table>
      </section>

      {showForm && (
        <Modal title={editingId ? 'Editar Conta' : 'Nova Conta'} onClose={() => setShowForm(false)} onSubmit={e => { e.preventDefault(); saveMutation.mutate() }}>
          <label className="form-label">Nome
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Pessoal, Empresa..." />
          </label>
          <label className="form-label">Cor
            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 48, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 6 }} />
          </label>
        </Modal>
      )}
    </div>
  )
}
