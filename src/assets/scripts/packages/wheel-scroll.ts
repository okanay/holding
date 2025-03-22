// Arayüz tanımlamaları
interface ScrollInfo {
  contentWidth: number
  viewportWidth: number
  hiddenAreaWidth: number
}

interface WheelScrollOptions {
  debugMode?: boolean
  scrollStep?: number // Kaydırma miktarı (piksel)
  scrollDuration?: number // Kaydırma animasyon süresi (ms)
}

// Her container için alt elementleri ve bilgileri saklayan arayüz
interface ContainerElements {
  container: HTMLElement
  scrollElement: HTMLElement
  leftButton: HTMLElement | null
  rightButton: HTMLElement | null
  scrollInfo: ScrollInfo
}

class WheelScroll {
  private containers: HTMLElement[] = []
  private isMobile: boolean = false
  private containerIdMap: Map<string, HTMLElement> = new Map()
  private debugMode: boolean = true
  private scrollInfoMap: Map<HTMLElement, ScrollInfo> = new Map()
  private options: Required<WheelScrollOptions>
  // Container elementleri önbelleğe almak için yeni map
  private containerElementsCache: Map<HTMLElement, ContainerElements> =
    new Map()

  // WheelScroll sınıfı içine eklenecek yeni üye değişken
  private itemPositionsMap: Map<
    HTMLElement,
    Array<{
      element: HTMLElement
      left: number
      width: number
      right: number
    }>
  > = new Map()

  constructor(options: WheelScrollOptions = {}) {
    // Varsayılan değerlerle birleştir
    this.options = {
      debugMode: options.debugMode ?? true,
      scrollStep: options.scrollStep ?? 300,
      scrollDuration: options.scrollDuration ?? 300,
    }

    this.debugMode = this.options.debugMode

    const debouncedResize = this.debounce(() => {
      this.checkMobileState()
      this.updateAllScrollInfo()
      // Kart pozisyonlarını güncelle
      this.containers.forEach(container => {
        this.calculateItemPositions(container)
      })
      this.updateAllButtonStates()
    }, 150)

    // Throttle ile scroll olayına tepki vermeyi optimize et (16ms - yaklaşık 60fps)
    this.throttledUpdateButtonStates = this.throttle(
      (container: HTMLElement) => {
        this.updateButtonStates(container)
      },
      16,
    )

    window.addEventListener('resize', debouncedResize)

    // Başlangıç işlemlerini çalıştır
    this.init()
  }

  // Class seviyesinde throttled fonksiyon tanımla
  private throttledUpdateButtonStates: (container: HTMLElement) => void

  /**
   * Başlangıç işlemleri
   */
  private init(): void {
    // Mobil durumu kontrol et
    this.checkMobileState()

    // Wheel container'ları bul ve bilgilerini hesapla
    this.findWheelContainers()

    // Tüm containerlar için kart pozisyonlarını hesapla
    this.containers.forEach(container => {
      this.calculateItemPositions(container)
    })

    // Event'leri ekle
    this.setupEventListeners()

    // Buton durumlarını güncelle
    this.updateAllButtonStates()

    this.debug(
      `${this.containers.length} adet wheel-container bulundu. Mobil: ${this.isMobile ? 'Evet' : 'Hayır'}`,
    )
  }

  /**
   * Tüm container'ların scroll bilgilerini günceller
   */
  private updateAllScrollInfo(): void {
    this.containers.forEach(container => {
      this.calculateScrollInfo(container)
      // Kart pozisyonlarını da güncelle
      this.calculateItemPositions(container)
    })
  }

  /**
   * Debug mesajlarını kontrol eder ve gösterir
   * @param message Debug mesajı
   * @param data İsteğe bağlı ek veri
   */
  private debug(message: string, data?: any): void {
    if (!this.debugMode) return

    if (data) {
      console.log(`[WheelScroll] ${message}`, data)
    } else {
      console.log(`[WheelScroll] ${message}`)
    }
  }

  // Debounce fonksiyonu - olayın en son tetiklenmesinden belli süre sonra çalışır
  private debounce(func: Function, wait: number): (...args: any[]) => void {
    let timeout: number | null = null

    return (...args: any[]) => {
      const later = () => {
        timeout = null
        func(...args)
      }

      if (timeout !== null) {
        clearTimeout(timeout)
      }
      timeout = window.setTimeout(later, wait)
    }
  }

