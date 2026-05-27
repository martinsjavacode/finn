interface QueuedMutation {
  id: string
  timestamp: number
  table: string
  operation: 'insert' | 'update' | 'delete'
  payload: Record<string, unknown>
  filters?: Record<string, unknown>
}

const QUEUE_KEY = 'finn-sync-queue'

function getQueue(): QueuedMutation[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch { return [] }
}

function saveQueue(queue: QueuedMutation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function enqueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>) {
  const queue = getQueue()
  queue.push({ ...mutation, id: crypto.randomUUID(), timestamp: Date.now() })
  saveQueue(queue)
}

export function dequeue(id: string) {
  saveQueue(getQueue().filter(m => m.id !== id))
}

export function peekAll(): QueuedMutation[] {
  return getQueue()
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY)
}

export function hasPending(): boolean {
  return getQueue().length > 0
}
