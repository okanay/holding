interface ScrollObserverOptions {
  /**
   * Scroll pozisyonu değiştiğinde tetiklenecek callback
   */
  onScroll?: (state: ScrollState) => void

  /**
   * Takip edilecek scroll hedefi (default: document)
   */
  target?: string | HTMLElement | Document

  /**
   * Offset değeri (px veya % cinsinden)
   * Örnek: 20 (piksel) veya '5%' (viewport yüksekliğinin yüzdesi)
   */
  offset?: number | string

  /**
   * Debounce değeri (ms cinsinden)
   */
  debounceTime?: number
}

interface ScrollState {
  /**
   * Scroll pozisyonu (yüzde olarak 0-100)
   */
  percentage: number

  /**
   * Scroll yönü ('up' ya da 'down')
   */
  direction: 'up' | 'down'

  /**
   * Scroll pozisyonu ('top', 'middle', 'bottom')
   */
  position: 'top' | 'middle' | 'bottom'

  /**
   * Scroll değeri (piksel)
   */
  scrollY: number

  /**
   * Hedef elementin toplam yüksekliği
   */
  maxScroll: number
}

class ScrollObserver {
  private options: ScrollObserverOptions
  private elements: HTMLElement[] = []
  private lastScrollY = 0
  private target: HTMLElement | Document
  private debouncedProcessScroll: (...args: any[]) => void
  private boundHandleScroll: EventListenerOrEventListenerObject
  private boundHandleResize: EventListenerOrEventListenerObject
  private isDestroyed = false

  constructor(options: ScrollObserverOptions = {}) {
    this.options = {
      offset: 240, // Varsayılan olarak 240px
      debounceTime: 20,
      target: document as Document,
      ...options,
    }

    this.target = this.resolveTarget()

    // Bound event handler'ları bir kez oluştur
    this.boundHandleScroll = this.handleScroll.bind(this)
    this.boundHandleResize = this.handleResize.bind(this)

    // Debounce fonksiyonunu uygula
    this.debouncedProcessScroll = this.debounce(() => {
      if (!this.isDestroyed) {
        this.processScroll()
      }
    }, this.options.debounceTime || 100)

    this.init()
  }

  /**
   * Debounce fonksiyonu - art arda gelen çağrıları tek bir çağrıya indirgeyerek performansı artırır
   */
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

  /**
   * Hedef elementi belirler
   */
  private resolveTarget(): HTMLElement | Document {
    if (typeof this.options.target === 'string') {
      const targetElement = document.querySelector(this.options.target)
      if (targetElement) {
        return targetElement as HTMLElement
      }
    } else if (this.options.target instanceof HTMLElement) {
      return this.options.target
    }

    return document
  }

  /**
   * Scroll listener'ları başlatır
   */
  private init(): void {
    const scrollTarget = this.target === document ? window : this.target

    // Passive true ile event listener'ları ekle
    scrollTarget.addEventListener('scroll', this.boundHandleScroll, {
      passive: true,
    })
    window.addEventListener('resize', this.boundHandleResize, { passive: true })

    // İlk yükleme durumu için anında çalıştır - requestAnimationFrame ile
    requestAnimationFrame(() => {
      this.collectElements()
      this.processScroll()
    })
  }

  /**
   * Resize event handler
   */
  private handleResize(): void {
    this.collectElements()
    this.debouncedProcessScroll()
  }

  /**
   * 'scroll-observer' class'ına sahip elementleri toplar
   */
  private collectElements(): void {
    this.elements = Array.from(document.querySelectorAll('.scroll-observer'))
  }

  /**
   * Scroll event handler
   */
  private handleScroll(): void {
    // Throttle yerine debounce kullan
    this.debouncedProcessScroll()
  }

  /**
   * Scroll durumunu hesaplar ve elementlere uygular
   */
  private processScroll(): void {
    if (this.isDestroyed) return

    const scrollY = this.getScrollTop()
    const maxScroll = this.getScrollHeight() - this.getViewportHeight()

    // Division by zero'dan kaçın
    const scrollPercentage =
      maxScroll <= 0
        ? 0
        : Math.min(Math.max(0, (scrollY / maxScroll) * 100), 100)

    const scrollState: ScrollState = {
      percentage: scrollPercentage,
      direction: scrollY > this.lastScrollY ? 'down' : 'up',
      position: this.getScrollPosition(scrollPercentage),
      scrollY,
      maxScroll,
    }

    // Observer'ları güncelle - requestAnimationFrame ile DOM manipülasyonlarını grupla
    requestAnimationFrame(() => {
      if (this.isDestroyed) return

      // Observer'ları güncelle
      this.updateElements(scrollState)

      // Callback'i çağır
      if (this.options.onScroll) {
        this.options.onScroll(scrollState)
      }
    })

    this.lastScrollY = scrollY
  }

  /**
   * Scroll pozisyonunu alır
   */
  private getScrollTop(): number {
    return this.target === document
      ? window.pageYOffset || document.documentElement.scrollTop
      : (this.target as HTMLElement).scrollTop
  }

