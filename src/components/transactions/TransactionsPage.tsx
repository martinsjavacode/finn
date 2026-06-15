import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAuth, useAppData, useTransactions, useTransactionMutations, useBatchSelection } from '../../hooks'
import { categoryOptions } from '../../utils/format'
import Select from '../ui/Select'
import SummaryCards from '../dashboard/SummaryCards'
import TransactionsTable from './TransactionsTable'
import CardsTable from './CardsTable'
import AddTransaction from './AddTransaction'
import BatchActionBar from './BatchActionBar'
import Button from '../ui/Button'

export default function TransactionsPage() {
  const { session, can, activeAccountId, isSuperadmin, accounts } = useAuth()
  const { categories, cardsList } = useAppData(!!session)
  const { month, setMonth, months, transactions, cards } = useTransactions(!!session, activeAccountId)
  const { batchMarkPaid } = useTransactionMutations(month)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [catFilter, setCatFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [paidFilter, setPaidFilter] = useState<'all' | 'paid' | 'pending'>('all')

  const {
    selectionMode,
    selectedIds,
    activateSelection,
    cancelSelection,
    toggleItem,
    selectAll,
    deselectAll,
    pruneSelection,
  } = useBatchSelection()

  const ft = transactions.filter(r =>
    (!search || r.description.toLowerCase().includes(search.toLowerCase())) &&
    (catFilter === 'all' || r.category === catFilter)
  )
  const fc = cards.filter(r =>
    (!search || r.description.toLowerCase().includes(search.toLowerCase())) &&
    (catFilter === 'all' || r.category === catFilter)
  )

  // Apply type and paid filters for the table-visible transactions
  const ftVisible = useMemo(() => ft.filter(r =>
    (typeFilter === 'all' || r.type === typeFilter) &&
    (paidFilter === 'all' || (paidFilter === 'paid' ? r.paid : !r.paid))
  ), [ft, typeFilter, paidFilter])

  // Visible pending IDs: transactions visible after all filters with paid === false
  const visiblePendingIds = useMemo(
    () => ftVisible.filter(r => !r.paid).map(r => r.id),
    [ftVisible]
  )

  // Total sum: sum of Math.abs(amount) for transactions whose ID is in selectedIds
  const totalSum = useMemo(
    () => transactions
      .filter(r => selectedIds.has(r.id))
      .reduce((sum, r) => sum + Math.abs(+r.amount), 0),
    [transactions, selectedIds]
  )

  // Prune selection when filters change
  useEffect(() => {
    if (selectionMode) {
      pruneSelection(visiblePendingIds)
    }
  }, [search, catFilter, typeFilter, paidFilter, selectionMode, visiblePendingIds, pruneSelection])

  const handlePaySelected = useCallback(async () => {
    // Filter to only include transactions that are actually unpaid (Requirement 4.7)
    const unpaidIds = Array.from(selectedIds).filter(id =>
      transactions.find(t => t.id === id && !t.paid)
    )
    if (unpaidIds.length === 0) return
    try {
      await batchMarkPaid.mutateAsync(unpaidIds)
      cancelSelection()
    } catch {
      // Error is handled by the mutation's onError (toast)
    }
  }, [batchMarkPaid, selectedIds, cancelSelection, transactions])

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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {canUpdate && !selectionMode && (
            <Button onClick={activateSelection}>Selecionar para pagar</Button>
          )}
          {canCreate && <Button onClick={() => setShowAdd(true)}>+ Novo</Button>}
        </div>
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

      <div style={{ paddingBottom: selectionMode ? '80px' : undefined }}>
        <TransactionsTable
          transactions={ft}
          categories={categories}
          month={month}
          canUpdate={canUpdate}
          canDelete={canDelete}
          isSuperadmin={isSuperadmin}
          accounts={accounts}
          activeAccountId={activeAccountId}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleItem}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          paidFilter={paidFilter}
          onPaidFilterChange={setPaidFilter}
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
      </div>

      {selectionMode && (
        <BatchActionBar
          selectedCount={selectedIds.size}
          totalSum={totalSum}
          isLoading={batchMarkPaid.isPending}
          hasPending={visiblePendingIds.length > 0}
          onPaySelected={handlePaySelected}
          onSelectAll={() => selectAll(visiblePendingIds)}
          onDeselectAll={deselectAll}
          onCancel={cancelSelection}
        />
      )}

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
