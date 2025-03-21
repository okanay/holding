interface LazyLoadOptions {
  imageSelector: string
  rootMargin?: string
  threshold?: number
  dataAttribute?: string
  onLoadCallback?: (img: HTMLImageElement) => void
  filterStyle?: string
  maxConcurrentLoads?: number // Aynı anda yüklenebilecek maksimum görsel sayısı
}

class LazyImageLoadController {
  private imageSelector: string
  private rootMargin: string
  private threshold: number
  private dataAttribute: string
  private onLoadCallback?: (img: HTMLImageElement) => void
  private filterStyle: string
  private maxConcurrentLoads: number

  // Yeni eklenen özellikler
  private observer: IntersectionObserver
  private observedImages: Set<HTMLImageElement> = new Set()
  private loadingImages: Set<HTMLImageElement> = new Set()
  private imageQueue: HTMLImageElement[] = []

  constructor(options: LazyLoadOptions) {
    const {
      imageSelector,
      rootMargin = '50px 0px',
      threshold = 0.1,
      dataAttribute = 'data-src',
      onLoadCallback,
      filterStyle = 'blur(10px)',
      maxConcurrentLoads = 3,
    } = options

    this.imageSelector = imageSelector
    this.rootMargin = rootMargin
    this.threshold = threshold
    this.dataAttribute = dataAttribute
    this.onLoadCallback = onLoadCallback
    this.filterStyle = filterStyle
    this.maxConcurrentLoads = maxConcurrentLoads

    // Observer'ı constructor'da bir kere oluştur
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: this.rootMargin,
        threshold: this.threshold,
      },
    )

    this.init()
  }

  private init(): void {
    const images = document.querySelectorAll<HTMLImageElement>(
      this.imageSelector,
    )
    this.observe(images)
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
    const highResSrc = img.getAttribute(this.dataAttribute)
    if (!highResSrc || this.loadingImages.has(img)) return

    this.loadingImages.add(img)

    // Önbelleğe alma işlemi
    const tempImage = new Image()

    tempImage.onload = () => {
      img.style.filter = this.filterStyle
      img.src = highResSrc
      this.handleImageLoad(img)

      // Sıradaki görseli yükle
      if (this.imageQueue.length > 0) {
        const nextImage = this.imageQueue.shift()
        if (nextImage) this.loadImage(nextImage)
      }
    }

    tempImage.onerror = () => {
      this.loadingImages.delete(img)
      console.error(`Error loading image: ${highResSrc}`)

      // Hata durumunda da sıradaki görseli yükle
      if (this.imageQueue.length > 0) {
        const nextImage = this.imageQueue.shift()
        if (nextImage) this.loadImage(nextImage)
      }
    }

    tempImage.src = highResSrc
  }

  private handleImageLoad(img: HTMLImageElement): void {
    img.style.filter = 'none'
    img.removeAttribute(this.dataAttribute)
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
    const notLoadedImages = Array.from(images).filter(img => {
      const highResSrc = img.getAttribute(this.dataAttribute)
      return (
        highResSrc &&
        img.src !== highResSrc &&
        !this.observedImages.has(img) &&
        !this.loadingImages.has(img)
      )
    })

    notLoadedImages.forEach(img => {
      this.observer.observe(img)
      this.observedImages.add(img)
    })
  }

  public disconnect(): void {
    this.observer.disconnect()
    this.observedImages.clear()
    this.loadingImages.clear()
    this.imageQueue = []
  }
}

export { LazyImageLoadController }
