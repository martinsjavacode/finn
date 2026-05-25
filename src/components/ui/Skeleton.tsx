import './Skeleton.css'

export function Skeleton({ width = '100%', height = '1rem' }: { width?: string; height?: string }) {
  return <div className="skeleton" style={{ width, height }} />
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <table>
      <thead>
        <tr>{Array.from({ length: cols }, (_, i) => <th key={i}><Skeleton width="80%" /></th>)}</tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>{Array.from({ length: cols }, (_, c) => <td key={c}><Skeleton /></td>)}</tr>
        ))}
      </tbody>
    </table>
  )
}

export function CardsSkeleton() {
  return (
    <div className="grid">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="card">
          <Skeleton width="60%" height="0.9rem" />
          <Skeleton width="80%" height="1.5rem" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return <div className="skeleton skeleton-chart" />
}
