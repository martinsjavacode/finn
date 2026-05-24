import { useState, useRef, useEffect } from 'react'

interface Option { value: string; label: string }

export default function Select({ options, value, onChange }: { options: Option[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div className="custom-select" ref={ref}>
      <button type="button" className="custom-select-trigger" onClick={() => setOpen(!open)}>
        <span>{selected?.label ?? 'Selecione'}</span>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 11L3 6h10l-5 5z"/></svg>
      </button>
      {open && (
        <ul className="custom-select-menu">
          {options.map(o => (
            <li key={o.value} className={o.value === value ? 'active' : ''} onClick={() => { onChange(o.value); setOpen(false) }}>
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
