import type { ReactNode } from 'react'
import './MobileCard.css'

interface Field {
  label: string
  value: ReactNode
  fullWidth?: boolean
}

interface Props {
  title: ReactNode
  fields: Field[]
  actions?: ReactNode
  className?: string
}

export default function MobileCard({ title, fields, actions, className = '' }: Props) {
  return (
    <div className={`mobile-card ${className}`}>
      <div className="mobile-card-title">{title}</div>
      <div className="mobile-card-fields">
        {fields.map((f, i) => (
          <div key={i} className={`mobile-card-field ${f.fullWidth ? 'full' : ''}`}>
            <span className="mobile-card-label">{f.label}</span>
            <span className="mobile-card-value">{f.value}</span>
          </div>
        ))}
      </div>
      {actions && <div className="mobile-card-actions">{actions}</div>}
    </div>
  )
}
