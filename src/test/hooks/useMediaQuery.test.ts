import { renderHook } from '@testing-library/react'
import { useMediaQuery, useIsMobile } from '../../hooks/useMediaQuery'

describe('useMediaQuery', () => {
  let listeners: (() => void)[] = []

  beforeEach(() => {
    listeners = []
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(max-width: 1024px)' ? false : true,
        addEventListener: (_: string, cb: () => void) => { listeners.push(cb) },
        removeEventListener: () => {},
      })),
    })
  })

  it('retorna false para mobile em tela grande', () => {
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('retorna true quando matchMedia matches', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: (_: string, cb: () => void) => { listeners.push(cb) },
        removeEventListener: () => {},
      })),
    })
    const { result } = renderHook(() => useMediaQuery('(max-width: 1024px)'))
    expect(result.current).toBe(true)
  })
})
