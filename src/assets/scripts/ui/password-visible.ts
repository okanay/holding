function setupPasswordVisibility() {
  // Data-visible attribute'u olan tüm container'ları bul
  const containers = document.querySelectorAll('div[data-visible]')

  containers.forEach(container => {
    const passwordInput = container.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement | null
    const toggleButton = container.querySelector(
      '.visible-control-btn',
    ) as HTMLElement | null

    if (!passwordInput || !toggleButton) return

    // Toggle butonuna tıklama olayı ekle
    toggleButton.addEventListener('click', e => {
      e.stopPropagation()
      const isVisible = (container as HTMLElement).dataset.visible === 'true'

      passwordInput.type = isVisible ? 'password' : 'text'
      ;(container as HTMLElement).dataset.visible = isVisible ? 'false' : 'true'
    })

    // Input'a tıklandığında event'in yayılmasını engelle
    passwordInput.addEventListener('click', e => e.stopPropagation())
  })

  // Sayfa herhangi bir yerine tıklandığında şifreleri gizle
  document.addEventListener('click', () => {
    containers.forEach(container => {
      const passwordInput = container.querySelector(
        'input[type="password"], input[type="text"]',
      ) as HTMLInputElement | null
      if (
        (container as HTMLElement).dataset.visible === 'true' &&
        passwordInput
      ) {
        passwordInput.type = 'password'
        ;(container as HTMLElement).dataset.visible = 'false'
      }
    })
  })
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', setupPasswordVisibility)
