export interface ConfirmState {
  message: string
  resolve: (confirmed: boolean) => void
}

let showConfirm: ((state: ConfirmState) => void) | null = null

export function confirm(message: string): Promise<boolean> {
  return new Promise(resolve => {
    showConfirm?.({ message, resolve })
  })
}

export function subscribeConfirm(fn: (state: ConfirmState) => void) {
  showConfirm = fn
  return () => { showConfirm = null }
}
