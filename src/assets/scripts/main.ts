import { WheelScroll } from './packages/wheel-scroll.js'

document.addEventListener('DOMContentLoaded', function () {
  // DOM Elementlerini seç ve tipleri belirle
  const slider: HTMLElement | null = document.getElementById('main-slider')
  const sliderTrack: HTMLElement | null =
    slider?.querySelector('.slider-track') || null
  const navDots: NodeListOf<HTMLElement> = document.querySelectorAll('.nav-dot')

  // Slider bulunamazsa erken çık
  if (!slider || !sliderTrack) {
    console.error('Slider veya slider track element bulunamadı!')
    return
  }

  // Toplam slide sayısını al
  const totalSlides: number = parseInt(
    slider.getAttribute('data-total-slides') || '0',
    10,
  )

  // Otomatik geçiş için global değişkenler
  let intervalId: number | null = null
  let controller: AbortController = new AbortController()

  /**
   * Belirtilen indekse göre slider durumunu günceller
   * @param {number} slideIndex - Gösterilecek slayt indeksi
   */
  function updateSlide(slideIndex: number): void {
    // Geçersiz indeks kontrolü
    if (slideIndex < 0 || slideIndex >= totalSlides) {
      console.warn(
        `Geçersiz slide indeksi: ${slideIndex}. İndeks 0 ile ${totalSlides - 1} arasında olmalıdır.`,
      )
      return
    }

    // data-active özniteliğini güncelle
    slider!.setAttribute('data-active', slideIndex.toString())

    // Transform değerini dinamik olarak hesapla ve uygula
    const transformValue: string = `translateX(-${slideIndex * 100}%)`
    sliderTrack!.style.transform = transformValue

    // Navigasyon noktalarını güncelle
    navDots.forEach((dot: HTMLElement) => {
      const dotIndex: number = parseInt(
        dot.getAttribute('data-slide-target') || '0',
        10,
      )
      dot.setAttribute('data-active', dotIndex === slideIndex ? 'yes' : 'no')
    })
  }

  /**
   * Otomatik slide geçişini başlatır
   */
  function startAutoSlide(): void {
    // Eğer hali hazırda çalışan bir interval varsa temizle
    if (intervalId !== null) {
      window.clearInterval(intervalId)
    }

    // Yeni bir AbortController oluştur
    controller = new AbortController()

    // Yeni interval başlat
    intervalId = window.setInterval(() => {
      // Şu anki aktif slaytı al
      const activeSlide: number = parseInt(
        slider!.getAttribute('data-active') || '0',
        10,
      )

      // Sonraki slaytı hesapla (son slayttaysa başa dön)
      const nextSlide: number =
        totalSlides - 1 === activeSlide ? 0 : activeSlide + 1

      // Slaytı güncelle
      updateSlide(nextSlide)
    }, 5000) // 5 saniyede bir değişim
  }

  /**
   * Manuel geçiş için otomatik geçişi durdur ve yeniden başlat
   */
  function resetAutoSlide(): void {
    // Mevcut AbortController'ı iptal et
    controller.abort()

    // Interval'i temizle
    if (intervalId !== null) {
      window.clearInterval(intervalId)
      intervalId = null
    }

    // Yeniden otomatik geçişi başlat
    startAutoSlide()
  }

  // Event listener tipleri için interface tanımları
  interface SlideClickEvent extends Event {
    target: HTMLElement
  }

  // Navigasyon noktalarına tıklama olaylarını ekle
  navDots.forEach((dot: HTMLElement) => {
    dot.addEventListener(
      'click',
      function (this: HTMLElement) {
        const targetSlideAttr: string | null =
          this.getAttribute('data-slide-target')
        if (targetSlideAttr === null) return

        const targetSlide: number = parseInt(targetSlideAttr, 10)
        updateSlide(targetSlide)

        // Kullanıcı manuel geçiş yaptığında otomatik geçişi sıfırla
        resetAutoSlide()
      },
      { signal: controller.signal },
    )
  })

  // Sliderın kendisine tıklama durumunda da otomatik geçişi sıfırla
  slider.addEventListener(
    'click',
    function (e: Event) {
      const event = e as SlideClickEvent
      // Sadece slider'a tıklanırsa (navigasyon noktaları dışında)
      if (event.target !== slider) return

      resetAutoSlide()
    },
    { signal: controller.signal },
  )

  // Touch olayları için (mobil cihazlar)
  slider.addEventListener('touchstart', resetAutoSlide, {
    signal: controller.signal,
    passive: true,
  })

  // İlk slide'ı ayarla
  updateSlide(0)

  // Otomatik slide geçişini başlat
  startAutoSlide()
})

