// lucide-icons.ts dosyası
import { createIcons, icons } from 'lucide'

// Global'e ekleme
window.callIcons = function () {
  createIcons({ icons: { ...icons } })
}

// TypeScript tanımlaması - ayrı bir .d.ts dosyasına da koyabilirsiniz
declare global {
  interface Window {
    callIcons: () => void
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.callIcons()
})

export { createIcons, icons }
