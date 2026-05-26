import { useEffect, useRef } from 'react'
import { useFocusTrap } from './useFocusTrap'

export function useModal<T extends HTMLElement = HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => { onCloseRef.current = onClose })

  useFocusTrap(ref)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return ref
}
