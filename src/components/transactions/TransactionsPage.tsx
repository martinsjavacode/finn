import { useState } from 'react'
import { useAuth, useAppData, useTransactions } from '../../hooks'
import { categoryOptions } from '../../utils/format'
import Select from '../ui/Select'
import SummaryCards from '../dashboard/SummaryCards'
import TransactionsTable from './TransactionsTable'
import CardsTable from './CardsTable'
import AddTransaction from './AddTransaction'
import Button from '../ui/Button'

export default function TransactionsPage() {
  const { session, can, activeAccountId, isSuperadmin, accounts } = useAuth()
  const { categories, cardsList } = useAppData(!!session)
  const { month, setMonth, months, transactions, cards } = useTransactions(!!session, activeAccountId)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [catFilter, setCatFilter] = useState('all')

  const ft = transactions.filter(r =>
    (!search || r.description.toLowerCase().includes(search.toLowerCase())) &&
    (catFilter === 'all' || r.category === catFilter)
  )
  const fc = cards.filter(r =>
    (!search || r.description.toLowerCase().includes(search.toLowerCase())) &&
    (catFilter === 'all' || r.category === catFilter)
  )

  const income = ft.filter(r => r.type === 'income').reduce((s, r) => s + +r.amount, 0)
  const expense = ft.filter(r => r.type === 'expense').reduce((s, r) => s + +r.amount, 0)
  const cardTotal = fc.reduce((s, r) => s + +r.amount, 0)

  const canCreate = can('transactions', 'create')
  const canUpdate = can('transactions', 'update')
  const canDelete = can('transactions', 'delete')

  return (
    <>
      <div className="page-header">
        <h2>Lançamentos</h2>
        {canCreate && <Button onClick={() => setShowAdd(true)}>+ Novo</Button>}
      </div>

      <div className="controls">
        <Select
          value={month}
          onChange={setMonth}
          options={months.length ? months.map(m => ({ value: m, label: new Date(m + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) })) : [{ value: '', label: 'Sem dados' }]}
        />
        <Select
          value={catFilter}
          onChange={setCatFilter}
          options={[{ value: 'all', label: 'Todas categorias' }, ...categoryOptions(categories)]}
        />
        <input type="text" className="search-input" placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar lançamentos" />
      </div>

      <SummaryCards income={income} expense={expense} cardTotal={cardTotal} />

      <TransactionsTable
        transactions={ft}
        categories={categories}
        month={month}
        canUpdate={canUpdate}
        canDelete={canDelete}
        isSuperadmin={isSuperadmin}
        accounts={accounts}
        activeAccountId={activeAccountId}
      />

      {fc.length > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '0.5rem 0' }} />}

      <CardsTable
        cards={fc}
        cardsList={cardsList}
        categories={categories}
        month={month}
        canUpdate={can('credit_cards', 'update')}
        canDelete={can('credit_cards', 'delete')}
      />

      {showAdd && activeAccountId && (
        <AddTransaction
          categories={categories}
          cardsList={cardsList}
          month={month}
          accountId={activeAccountId}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  )
}
