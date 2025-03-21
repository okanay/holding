interface ScrollObserver {
  onScroll(scrollY: number): void
}

class ScrollManager {
  private observers: Set<ScrollObserver> = new Set()
  private lastScrollY: number = 0
  private scrollTimeout?: number
  private throttleDelay: number

  constructor(throttleDelay: number = 100) {
    this.throttleDelay = throttleDelay
    this.setupScrollListener()
  }

  private setupScrollListener(): void {
    window.addEventListener(
      'scroll',
      () => {
        if (this.scrollTimeout !== undefined) {
          window.cancelAnimationFrame(this.scrollTimeout)
        }
        this.scrollTimeout = window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          if (Math.abs(currentScrollY - this.lastScrollY) < 50) {
            this.notifyObservers(currentScrollY)
          }
          this.lastScrollY = currentScrollY
        })
      },
      { passive: true },
    )
  }

  private notifyObservers(scrollY: number): void {
    this.observers.forEach(observer => observer.onScroll(scrollY))
  }

  public addObserver(observer: ScrollObserver): void {
    this.observers.add(observer)
  }

  public removeObserver(observer: ScrollObserver): void {
    this.observers.delete(observer)
  }
}

class ElementTracker {
  private element: HTMLElement
  private resizeObserver: ResizeObserver | undefined
  private rect: DOMRect

  constructor(element: HTMLElement) {
    this.element = element
    this.rect = element.getBoundingClientRect()
    this.setupResizeObserver()
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(
      this.throttle(() => this.updateRect(), 250),
    )
    this.resizeObserver.observe(this.element)
  }

  private throttle(func: Function, limit: number): () => void {
    let inThrottle: boolean
    return () => {
      if (!inThrottle) {
        func()
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }

  public updateRect(): void {
    this.rect = this.element.getBoundingClientRect()
  }

  public getRect(): DOMRect {
    return this.rect
  }

  public getTopPosition(): number {
    return this.rect.top + window.scrollY
  }

  public getBottomPosition(): number {
    return this.rect.bottom + window.scrollY
  }

  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
  }
}

export { ScrollManager, ElementTracker }
