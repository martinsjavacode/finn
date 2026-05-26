import type { ReactNode, CSSProperties } from 'react'
import '../categories/CategoriesPage.css'

interface CardItemProps {
  title: ReactNode
  actions?: ReactNode
  children: ReactNode
  style?: CSSProperties
  className?: string
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="cat-grid">{children}</div>
}

export function CardItem({ title, actions, children, style, className = '' }: CardItemProps) {
  return (
    <div className={`cat-card ${className}`} style={style}>
      <div className="cat-card-header">
        <h3>{title}</h3>
        {actions && <div className="cat-card-actions">{actions}</div>}
      </div>
      <div className="cat-children">{children}</div>
    </div>
  )
}

export function Chip({ children, className = '', onClick, ariaLabel }: { children: ReactNode; className?: string; onClick?: () => void; ariaLabel?: string }) {
  const Tag = onClick ? 'button' : 'span'
  return <Tag className={`cat-chip ${className}`} onClick={onClick} aria-label={ariaLabel}>{children}</Tag>
}
