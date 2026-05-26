import { fmt } from '../../utils/format'
import type { Transaction, Category } from '../../types/database'

interface Props {
  budgets: { category: string; monthly_limit: number }[]
  expenses: Transaction[]
  categories: Category[]
}

export default function BudgetProgress({ budgets, expenses, categories }: Props) {
  if (!budgets.length) return <section><h2>Orçamento por Categoria</h2><p className="empty">Nenhum orçamento cadastrado.</p></section>

  return (
    <section>
      <h2>Orçamento por Categoria</h2>
      <div className="budget-list">
        {budgets.map(b => {
          const catName = categories.find(c => c.id === b.category)?.label ?? b.category
          const spent = expenses.filter(r => r.category === b.category).reduce((s, r) => s + +r.amount, 0)
          const pct = Math.min((spent / b.monthly_limit) * 100, 100)
          const over = spent > b.monthly_limit
          return (
            <div key={b.category} className="budget-row">
              <div className="budget-header">
                <span className="budget-cat">{catName}</span>
                <span className={`budget-values ${over ? 'over' : ''}`}>{fmt(spent)} / {fmt(b.monthly_limit)}</span>
              </div>
              <div className="budget-track">
                <div className={`budget-fill ${over ? 'over' : ''}`} style={{ width: `${pct}%` }}></div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
