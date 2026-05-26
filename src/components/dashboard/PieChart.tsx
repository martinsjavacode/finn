import { fmt } from '../../utils/format'

const pieColors = ['#667eea', '#764ba2', '#00d68f', '#ff6b6b', '#38bdf8', '#a78bfa', '#f59e0b']

interface Props {
  data: [string, number][]
  total: number
}

export default function PieChart({ data, total }: Props) {
  if (!data.length) return <section><h2>Despesas por Categoria</h2><p className="empty">Sem despesas</p></section>

  const gradient = `conic-gradient(${data.reduce<{ stops: string[]; acc: number }>((r, [, value], i) => {
    const start = r.acc
    const end = r.acc + (value / total) * 360
    r.stops.push(`${pieColors[i % pieColors.length]} ${start}deg ${end}deg`)
    r.acc = end
    return r
  }, { stops: [], acc: 0 }).stops.join(', ')})`

  return (
    <section>
      <h2>Despesas por Categoria</h2>
      <div className="pie-container">
        <div className="pie" style={{ background: gradient }} role="img" aria-label="Gráfico de despesas por categoria"></div>
        <div className="pie-legend">
          {data.map(([label, value], i) => (
            <div key={label} className="pie-legend-item">
              <div className="pie-legend-top">
                <span className="pie-legend-dot" style={{ background: pieColors[i % pieColors.length] }}></span>
                <span className="pie-legend-label">{label}</span>
              </div>
              <span className="pie-legend-value">{fmt(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
