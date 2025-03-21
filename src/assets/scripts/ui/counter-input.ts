import { CounterInput } from '../packages/counter-input.js'

declare global {
  interface Window {
    CounterInputs: CounterInput
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Sayaçları kişi seçiciler için başlat
  const counterInputs = new CounterInput({
    container: '.counter-input-container',
    autoRefresh: true,
  })

  window.CounterInputs = counterInputs
})
