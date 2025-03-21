interface LazyLoadOptions {
  imageSelector: string
  rootMargin?: string
  threshold?: number
  onLoadCallback?: (img: HTMLImageElement) => void
  filterStyle?: string
  maxConcurrentLoads?: number
}

class PictureLazyLoadController {
  private imageSelector: string
  private rootMargin: string
  private threshold: number
  private onLoadCallback?: (img: HTMLImageElement) => void
  private filterStyle: string
  private maxConcurrentLoads: number

  private observer: IntersectionObserver
  private observedImages: Set<HTMLImageElement> = new Set()
  private loadingImages: Set<HTMLImageElement> = new Set()
  private imageQueue: HTMLImageElement[] = []
  private loadedSources: Map<HTMLSourceElement, string> = new Map()
  private resizeTimeout: number | null = null

  constructor(options: LazyLoadOptions) {
    const {
      imageSelector,
      rootMargin = '50px 0px',
      threshold = 0.1,
      onLoadCallback,
      filterStyle = 'blur(10px)',
      maxConcurrentLoads = 3,
    } = options

    this.imageSelector = imageSelector
    this.rootMargin = rootMargin
    this.threshold = threshold
    this.onLoadCallback = onLoadCallback
    this.filterStyle = filterStyle
    this.maxConcurrentLoads = maxConcurrentLoads

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: this.rootMargin,
        threshold: this.threshold,
      },
    )

    this.init()
    this.setupResizeHandler()
  }

  private init(): void {
    const images = document.querySelectorAll<HTMLImageElement>(
      this.imageSelector,
    )
    this.observe(images)
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      if (this.resizeTimeout) {
        window.clearTimeout(this.resizeTimeout)
      }

      this.resizeTimeout = window.setTimeout(() => {
        this.handleResize()
      }, 100)
    })
  }

  private handleResize(): void {
    const images = document.querySelectorAll<HTMLImageElement>(
      this.imageSelector,
    )

    images.forEach(img => {
      const picture = img.closest('picture')
      if (picture) {
        this.updateSourcesForCurrentBreakpoint(picture)
      }
    })
  }

  private updateSourcesForCurrentBreakpoint(picture: HTMLPictureElement): void {
    const sources = Array.from(picture.querySelectorAll('source'))
    const img = picture.querySelector('img')

    let matchingSource: HTMLSourceElement | null = null

    // Ekran boyutuna göre uygun source'u bul
    for (const source of sources) {
      const media = source.getAttribute('media')
      if (media && window.matchMedia(media).matches) {
        matchingSource = source
        break
      }
    }

    if (matchingSource) {
      // Bu source için daha önce yüksek kaliteli görsel yüklendi mi kontrol et
      const loadedSrc = this.loadedSources.get(matchingSource)
      if (loadedSrc) {
        matchingSource.srcset = loadedSrc
      } else {
        // Yüklenmemişse yükle
        const highResSrc = matchingSource.getAttribute('data-srcset')
        if (highResSrc) {
          this.loadImageForSource(matchingSource, highResSrc)
        }
      }
    }
  }

  private loadImageForSource(source: HTMLSourceElement, src: string): void {
    const tempImage = new Image()

    tempImage.onload = () => {
      source.srcset = src
      this.loadedSources.set(source, src)
    }

    tempImage.src = src
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        this.queueImageLoad(img)
      }
    })
  }

  private queueImageLoad(img: HTMLImageElement): void {
    if (this.loadingImages.size < this.maxConcurrentLoads) {
      this.loadImage(img)
    } else {
      this.imageQueue.push(img)
    }
  }

  private loadImage(img: HTMLImageElement): void {
    if (this.loadingImages.has(img)) return

    this.loadingImages.add(img)
    const picture = img.closest('picture')

    if (picture) {
      const sources = Array.from(picture.querySelectorAll('source'))
      let matchingSource: HTMLSourceElement | null = null

      for (const source of sources) {
        const media = source.getAttribute('media')
        if (media && window.matchMedia(media).matches) {
          matchingSource = source
          break
        }
      }

      if (matchingSource) {
        const highResSrc = matchingSource.getAttribute('data-srcset')
        if (highResSrc) {
          const tempImage = new Image()

          tempImage.onload = () => {
            matchingSource!.srcset = highResSrc
            this.loadedSources.set(matchingSource!, highResSrc)
            this.handleImageLoad(img)

            if (this.imageQueue.length > 0) {
              const nextImage = this.imageQueue.shift()
              if (nextImage) this.loadImage(nextImage)
            }
          }

          tempImage.onerror = () => {
            this.loadingImages.delete(img)
            console.error(`Error loading image: ${highResSrc}`)

            if (this.imageQueue.length > 0) {
              const nextImage = this.imageQueue.shift()
              if (nextImage) this.loadImage(nextImage)
            }
          }

          tempImage.src = highResSrc
        }
      } else {
        // Fallback image için yükleme
        const highResSrc = img.getAttribute('data-src')
        if (highResSrc) {
          const tempImage = new Image()

          tempImage.onload = () => {
            img.src = highResSrc
            this.handleImageLoad(img)

            if (this.imageQueue.length > 0) {
              const nextImage = this.imageQueue.shift()
              if (nextImage) this.loadImage(nextImage)
            }
          }

          tempImage.src = highResSrc
        }
      }
    }
  }

  private handleImageLoad(img: HTMLImageElement): void {
    img.style.filter = 'none'
    this.observer.unobserve(img)
    this.observedImages.delete(img)
    this.loadingImages.delete(img)

    if (this.onLoadCallback) {
      this.onLoadCallback(img)
    }
  }

  public observe(
    images: NodeListOf<HTMLImageElement> | HTMLImageElement[],
  ): void {
    Array.from(images).forEach(img => {
      if (!this.observedImages.has(img) && !this.loadingImages.has(img)) {
        this.observer.observe(img)
        this.observedImages.add(img)
      }
    })
  }

  public disconnect(): void {
    this.observer.disconnect()
    this.observedImages.clear()
    this.loadingImages.clear()
    this.imageQueue = []
    this.loadedSources.clear()
    if (this.resizeTimeout) {
      window.clearTimeout(this.resizeTimeout)
    }
  }
}

export { PictureLazyLoadController }
