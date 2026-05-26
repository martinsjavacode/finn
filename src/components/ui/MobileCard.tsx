import type { CSSProperties, ReactNode, KeyboardEvent } from 'react'
import './MobileCard.css'

interface Props {
  status?: ReactNode
  title: ReactNode
  value: ReactNode
  subtitle: ReactNode
  onTap?: () => void
  className?: string
  style?: CSSProperties
}

export default function MobileCard({ status, title, value, subtitle, onTap, className = '', style }: Props) {
  const interactive = !!onTap
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onTap) { e.preventDefault(); onTap() }
  }

  return (
    <div
      className={`mcard ${className}`}
      onClick={onTap}
      style={style}
      {...(interactive && { role: 'button', tabIndex: 0, onKeyDown: handleKeyDown })}
    >
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
