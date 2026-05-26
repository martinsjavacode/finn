import { fmt } from '../../utils/format'

interface MonthData { month: string; income: number; expense: number }

interface Props {
  data: MonthData[]
  trend: number[]
  maxValue: number
  selectedMonth: string
  tooltip: { i: number } | null
  onSelect: (month: string, i: number) => void
}

export default function LineChart({ data, trend, maxValue, selectedMonth, tooltip, onSelect }: Props) {
  const w = 840, pad = 35, usable = w - pad * 2
  const getX = (i: number) => data.length === 1 ? w / 2 : (i / (data.length - 1)) * usable + pad
  const getY = (v: number) => 170 - (v / maxValue) * 150
  const monthLabel = (ym: string) => new Date(ym + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })

  return (
    <section>
      <h2>Evolução Anual</h2>
      <p className="chart-hint">Clique em um mês para ver detalhes.</p>
      <div className="chart-legend">
        <span className="legend-item"><span className="legend-dot green"></span>Receita</span>
        <span className="legend-item"><span className="legend-dot red"></span>Despesa</span>
        <span className="legend-item"><span className="legend-dot purple"></span>Tendência</span>
      </div>
      <div className="line-chart-container">
        <svg className="line-chart" viewBox="0 0 840 220" role="img" aria-label="Gráfico de evolução anual">
          {[0.25, 0.5, 0.75].map(p => <line key={p} x1={pad} y1={p * 160 + 10} x2={w - pad} y2={p * 160 + 10} className="grid-line" />)}
          <polygon className="chart-area-balance" points={[...data.map((d, i) => `${getX(i)},${getY(d.income)}`), ...data.map((_, i) => `${getX(data.length - 1 - i)},${getY(data[data.length - 1 - i].expense)}`)].join(' ')} />
          <polyline fill="none" className="chart-line income" points={data.map((d, i) => `${getX(i)},${getY(d.income)}`).join(' ')} />
          <polyline fill="none" className="chart-line expense" points={data.map((d, i) => `${getX(i)},${getY(d.expense)}`).join(' ')} />
          <polyline fill="none" className="chart-line trend" points={data.map((_, i) => `${getX(i)},${getY(trend[i])}`).join(' ')} />
          {data.map((d, i) => (
            <g key={d.month} onClick={() => onSelect(d.month, i)} style={{ cursor: 'pointer' }} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onSelect(d.month, i) }} aria-label={`${monthLabel(d.month)}: receita ${fmt(d.income)}, despesa ${fmt(d.expense)}`}>
              <circle cx={getX(i)} cy={getY(d.income)} r="4" className="chart-dot income" />
              <circle cx={getX(i)} cy={getY(d.expense)} r="4" className="chart-dot expense" />
              <text x={getX(i)} y="200" textAnchor="middle" className={`chart-label ${d.month === selectedMonth ? 'active' : ''}`}>{monthLabel(d.month)}</text>
              {tooltip?.i === i && (() => {
                const ty = getY(d.income) < 45 ? getY(d.income) + 10 : getY(d.income) - 38
                return (
                  <g className="chart-tooltip">
                    <rect x={getX(i) - 55} y={ty} width="110" height="32" rx="6" />
                    <text x={getX(i)} y={ty + 14} textAnchor="middle" className="tooltip-income">{fmt(d.income)}</text>
                    <text x={getX(i)} y={ty + 26} textAnchor="middle" className="tooltip-expense">{fmt(d.expense)}</text>
                  </g>
                )
              })()}
            </g>
          ))}
        </svg>
      </div>
    </section>
  )
}
