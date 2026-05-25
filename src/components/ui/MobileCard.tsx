import type { ReactNode } from 'react'
import './MobileCard.css'

interface Props {
  status?: ReactNode
  title: ReactNode
  value: ReactNode
  subtitle: ReactNode
  onTap?: () => void
  className?: string
}

export default function MobileCard({ status, title, value, subtitle, onTap, className = '' }: Props) {
  return (
    <div className={`mcard ${className}`} onClick={onTap}>
      {status && <div className="mcard-status">{status}</div>}
      <div className="mcard-body">
        <div className="mcard-row">
          <span className="mcard-title">{title}</span>
          <span className="mcard-value">{value}</span>
        </div>
        <div className="mcard-subtitle">{subtitle}</div>
      </div>
    </div>
  )
}
