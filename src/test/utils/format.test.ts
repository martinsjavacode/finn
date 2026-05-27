import { fmt, currentYearMonth, monthRange, toYearMonth, monthLabel, monthLabelShort } from '../../utils/format'

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
