import { fmt } from '../../utils/format'

interface Props {
  income: number
  expense: number
  cardTotal: number
}

export default function SummaryCards({ income, expense, cardTotal }: Props) {
  const balance = income - expense - cardTotal
  return (
    <div className="grid">
      <div className="card"><h2>Receitas</h2><span className="total positive">{fmt(income)}</span></div>
      <div className="card"><h2>Despesas</h2><span className="total negative">{fmt(expense)}</span></div>
      <div className="card"><h2>Cartões</h2><span className="total negative">{fmt(cardTotal)}</span></div>
      <div className="card"><h2>Saldo</h2><span className={`total ${balance >= 0 ? 'positive' : 'negative'}`}>{fmt(balance)}</span></div>
    </div>
  )
}
