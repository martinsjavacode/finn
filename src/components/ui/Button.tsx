interface Props {
  children: React.ReactNode
  variant?: 'primary' | 'tab' | 'icon'
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

export default function Button({ children, variant = 'primary', active, disabled, onClick, type = 'button', className = '', style, 'aria-label': ariaLabel }: Props) {
  const base = variant === 'primary' ? 'btn-primary' : variant === 'icon' ? 'edit-btn' : 'tab'
  const cls = `${base} ${active ? 'active' : ''} ${className}`.trim()

  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick} style={style} aria-label={ariaLabel}>
      {children}
    </button>
  )
}
