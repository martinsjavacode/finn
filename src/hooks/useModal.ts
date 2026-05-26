import { useEffect, useRef } from 'react'

export function useModal<T extends HTMLElement = HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    const prev = document.activeElement as HTMLElement
    ref.current?.querySelector<HTMLElement>('input, select, button')?.focus()
    return () => { document.removeEventListener('keydown', handleKey); prev?.focus() }
  }, [onClose])

  return ref
}
