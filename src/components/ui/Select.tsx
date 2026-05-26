import { useState, useRef, useEffect, useCallback, useId } from 'react'

interface Option { value: string; label: string }

interface Props {
  options: Option[]
  value: string
  onChange: (v: string) => void
  'aria-label'?: string
}

export default function Select({ options, value, onChange, 'aria-label': ariaLabel }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && activeIndex >= 0) {
      listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex, open])

  const select = useCallback((o: Option) => { onChange(o.value); setOpen(false); setActiveIndex(-1) }, [onChange])

  const openMenu = () => {
    setOpen(true)
    setActiveIndex(options.findIndex(o => o.value === value))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open && activeIndex >= 0) select(options[activeIndex])
        else openMenu()
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!open) { openMenu(); break }
        setActiveIndex(i => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) { openMenu(); break }
        setActiveIndex(i => Math.max(i - 1, 0))
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        setActiveIndex(-1)
        break
      case 'Home':
        if (open) { e.preventDefault(); setActiveIndex(0) }
        break
      case 'End':
        if (open) { e.preventDefault(); setActiveIndex(options.length - 1) }
        break
    }
  }

  const selected = options.find(o => o.value === value)
  const activeId = activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined

  return (
    <div className="custom-select" ref={ref}>
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => open ? (setOpen(false), setActiveIndex(-1)) : openMenu()}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-activedescendant={activeId}
        aria-label={ariaLabel}
      >
        <span>{selected?.label ?? 'Selecione'}</span>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 11L3 6h10l-5 5z"/></svg>
      </button>
      {open && (
        <ul className="custom-select-menu" role="listbox" ref={listRef} aria-label={ariaLabel}>
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={o.value === value}
              className={`${o.value === value ? 'active' : ''} ${i === activeIndex ? 'focused' : ''}`}
              onClick={() => select(o)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
