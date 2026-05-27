import { fmt, currentYearMonth, monthRange, toYearMonth, monthLabel, monthLabelShort, getEffectiveClosingDay, resolveInvoiceMonth, categoryOptions } from '../../utils/format'

describe('fmt', () => {
  it('formata valor em BRL', () => {
    expect(fmt(1500)).toContain('1.500')
    expect(fmt(0)).toContain('0')
    expect(fmt(99.9)).toContain('99,90')
  })
})

describe('currentYearMonth', () => {
  it('retorna formato YYYY-MM', () => {
    const result = currentYearMonth()
    expect(result).toMatch(/^\d{4}-\d{2}$/)
  })
})

describe('monthRange', () => {
  it('calcula range para mês normal', () => {
    const { start, end } = monthRange('2026-03')
    expect(start).toBe('2026-03-01')
    expect(end).toBe('2026-04-01')
  })

  it('calcula range para dezembro (virada de ano)', () => {
    const { start, end } = monthRange('2026-12')
    expect(start).toBe('2026-12-01')
    expect(end).toBe('2027-01-01')
  })
})

describe('toYearMonth', () => {
  it('extrai YYYY-MM de uma data', () => {
    expect(toYearMonth('2026-05-15')).toBe('2026-05')
    expect(toYearMonth('2026-12-01T00:00:00')).toBe('2026-12')
  })
})

describe('monthLabel', () => {
  it('retorna mês por extenso com ano', () => {
    const result = monthLabel('2026-01')
    expect(result.toLowerCase()).toContain('janeiro')
    expect(result).toContain('2026')
  })
})

describe('monthLabelShort', () => {
  it('retorna mês abreviado', () => {
    const result = monthLabelShort('2026-01')
    expect(result.toLowerCase()).toContain('jan')
  })
})

describe('getEffectiveClosingDay', () => {
  it('retorna closing_day para regra fixed', () => {
    expect(getEffectiveClosingDay({ closing_day: 15, due_day: 25, closing_rule: 'fixed', days_before_due: 7 })).toBe(15)
  })

  it('calcula dia relativo ao vencimento', () => {
    expect(getEffectiveClosingDay({ closing_day: 1, due_day: 20, closing_rule: 'relative', days_before_due: 7 })).toBe(13)
  })
})

describe('resolveInvoiceMonth', () => {
  const card = { closing_day: 10, due_day: 20, closing_rule: 'fixed' as const, days_before_due: 7 }

  it('compra antes do fechamento vai para mês atual', () => {
    expect(resolveInvoiceMonth('2026-05-08', card)).toBe('2026-05')
  })

  it('compra depois do fechamento vai para próximo mês', () => {
    expect(resolveInvoiceMonth('2026-05-15', card)).toBe('2026-06')
  })

  it('dezembro vai para janeiro do próximo ano', () => {
    expect(resolveInvoiceMonth('2026-12-15', card)).toBe('2027-01')
  })
})

describe('categoryOptions', () => {
  it('retorna opções hierárquicas', () => {
    const cats = [
      { id: '1', label: 'Casa', parent_id: null },
      { id: '2', label: 'EAD', parent_id: '1' },
      { id: '3', label: 'Empresa', parent_id: null },
    ]
    const opts = categoryOptions(cats)
    expect(opts).toHaveLength(3)
    expect(opts[0]).toEqual({ value: '1', label: 'Casa' })
    expect(opts[1]).toEqual({ value: '2', label: '  Casa > EAD' })
    expect(opts[2]).toEqual({ value: '3', label: 'Empresa' })
  })
})
