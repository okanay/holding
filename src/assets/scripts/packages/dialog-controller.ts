class DialogController {
  private latestOpenId: number = -1
  private targetGroups: Map<number, string[]> = new Map()
  private triggerElements: Map<number, HTMLElement> = new Map()
  private isResizing: boolean = false
  private resizeTimer: number | null = null
  private boundHandleClick: any
  private boundHandleCloseButtonClick: any
  private boundHandleOutsideClick: any
  private boundHandleKeydown: any
  private boundHandleResize: any

  constructor() {
    // Event handler fonksiyonlarını bağla
    this.boundHandleClick = this.handleClick.bind(this)
    this.boundHandleCloseButtonClick = this.handleCloseButtonClick.bind(this)
    this.boundHandleOutsideClick = this.handleOutsideClick.bind(this)
    this.boundHandleKeydown = this.handleKeydown.bind(this)
    this.boundHandleResize = this.handleResize.bind(this)

    // Dialog tetikleyicilerini ve hedeflerini başlat
    this.initializeDialogs()

    // Event listener'ları ekle
    document.addEventListener('click', this.boundHandleClick)
    document.addEventListener('click', this.boundHandleCloseButtonClick)
    document.addEventListener('click', this.boundHandleOutsideClick)
    document.addEventListener('keydown', this.boundHandleKeydown)
    window.addEventListener('resize', this.boundHandleResize)
  }

  // Sayfadaki tüm dialog tetikleyicilerini ve hedeflerini başlat
  initializeDialogs() {
    let dialogId = 0

    // Tüm tetikleyicileri bul ve başlat
    document.querySelectorAll('[data-targets]').forEach((trigger: Element) => {
      const triggerElement = trigger as HTMLElement
      const targetIds =
        triggerElement.getAttribute('data-targets')?.split(',') || []

      // Her tetikleyiciye benzersiz bir dialog-id ata
      triggerElement.setAttribute('data-dialog-id', dialogId.toString())

      // Hedef grubunu kaydet
      this.targetGroups.set(
        dialogId,
        targetIds.map(id => id.trim()),
      )

      // Tetikleyici elementi kaydet
      this.triggerElements.set(dialogId, triggerElement)

      dialogId++
    })
  }

  // Yeniden boyutlandırma olaylarını işle
  handleResize() {
    // Resize olayı başladığında isResizing'i true yap
    this.isResizing = true

    // Önceki zamanlayıcıyı temizle
    if (this.resizeTimer !== null) {
      window.clearTimeout(this.resizeTimer)
    }

    // Resize olayı bittikten 300ms sonra isResizing'i false yap
    this.resizeTimer = window.setTimeout(() => {
      this.isResizing = false
      this.resizeTimer = null
    }, 300)
  }

  // Click olaylarını yönet
  handleClick(event: MouseEvent) {
    // Resize sırasında tıklamaları yok say
    if (this.isResizing) return

    const target = (event.target as HTMLElement).closest('[data-targets]')
    if (!target) return

    event.preventDefault()
    event.stopPropagation()

    const dialogId = parseInt(target.getAttribute('data-dialog-id') || '-1', 10)
    if (dialogId >= 0) {
      this.toggleDialog(dialogId)
    }
  }

  // Kapatma butonlarını yönet
  handleCloseButtonClick(event: MouseEvent) {
    // Resize sırasında tıklamaları yok say
    if (this.isResizing) return

    const closeButton = (event.target as HTMLElement).closest(
      '[data-close-target]',
    )
    if (!closeButton) return

    event.preventDefault()
    event.stopPropagation()

    const targetId = closeButton.getAttribute('data-close-target')
    if (targetId) {
      this.closeDialogByTarget(targetId)
    }
  }

  // Klavye olaylarını yönet
  handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.closeLatestDialog()
    }
  }

  // Target ID'sine göre diyaloğu kapat
  closeDialogByTarget(targetId: string) {
    // Tüm dialog gruplarını kontrol et
    this.targetGroups.forEach((targets, dialogId) => {
      // Eğer bu group içinde hedef ID varsa
      if (targets.includes(targetId)) {
        // Bu diyaloğu kapat
        this.closeDialog(dialogId)
      }
    })
  }

  // Dışarı tıklamayı yönet
  handleOutsideClick(event: MouseEvent) {
    // Resize sırasında hiçbir şey yapma - ÖNEMLİ DÜZELTME!
    if (this.isResizing) return

    // Eğer aktif bir dialog yoksa, işlem yapma
    if (this.latestOpenId === -1) return

    const clickedElement = event.target as HTMLElement

    // Temel kontrol: Tıklama event'i güvenilir mi?
    if (!event.isTrusted) return

    // Eğer tıklama tetikleyici üzerinde ise, handleClick zaten işleyecek
    if (clickedElement.closest('[data-targets]')) return

    // Eğer tıklama kapatma butonu üzerindeyse, handleCloseButtonClick zaten işleyecek
    if (clickedElement.closest('[data-close-target]')) return

    // Tıklamanın aktif dialog hedefleri içinde olup olmadığını kontrol et
    const activeTargets = this.targetGroups.get(this.latestOpenId) || []
    let isClickInsideActiveTarget = false

    for (const targetId of activeTargets) {
      const target = document.getElementById(targetId)
      if (target && target.contains(clickedElement)) {
        isClickInsideActiveTarget = true
        break
      }
    }

    // Eğer tıklama aktif dialog dışındaysa, diyalogu kapat
    if (!isClickInsideActiveTarget) {
      this.closeLatestDialog()
    }
  }

  // Belirtilen dialog ID'sine göre dialog durumunu değiştir
  toggleDialog(dialogId: number) {
    const triggerElement = this.triggerElements.get(dialogId)
    const targetIds = this.targetGroups.get(dialogId) || []

    if (!triggerElement) return

    const isActive = triggerElement.getAttribute('data-active') === 'open'

    if (isActive) {
      // Diyalog açıksa kapat
      this.closeDialog(dialogId)
    } else {
      // Diyalog kapalıysa, önce tüm açık diyalogları kapat, sonra bu diyalogu aç
      this.closeAllDialogs()
      this.openDialog(dialogId)
    }
  }

  // Belirtilen dialog ID'sini aç
  openDialog(dialogId: number) {
    const triggerElement = this.triggerElements.get(dialogId)
    const targetIds = this.targetGroups.get(dialogId) || []

    if (triggerElement) {
      // Tetikleyici butonu aktif yap
      triggerElement.setAttribute('data-active', 'open')

      // Tüm hedefleri aç
      targetIds.forEach(id => {
        const target = document.getElementById(id)
        if (target) {
          target.setAttribute('data-active', 'open')
        }
      })

      // En son açılan diyalogu güncelle
      this.latestOpenId = dialogId
    }
  }

  // Belirtilen dialog ID'sini kapat
  closeDialog(dialogId: number) {
    const triggerElement = this.triggerElements.get(dialogId)
    const targetIds = this.targetGroups.get(dialogId) || []

    if (triggerElement) {
      // Tetikleyici butonu kapalı yap
      triggerElement.setAttribute('data-active', 'close')

      // Tüm hedefleri kapat
      targetIds.forEach(id => {
        const target = document.getElementById(id)
        if (target) {
          target.setAttribute('data-active', 'close')
        }
      })

      // Eğer kapattığımız dialog en son açılan dialogsa, latestOpenId'yi sıfırla
      if (this.latestOpenId === dialogId) {
        this.latestOpenId = -1
      }
    }
  }

  // En son açılan diyaloğu kapat
  closeLatestDialog() {
    if (this.latestOpenId >= 0) {
      this.closeDialog(this.latestOpenId)
    }
  }

  // Tüm diyalogları kapat
  closeAllDialogs() {
    this.targetGroups.forEach((_, dialogId) => {
      this.closeDialog(dialogId)
    })

    // Tüm diyaloglar kapatıldığında latestOpenId'yi sıfırla
    this.latestOpenId = -1
  }

  // Controller'ı temizle ve event listener'ları kaldır
  destroy() {
    document.removeEventListener('click', this.boundHandleClick)
    document.removeEventListener('click', this.boundHandleCloseButtonClick)
    document.removeEventListener('click', this.boundHandleOutsideClick)
    document.removeEventListener('keydown', this.boundHandleKeydown)
    window.removeEventListener('resize', this.boundHandleResize)

    if (this.resizeTimer !== null) {
      window.clearTimeout(this.resizeTimer)
    }

    this.targetGroups.clear()
    this.triggerElements.clear()
  }
}

export { DialogController }
