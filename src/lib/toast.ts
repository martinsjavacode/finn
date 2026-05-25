export interface ToastMessage {
  id: number
  text: string
  type: 'success' | 'error'
}

let toastId = 0
let listener: ((msg: ToastMessage) => void) | null = null

export function toast(text: string, type: 'success' | 'error' = 'success') {
  listener?.({ id: ++toastId, text, type })
}

export function showError(error: { message: string } | null, fallback = 'Erro inesperado') {
  if (error) toast(error.message || fallback, 'error')
}

export function subscribe(fn: (msg: ToastMessage) => void) {
  listener = fn
  return () => { listener = null }
}
