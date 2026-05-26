import { useEffect, useRef } from 'react'

export function useModal<T extends HTMLElement = HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    document.addEventListener('keydown', handleKey)
    ref.current?.querySelector<HTMLElement>('input, select, button')?.focus()
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return ref
}