  // Throttle fonksiyonu - olayı belirli aralıklarla sınırlandırır
  private throttle(func: Function, limit: number): (...args: any[]) => void {
    let inThrottle = false

    return (...args: any[]) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => {
          inThrottle = false
        }, limit)
      }
    }
  }

  // RequestAnimationFrame throttle - ekran yenileme hızıyla sınırlar
  private rafThrottle(func: Function): (...args: any[]) => void {
    let rafId: number | null = null

    return (...args: any[]) => {
      if (rafId) return

      rafId = requestAnimationFrame(() => {
        func(...args)
        rafId = null
      })
    }
  }

  /**
   * Container içindeki kartların pozisyonlarını hesaplar
   */
  private calculateItemPositions(container: HTMLElement): void {
    const elements = this.containerElementsCache.get(container)
    if (!elements) return

    const { scrollElement } = elements

    // Scroll içindeki doğrudan çocuk elemanlar (kartlar)
    const items = Array.from(scrollElement.children) as HTMLElement[]

    // Her kartın pozisyon ve genişliğini hesapla
    const itemPositions = items.map(item => {
      return {
        element: item,
        left: item.offsetLeft,
        width: item.offsetWidth,
        right: item.offsetLeft + item.offsetWidth,
      }
    })

    // Hesaplanan pozisyonları container için sakla
    this.itemPositionsMap.set(container, itemPositions)

    this.debug(`Kart pozisyonları hesaplandı:`, {
      containerId: container.dataset.wheelScroll,
      kartSayisi: items.length,
      positions: itemPositions.map(p => ({ left: p.left, width: p.width })),
    })
  }

  /**
   * Mevcut scroll pozisyonuna göre görünür kartları bulur
   */
  private getVisibleItems(container: HTMLElement): {
    firstVisible: number
    lastVisible: number
    fullyVisible: number[]
  } {
    const elements = this.containerElementsCache.get(container)
    if (!elements)
      return { firstVisible: -1, lastVisible: -1, fullyVisible: [] }

    const { scrollElement } = elements
    const positions = this.itemPositionsMap.get(container) || []

    // Görünür alanın başlangıç ve bitiş noktaları
    const scrollLeft = scrollElement.scrollLeft
    const visibleRight = scrollLeft + scrollElement.offsetWidth

    // Kısmen görünen ilk kart
    const firstVisible = positions.findIndex(item => item.right > scrollLeft)

    // Kısmen görünen son kart
    const lastVisible =
      positions.length -
      1 -
      [...positions].reverse().findIndex(item => item.left < visibleRight)

    // Tamamen görünen kartlar
    const fullyVisible = positions
      .map((item, index) => ({ item, index }))
      .filter(
        ({ item }) => item.left >= scrollLeft && item.right <= visibleRight,
      )
      .map(({ index }) => index)

    return {
      firstVisible: firstVisible !== -1 ? firstVisible : 0,
      lastVisible: lastVisible !== -1 ? lastVisible : 0,
      fullyVisible,
    }
  }

  /**
   * Akıllı kaydırma için hedef pozisyonu hesaplar
   */
  private calculateSmartScrollTarget(
    container: HTMLElement,
    direction: 'left' | 'right',
  ): number {
    const elements = this.containerElementsCache.get(container)
    if (!elements) return 0

    const { scrollElement } = elements
    const positions = this.itemPositionsMap.get(container) || []

    if (positions.length === 0) return 0

    // Mevcut görünür kartları bul
    const { firstVisible, lastVisible, fullyVisible } =
      this.getVisibleItems(container)

    // Kaydırma yönüne göre hedef pozisyonu hesapla
    if (direction === 'right') {
      // Eğer hiç tam görünür kart yoksa, ilk kartı tam göster
      if (fullyVisible.length === 0) {
        return positions[firstVisible].left
      }

      // Masaüstü: Son tam görünür karttan sonraki kartı göster
      const targetIndex = this.isMobile
        ? fullyVisible[0] + 1 // Mobil: Bir sonraki karta geç
        : fullyVisible[fullyVisible.length - 1] + 1 // Masaüstü: Son görünürden sonrakine geç

      // Eğer gösterilecek kart kalmadıysa, en sona git
      if (targetIndex >= positions.length) {
        return positions[positions.length - 1].left
      }

      return positions[targetIndex].left
    } else {
      // Sola kaydırma
      // Eğer hiç tam görünür kart yoksa, bir önceki kartı göster
      if (fullyVisible.length === 0) {
        const prevIndex = Math.max(0, firstVisible - 1)
        return positions[prevIndex].left
      }

      // Masaüstü vs. mobil için farklı stratejiler
      const targetIndex = this.isMobile
        ? Math.max(0, fullyVisible[0] - 1) // Mobil: Bir önceki karta git
        : Math.max(0, fullyVisible[0] - fullyVisible.length) // Masaüstü: Bir ekran kadar geri git

      return positions[targetIndex].left
    }
  }

  /**
   * İyileştirilmiş scroll işlevi - akıllı kaydırma kullanır
   */
  private scrollContainer(
    container: HTMLElement,
    direction: 'left' | 'right',
  ): void {
    const elements = this.containerElementsCache.get(container)
    if (!elements) {
      this.debug(`Container elementleri bulunamadı`)
      return
    }

    const { scrollElement } = elements

    this.debug(`Button click: ${direction}`, {
      containerId: container.dataset.wheelScroll,
      container: container.className,
    })

    // Önce kart pozisyonlarını güncelle (olası değişiklikler için)
    this.calculateItemPositions(container)

    // Akıllı kaydırma hedefini hesapla
    let targetScrollLeft = this.calculateSmartScrollTarget(container, direction)

    this.debug(
      `Akıllı scroll hedefi: ${targetScrollLeft}, mevcut: ${scrollElement.scrollLeft}`,
    )

    // Mevcut kaydırma fonksiyonlarını kullan
    if (this.isMobile) {
      try {
        scrollElement.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth',
        })

        const initialScrollLeft = scrollElement.scrollLeft
        setTimeout(() => {
          if (Math.abs(scrollElement.scrollLeft - initialScrollLeft) < 5) {
            this.simpleMobileScroll(scrollElement, targetScrollLeft)
          }
        }, 50)
      } catch (error) {
        this.simpleMobileScroll(scrollElement, targetScrollLeft)
      }
    } else {
      this.smoothScrollTo(scrollElement, targetScrollLeft)
    }
  }

  /**
   * Mobil cihaz kontrolü yapar
   */
  private checkMobileState(): void {
    this.isMobile =
      window.innerWidth <= 768 ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
  }

  /**
   * Container alt elementlerini bulur ve önbelleğe alır
   */
  private cacheContainerElements(
    container: HTMLElement,
  ): ContainerElements | null {
    // Scroll elementi bul
    const scrollElement = container.querySelector(
      '.wheel-scroll',
    ) as HTMLElement
    if (!scrollElement) {
      this.debug(
        `Hata: Container içinde .wheel-scroll elementi bulunamadı: ${container.dataset.wheelScroll || container.className}`,
      )
      return null
    }

    // Butonları bul
    const leftButton = container.querySelector(
      '.wheel-btn-left',
    ) as HTMLElement | null
    const rightButton = container.querySelector(
      '.wheel-btn-right',
    ) as HTMLElement | null

    // Scroll bilgilerini hesapla
    const contentWidth = scrollElement.scrollWidth
    const viewportWidth = scrollElement.clientWidth
    const hiddenAreaWidth = Math.max(0, contentWidth - viewportWidth)

    const scrollInfo: ScrollInfo = {
      contentWidth,
      viewportWidth,
      hiddenAreaWidth,
    }

    // Container elementlerini önbelleğe al
    const elements: ContainerElements = {
      container,
      scrollElement,
      leftButton,
      rightButton,
      scrollInfo,
    }

    this.containerElementsCache.set(container, elements)
    this.scrollInfoMap.set(container, scrollInfo)

    return elements
  }

  /**
   * Container yapısının doğru olduğunu kontrol eder
   */
  private validateStructure(container: HTMLElement): boolean {
    const scrollContent = container.querySelector('.wheel-scroll')

    if (!scrollContent) {
      this.debug(
        `Hata: Container içinde '.wheel-scroll' elementi bulunamadı: ${container.dataset.wheelScroll || container.className}`,
      )
      return false
    }

    const leftBtn = container.querySelector('.wheel-btn-left')
    const rightBtn = container.querySelector('.wheel-btn-right')

    if (!leftBtn) {
      this.debug(
        `Uyarı: Container içinde '.wheel-btn-left' butonu bulunamadı: ${container.dataset.wheelScroll || container.className}`,
      )
    }

    if (!rightBtn) {
      this.debug(
        `Uyarı: Container içinde '.wheel-btn-right' butonu bulunamadı: ${container.dataset.wheelScroll || container.className}`,
      )
    }

    return true
  }

  /**
   * Wheel container'ları bulur ve scroll bilgilerini hesaplar
   */
  private findWheelContainers(): void {
    this.containers = []
    this.scrollInfoMap.clear()
    this.containerIdMap.clear()
    this.containerElementsCache.clear()

    const elements = document.querySelectorAll('.wheel-container')
    this.debug(`DOM'da bulunan wheel-container sayısı: ${elements.length}`)

    elements.forEach((el, index) => {
      const container = el as HTMLElement

      // Yapı kontrolü yap
      if (!this.validateStructure(container)) {
        this.debug(
          `Container yapısı geçersiz, atlanıyor: ${container.className}`,
        )
        return
      }

      // Eğer data-wheel-scroll özelliği yoksa, oluştur
      if (!container.dataset.wheelScroll) {
        const uniqueId = `wheel-${index}`
        container.setAttribute('data-wheel-scroll', uniqueId)
        this.debug(`Container için unique ID oluşturuldu: ${uniqueId}`)
      }

      // Container'ı ID'si ile eşleştir ve depola
      const containerId = container.dataset.wheelScroll as string
      this.containerIdMap.set(containerId, container)

      this.containers.push(container)

      // Container elementlerini önbelleğe al
      this.cacheContainerElements(container)
    })
  }

  /**
   * ID ile container'ı bul
   * @param id Container data-wheel-scroll ID değeri
   * @returns Container elementi veya null
   */
  public getContainerById(id: string): HTMLElement | null {
    return this.containerIdMap.get(id) || null
  }

  /**
   * Tüm container'lar için event'leri ayarlar
   */
  private setupEventListeners(): void {
    this.containers.forEach(container => {
      const elements = this.containerElementsCache.get(container)
      if (!elements) return

      // Sadece masaüstü cihazlarda wheel event'i ekle
      // Mobil cihazlarda dokunma olaylarına hiç müdahale etmiyoruz, varsayılan tarayıcı davranışını koruyoruz
      if (!this.isMobile) {
        this.attachWheelEvent(elements)
      }

      // Hem masaüstü hem mobil için buton event'leri
      this.attachButtonEvents(elements)

      // Scroll olayını scroll elementi için dinle - rafThrottle ile optimize edildi
      const throttledScrollHandler = this.rafThrottle(() => {
        const containerId = container.dataset.wheelScroll
        // Debug logları daha az göster
        if (this.debugMode && Math.random() < 0.1) {
          // Sadece %10 olasılıkla göster
          this.debug(
            `Container scroll eventi: ${containerId || container.className}`,
          )
        }
        this.updateButtonStates(container)
      })

      elements.scrollElement.addEventListener('scroll', throttledScrollHandler)
    })
  }

  /**
   * Container için scroll bilgilerini hesaplar
   * Bu fonksiyon sadece resize olayında ve başlangıçta çağrılmalı
   */
  private calculateScrollInfo(container: HTMLElement): void {
    const elements = this.containerElementsCache.get(container)
    if (!elements) {
      // Önbellekte yoksa, yeniden oluştur
      this.cacheContainerElements(container)
      return
    }

    const { scrollElement } = elements

    // Eğer DOM tamamen yüklenmemişse, doğru ölçümleri alamayabiliriz
    // 0 genişliği kontrolü yapıyoruz
    if (scrollElement.scrollWidth === 0 || scrollElement.clientWidth === 0) {
      // DOM henüz hazır değil, biraz bekleyip tekrar deneyelim
      setTimeout(() => this.calculateScrollInfo(container), 100)
      return
    }

    // İçerik genişliğini hesapla
    const contentWidth = scrollElement.scrollWidth

    // Görünür alan genişliğini al
    const viewportWidth = scrollElement.clientWidth

    // Görünmeyen (kaydırılabilir) alan genişliğini hesapla
    const hiddenAreaWidth = Math.max(0, contentWidth - viewportWidth)

    // Değişiklik olup olmadığını kontrol et (gereksiz güncellemeleri önle)
    const oldInfo = elements.scrollInfo
    if (
      oldInfo &&
      oldInfo.contentWidth === contentWidth &&
      oldInfo.viewportWidth === viewportWidth
    ) {
      // Değişiklik yok, güncelleme yapma
      return
    }

    // Bilgileri güncelle
    elements.scrollInfo = {
      contentWidth,
      viewportWidth,
      hiddenAreaWidth,
    }

    // Bilgileri sakla
    this.scrollInfoMap.set(container, elements.scrollInfo)

    this.debug(`Scroll bilgileri hesaplandı:`, {
      containerId: container.dataset.wheelScroll,
      container: container.className,
      contentWidth,
      viewportWidth,
      hiddenAreaWidth,
    })
  }

  /**
   * Buton event'lerini container'a ekler
   */
  private attachButtonEvents(elements: ContainerElements): void {
    const { container, leftButton, rightButton } = elements

    if (leftButton) {
      // Mevcut event listener'ları temizle
      const newLeftBtn = leftButton.cloneNode(true) as HTMLElement
      leftButton.parentNode?.replaceChild(newLeftBtn, leftButton)

      // Önbelleği güncelle
      elements.leftButton = newLeftBtn

      newLeftBtn.addEventListener('click', e => {
        e.preventDefault() // Varsayılan davranışı engelle
        this.debug(
          `Sol buton tıklandı: ${container.dataset.wheelScroll || container.className}`,
        )
        this.scrollContainer(container, 'left')
      })
    } else {
      this.debug(
        `Sol buton bulunamadı: ${container.dataset.wheelScroll || container.className}`,
      )
    }

    if (rightButton) {
      // Mevcut event listener'ları temizle
      const newRightBtn = rightButton.cloneNode(true) as HTMLElement
      rightButton.parentNode?.replaceChild(newRightBtn, rightButton)

      // Önbelleği güncelle
      elements.rightButton = newRightBtn

      newRightBtn.addEventListener('click', e => {
        e.preventDefault() // Varsayılan davranışı engelle
        this.debug(
          `Sağ buton tıklandı: ${container.dataset.wheelScroll || container.className}`,
        )
        this.scrollContainer(container, 'right')
      })
    } else {
      this.debug(
        `Sağ buton bulunamadı: ${container.dataset.wheelScroll || container.className}`,
      )
    }
  }

  /**
   * Tüm container'lar için buton durumlarını günceller
   * Debounce ile çağrılırsa, performans sorunu olmaz
   */
  private updateAllButtonStates(): void {
    // requestAnimationFrame içinde çalıştırarak tarayıcının yenileme döngüsüne uyum sağlıyoruz
    requestAnimationFrame(() => {
      this.containers.forEach(container => {
        this.updateButtonStates(container)
      })
    })
  }

  /**
   * Container için buton durumlarını günceller
   * Scroll eventi sırasında sık çağrılır, bu yüzden optimize edilmelidir
   */
  private updateButtonStates(container: HTMLElement): void {
    const elements = this.containerElementsCache.get(container)
    if (!elements) return

    const { scrollElement, leftButton, rightButton, scrollInfo } = elements

    if (!leftButton || !rightButton) return

    // Güncel scroll pozisyonu
    const scrollLeft = scrollElement.scrollLeft

    // Sadece rastgele örnekleme ile debug logları (performans için)
    if (this.debugMode && Math.random() < 0.05) {
      this.debug(`Scroll durumu:`, {
        containerId: container.dataset.wheelScroll,
        scrollLeft,
        hiddenAreaWidth: scrollInfo.hiddenAreaWidth,
      })
    }

    // Buton durumları için önceki değerleri kontrol etme
    // Bu şekilde DOM'a gereksiz yazma işlemi yapmıyoruz
    const leftDisabled = leftButton.hasAttribute('disabled')
    const rightDisabled = rightButton.hasAttribute('disabled')

    // İçerik kaydırılabilir değilse iki butonu da devre dışı bırak
    if (scrollInfo.hiddenAreaWidth <= 5) {
      if (!leftDisabled) this.disableButton(leftButton)
      if (!rightDisabled) this.disableButton(rightButton)
      return
    }

    // Sol buton durumu - sadece değişiklik varsa güncelle
    const shouldLeftBeDisabled = scrollLeft <= 5
    if (shouldLeftBeDisabled !== leftDisabled) {
      if (shouldLeftBeDisabled) {
        this.disableButton(leftButton)
      } else {
        this.enableButton(leftButton)
      }
    }

    // Sağ buton durumu - sadece değişiklik varsa güncelle
    const shouldRightBeDisabled = scrollLeft >= scrollInfo.hiddenAreaWidth - 5
    if (shouldRightBeDisabled !== rightDisabled) {
      if (shouldRightBeDisabled) {
        this.disableButton(rightButton)
      } else {
        this.enableButton(rightButton)
      }
    }
  }

  /**
   * Butonu devre dışı bırakır
   */
  private disableButton(button: HTMLElement): void {
    button.setAttribute('disabled', 'true')
    button.classList.add('disabled')
  }

  /**
   * Butonu etkinleştirir
   */
  private enableButton(button: HTMLElement): void {
    button.removeAttribute('disabled')
    button.classList.remove('disabled')
  }

  /**
   * Geliştirilmiş wheel event yönetimi
   * Yatay scrollun sonuna gelindiğinde dikey scrolla doğal bir geçiş sağlar
   */
  private attachWheelEvent(elements: ContainerElements): void {
    const { scrollElement, container } = elements

    // Eşik değerleri - bunları ihtiyaca göre ayarlayabilirsiniz
    const OVERFLOW_THRESHOLD = 0.08 // %15'lik bir eşik değeri

    // Son "aşırı" scroll miktarını takip etmek için değişken
    let overscrollAmount = 0
    let isOverscrolling = false
    let lastWheelTime = 0

    // Scroll olayında kullanacağımız debounced fonksiyon
    // Tarayıcı kendi scroll davranışını sürdürse bile, buton durumlarını güncellememiz gerekiyor
    const debouncedUpdateButtonState = this.debounce(() => {
      this.updateButtonStates(container)
    }, 100)

    scrollElement.addEventListener('wheel', e => {
      // Şu anki zaman
      const now = performance.now()

      // Mevcut scroll durumunu kontrol et
      const currentScrollLeft = scrollElement.scrollLeft
      const maxScrollLeft =
        scrollElement.scrollWidth - scrollElement.clientWidth

      // Scroll yönünü belirle
      const isScrollingRight = e.deltaY > 0

      // En sağdayız ve sağa kaydırmaya çalışıyoruz veya
      // En soldayız ve sola kaydırmaya çalışıyoruz
      const isAtRightEdge =
        Math.abs(currentScrollLeft - maxScrollLeft) < 2 && isScrollingRight
      const isAtLeftEdge = currentScrollLeft <= 2 && !isScrollingRight

      // Kenardayız ve kenara doğru kaydırmaya çalışıyoruz
      if (isAtRightEdge || isAtLeftEdge) {
        // Eğer zaten aşırı kaydırma modundaysak veya yeterince zaman geçtiyse overscroll miktarını sıfırla
        if (!isOverscrolling || now - lastWheelTime > 300) {
          overscrollAmount = 0
          isOverscrolling = true
        }

        // Aşırı kaydırma miktarını artır
        // E.deltaY'nin mutlak değerini alarak, her iki yöndeki overscroll için de aynı mantığı kullanıyoruz
        overscrollAmount += Math.abs(e.deltaY)

        // Eşik değerinin hesaplanması - scroll alanının genişliğine göre orantılı
        const thresholdPixels = scrollElement.clientWidth * OVERFLOW_THRESHOLD

        this.debug(
          `Aşırı kaydırma: ${overscrollAmount.toFixed(2)}px, Eşik: ${thresholdPixels.toFixed(2)}px`,
        )

        // Eşik değeri aşıldıysa, tarayıcının normal scroll davranışına izin ver
        if (overscrollAmount > thresholdPixels) {
          // Tarayıcının kendi scrollunu uygulasın
          // preventDefault() çağırmadan devam ediyoruz
          this.debug('Eşik aşıldı, dikey scrolla geçiliyor')

          // Buton durumlarını güncelleyelim
          debouncedUpdateButtonState()

          // Aşağıdaki satırları "devam ettir"
          lastWheelTime = now
          return
        }
      } else {
        // Kenarda değiliz, normal yatay kaydırma yapalım
        isOverscrolling = false
        overscrollAmount = 0
      }

      // Normal yatay kaydırma davranışını uygula (kenarlarda değilsek veya eşik aşılmadıysa)
      e.preventDefault()

      // Kaydırma miktarı - direction değişkeni pozitif değer için sağa, negatif değer için sola kaydırır
      const scrollAmount = e.deltaY

      // Kaydırmayı uygula
      scrollElement.scrollBy({
        left: scrollAmount,
        behavior: 'smooth', // Tarayıcı desteği varsa smooth scroll kullan
      })

      this.debug(
        `Wheel event: ${container.dataset.wheelScroll || container.className}, deltaY: ${e.deltaY}`,
      )

      // Son wheel zamanını güncelle
      lastWheelTime = now

      // Buton durumlarını güncelle
      this.throttledUpdateButtonStates(container)
    })

    // Touch olaylarını engellemiyoruz - mobil cihazlarda varsayılan davranışı koruyoruz
  }

  /**
   * Mobil cihazlar için daha uygun scroll animasyonu
   * Özellikle iOS için daha iyi çalışır
   */
  private simpleMobileScroll(
    element: HTMLElement,
    targetScrollLeft: number,
  ): void {
    const startScrollLeft = element.scrollLeft
    const distance = targetScrollLeft - startScrollLeft

    // Mesafe çok kısaysa, doğrudan atla
    if (Math.abs(distance) < 5) {
      element.scrollLeft = targetScrollLeft
      return
    }

    // Mobil için daha kısa bir animasyon süresi kullan (performans için)
    const duration = 200 // ms
    const startTime = performance.now()

    const animateScroll = (currentTime: number) => {
      const elapsedTime = currentTime - startTime
      const progress = Math.min(elapsedTime / duration, 1)

      // Basit bir ease-out fonksiyonu (mobil performans için optimize)
      const easedProgress = progress * (2 - progress)

      element.scrollLeft = startScrollLeft + distance * easedProgress

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  private smoothScrollTo(element: HTMLElement, targetScrollLeft: number): void {
    try {
      // İlk olarak native smooth scrollTo deneyelim
      element.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      })

      // Native scrollTo sonrasında bir animasyon kontrolü yapalım
      // Bazı tarayıcılar smooth behavior'u desteklemeyebilir
      const initialScrollLeft = element.scrollLeft

      // Timeout ile native scrollTo'nun çalışıp çalışmadığını kontrol et
      setTimeout(() => {
        // Eğer scroll pozisyonu değişmediyse, manuel animasyon uygula
        if (Math.abs(element.scrollLeft - initialScrollLeft) < 5) {
          this.debug(
            `Native smooth scroll çalışmadı, manuel animasyon başlıyor`,
          )
          this.animateScroll(element, initialScrollLeft, targetScrollLeft)
        }
      }, 50)
    } catch (error) {
      this.debug(`Smooth scroll hatası, manuel animasyona geçiliyor`, error)
      this.animateScroll(element, element.scrollLeft, targetScrollLeft)
    }
  }

  private animateScroll(
    element: HTMLElement,
    startScrollLeft: number,
    targetScrollLeft: number,
  ): void {
    const distance = targetScrollLeft - startScrollLeft

    // Mesafe çok azsa doğrudan atla
    if (Math.abs(distance) < 5) {
      element.scrollLeft = targetScrollLeft
      return
    }

    const duration = this.options.scrollDuration
    let startTime: number | null = null

    const step = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing fonksiyonu (ease-out)
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 2)
      const easedProgress = easeOut(progress)

      element.scrollLeft = startScrollLeft + distance * easedProgress

      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    window.requestAnimationFrame(step)
  }

  /**
   * ID ile container'ı yatay olarak kaydır
   * @param containerId Container ID değeri
   * @param direction Kaydırma yönü ('left' veya 'right')
   */
  public scrollContainerById(
    containerId: string,
    direction: 'left' | 'right',
  ): void {
    const container = this.getContainerById(containerId)
    if (container) {
      this.scrollContainer(container, direction)
    } else {
      this.debug(`Hata: '${containerId}' ID'li container bulunamadı`)
    }
  }
}

export { WheelScroll }
