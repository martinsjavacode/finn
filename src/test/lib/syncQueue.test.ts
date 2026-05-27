import { enqueue, dequeue, peekAll, clearQueue, hasPending } from '../../lib/syncQueue'

describe('syncQueue', () => {
  beforeEach(() => { localStorage.clear() })

  it('inicia vazia', () => {
    expect(peekAll()).toEqual([])
    expect(hasPending()).toBe(false)
  })

  it('enqueue adiciona item com id e timestamp', () => {
    enqueue({ table: 'entries', operation: 'insert', payload: { description: 'test' } })
    const queue = peekAll()
    expect(queue).toHaveLength(1)
    expect(queue[0].table).toBe('entries')
    expect(queue[0].operation).toBe('insert')
    expect(queue[0].id).toBeDefined()
    expect(queue[0].timestamp).toBeGreaterThan(0)
    expect(hasPending()).toBe(true)
  })

  it('dequeue remove item por id', () => {
    enqueue({ table: 'entries', operation: 'insert', payload: { a: 1 } })
    enqueue({ table: 'entries', operation: 'delete', payload: {}, filters: { id: 'x' } })
    const [first] = peekAll()
    dequeue(first.id)
    expect(peekAll()).toHaveLength(1)
    expect(peekAll()[0].operation).toBe('delete')
  })

  it('clearQueue limpa tudo', () => {
    enqueue({ table: 'entries', operation: 'insert', payload: {} })
    enqueue({ table: 'entries', operation: 'update', payload: {} })
    clearQueue()
    expect(peekAll()).toEqual([])
    expect(hasPending()).toBe(false)
  })

  it('persiste no localStorage', () => {
    enqueue({ table: 'budgets', operation: 'insert', payload: { limit: 500 } })
    const raw = localStorage.getItem('finn-sync-queue')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!)).toHaveLength(1)
  })
})
