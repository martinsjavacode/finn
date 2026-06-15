import { formatActivityDescription, formatItemType, formatTimestamp, formatRelativeDay, groupLogsByDay } from '../../utils/activityFormatter'
import type { ActivityLog } from '../../types/admin'

function makeLog(overrides: Partial<ActivityLog> = {}): ActivityLog {
  return {
    id: '1',
    action_type: 'migration',
    actor_email: 'admin@test.com',
    account_id: 'acc-1',
    account_name: 'Conta Pessoal',
    details: {},
    created_at: '2026-05-25T14:30:00Z',
    ...overrides,
  }
}

describe('formatActivityDescription', () => {
  it('formata migração', () => {
    const log = makeLog({
      action_type: 'migration',
      details: { itemCount: 5, itemType: 'entries', sourceAccount: 'Pessoal', targetAccount: 'Empresa' },
    })
    expect(formatActivityDescription(log)).toBe('Migrou 5 lançamento(s) de "Pessoal" para "Empresa"')
  })

  it('formata member_added', () => {
    const log = makeLog({
      action_type: 'member_added',
      account_name: 'Empresa',
      details: { affectedUserEmail: 'user@test.com' },
    })
    expect(formatActivityDescription(log)).toBe('Adicionou user@test.com à conta "Empresa"')
  })

  it('formata member_removed', () => {
    const log = makeLog({
      action_type: 'member_removed',
      account_name: 'Empresa',
      details: { affectedUserEmail: 'user@test.com' },
    })
    expect(formatActivityDescription(log)).toBe('Removeu user@test.com da conta "Empresa"')
  })

  it('formata role_changed', () => {
    const log = makeLog({
      action_type: 'role_changed',
      account_name: 'Empresa',
      details: { affectedUserEmail: 'user@test.com', oldRole: 'viewer', newRole: 'editor' },
    })
    expect(formatActivityDescription(log)).toBe('Alterou papel de user@test.com de "viewer" para "editor" na conta "Empresa"')
  })

  it('formata account_created', () => {
    const log = makeLog({ action_type: 'account_created', account_name: 'Nova Conta' })
    expect(formatActivityDescription(log)).toBe('Criou a conta "Nova Conta"')
  })

  it('formata account_deleted', () => {
    const log = makeLog({ action_type: 'account_deleted', account_name: 'Conta Antiga' })
    expect(formatActivityDescription(log)).toBe('Excluiu a conta "Conta Antiga"')
  })

  it('retorna ação desconhecida para tipo inválido', () => {
    const log = makeLog({ action_type: 'unknown' as unknown as ActivityLog['action_type'] })
    expect(formatActivityDescription(log)).toBe('Ação desconhecida')
  })
})

describe('formatItemType', () => {
  it('entries → lançamento(s)', () => {
    expect(formatItemType('entries')).toBe('lançamento(s)')
  })

  it('installments → parcelamento(s)', () => {
    expect(formatItemType('installments')).toBe('parcelamento(s)')
  })

  it('budgets → orçamento(s)', () => {
    expect(formatItemType('budgets')).toBe('orçamento(s)')
  })

  it('tipo desconhecido → item(ns)', () => {
    expect(formatItemType('other')).toBe('item(ns)')
  })
})

describe('formatTimestamp', () => {
  it('formata data/hora em pt-BR', () => {
    const result = formatTimestamp('2026-05-25T14:30:00Z')
    // The exact output depends on locale, but should contain date and time parts
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe('formatRelativeDay', () => {
  it('retorna "Hoje" para data de hoje', () => {
    const now = new Date()
    expect(formatRelativeDay(now.toISOString())).toBe('Hoje')
  })

  it('retorna "Ontem" para data de ontem', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(formatRelativeDay(yesterday.toISOString())).toBe('Ontem')
  })

  it('retorna data formatada para datas mais antigas', () => {
    const oldDate = '2026-01-15T10:00:00Z'
    const result = formatRelativeDay(oldDate)
    expect(result).not.toBe('Hoje')
    expect(result).not.toBe('Ontem')
    // Should contain day number and month name in pt-BR
    expect(result).toMatch(/\d+/)
  })
})

describe('groupLogsByDay', () => {
  it('agrupa logs por dia relativo', () => {
    const now = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const logs: ActivityLog[] = [
      makeLog({ id: '1', created_at: now.toISOString() }),
      makeLog({ id: '2', created_at: now.toISOString() }),
      makeLog({ id: '3', created_at: yesterday.toISOString() }),
    ]

    const groups = groupLogsByDay(logs)
    expect(groups).toHaveLength(2)
    expect(groups[0].day).toBe('Hoje')
    expect(groups[0].entries).toHaveLength(2)
    expect(groups[1].day).toBe('Ontem')
    expect(groups[1].entries).toHaveLength(1)
  })

  it('retorna array vazio para lista vazia', () => {
    expect(groupLogsByDay([])).toEqual([])
  })

  it('preserva ordem de inserção dos grupos', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const now = new Date()

    const logs: ActivityLog[] = [
      makeLog({ id: '1', created_at: yesterday.toISOString() }),
      makeLog({ id: '2', created_at: now.toISOString() }),
    ]

    const groups = groupLogsByDay(logs)
    // First group is "Ontem" because first log is from yesterday
    expect(groups[0].day).toBe('Ontem')
    expect(groups[1].day).toBe('Hoje')
  })
})
