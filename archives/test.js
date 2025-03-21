document.addEventListener('DOMContentLoaded', () => {
  /**
   * Basit HTML Repeater - HTML elemanlarını saf HTML olarak kopyalar
   * @param {string} sourceSelector - Kopyalanacak elemanın CSS seçicisi
   * @param {string} targetSelector - Hedef konteynerin CSS seçicisi
   * @param {Object} options - Opsiyonel yapılandırma ayarları
   * @param {Array<string>} options.removeAttr - Kopyalanan elemandan silinecek öznitelik listesi
   * @param {string} options.idPattern - ID'lere eklenecek desen (default: rastgele string)
   * @returns {HTMLElement|null} - Kopyalanan eleman veya hata durumunda null
   */
  window.Repeater = function (sourceSelector, targetSelector, options = {}) {
    // Varsayılan ayarları tanımla
    const defaultOptions = {
      removeAttr: [], // Silinecek öznitelik listesi
      idPattern: generateUniqueId(), // Varsayılan olarak rastgele benzersiz ID
    }

    // Kullanıcı tarafından sağlanan ayarları birleştir
    const settings = { ...defaultOptions, ...options }

    // Kopyalanacak elementi seç
    const sourceElement = document.querySelector(sourceSelector)
    if (!sourceElement) {
      console.error(`Kaynak element bulunamadı: ${sourceSelector}`)
      return null
    }

    // Hedef elementi seç
    const targetElement = document.querySelector(targetSelector)
    if (!targetElement) {
      console.error(`Hedef element bulunamadı: ${targetSelector}`)
      return null
    }

    try {
      // HTML olarak kopyala - bu sayede temiz bir kopyalama yapılır
      const htmlContent = sourceElement.outerHTML

      // Geçici bir div oluştur ve HTML'i içine yerleştir
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent

      // HTML'den yeni elementi al
      const newElement = tempDiv.firstChild

      // Tüm input, select ve label elemanlarının ID, name, for değerlerini güncelle
      updateElementIds(newElement, settings.idPattern)

      // Belirtilen özellikleri sil
      removeAttributes(newElement, settings.removeAttr)

      // Input değerlerini sıfırla
      resetInputValues(newElement)

      // Yeni elementi hedef alana ekle
      targetElement.appendChild(newElement)

      return newElement
    } catch (error) {
      console.error('Repeater hatası:', error)
      return null
    }
  }

  /**
   * Benzersiz bir kimlik oluşturur
   * @returns {string} - Benzersiz kimlik
   */
  function generateUniqueId() {
    return Math.random().toString(36).substring(2, 9)
  }

  /**
   * Element içindeki ID, name ve for özelliklerini günceller
   * @param {HTMLElement} element - İşlenecek element
   * @param {string} idPattern - Eklenecek benzersiz kimlik veya desen
   */
  function updateElementIds(element, idPattern) {
    // ID özelliğini güncelle
    if (element.id) {
      element.id = `${element.id}-${idPattern}`
    }

    // name özelliğini güncelle
    if (element.name) {
      element.name = `${element.name}-${idPattern}`
    }

    // for özelliğini güncelle (label elementleri için)
    if (element.hasAttribute('for')) {
      element.setAttribute('for', `${element.getAttribute('for')}-${idPattern}`)
    }

    // Alt elementleri işle
    if (element.children && element.children.length > 0) {
      Array.from(element.children).forEach(child => {
        updateElementIds(child, idPattern)
      })
    }
  }

  /**
   * Belirtilen özellikleri elemandan ve alt elemanlarından siler
   * @param {HTMLElement} element - İşlenecek element
   * @param {Array<string>} attrList - Silinecek öznitelik listesi
   */
  function removeAttributes(element, attrList) {
    if (!attrList || !attrList.length) return

    // Belirtilen özellikleri elemandan sil
    attrList.forEach(attr => {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr)
      }
    })

    // data-attr ile başlayan tüm özellikleri kontrol et ve sil
    const dataAttrs = []
    for (let i = 0; i < element.attributes.length; i++) {
      const attrName = element.attributes[i].name
      if (
        attrList.some(pattern => {
          // Tam eşleşme veya * ile biten wildcard desteği
          if (pattern.endsWith('*')) {
            const prefix = pattern.slice(0, -1)
            return attrName.startsWith(prefix)
          }
          return attrName === pattern
        })
      ) {
        dataAttrs.push(attrName)
      }
    }

    // Topladığımız öznitelikleri sil
    dataAttrs.forEach(attr => {
      element.removeAttribute(attr)
    })

    // Alt elemanları işle
    if (element.children && element.children.length > 0) {
      Array.from(element.children).forEach(child => {
        removeAttributes(child, attrList)
      })
    }
  }

  /**
   * Elementin içindeki input, select, textarea değerlerini sıfırlar
   * @param {HTMLElement} element - İşlenecek element
   */
  function resetInputValues(element) {
    // Tüm form elemanlarını seç
    const formElements = element.querySelectorAll('input, select, textarea')

    formElements.forEach(el => {
      if (el.tagName === 'INPUT') {
        const inputType = el.type.toLowerCase()

        switch (inputType) {
          case 'text':
          case 'email':
          case 'tel':
          case 'password':
          case 'url':
          case 'number':
          case 'search':
          case 'date':
          case 'time':
          case 'datetime-local':
          case 'month':
          case 'week':
          case 'color':
            el.value = ''
            break

          case 'checkbox':
          case 'radio':
            el.checked = false
            break

          case 'file':
            // File input'u sıfırlamak için
            try {
              el.value = ''
            } catch (e) {
              // Bazı tarayıcılarda file input değerini sıfırlamak için
              // yeni bir element oluşturmak gerekebilir
              const newFileInput = document.createElement('input')
              newFileInput.type = 'file'
              if (el.multiple) newFileInput.multiple = el.multiple
              if (el.accept) newFileInput.accept = el.accept
              if (el.className) newFileInput.className = el.className
              if (el.id) newFileInput.id = el.id
              if (el.name) newFileInput.name = el.name
              el.parentNode.replaceChild(newFileInput, el)
            }
            break
        }
      } else if (el.tagName === 'SELECT') {
        // Select elemanı için ilk seçeneği seç veya seçimi temizle
        if (el.options.length > 0) {
          el.selectedIndex = 0
        }
      } else if (el.tagName === 'TEXTAREA') {
        el.value = ''
      }
    })

    // Önizleme div'leri veya benzer alanları temizle
    const previewElements = element.querySelectorAll('[id$="-preview"]')
    previewElements.forEach(preview => {
      // Önizleme alanını varsayılan haline döndür
      preview.innerHTML = ''
    })
  }
})