document.addEventListener('DOMContentLoaded', function (): void {
  // Tip tanımlamaları
  type TabState = 'open' | 'close'

  // Tüm feature-dialog butonlarını seç
  const dialogButtons: NodeListOf<HTMLButtonElement> =
    document.querySelectorAll('.feature-dialog')

  // Tüm feature menülerini saklamak için bir harita
  const featureMenus: Map<string, HTMLElement> = new Map()

  // İlk render için dialog butonlarını ve hedeflerini işle
  dialogButtons.forEach((button: HTMLButtonElement): void => {
    const targetId: string | null = button.getAttribute('data-target')

    if (!targetId) return

    const targetElement: HTMLElement | null = document.getElementById(targetId)

    if (targetElement) {
      // Hedef elemanlara erişmek için haritaya ekle
      featureMenus.set(targetId, targetElement)

      // Başlangıçta active durumunu ayarla
      const isActive: boolean = button.getAttribute('data-active') === 'open'

      if (isActive) {
        // Aktif buton
        button.setAttribute('data-active', 'open')
        targetElement.setAttribute('data-active', 'open')
      } else {
        // Pasif buton
        button.setAttribute('data-active', 'close')
        targetElement.setAttribute('data-active', 'close')
      }
    }
  })

  /**
   * Belirli bir tab'ı açıp diğerlerini kapatır
   * @param targetId - Açılacak tab'ın ID'si
   */
  const activateTab = (targetId: string): void => {
    // Tüm butonları ve menüleri kapat
    dialogButtons.forEach((btn: HTMLButtonElement): void => {
      btn.setAttribute('data-active', 'close')

      const btnTargetId: string | null = btn.getAttribute('data-target')
      if (!btnTargetId) return

      const targetMenu: HTMLElement | undefined = featureMenus.get(btnTargetId)
      if (targetMenu) {
        targetMenu.setAttribute('data-active', 'close')
      }
    })

    // Hedef butonu ve menüyü aç
    const selectedButton: HTMLButtonElement | undefined = Array.from(
      dialogButtons,
    ).find(
      (btn: HTMLButtonElement): boolean =>
        btn.getAttribute('data-target') === targetId,
    )

    if (selectedButton) {
      selectedButton.setAttribute('data-active', 'open')
    }

    const targetMenu: HTMLElement | undefined = featureMenus.get(targetId)
    if (targetMenu) {
      targetMenu.setAttribute('data-active', 'open')
    }
  }

  // Click event listener'ı ekle
  dialogButtons.forEach((button: HTMLButtonElement): void => {
    button.addEventListener('click', function (this: HTMLButtonElement): void {
      const targetId: string | null = this.getAttribute('data-target')
      if (targetId) {
        activateTab(targetId)
      }
    })
  })

  // Mobil dropdown için aynı fonksiyonaliteyi ekle (eğer varsa)
  const mobileDropdown: HTMLSelectElement | null = document.querySelector(
    'select.feature-mobile-selector',
  )
  if (mobileDropdown) {
    mobileDropdown.addEventListener(
      'change',
      function (this: HTMLSelectElement): void {
        const targetId: string = this.value
        if (targetId) {
          activateTab(targetId)
        }
      },
    )
  }
})

document.addEventListener('DOMContentLoaded', function (): void {
  new WheelScroll({ debugMode: false })
})
