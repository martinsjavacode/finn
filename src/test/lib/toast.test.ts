import { toast, showError, subscribe } from '../../lib/toast'
import { confirm } from '../../lib/confirm'

describe('toast', () => {
  it('notifica subscriber com mensagem', () => {
    const cb = vi.fn()
    const unsub = subscribe(cb)
    toast('Sucesso!')
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ text: 'Sucesso!', type: 'success' }))
    unsub()
  })

  it('showError envia toast de erro', () => {
    const cb = vi.fn()
    const unsub = subscribe(cb)
    showError({ message: 'Falhou' })
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ text: 'Falhou', type: 'error' }))
    unsub()
  })

  it('não notifica após unsubscribe', () => {
    const cb = vi.fn()
    const unsub = subscribe(cb)
    unsub()
    toast('Nada')
    expect(cb).not.toHaveBeenCalled()
  })
})

describe('confirm', () => {
  it('retorna promise', () => {
    const result = confirm('Tem certeza?')
    expect(result).toBeInstanceOf(Promise)
  })
})