  /**
   * Scroll yapılabilir toplam yüksekliği alır
   */
  private getScrollHeight(): number {
    return this.target === document
      ? Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight,
        )
      : (this.target as HTMLElement).scrollHeight
  }

  /**
   * Görünür viewport yüksekliğini alır
   */
  private getViewportHeight(): number {
    return this.target === document
      ? window.innerHeight
      : (this.target as HTMLElement).clientHeight
  }

  /**
   * Scroll pozisyonuna göre 'top', 'middle', 'bottom' değerlerinden birini döndürür
   */
  private getScrollPosition(percentage: number): 'top' | 'middle' | 'bottom' {
    if (percentage < 10) return 'top'
    if (percentage > 90) return 'bottom'
    return 'middle'
  }

  /**
   * Offset değerini piksel cinsinden hesaplar
   * Yüzde olarak girilmiş offset değerlerini viewport yüksekliğine göre hesaplar
   */
  private calculateOffset(offsetValue: string | number | undefined): number {
    if (offsetValue === undefined) return 0

    // Eğer offset bir sayı ise, doğrudan piksel değeri olarak kullan
    if (typeof offsetValue === 'number') return offsetValue

    // Eğer offset bir string ve % içeriyorsa, viewport yüksekliğinin yüzdesi olarak hesapla
    if (typeof offsetValue === 'string' && offsetValue.includes('%')) {
      const percentage = parseFloat(offsetValue) / 100
      return this.getViewportHeight() * percentage
    }

    // Diğer durumlarda, string'i sayıya çevir (px değeri olarak)
    return parseInt(offsetValue, 10) || 0
  }

  private updateElements(state: ScrollState): void {
    // Element sayısına göre performans optimizasyonu
    if (this.elements.length === 0) return

    // Memoize offset hesaplamalarını - gereksiz yeniden hesaplamaları önle
    const offsetCache = new Map<string, number>()

    this.elements.forEach(element => {
      // Tüm elementlere scroll state'i uygula
      element.dataset.scroll = state.position
      element.dataset.scrollDirection = state.direction
      element.dataset.scrollPercentage = Math.round(state.percentage).toString()

      // Element bazlı offset kontrolü - yüzde veya piksel değeri olabilir
      let elementOffsetValue =
        element.dataset.scrollOffset || this.options.offset?.toString() || '0'

      // Cache'den offset değerini al veya hesapla
      let elementOffset: number
      if (offsetCache.has(elementOffsetValue)) {
        elementOffset = offsetCache.get(elementOffsetValue)!
      } else {
        elementOffset = this.calculateOffset(elementOffsetValue)
        offsetCache.set(elementOffsetValue, elementOffset)
      }

      // Orijinal offset değerini de saklayalım (debug için)
      element.dataset.scrollOffsetValue = elementOffsetValue.toString()
      element.dataset.scrollOffsetPixels = Math.round(elementOffset).toString()

      // Offset değerine göre 'yes/no' state'i
      const isPassedOffset = state.scrollY > elementOffset
      element.dataset.scrollPassed = isPassedOffset ? 'yes' : 'no'

      // Özel scroll target kontrolü
      const scrollTargetSelector = element.dataset.scrollTarget
      if (scrollTargetSelector) {
        const scrollTarget = document.querySelector(scrollTargetSelector)
        if (scrollTarget) {
          const targetRect = scrollTarget.getBoundingClientRect()

          // Hedef görünür mü?
          const isVisible =
            targetRect.top < window.innerHeight && targetRect.bottom > 0
          element.dataset.scrollTargetVisible = isVisible ? 'yes' : 'no'

          // Hedefin ne kadarı görünür?
          const visiblePercentage = this.calculateVisiblePercentage(targetRect)
          element.dataset.scrollTargetPercentage =
            Math.round(visiblePercentage).toString()
        }
      }
    })
  }

  /**
   * Bir elementin ekranda ne kadar göründüğünü hesaplar (%)
   */
  private calculateVisiblePercentage(rect: DOMRect): number {
    const windowHeight = window.innerHeight

    if (rect.top >= windowHeight || rect.bottom <= 0) {
      return 0
    }

    const visibleTop = Math.max(0, rect.top)
    const visibleBottom = Math.min(windowHeight, rect.bottom)
    const visibleHeight = visibleBottom - visibleTop

    return (visibleHeight / rect.height) * 100
  }

  /**
   * Yeni elementleri gözlemlemek için observer'ı günceller
   */
  public refresh(): void {
    if (this.isDestroyed) return
    this.collectElements()
    this.processScroll()
  }

  /**
   * Observer'ı temizler
   */
  public destroy(): void {
    this.isDestroyed = true

    const scrollTarget = this.target === document ? window : this.target
    scrollTarget.removeEventListener('scroll', this.boundHandleScroll)
    window.removeEventListener('resize', this.boundHandleResize)

    // Referansları temizle
    this.elements = []
  }
}

export { ScrollObserver }
