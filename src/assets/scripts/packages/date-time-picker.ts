/**
 * Aşama 1: Interface ve Tip Tanımlamaları
 */
// Default CSS sınıfları
const DEFAULT_CLASSES = {
  calendar: {
    grid: 'calendar-grid',
    dayHeader: 'day-header',
  },
  wrapper: {
    base: 'wrapper',
    hidden: 'date-hidden',
    visible: 'date-visible', // Yeni eklendi - görünür durum için
  },
  month: {
    container: 'month-container',
    current: 'month-current',
    pointer: {
      prev: {
        base: 'prev-pointer',
        disabled: 'prev-disabled',
      },
      next: {
        base: 'next-pointer',
        disabled: 'next-disabled',
      },
    },
  },
  day: {
    base: 'day',
    disabled: 'day-disabled',
    selected: 'day-selected',
    empty: 'day-empty',
    today: 'day-today',
  },
  time: {
    container: 'time-container',
    column: 'time-column',
    display: 'time-display',
    button: 'time-btn',
    separator: 'time-separator',
    ampm: {
      container: 'ampm-container',
      button: 'ampm-btn',
      selected: 'ampm-selected',
    },
  },
} as const

/**
 * Dil yapılandırması
 */
interface LanguageConfig {
  language: string
  monthNames: string[]
  dayNames: string[]
}

/**
 * Saat seçici yapılandırması
 */
interface TimePickerConfig {
  enabled: boolean
  use24HourFormat?: boolean
  minuteInterval?: number
  defaultHours?: number
  defaultMinutes?: number
}

/**
 * Çıktı formatı yapılandırması
 */
interface OutputConfig {
  order: string[] // ["day", "month", "year"]
  slash: string // "/" veya "-" veya "."
  between: string // " - " veya " & "
  fullFormat?: boolean
  backendFormat?: string[] // Backend formatı için
}

/**
 * Bağlantı yapılandırması (YENİ)
 */
interface ConnectionConfig {
  input: string // Input element ID
  label?: string // Label element ID (isteğe bağlı)
  focusContainer?: string // Focus container ID (isteğe bağlı)
  onChange?: (date: Date | null) => void // Değişiklik callback'i (YENİ)
}

/**
 * Bağlantı kontrol objesi (YENİ)
 */
interface DatePickerConnection {
  input: HTMLInputElement | null
  safeClose: () => void
  focus: (openDatePicker?: boolean) => boolean
  getDate: () => Date | null
  resetToToday: () => void
  resetAllInputs: () => void
  resetDate: (date: Date, updateInput?: boolean) => boolean
  changeMinDate: (date: Date, resetIfInvalid?: boolean) => boolean
  changeMaxDate: (date: Date, resetIfInvalid?: boolean) => boolean
  // Callback fonksiyonunu güncelleme için eklendi (YENİ)
  setOnChange: (callback: (date: Date | null) => void) => void
  autoClose: boolean
}

/**
 * DatePickerWithTime yapılandırması (Değiştirildi)
 */
interface DatePickerWithTimeConfig {
  elements: {
    container: string
    monthContainer: string
    daysContainer: string
    timeContainer?: string
    buttons: {
      prev: string
      next: string
      reset?: string
      resetAll?: string
      close?: string
    }
  }
  classes?: {
    day?: {
      base?: string
      disabled?: string
      selected?: string
      empty?: string
      today?: string
    }
    month?: {
      container?: string
      current?: string
      buttons?: {
        prev?: {
          base?: string
          disabled?: string
        }
        next?: {
          base?: string
          disabled?: string
        }
      }
    }
    calendar?: {
      grid?: string
      dayHeader?: string
    }
    wrapper?: {
      base?: string
      hidden?: string
    }
    time?: {
      container?: string
      column?: string
      display?: string
      button?: string
      separator?: string
      ampm?: {
        container?: string
        button?: string
        selected?: string
      }
    }
  }
  language: LanguageConfig[]
  output?: OutputConfig
  minDate?: Date
  maxDate?: Date
  autoClose?: boolean
  timePicker?: TimePickerConfig
}

/**
 * Bağlantı durumu için iç interface (YENİ)
 */
interface ConnectionState {
  id: string // Bağlantı için benzersiz ID
  input: HTMLInputElement | null
  label: HTMLElement | null
  focusContainer: HTMLElement | null
  selectedDate: Date | null
  hours: number
  minutes: number
  isPM: boolean
  minDate?: Date
  maxDate?: Date
  // Time picker ayarları
  timePickerEnabled?: boolean
  use24HourFormat?: boolean
  minuteInterval?: number
  // Değişiklik callback'i (YENİ)
  onChange?: (date: Date | null) => void
  autoClose?: boolean
}

interface ResetOptions {
  type: ResetType
  date?: Date
  language?: string
}

type ResetType = 'today' | 'all' | 'soft'

// Aşama 2: Veri Yapılarının Hazırlanması

/**
 * DatePickerWithTime sınıfı
 */
class DatePickerWithTime {
  private config: DatePickerWithTimeConfig
  private classes: typeof DEFAULT_CLASSES
  private containerElement: HTMLElement | null = null
  private monthContainer: HTMLElement | null = null
  private daysContainer: HTMLElement | null = null
  private timeContainer: HTMLElement | null = null

  private prevButton: HTMLElement | null = null
  private nextButton: HTMLElement | null = null
  private resetButton: HTMLElement | null = null
  private resetAllButton: HTMLElement | null = null
  private closeButton: HTMLElement | null = null

  private hoursDisplay: HTMLElement | null = null
  private minutesDisplay: HTMLElement | null = null
  private ampmToggle: HTMLElement | null = null

  private currentDate: Date
  private connections: Map<string, ConnectionState> = new Map()
  private activeConnectionId: string | null = null
  private lastOpenTime: number = 0
  private openCloseDelay: number = 250 // ms
  private autoClose: boolean = true
  private nextConnectionId: number = 1

  // Aşama 3: Constructor ve Başlatma Yöntemleri

  /**
   * DatePickerWithTime sınıfının constructor'ı
   * @param config DatePickerWithTime yapılandırması
   */
  constructor(config: DatePickerWithTimeConfig) {
    // Temel yapılandırmayı ayarla
    this.config = config
    this.classes = this.mergeClasses(DEFAULT_CLASSES, config.classes || {})
    this.currentDate = this.stripTime(new Date())
    this.autoClose = config.autoClose ?? this.autoClose

    // HTML elementlerini al
    this.containerElement = document.getElementById(config.elements.container)
    this.monthContainer = document.getElementById(
      config.elements.monthContainer,
    )
    this.daysContainer = document.getElementById(config.elements.daysContainer)

    if (config.elements.timeContainer) {
      this.timeContainer = document.getElementById(
        config.elements.timeContainer,
      )
    }

    this.prevButton = document.getElementById(config.elements.buttons.prev)
    this.nextButton = document.getElementById(config.elements.buttons.next)

    if (config.elements.buttons.reset) {
      this.resetButton = document.getElementById(config.elements.buttons.reset)
    }

    if (config.elements.buttons.resetAll) {
      this.resetAllButton = document.getElementById(
        config.elements.buttons.resetAll,
      )
    }

    if (config.elements.buttons.close) {
      this.closeButton = document.getElementById(config.elements.buttons.close)
    }

    // Min ve max tarihleri düzenle - Daha detaylı hata kontrolü eklenmiştir
    if (this.config.minDate) {
      try {
        this.config.minDate = this.stripTime(this.config.minDate)
      } catch (error) {
        console.error('Geçersiz minDate formatı:', error)
        this.config.minDate = undefined
      }
    }

    if (this.config.maxDate) {
      try {
        this.config.maxDate = this.stripTime(this.config.maxDate)
      } catch (error) {
        console.error('Geçersiz maxDate formatı:', error)
        this.config.maxDate = undefined
      }
    }

    // DatePicker'ı başlat
    if (this.containerElement && this.daysContainer && this.monthContainer) {
      this.initializeDatePicker()
      this.addEventListeners()
    } else {
      console.warn('Gerekli container elementleri bulunamadı.')
    }

    if (this.containerElement) {
      this.containerElement.classList.add(this.classes.wrapper.hidden)
      this.containerElement.classList.remove(this.classes.wrapper.visible)
    }

    // DatePicker'ı gizle
    this.hideDatePicker()
    this.autoConnectAllInputs()
  }

  /**
   * Yeni bir input bağlantısı oluştur
   * @param config Bağlantı yapılandırması
   * @returns Bağlantı kontrol objesi
   */
  public connect(config: ConnectionConfig): DatePickerConnection {
    const connectionId = `connection-${this.nextConnectionId++}`
    const input = document.getElementById(config.input) as HTMLInputElement

    const autoCloseAttr = input.getAttribute('data-auto-close')
    let connectionAutoClose: boolean = this.autoClose

    if (autoCloseAttr !== null) {
      connectionAutoClose =
        autoCloseAttr.toLowerCase() === 'true' ? true : false
    }

    if (!input) {
      console.error(`"${config.input}" ID'li input elementi bulunamadı.`)
      // Boş bir kontrol objesi döndür (hata durumunda çalışmayan metodlar)
      return {
        input,
        safeClose: () => this.safeClose(),
        focus: () => false,
        getDate: () => null,
        resetToToday: () => {},
        resetAllInputs: () => {},
        resetDate: () => false,
        changeMinDate: () => false,
        changeMaxDate: () => false,
        setOnChange: () => {},
        autoClose: connectionAutoClose || this.autoClose,
      }
    }

    // Label ve focusContainer elementlerini al
    let label: HTMLElement | null = null
    let focusContainer: HTMLElement | null = null

    if (config.label) {
      label = document.getElementById(config.label)
    }

    if (config.focusContainer) {
      focusContainer = document.getElementById(config.focusContainer)
    }

    // TimePicker özelliklerini data attribute'larından al
    let selectedDate: Date | null = null
    let hours: number = 12
    let minutes: number = 0
    let isPM: boolean = false

    // Min ve max tarih için data attribute kontrolü - ÖNCELİK DEĞİŞTİRİLDİ
    // İlk olarak input'tan data attribute'ları alalım, yoksa config değerlerini kullanalım
    let minDate: Date | undefined = undefined
    let maxDate: Date | undefined = undefined

    // data-min-date kontrolü - ÖNCE INPUT ATTRIBUTE KONTROL EDİLİYOR
    const minDateAttr = input.getAttribute('data-min-date')
    if (minDateAttr) {
      const parsedMinDate = this.parseDefaultDate(minDateAttr)
      if (parsedMinDate) {
        minDate = this.stripTime(parsedMinDate)
      }
    } else if (this.config.minDate) {
      // Input attribute yoksa config değerini kullan
      minDate = new Date(this.config.minDate)
    }

    // data-max-date kontrolü
    const maxDateAttr = input.getAttribute('data-max-date')
    if (maxDateAttr) {
      const parsedMaxDate = this.parseDefaultDate(maxDateAttr)
      if (parsedMaxDate) {
        maxDate = this.stripTime(parsedMaxDate)
      }
    } else if (this.config.maxDate) {
      // Input attribute yoksa config değerini kullan
      maxDate = new Date(this.config.maxDate)
    }

    // Varsayılan tarih için data attribute kontrolü
    const defaultDateAttr = input.getAttribute('data-default-date')
    if (defaultDateAttr) {
      const defaultDate = this.parseDefaultDate(defaultDateAttr)
      if (defaultDate) {
        // minDate kontrolü yap
        if (minDate && this.stripTime(defaultDate) < minDate) {
          console.warn(
            'Default tarih, minimum tarihten küçük olduğu için minimum tarih kullanılacak.',
          )
          selectedDate = new Date(minDate)
        } else {
          selectedDate = this.stripTime(defaultDate)
        }
      }
    }

    // data attribute değerlerini kontrol et
    const timePickerAttr = input.getAttribute('data-timepicker')
    const defaultHoursAttr = input.getAttribute('data-default-hours')
    const defaultMinuteAttr = input.getAttribute('data-default-minute')
    const ampmAttr = input.getAttribute('data-ampm')
    const minuteIntervalAttr = input.getAttribute('data-minute-interval')

    // Input'taki data attributelerine öncelik verelim
    const configTimePickerEnabled = this.config.timePicker?.enabled ?? false

    // data-timepicker attribute'u için daha sağlam kontrol
    let timePickerEnabled = configTimePickerEnabled
    if (timePickerAttr !== null) {
      timePickerEnabled = timePickerAttr.toLowerCase() === 'true'
    }

    // ampmAttr için daha sağlam kontrol
    let use24HourFormat = this.config.timePicker?.use24HourFormat || false
    if (ampmAttr !== null) {
      // "true" ise 12 saat formatı (AM/PM kullan)
      // "false" ise 24 saat formatı (AM/PM kullanma)
      use24HourFormat = ampmAttr.toLowerCase() !== 'true'
    }

    // Saat değerini hesapla
    if (defaultHoursAttr !== null) {
      const hours24 = parseInt(defaultHoursAttr)

      if (!use24HourFormat) {
        // 24 saatlik formattan 12 saatlik formata dönüşüm
        isPM = hours24 >= 12
        hours = hours24 % 12
        if (hours === 0) hours = 12 // 0 yerine 12 AM
      } else {
        hours = hours24
      }
    } else {
      hours = this.config.timePicker?.defaultHours || 12
      if (!use24HourFormat && hours >= 12) {
        isPM = true
        if (hours > 12) hours = hours % 12
      }
    }

    // Dakika değerini hesapla
    if (defaultMinuteAttr !== null) {
      minutes = parseInt(defaultMinuteAttr)
    } else {
      minutes = this.config.timePicker?.defaultMinutes || 0
    }

    // Dakika aralığı için daha sağlam kontrol
    let minuteInterval = this.config.timePicker?.minuteInterval || 1
    if (minuteIntervalAttr !== null) {
      const parsedInterval = parseInt(minuteIntervalAttr)
      if (!isNaN(parsedInterval) && parsedInterval > 0) {
        minuteInterval = parsedInterval
      }
    }

    // En yakın geçerli dakika değerine yuvarla
    minutes = this.getNearestValidMinute(minutes, minuteInterval)

    // TimePicker yapılandırmasını güncelle
    const timePickerConfig = {
      enabled: timePickerEnabled,
      use24HourFormat: use24HourFormat,
      defaultHours: hours,
      defaultMinutes: minutes,
      minuteInterval: minuteInterval,
    }

    // Bağlantı durumunu oluştur
    const connectionState: ConnectionState = {
      id: connectionId,
      input,
      label,
      focusContainer,
      selectedDate,
      hours,
      minutes,
      isPM,
      minDate,
      maxDate,
      // TimePicker ayarlarını da bağlantı durumunda saklayalım
      timePickerEnabled: timePickerConfig.enabled,
      use24HourFormat: timePickerConfig.use24HourFormat,
      minuteInterval: timePickerConfig.minuteInterval,
      // Callback'i ekle
      onChange: config.onChange,
      autoClose: connectionAutoClose,
    }

    // Bağlantıyı kaydet
    this.connections.set(connectionId, connectionState)

    // Input için event listener ekle
    input.addEventListener('click', e => {
      e.stopPropagation()
      this.handleInputClick(connectionId)
    })

    input.addEventListener('focus', () => {
      this.handleInputClick(connectionId)
    })

    // Eğer varsayılan tarih varsa, input değerini güncelle
    if (selectedDate) {
      this.updateInputValue(connectionId)
    }

    // Input'a data attribute'ları yansıt
    this.reflectDataAttributesToInput(connectionState)

    // Kontrol objesi döndür
    return {
      input,
      safeClose: () => this.safeClose(),
      focus: (openDatePicker = true) =>
        this.focusConnection(connectionId, openDatePicker),
      getDate: () => this.getDateForConnection(connectionId),
      resetToToday: () => this.handleReset({ type: 'today' }, connectionId),
      resetAllInputs: () => this.handleReset({ type: 'all' }, connectionId),
      resetDate: (date, updateInput = true) =>
        this.resetDateForConnection(connectionId, date, updateInput),
      changeMinDate: (date, resetIfInvalid = true) =>
        this.changeMinDateForConnection(connectionId, date, resetIfInvalid),
      changeMaxDate: (date, resetIfInvalid = true) =>
        this.changeMaxDateForConnection(connectionId, date, resetIfInvalid),
      // Callback güncelleme fonksiyonu
      setOnChange: callback => {
        const conn = this.connections.get(connectionId)
        if (conn) {
          conn.onChange = callback
        }
      },
      autoClose: connectionAutoClose,
    }
  }

  // Class'ın üst kısmına bu alanı ekleyin
  private inputsWithInitialRender: Set<string> = new Set()

  /**
   * DOM'daki tüm .date-picker-input sınıfına sahip elementleri bulup bağlantı oluşturur
   */
  private autoConnectAllInputs(): void {
    // Tüm date-picker-input sınıfına sahip inputları bul
    const inputs = document.querySelectorAll('.date-picker-input')

    // Her bir input için bağlantı oluştur
    inputs.forEach(input => {
      if (input instanceof HTMLInputElement) {
        // Input için id kontrolü yap
        if (!input.id) {
          // Id yoksa rastgele bir id oluştur
          input.id = `date-input-${Math.random().toString(36).substring(2, 9)}`
        }

        // Zaten bağlı mı kontrol et
        if (input.hasAttribute('data-datepicker-connected')) {
          return
        }

        // Input'un üst elementi container olur
        const container = input.closest('.date-picker-container')

        // Label elementini bul
        let label: HTMLElement | null = null
        let labelId: string | undefined = undefined

        if (container) {
          // Container içinde .date-picker-label ara
          label = container.querySelector('.date-picker-label')

          if (label) {
            // Label için id kontrolü
            if (!label.id) {
              label.id = `${input.id}-label`
            }

            // Label'ın for attribute'ünü input'a bağla
            if (!label.getAttribute('for')) {
              label.setAttribute('for', input.id)
            }

            labelId = label.id
          }
        }

        // Focus container olarak label veya container kullan
        let focusContainer: HTMLElement | null = null
        let focusContainerId: string | undefined = undefined

        if (label) {
          focusContainer = label
        } else if (container) {
          focusContainer = container as HTMLElement
        }

        if (focusContainer) {
          if (!focusContainer.id) {
            focusContainer.id = `${input.id}-container`
          }
          focusContainerId = focusContainer.id
        }

        // İlk değer değişimini algılamak için
        const initialValue = input.value

        // Bağlantıyı oluştur - onChange callback olmadan
        const connection = this.connect({
          input: input.id,
          label: labelId,
          focusContainer: focusContainerId,
        })

        // Bağlandı olarak işaretle
        input.setAttribute('data-datepicker-connected', 'true')
      }
    })
  }

  /**
   * Data attribute'larını input elementine yansıt
   */
  private reflectDataAttributesToInput(connection: ConnectionState): void {
    if (!connection.input) return

    try {
      // TimePicker ayarlarını yansıt
      connection.input.setAttribute(
        'data-timepicker',
        connection.timePickerEnabled ? 'true' : 'false',
      )

      connection.input.setAttribute(
        'data-ampm',
        connection.use24HourFormat ? 'false' : 'true',
      )

      // Dakika aralığı değeri tanımlı ise ekle
      if (
        connection.minuteInterval !== undefined &&
        connection.minuteInterval !== null
      ) {
        connection.input.setAttribute(
          'data-minute-interval',
          connection.minuteInterval.toString(),
        )
      } else {
        // Varsayılan değer (1) veya config'den gelen değeri kullan
        const defaultInterval = this.config.timePicker?.minuteInterval || 1
        connection.input.setAttribute(
          'data-minute-interval',
          defaultInterval.toString(),
        )
      }

      // Saat ayarlarını yansıt
      let hours24 = this.get24HourFormat(connection)

      connection.input.setAttribute('data-default-hours', hours24.toString())

      if (connection.minutes !== undefined) {
        connection.input.setAttribute(
          'data-default-minute',
          connection.minutes.toString().padStart(2, '0'),
        )
      }

      // Tarih ayarlarını yansıt
      if (connection.selectedDate) {
        connection.input.setAttribute(
          'data-default-date',
          this.formatDateForAttribute(connection.selectedDate),
        )
      }

      if (connection.minDate) {
        connection.input.setAttribute(
          'data-min-date',
          this.formatDateForAttribute(connection.minDate),
        )
      }

      if (connection.maxDate) {
        connection.input.setAttribute(
          'data-max-date',
          this.formatDateForAttribute(connection.maxDate),
        )
      }
    } catch (error) {
      console.error("Data attribute'larını yansıtırken hata oluştu:", error)
    }
  }

  /**
   * Aktif bağlantıyı al
   * @returns Aktif bağlantı durumu veya null
   */
  private getActiveConnection(): ConnectionState | null {
    if (!this.activeConnectionId) return null
    return this.connections.get(this.activeConnectionId) || null
  }

  /**
   * Input'a tıklanınca DatePicker'ı göster
   */
  private handleInputClick(connectionId: string): void {
    // Açılma zamanını kaydet (kapanma koruması için)
    const now = Date.now()

    // Eğer çok kısa sürede bir açma-kapama olmuşsa, işlemi engelle
    if (now - this.lastOpenTime < this.openCloseDelay) {
      return
    }

    this.lastOpenTime = now

    // ÖNCEKİ BAĞLANTININ FOCUS DURUMUNU TEMIZLE
    if (this.activeConnectionId && this.activeConnectionId !== connectionId) {
      const prevConnection = this.connections.get(this.activeConnectionId)
      if (prevConnection?.focusContainer) {
        prevConnection.focusContainer.setAttribute('data-focus', 'false')
      }
    }

    if (
      this.isDatePickerVisible() &&
      this.activeConnectionId === connectionId
    ) {
      return
    }

    const connection = this.connections.get(connectionId)
    if (!connection) return

    // Aktif bağlantıyı değiştir
    this.activeConnectionId = connectionId

    // ÖNEMLİ: Tarih belirleme önceliği
    let targetDate: Date | null = null

    // 1. İlk öncelik: Input değeri (eğer input dolu ise ve geçerli bir tarih içeriyorsa)
    if (connection.input && connection.input.value) {
      const dateStr = connection.input.value.split(' & ')[0] // Tarih kısmını al
      const parsedDate = this.parseDisplayDate(dateStr)
      if (parsedDate) {
        targetDate = this.stripTime(parsedDate)
        connection.selectedDate = new Date(targetDate)
      }
    }

    // 2. İkinci öncelik: Daha önce seçilmiş tarih
    if (!targetDate && connection.selectedDate) {
      targetDate = this.stripTime(connection.selectedDate)
    }

    // 3. Üçüncü öncelik: data-min-date veya minDate konfigürasyonu
    if (!targetDate && connection.minDate) {
      targetDate = this.stripTime(connection.minDate)
      // Minimum tarih bildirmek için log koy
    } else if (!targetDate && this.config.minDate) {
      targetDate = this.stripTime(this.config.minDate)
    }

    // 4. Son öncelik: Bugün
    if (!targetDate) {
      targetDate = this.stripTime(new Date())
    }

    // currentDate'i hedef tarihe göre ayarla (ay görünümü için)
    this.currentDate = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
    )

    // Önce ay başlığını güncelle, sonra takvimi render et
    this.renderMonthHeader()
    this.renderCalendar()

    // TimePicker'ı sadece etkinse göster
    if (connection.timePickerEnabled && this.timeContainer) {
      this.timeContainer.style.display = 'block'
      this.renderTimePicker()
      // TimePicker event listener'larını yeniden ekle
      this.addTimePickerEventListeners()
    } else if (this.timeContainer) {
      // TimePicker etkin değilse gizle
      this.timeContainer.style.display = 'none'
    }

    this.updateNavigationState()
    this.positionDatePickerUnderInput()
    this.showDatePicker()

    // Focus container'ı güncelle
    if (connection.focusContainer) {
      connection.focusContainer.setAttribute('data-focus', 'true')
    }
  }

  /**
   * Belirli bir bağlantı için input'a odaklan
   * @param connectionId Bağlantı ID
   * @param openDatePicker DatePicker'ı aç/kapa
   * @returns İşlem başarılı mı
   */
  private focusConnection(
    connectionId: string,
    openDatePicker: boolean = true,
  ): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.input) return false

    try {
      // Input'a odaklan
      connection.input.focus()

      // Focus container'ı güncelle
      if (connection.focusContainer) {
        connection.focusContainer.setAttribute('data-focus', 'true')
      }

      // Eğer isteniyorsa date picker'ı aç
      if (openDatePicker) {
        // Aktif bağlantıyı ayarla
        this.activeConnectionId = connectionId

        // ÖNEMLİ: Tarih belirleme önceliğini handleInputClick ile aynı şekilde uygula
        let targetDate: Date | null = null

        // 1. İlk öncelik: Input değeri (eğer input dolu ise ve geçerli bir tarih içeriyorsa)
        if (connection.input.value) {
          const dateStr = connection.input.value.split(' & ')[0] // Tarih kısmını al
          const parsedDate = this.parseDisplayDate(dateStr)
          if (parsedDate) {
            targetDate = this.stripTime(parsedDate)
            connection.selectedDate = new Date(targetDate)
          }
        }

        // 2. İkinci öncelik: Daha önce seçilmiş tarih
        if (!targetDate && connection.selectedDate) {
          targetDate = this.stripTime(connection.selectedDate)
        }

        // 3. Üçüncü öncelik: data-min-date veya minDate konfigürasyonu
        if (!targetDate && connection.minDate) {
          targetDate = this.stripTime(connection.minDate)
        } else if (!targetDate && this.config.minDate) {
          targetDate = this.stripTime(this.config.minDate)
        }

        // 4. Son öncelik: Bugün
        if (!targetDate) {
          targetDate = this.stripTime(new Date())
        }

        // currentDate'i hedef tarihe göre ayarla
        this.currentDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate(),
        )

        // Takvimi güncel tarih ve seçimlerle göster
        this.renderMonthHeader()
        this.renderCalendar()

        if (connection.timePickerEnabled && this.timeContainer) {
          this.renderTimePicker()
          // TimePicker event listener'larını yeniden ekle
          this.addTimePickerEventListeners()
        }

        this.updateNavigationState()
        this.positionDatePickerUnderInput()
        this.showDatePicker()
      }

      return true
    } catch (error) {
      console.error('Focus sırasında hata oluştu:', error)
      return false
    }
  }

  /**
   * DatePickerWithTime'ı başlat
   */
  private initializeDatePicker(): void {
    // Elementlerin hazır olup olmadığını kontrol et
    if (!this.containerElement || !this.daysContainer || !this.monthContainer) {
      console.error('Gerekli container elementleri bulunamadı.')
      return
    }

    this.renderMonthHeader()
    this.renderCalendar()

    if (this.config.timePicker?.enabled && this.timeContainer) {
      // İlk oluşturma sırasında zaten HTML mevcut olacak, sadece değerleri güncelle
      this.hoursDisplay = this.timeContainer.querySelector('#hour-display')
      this.minutesDisplay = this.timeContainer.querySelector('#minute-display')
      this.ampmToggle = this.timeContainer.querySelector('#ampm-toggle')

      this.renderTimePicker()
    } else if (this.timeContainer) {
      // Zaman seçici devre dışıysa, container'ı gizle
      this.timeContainer.style.display = 'none'
    }

    this.updateNavigationState()
  }

  /**
   * Event listener'ları ekle
   */
  private addEventListeners(): void {
    // Ay değiştirme butonları
    this.prevButton?.addEventListener('click', e => {
      e.stopPropagation()
      this.safeChangeMonth('prev')
    })

    this.nextButton?.addEventListener('click', e => {
      e.stopPropagation()
      this.safeChangeMonth('next')
    })

    // Reset butonları
    this.resetButton?.addEventListener('click', e => {
      e.stopPropagation()
      if (this.activeConnectionId) {
        this.resetStateForConnection(this.activeConnectionId, { type: 'today' })
      }
    })

    this.resetAllButton?.addEventListener('click', e => {
      e.stopPropagation()
      if (this.activeConnectionId) {
        this.resetStateForConnection(this.activeConnectionId, { type: 'all' })
      }
    })

    // Kapat butonu
    this.closeButton?.addEventListener('click', e => {
      e.stopPropagation()
      this.safeClose()
    })

    // Gün seçimi
    this.daysContainer?.addEventListener('click', e => {
      e.stopPropagation()
      const target = e.target as HTMLElement

      if (target.classList.contains(this.classes.day.base)) {
        const dateStr = target.getAttribute('data-date')
        const monthType = target.getAttribute('data-month')

        if (!dateStr) return

        const date = new Date(dateStr)

        // Önceki/sonraki ay günlerine tıklanınca ay değişimi yap
        if (monthType === 'prev') {
          this.safeChangeMonth('prev')
          return
        } else if (monthType === 'next') {
          this.safeChangeMonth('next')
          return
        }

        // Disabled güne tıklanırsa işlem yapma
        if (target.classList.contains(this.classes.day.disabled)) {
          return
        }

        // Tarih seçimini yap
        this.selectDate(date)
      }
    })

    // TimePicker event listener'larını ekle
    this.addTimePickerEventListeners()

    // Dışarı tıklama
    document.addEventListener('click', e => {
      const target = e.target as HTMLElement
      const isDatePickerClick =
        this.containerElement && this.containerElement.contains(target)

      // Aktif bağlantının input'una tıklama kontrolü
      const activeConnection = this.getActiveConnection()
      const isInputClick = activeConnection?.input === target

      if (!isDatePickerClick && !isInputClick && this.isDatePickerVisible()) {
        this.safeClose()
      }
    })

    // Pencere boyut değişikliği
    window.addEventListener('resize', this.handleWindowResize)
  }

  /**
   * TimePicker için event listener'ları ekle
   */
  private addTimePickerEventListeners(): void {
    if (!this.config.timePicker?.enabled || !this.timeContainer) {
      return
    }

    // Referansları al
    const hourUpBtn = this.timeContainer.querySelector('#hour-up')
    const hourDownBtn = this.timeContainer.querySelector('#hour-down')
    const minuteUpBtn = this.timeContainer.querySelector('#minute-up')
    const minuteDownBtn = this.timeContainer.querySelector('#minute-down')
    const ampmToggle = this.timeContainer.querySelector('#ampm-toggle')

    // Saat arttırma
    if (hourUpBtn) {
      // Önce eski event listener'ları kaldır (varsa)
      const newHourUpBtn = hourUpBtn.cloneNode(true)
      if (hourUpBtn.parentNode) {
        hourUpBtn.parentNode.replaceChild(newHourUpBtn, hourUpBtn)

        newHourUpBtn.addEventListener('click', e => {
          e.stopPropagation()
          this.changeHour('up')
        })
      }
    }

    // Saat azaltma
    if (hourDownBtn) {
      const newHourDownBtn = hourDownBtn.cloneNode(true)
      if (hourDownBtn.parentNode) {
        hourDownBtn.parentNode.replaceChild(newHourDownBtn, hourDownBtn)

        newHourDownBtn.addEventListener('click', e => {
          e.stopPropagation()
          this.changeHour('down')
        })
      }
    }

    // Dakika arttırma
    if (minuteUpBtn) {
      const newMinuteUpBtn = minuteUpBtn.cloneNode(true)
      if (minuteUpBtn.parentNode) {
        minuteUpBtn.parentNode.replaceChild(newMinuteUpBtn, minuteUpBtn)

        newMinuteUpBtn.addEventListener('click', e => {
          e.stopPropagation()
          this.changeMinute('up')
        })
      }
    }

    // Dakika azaltma
    if (minuteDownBtn) {
      const newMinuteDownBtn = minuteDownBtn.cloneNode(true)
      if (minuteDownBtn.parentNode) {
        minuteDownBtn.parentNode.replaceChild(newMinuteDownBtn, minuteDownBtn)

        newMinuteDownBtn.addEventListener('click', e => {
          e.stopPropagation()
          this.changeMinute('down')
        })
      }
    }

    // AM/PM toggle
    if (ampmToggle) {
      const newAmPmToggle = ampmToggle.cloneNode(true)
      if (ampmToggle.parentNode) {
        ampmToggle.parentNode.replaceChild(newAmPmToggle, ampmToggle)

        newAmPmToggle.addEventListener('click', e => {
          e.stopPropagation()
          this.toggleAMPM()
        })
      }

      // Referansı güncelle
      this.ampmToggle = newAmPmToggle as HTMLElement
    }

    // Referansları güncelle
    this.hoursDisplay = this.timeContainer.querySelector('#hour-display')
    this.minutesDisplay = this.timeContainer.querySelector('#minute-display')
  }

  /**
   * Pencere boyutu değişince DatePicker'ı yeniden konumlandır
   */
  private handleWindowResize = (): void => {
    if (this.isDatePickerVisible()) {
      this.positionDatePickerUnderInput()
    }
  }

  /**
   * DatePicker'ı göster
   */
  private showDatePicker(): void {
    if (this.containerElement) {
      this.containerElement.classList.remove(this.classes.wrapper.hidden)
      this.containerElement.classList.add(this.classes.wrapper.visible)

      // Aktif bağlantıyı al ve timepicker durumuna göre data-timepicker attribute'ünü ayarla
      const activeConnection = this.getActiveConnection()
      if (activeConnection) {
        this.containerElement.setAttribute(
          'data-timepicker',
          activeConnection.timePickerEnabled ? 'true' : 'false',
        )
      }
    }
  }

  /**
   * DatePicker'ı gizle
   */
  private hideDatePicker(): void {
    if (this.containerElement) {
      this.containerElement.classList.add(this.classes.wrapper.hidden)
      this.containerElement.classList.remove(this.classes.wrapper.visible)
    }

    // Aktif bağlantının focus container'ını güncelle
    const activeConnection = this.getActiveConnection()
    if (activeConnection?.focusContainer) {
      activeConnection.focusContainer.setAttribute('data-focus', 'false')
    }

    // Aktif bağlantı ID'sini null olarak ayarla
    // Bu önemli çünkü artık aktif bir bağlantı yok
    this.activeConnectionId = null
  }

  /**
   * DatePicker görünür mü?
   */
  private isDatePickerVisible(): boolean {
    if (!this.containerElement) return false

    // Görünür olma durumunu visible sınıfının varlığı ile kontrol et
    return this.containerElement.classList.contains(
      this.classes.wrapper.visible,
    )
  }
  /**
   * DatePicker'ı input'un altına konumlandır
   */
  private positionDatePickerUnderInput(): void {
    const activeConnection = this.getActiveConnection()
    if (!this.containerElement || !activeConnection?.input) return

    // Input element boyutları ve pozisyonu
    const inputRect = activeConnection.input.getBoundingClientRect()

    // Pencere boyutları
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    // DatePicker boyutları
    const datePickerRect = this.containerElement.getBoundingClientRect()

    // Scroll pozisyonları
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft

    // Başlangıç pozisyonları
    let top = inputRect.bottom + scrollTop + 8 // 8px padding
    let left = inputRect.left + scrollLeft - 1.5

    // Sağ kenardan taşma kontrolü
    if (left + datePickerRect.width > windowWidth) {
      // Inputun sağ kenarına hizala
      left = inputRect.right + scrollLeft - datePickerRect.width

      // Hala taşıyorsa, pencere sağ kenarına hizala
      if (left < 0) {
        left = windowWidth - datePickerRect.width - 16 // 16px padding
      }
    }

    // Alt kenardan taşma kontrolü
    const bottomOverflow =
      top + datePickerRect.height > windowHeight + scrollTop
    const hasSpaceAbove = inputRect.top - datePickerRect.height - 16 > 0

    if (bottomOverflow && hasSpaceAbove) {
      // Üstte yeterli alan varsa, üste konumlandır
      top = inputRect.top + scrollTop - datePickerRect.height - 16
    } else if (bottomOverflow) {
      // Üstte de yeterli alan yoksa, mümkün olduğunca yukarı çek
      top = windowHeight + scrollTop - datePickerRect.height - 16
    }

    // Sol kenarın negatif olmamasını sağla
    left = Math.max(8, left)

    // Pozisyonu uygula
    this.containerElement.style.position = 'absolute'
    this.containerElement.style.top = `${Math.round(top)}px`
    this.containerElement.style.left = `${Math.round(left)}px`
    this.containerElement.style.zIndex = '100'
    this.containerElement.style.opacity = '100%'

    // Pozisyon için data attribute ekle (animasyon/stil için kullanışlı)
    this.containerElement.setAttribute(
      'data-position',
      bottomOverflow && hasSpaceAbove ? 'top' : 'bottom',
    )
  }

  /**
   * Güvenli kapatma
   */
  public safeClose(): void {
    // Açılma zamanını kontrol et (koruma için)
    if (Date.now() - this.lastOpenTime < this.openCloseDelay) {
      return
    }

    const activeConnection = this.getActiveConnection()
    if (!activeConnection) return

    // Hem tarih hem saat seçili mi kontrol et
    const hasValidDateTime =
      activeConnection.selectedDate !== null &&
      (this.config.timePicker?.enabled ? true : true) // Eğer timePicker etkin değilse tarih yeterli

    if (hasValidDateTime) {
      // Seçimleri inputa yansıt
      this.updateInputValue(this.activeConnectionId!)
    } else {
      // Seçimleri temizle
      this.resetStateForConnection(this.activeConnectionId!, { type: 'soft' })
    }

    this.hideDatePicker()
  }

  /**
   * Input değerini güncelle
   */
  private updateInputValue(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.input || !connection.selectedDate) return

    // Önceki değeri kaydet (değişiklik kontrolü için)
    const oldValue = connection.input.value

    let value = this.formatDateBasedOnConfig(connection.selectedDate)

    // TimePicker etkinse saat formatını ekle
    if (connection.timePickerEnabled) {
      const timeStr = this.formatTimeBasedOnConfig(connection)
      value = `${value} & ${timeStr}`
    }

    // Değer değişti mi kontrol et
    const hasChanged = oldValue !== value

    connection.input.value = value

    // Data attribute'larını güncelle
    this.updateDataAttributes(connection)

    // Değer değişmişse, onChange callback'i çağır ve change event tetikle
    if (hasChanged) {
      // onChange callback'i çağır
      if (connection.onChange) {
        const dateWithTime = this.getDateForConnection(connectionId)
        if (dateWithTime) {
          connection.onChange(dateWithTime)
        }
      }

      // Custom event tetikle (değer değiştiğinde harici kod için bildirim)
      const changeEvent = new Event('change', { bubbles: true })
      connection.input.dispatchEvent(changeEvent)
    }
  }

  /**
   * TimePicker: Zamanı formatla
   */
  private formatTimeBasedOnConfig(connection: ConnectionState): string {
    const hours = this.getDisplayHours(connection).toString().padStart(2, '0')
    const minutes = connection.minutes.toString().padStart(2, '0')

    if (connection.use24HourFormat) {
      return `${hours}:${minutes}`
    } else {
      return `${hours}:${minutes} ${connection.isPM ? 'PM' : 'AM'}`
    }
  }

  /**
   * Bugüne döndür
   */
  private handleTodayResetForConnection(connection: ConnectionState): void {
    // Önceki değeri sakla
    const oldSelectedDate = connection.selectedDate

    // Bugünün tarihini al
    const today = this.stripTime(new Date())

    // Minimum tarih kontrolü
    if (connection.minDate && this.stripTime(connection.minDate) > today) {
      // Eğer minDate bugünden büyükse, bugüne değil minDate'e ayarla
      connection.selectedDate = new Date(connection.minDate)
      this.currentDate = new Date(connection.minDate)

      console.warn(
        'Bugün tarihi, minimum tarihten küçük olduğu için minimum tarih kullanıldı:',
        this.formatDateForAttribute(connection.minDate),
      )
    } else {
      // Normal durumda bugüne ayarla
      connection.selectedDate = today
      this.currentDate = new Date(today)
    }

    // Saati varsayılan değerlere döndür
    if (connection.timePickerEnabled) {
      connection.hours = this.config.timePicker?.defaultHours || 12
      connection.minutes = this.getNearestValidMinute(
        this.config.timePicker?.defaultMinutes || 0,
        connection.minuteInterval || 1,
      )
      connection.isPM =
        !(connection.use24HourFormat || false) && connection.hours >= 12

      // 24 saat formatında 12 varsayılan değerse 0 olarak ayarla
      if ((connection.use24HourFormat || false) && connection.hours === 12) {
        connection.hours = 0
      }
    }

    // Input değerini güncelle
    this.updateInputValue(connection.id)

    // onChange callback'i çağır (YENİ)
    // updateInputValue içinde bu çağrılacak, ancak değeri daha kolay olsun diye burada da getirelim
    if (connection.onChange) {
      const newDate = this.getDateForConnection(connection.id)
      if (newDate) {
        connection.onChange(newDate)
      }
    }
  }

  /**
   * Tüm değerleri temizle
   */
  private handleFullResetForConnection(connection: ConnectionState): void {
    // Eski değeri sakla
    const oldSelectedDate = connection.selectedDate

    connection.selectedDate = null

    // ÖNEMLİ DEĞİŞİKLİK: currentDate'i yalnızca aktif bağlantıysa güncelle
    if (connection.id === this.activeConnectionId) {
      this.currentDate = this.stripTime(new Date())
    }

    // Saati varsayılan değerlere döndür
    if (this.config.timePicker?.enabled) {
      connection.hours = this.config.timePicker.defaultHours || 12
      connection.minutes = this.getNearestValidMinute(
        this.config.timePicker.defaultMinutes || 0,
        this.config.timePicker.minuteInterval || 1,
      )
      connection.isPM =
        !this.config.timePicker.use24HourFormat && connection.hours >= 12

      // 24 saat formatında 12 varsayılan değerse 0 olarak ayarla
      if (this.config.timePicker.use24HourFormat && connection.hours === 12) {
        connection.hours = 0
      }
    }

    // Input değerini temizle
    if (connection.input) {
      connection.input.value = ''
      connection.input.removeAttribute('data-selected')
      connection.input.removeAttribute('data-hours')
      connection.input.removeAttribute('data-minutes')
      connection.input.removeAttribute('data-ampm')

      // onChange callback'i çağır (YENİ)
      if (connection.onChange) {
        connection.onChange(null)
      }

      // Custom event tetikle - bu kısmı muhafaza ediyoruz
      const changeEvent = new Event('change', { bubbles: true })
      connection.input.dispatchEvent(changeEvent)
    }
  }

  /**
   * Yumuşak sıfırlama (sadece input)
   */
  private handleSoftResetForConnection(connection: ConnectionState): void {
    if (connection.input) {
      connection.input.value = ''
      connection.input.removeAttribute('data-selected')
      connection.input.removeAttribute('data-hours')
      connection.input.removeAttribute('data-minutes')
      connection.input.removeAttribute('data-ampm')
      connection.input.removeAttribute('data-ampm-state')

      // onChange callback'i çağır (YENİ)
      if (connection.onChange) {
        connection.onChange(null)
      }

      // Custom event tetikle
      const changeEvent = new Event('change', { bubbles: true })
      connection.input.dispatchEvent(changeEvent)
    }
  }

  /**
   * TimePicker: En yakın geçerli dakika değerini bul
   */
  private getNearestValidMinute(minute: number, interval: number = 1): number {
    return (Math.round(minute / interval) * interval) % 60
  }

  /**
   * TimePicker'ı render et
   */
  private renderTimePicker(): void {
    const activeConnection = this.getActiveConnection()
    if (
      !activeConnection ||
      !this.timeContainer ||
      !activeConnection.timePickerEnabled
    ) {
      // TimePicker devre dışı veya aktif değilse, container'ı gizle
      if (this.timeContainer) {
        this.timeContainer.style.display = 'none'
      }
      return
    }

    // TimePicker etkin ise container'ı göster
    this.timeContainer.style.display = 'block'

    const is24Hour = activeConnection.use24HourFormat || false

    // Saat ve dakika değerlerini formatla
    const displayHours = this.getDisplayHours(activeConnection)
      .toString()
      .padStart(2, '0')
    const displayMinutes = activeConnection.minutes.toString().padStart(2, '0')

    // Var olan elementlerin içeriğini güncelle
    if (this.hoursDisplay) {
      this.hoursDisplay.textContent = displayHours
    }

    if (this.minutesDisplay) {
      this.minutesDisplay.textContent = displayMinutes
    }

    // AM/PM toggle durumunu güncelle
    const ampmContainer = this.timeContainer.querySelector('#ampm-container')
    if (ampmContainer) {
      if (!is24Hour) {
        // 12 saat formatı kullanılıyorsa AM/PM container'ı göster
        if (ampmContainer instanceof HTMLElement) {
          ampmContainer.style.display = 'block'
        }

        if (this.ampmToggle) {
          this.ampmToggle.textContent = activeConnection.isPM ? 'PM' : 'AM'

          // AM/PM butonunun sınıflarını güncelle
          if (this.classes.time.ampm.selected) {
            const ampmClass = this.classes.time.ampm.selected
            if (activeConnection.isPM) {
              this.ampmToggle.classList.add(ampmClass)
            } else {
              this.ampmToggle.classList.remove(ampmClass)
            }
          }
        }
      } else {
        // 24 saat formatı kullanılıyorsa AM/PM container'ı gizle
        if (ampmContainer instanceof HTMLElement) {
          ampmContainer.style.display = 'none'
        }
      }
    }
  }

  /**
   * TimePicker: Gösterilecek saat değerini hesapla
   */
  private getDisplayHours(connection: ConnectionState): number {
    if (connection.use24HourFormat) {
      return connection.hours
    } else {
      // 12 saat formatı için daha sağlıklı hesaplama
      if (connection.hours === 0) return 12
      if (connection.hours > 12) return connection.hours - 12
      return connection.hours
    }
  }

  /**
   * TimePicker: Saat değerini değiştir
   */
  private changeHour(direction: 'up' | 'down'): void {
    const activeConnection = this.getActiveConnection()
    if (!activeConnection || !activeConnection.timePickerEnabled) return

    const is24Hour = activeConnection.use24HourFormat || false

    if (is24Hour) {
      // 24 saat formatı için
      if (direction === 'up') {
        activeConnection.hours = (activeConnection.hours + 1) % 24
      } else {
        activeConnection.hours = (activeConnection.hours - 1 + 24) % 24
      }
    } else {
      // 12 saat formatı için (1-12 aralığı)
      // Önce mevcut saat değerini kontrol edelim (güvenlik için)
      if (activeConnection.hours < 1 || activeConnection.hours > 12) {
        // Eğer saat geçersiz aralıktaysa, düzeltelim
        activeConnection.hours = activeConnection.hours % 12
        if (activeConnection.hours === 0) activeConnection.hours = 12
      }

      if (direction === 'up') {
        if (activeConnection.hours === 12) {
          activeConnection.hours = 1
          // 12'den 1'e geçerken AM/PM durumunu değiştir
          activeConnection.isPM = !activeConnection.isPM
        } else {
          activeConnection.hours += 1
        }
      } else {
        // direction === 'down'
        if (activeConnection.hours === 1) {
          activeConnection.hours = 12
          // 1'den 12'ye geçerken AM/PM durumunu değiştir
          activeConnection.isPM = !activeConnection.isPM
        } else {
          activeConnection.hours -= 1
        }
      }
    }

    this.renderTimePicker()

    // Eğer bir tarih seçilmişse, değişiklikleri input'a yansıt
    if (activeConnection.selectedDate && activeConnection.id) {
      this.updateInputValue(activeConnection.id)
    }
  }

  /**
   * TimePicker: Dakika değerini değiştir
   */
  private changeMinute(direction: 'up' | 'down'): void {
    const activeConnection = this.getActiveConnection()
    if (!activeConnection || !activeConnection.timePickerEnabled) return

    const interval = activeConnection.minuteInterval || 1
    const is24Hour = activeConnection.use24HourFormat || false

    if (direction === 'up') {
      activeConnection.minutes += interval

      // Dakika 60'ı geçerse saati arttır
      if (activeConnection.minutes >= 60) {
        activeConnection.minutes %= 60

        if (is24Hour) {
          // 24 saat formatında saati arttır
          activeConnection.hours = (activeConnection.hours + 1) % 24
        } else {
          // 12 saat formatında saati arttır
          if (activeConnection.hours === 12) {
            activeConnection.hours = 1
            // 12'den 1'e geçerken AM/PM'i değiştir
            activeConnection.isPM = !activeConnection.isPM
          } else {
            activeConnection.hours += 1
          }
        }
      }
    } else {
      // Aşağı yönde dakikayı ayarlarken
      activeConnection.minutes -= interval

      // Dakika 0'dan küçük olursa saati azalt
      if (activeConnection.minutes < 0) {
        activeConnection.minutes = 60 + activeConnection.minutes

        if (is24Hour) {
          // 24 saat formatında saati azalt
          activeConnection.hours = (activeConnection.hours - 1 + 24) % 24
        } else {
          // 12 saat formatında saati azalt
          if (activeConnection.hours === 1) {
            activeConnection.hours = 12
            // 1'den 12'ye geçerken AM/PM'i değiştir
            activeConnection.isPM = !activeConnection.isPM
          } else {
            activeConnection.hours -= 1
          }
        }
      }
    }

    this.renderTimePicker()

    // Eğer bir tarih seçilmişse, değişiklikleri input'a yansıt
    if (activeConnection.selectedDate && activeConnection.id) {
      this.updateInputValue(activeConnection.id)
    }
  }

  /**
   * TimePicker: 24 saatlik formatta saati doğru şekilde al
   * Backend için kullanılacak formatta 12:00 PM -> 12:00 olarak dönüştürür
   */
  private get24HourFormat(connection: ConnectionState): number {
    if (connection.use24HourFormat) {
      return connection.hours
    } else {
      // 12 saat formatından 24 saat formatına dönüşüm
      if (connection.isPM) {
        if (connection.hours === 12) {
          // 12 PM = 12:00
          return 12
        } else {
          // 1 PM - 11 PM = 13:00 - 23:00
          return connection.hours + 12
        }
      } else {
        if (connection.hours === 12) {
          // 12 AM = 00:00
          return 0
        } else {
          // 1 AM - 11 AM = 01:00 - 11:00
          return connection.hours
        }
      }
    }
  }

  /**
   * TimePicker: Görünen saat formatını güncelle
   */
  private updateDataAttributes(connection: ConnectionState): void {
    if (!connection.input || !connection.selectedDate) return

    // Tarih formatını backend formatında ayarla
    connection.input.setAttribute(
      'data-selected',
      this.formatDateBasedOnConfig(connection.selectedDate, 'backend'),
    )

    // Seçilen tarihi data-default-date olarak ayarla
    connection.input.setAttribute(
      'data-default-date',
      this.formatDateForAttribute(connection.selectedDate),
    )

    // Min/max tarihleri set et (eğer varsa)
    if (connection.minDate) {
      connection.input.setAttribute(
        'data-min-date',
        this.formatDateForAttribute(connection.minDate),
      )
    }

    if (connection.maxDate) {
      connection.input.setAttribute(
        'data-max-date',
        this.formatDateForAttribute(connection.maxDate),
      )
    }

    // Saat bilgilerini data attribute'larına ekle
    // Önce TimePicker durumunu yansıt
    connection.input.setAttribute(
      'data-timepicker',
      connection.timePickerEnabled ? 'true' : 'false',
    )

    // AM/PM kullanımı
    connection.input.setAttribute(
      'data-ampm',
      !connection.use24HourFormat ? 'true' : 'false',
    )

    // Dakika aralığı bilgisini ekle
    if (connection.minuteInterval && connection.minuteInterval > 1) {
      connection.input.setAttribute(
        'data-minute-interval',
        connection.minuteInterval.toString(),
      )
    }

    if (connection.timePickerEnabled) {
      // Saat değerini her zaman 24 saatlik format olarak ayarla
      const hours24 = this.get24HourFormat(connection)

      const displayedMinutes = connection.minutes.toString().padStart(2, '0')

      // data-hours her zaman 24 saatlik formatta
      connection.input.setAttribute('data-hours', hours24.toString())
      connection.input.setAttribute('data-minutes', displayedMinutes)

      // Varsayılan değerleri de ekle
      connection.input.setAttribute('data-default-hours', hours24.toString())
      connection.input.setAttribute('data-default-minute', displayedMinutes)

      // AM/PM bilgisini de ekle (görüntüleme amaçlı)
      if (!connection.use24HourFormat) {
        connection.input.setAttribute(
          'data-ampm-state',
          connection.isPM ? 'PM' : 'AM',
        )
      }
    }
  }

  /**
   * TimePicker: AM/PM değerini değiştir
   */
  private toggleAMPM(): void {
    const activeConnection = this.getActiveConnection()
    if (
      !activeConnection ||
      !activeConnection.timePickerEnabled ||
      activeConnection.use24HourFormat
    )
      return

    activeConnection.isPM = !activeConnection.isPM

    this.renderTimePicker()

    // Eğer bir tarih seçilmişse input değerini güncelle
    if (activeConnection.selectedDate && activeConnection.id) {
      this.updateInputValue(activeConnection.id)
    }
  }

  /**
   * Ay başlığını render et
   */
  private renderMonthHeader(): void {
    if (!this.monthContainer) return

    const { monthNames } = this.getSelectedLanguage()
    const currentMonthIndex = this.currentDate.getMonth()
    const currentYear = this.currentDate.getFullYear()

    // Var olan ay başlığı elementi içeriğini güncelle
    const monthHeader = this.monthContainer.querySelector(
      `.${this.classes.month.current}`,
    )
    if (monthHeader) {
      monthHeader.textContent = `${monthNames[currentMonthIndex]} ${currentYear}`
    } else {
      // Eğer element mevcut değilse oluştur
      this.monthContainer.innerHTML = `
           <div class="${this.classes.month.container}">
             <span class="${this.classes.month.current}">
               ${monthNames[currentMonthIndex]} ${currentYear}
             </span>
           </div>`
    }
  }

  /**
   * Takvimi render et
   */
  private renderCalendar(): void {
    if (!this.daysContainer) return

    const { dayNames } = this.getSelectedLanguage()
    const { day, calendar } = this.classes
    const activeConnection = this.getActiveConnection()

    // Ay için gerekli tarih hesaplamaları
    const firstDayOfMonth = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      1,
    )
    const lastDayOfMonth = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      0,
    )

    // Ayın ilk gününün haftanın hangi günü olduğu (0: Pazar, 1: Pazartesi, ...)
    const startingDay = firstDayOfMonth.getDay()

    // Önceki ay günleri hesaplaması (Pazartesi: 1. gün olarak ayarla)
    const daysFromPrevMonth = startingDay === 0 ? 6 : startingDay - 1

    // Önceki ayın son günü
    const prevMonthLastDay = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      0,
    )

    // Sonraki ay günleri hesaplaması
    const totalDaysInMonth = lastDayOfMonth.getDate()
    const lastDayOfMonthWeekday = lastDayOfMonth.getDay()
    const daysFromNextMonth =
      lastDayOfMonthWeekday === 0 ? 0 : 7 - lastDayOfMonthWeekday

    // Önce içeriği temizle
    this.daysContainer.innerHTML = ''

    // CSS sınıfını ekle ve sağlamlaştır
    if (!this.daysContainer.classList.contains(calendar.grid)) {
      this.daysContainer.classList.add(calendar.grid)
    }

    // Bugünün tarihini al
    const today = this.stripTime(new Date())

    // Gün başlıklarını oluştur
    for (let i = 0; i < dayNames.length; i++) {
      const dayHeader = document.createElement('div')
      dayHeader.className = calendar.dayHeader
      dayHeader.textContent = dayNames[i].substring(0, 2)
      this.daysContainer.appendChild(dayHeader)
    }

    // Gün oluşturma fonksiyonu
    const createDayElement = (date: Date, isOtherMonth: boolean = false) => {
      const strippedDate = this.stripTime(date)
      const isValid = this.isDateValid(
        date,
        this.activeConnectionId || undefined,
      )
      const isSelected =
        activeConnection?.selectedDate &&
        this.areDatesEqual(strippedDate, activeConnection.selectedDate)
      const isToday = this.areDatesEqual(strippedDate, today)

      const dayElement = document.createElement('div')

      // CSS sınıflarını ekle
      dayElement.classList.add(day.base)

      if (!isValid) {
        dayElement.classList.add(day.disabled)
      } else if (isOtherMonth) {
        dayElement.classList.add(day.empty)
      }

      if (isSelected) {
        dayElement.classList.add(day.selected)
      }

      if (isToday) {
        dayElement.classList.add(day.today)
      }

      // Data özelliklerini ekle
      dayElement.setAttribute('data-date', date.toISOString())
      dayElement.setAttribute(
        'data-month',
        isOtherMonth ? (date < firstDayOfMonth ? 'prev' : 'next') : 'current',
      )

      // Günün numarasını ekle
      dayElement.textContent = date.getDate().toString()

      return dayElement
    }

    // Önceki ayın günlerini oluştur
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const prevDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() - 1,
        prevMonthLastDay.getDate() - i + 1,
      )
      this.daysContainer.appendChild(createDayElement(prevDate, true))
    }

    // Mevcut ayın günlerini oluştur
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const currentDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth(),
        i,
      )
      this.daysContainer.appendChild(createDayElement(currentDate))
    }

    // Sonraki ayın günlerini oluştur
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const nextDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() + 1,
        i,
      )
      this.daysContainer.appendChild(createDayElement(nextDate, true))
    }
  }

  /**
   * Tarihin zaman bölümünü sıfırla
   */
  private stripTime(date: Date): Date {
    const newDate = new Date(date)
    newDate.setHours(0, 0, 0, 0)
    return newDate
  }

  /**
   * İki tarihin eşit olup olmadığını kontrol et
   */
  private areDatesEqual(date1: Date | null, date2: Date | null): boolean {
    // Eğer iki tarih de null ise, eşit kabul edelim
    if (date1 === null && date2 === null) return true

    // Eğer tarihlerden biri null ise, eşit değiller
    if (date1 === null || date2 === null) return false

    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  /**
   * Ay değiştir
   */
  private changeMonth(direction: 'next' | 'prev'): void {
    const newMonth =
      direction === 'next'
        ? this.currentDate.getMonth() + 1
        : this.currentDate.getMonth() - 1

    this.currentDate.setMonth(newMonth)
    this.renderMonthHeader()
    this.renderCalendar()
    this.updateNavigationState()
  }

  /**
   * Güvenli ay değişimi (min/max date kontrolü ile)
   */
  public safeChangeMonth(direction: 'next' | 'prev'): boolean {
    const activeConnection = this.getActiveConnection()

    // Aktif bağlantı min/max tarihlerini veya genel ayarları kullan
    const minDate = activeConnection?.minDate || this.config.minDate
    const maxDate = activeConnection?.maxDate || this.config.maxDate

    const currentMonth = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      1, // Ayın ilk günü
    )

    // Ay hesaplamasını düzelt
    const targetMonth =
      direction === 'prev'
        ? new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
        : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)

    // Minimum tarih kontrolü
    if (direction === 'prev' && minDate) {
      const strippedMinDate = this.stripTime(minDate)
      const lastDayOfTargetMonth = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth() + 1,
        0,
      )

      if (lastDayOfTargetMonth < strippedMinDate) {
        return false // Önceki aya gitmeye izin verme
      }
    }

    // Maximum tarih kontrolü
    if (direction === 'next' && maxDate) {
      const strippedMaxDate = this.stripTime(maxDate)
      const firstDayOfTargetMonth = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth(),
        1,
      )

      if (firstDayOfTargetMonth > strippedMaxDate) {
        return false // Sonraki aya gitmeye izin verme
      }
    }

    // Güvenli değişim
    this.changeMonth(direction)
    return true
  }

  /**
   * Navigasyon durumunu güncelle (önceki/sonraki butonların durumu)
   */
  private updateNavigationState(): void {
    const activeConnection = this.getActiveConnection()

    // Aktif bağlantı min/max tarihlerini veya genel ayarları kullan
    const minDate = activeConnection?.minDate || this.config.minDate
    const maxDate = activeConnection?.maxDate || this.config.maxDate

    const currentMonth = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      1,
    )

    if (this.prevButton && minDate) {
      const prevMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1,
      )
      const lastDayOfPrevMonth = new Date(
        prevMonth.getFullYear(),
        prevMonth.getMonth() + 1,
        0,
      )

      const isDisabled = lastDayOfPrevMonth < this.stripTime(minDate)

      if (this.classes.month.pointer.prev.disabled) {
        this.prevButton.classList.toggle(
          this.classes.month.pointer.prev.disabled,
          isDisabled,
        )
      }
      ;(this.prevButton as HTMLButtonElement).disabled = isDisabled
    }

    if (this.nextButton && maxDate) {
      const nextMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1,
      )

      const isDisabled = nextMonth > this.stripTime(maxDate)

      if (this.classes.month.pointer.next.disabled) {
        this.nextButton.classList.toggle(
          this.classes.month.pointer.next.disabled,
          isDisabled,
        )
      }
      ;(this.nextButton as HTMLButtonElement).disabled = isDisabled
    }
  }

  /**
   * Tarih seç
   */
  private selectDate(date: Date): void {
    const activeConnection = this.getActiveConnection()
    if (!activeConnection) return

    const selectedDate = this.stripTime(date)
    const isValid = this.isDateValid(date, this.activeConnectionId || undefined)

    if (!isValid) return

    // Eski değeri sakla
    const oldSelectedDate = activeConnection.selectedDate

    // Seçilen tarihi aktif bağlantıya kaydet
    activeConnection.selectedDate = selectedDate

    // currentDate'i seçilen tarih ile güncelle
    this.currentDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    )

    // Takvim görünümünü güncelle
    this.renderMonthHeader()
    this.renderCalendar()
    this.updateNavigationState()

    // Input değerini güncelle
    if (activeConnection.input && activeConnection.input.readOnly) {
      this.updateInputValue(activeConnection.id)
    } else if (!activeConnection.timePickerEnabled || this.autoClose) {
      this.updateInputValue(activeConnection.id)
    }

    // onChange callback'i çağır - değeri değişmişse
    if (
      activeConnection.onChange &&
      !this.areDatesEqual(oldSelectedDate, selectedDate)
    ) {
      const fullDate = this.getDateForConnection(activeConnection.id)
      if (fullDate) {
        activeConnection.onChange(fullDate)
      }
    }

    if (activeConnection.autoClose) {
      this.hideDatePicker()
    }
  }

  /**
   * DatePicker bağlantılarını yeniler, tüm data attribute'larını okur ve günceller
   */
  public refresh(): void {
    console.log('DatePicker refresh başlatılıyor...')

    // Görünür durumdaysa DatePicker'ı gizle
    const wasVisible = this.isDatePickerVisible()
    const activeId = this.activeConnectionId

    if (wasVisible) {
      this.hideDatePicker()
    }

    // Mevcut tüm bağlantıları güncelle
    for (const [connectionId, connection] of this.connections.entries()) {
      if (!connection.input || !connection.input.id) continue

      const input = document.getElementById(
        connection.input.id,
      ) as HTMLInputElement
      if (!input) continue

      // 1. data-timepicker
      const timePickerAttr = input.getAttribute('data-timepicker')
      if (timePickerAttr !== null) {
        connection.timePickerEnabled = timePickerAttr.toLowerCase() === 'true'
      }

      // 2. data-ampm
      const ampmAttr = input.getAttribute('data-ampm')
      if (ampmAttr !== null) {
        connection.use24HourFormat = ampmAttr.toLowerCase() !== 'true'
      }

      // 3. data-minute-interval
      const minuteIntervalAttr = input.getAttribute('data-minute-interval')
      if (minuteIntervalAttr !== null) {
        const parsedInterval = parseInt(minuteIntervalAttr)
        if (!isNaN(parsedInterval) && parsedInterval > 0) {
          connection.minuteInterval = parsedInterval
        }
      }

      // 4. data-default-hours
      const defaultHoursAttr = input.getAttribute('data-default-hours')
      if (defaultHoursAttr !== null) {
        const hours24 = parseInt(defaultHoursAttr)
        if (!isNaN(hours24)) {
          if (!connection.use24HourFormat) {
            // 12 saat formatı
            connection.isPM = hours24 >= 12
            connection.hours = hours24 % 12
            if (connection.hours === 0) connection.hours = 12
          } else {
            // 24 saat formatı
            connection.hours = hours24
          }
        }
      }

      // 5. data-default-minute
      const defaultMinuteAttr = input.getAttribute('data-default-minute')
      if (defaultMinuteAttr !== null) {
        const newMinutes = parseInt(defaultMinuteAttr)
        if (!isNaN(newMinutes)) {
          connection.minutes = this.getNearestValidMinute(
            newMinutes,
            connection.minuteInterval || 1,
          )
        }
      }

      // 6. data-min-date
      const minDateAttr = input.getAttribute('data-min-date')
      if (minDateAttr) {
        const parsedMinDate = this.parseDefaultDate(minDateAttr)
        if (parsedMinDate) {
          connection.minDate = this.stripTime(parsedMinDate)
        }
      }

      // 7. data-default-date
      const defaultDateAttr = input.getAttribute('data-default-date')
      if (defaultDateAttr) {
        const defaultDate = this.parseDefaultDate(defaultDateAttr)
        if (defaultDate) {
          if (
            connection.minDate &&
            this.stripTime(defaultDate) < connection.minDate
          ) {
            // Min date'i aşmıyorsa, min date'e eşitle
            connection.selectedDate = new Date(connection.minDate)
          } else if (
            connection.maxDate &&
            this.stripTime(defaultDate) > connection.maxDate
          ) {
            // Max date'i aşmıyorsa, max date'e eşitle
            connection.selectedDate = new Date(connection.maxDate)
          } else {
            connection.selectedDate = this.stripTime(defaultDate)
          }
        }
      }

      // 8. data-auto-close
      const autoCloseAttr = input.getAttribute('data-auto-close')
      if (autoCloseAttr !== null) {
        connection.autoClose = autoCloseAttr.toLowerCase() === 'true'
      }

      // 9. data-selected
      const selectedDateAttr = input.getAttribute('data-selected')
      if (selectedDateAttr) {
        const selectedDate = this.parseDefaultDate(selectedDateAttr)
        if (selectedDate) {
          // Min/Max date kontrolü yap
          if (
            connection.minDate &&
            this.stripTime(selectedDate) < connection.minDate
          ) {
            connection.selectedDate = new Date(connection.minDate)
          } else if (
            connection.maxDate &&
            this.stripTime(selectedDate) > connection.maxDate
          ) {
            connection.selectedDate = new Date(connection.maxDate)
          } else {
            connection.selectedDate = this.stripTime(selectedDate)
          }
        }
      }

      // 10. data-hours (mevcut seçili saat)
      const hoursAttr = input.getAttribute('data-hours')
      if (hoursAttr !== null) {
        const hours24 = parseInt(hoursAttr)
        if (!isNaN(hours24)) {
          if (!connection.use24HourFormat) {
            // 12 saat formatı
            connection.isPM = hours24 >= 12
            connection.hours = hours24 % 12
            if (connection.hours === 0) connection.hours = 12
          } else {
            // 24 saat formatı
            connection.hours = hours24
          }
        }
      }

      // 11. data-minutes (mevcut seçili dakika)
      const minutesAttr = input.getAttribute('data-minutes')
      if (minutesAttr !== null) {
        const minutes = parseInt(minutesAttr)
        if (!isNaN(minutes)) {
          connection.minutes = this.getNearestValidMinute(
            minutes,
            connection.minuteInterval || 1,
          )
        }
      }

      // 12. data-ampm-state
      const ampmStateAttr = input.getAttribute('data-ampm-state')
      if (ampmStateAttr !== null) {
        connection.isPM = ampmStateAttr.toUpperCase() === 'PM'
      }

      // 13. data-max-date (eğer varsa)
      const maxDateAttr = input.getAttribute('data-max-date')
      if (maxDateAttr) {
        const parsedMaxDate = this.parseDefaultDate(maxDateAttr)
        if (parsedMaxDate) {
          connection.maxDate = this.stripTime(parsedMaxDate)
        }
      }

      // Seçili tarih ve saat değerlerini input'a yansıt
      if (connection.selectedDate) {
        this.updateInputValue(connectionId)
      }

      // Input'a tüm data attribute'ları yansıt
      this.reflectDataAttributesToInput(connection)
    }

    // Yeni input'ları tara ve bağla
    this.autoConnectAllInputs()

    // Eğer görünür durumdaysa, DatePicker'ı yeniden göster
    if (wasVisible && activeId && this.connections.has(activeId)) {
      const connection = this.connections.get(activeId)
      if (connection) {
        this.currentDate = connection.selectedDate
          ? new Date(connection.selectedDate)
          : this.stripTime(new Date())

        this.renderMonthHeader()
        this.renderCalendar()

        if (connection.timePickerEnabled && this.timeContainer) {
          this.renderTimePicker()
          this.addTimePickerEventListeners()
        }

        this.updateNavigationState()
        this.positionDatePickerUnderInput()
        this.showDatePicker()
      }
    }

    console.log('DatePicker refresh tamamlandı.')
  }

  /**
   * CSS sınıflarını birleştir
   */
  private mergeClasses(
    defaults: typeof DEFAULT_CLASSES,
    custom: any,
  ): typeof DEFAULT_CLASSES {
    const merged = JSON.parse(JSON.stringify(defaults))

    // Her bir özellik grubunu birleştir
    if (custom.day) {
      Object.assign(merged.day, custom.day)
    }

    if (custom.month) {
      Object.assign(merged.month, custom.month)

      if (custom.month.buttons?.prev) {
        Object.assign(merged.month.pointer.prev, custom.month.buttons.prev)
      }

      if (custom.month.buttons?.next) {
        Object.assign(merged.month.pointer.next, custom.month.buttons.next)
      }
    }

    if (custom.calendar) {
      Object.assign(merged.calendar, custom.calendar)
    }

    if (custom.wrapper) {
      Object.assign(merged.wrapper, custom.wrapper)
    }

    if (custom.time) {
      Object.assign(merged.time, custom.time)

      if (custom.time.ampm) {
        Object.assign(merged.time.ampm, custom.time.ampm)
      }
    }

    return merged
  }

  /**
   * Varsayılan tarih formatını parse et
   * Format: YYYY-MM-DD (2025-05-06 gibi)
   */
  private parseDefaultDate(dateStr: string): Date | null {
    if (dateStr && dateStr.toLowerCase() === 'today') {
      return this.stripTime(new Date()) // Bugünün tarihini döndür
    }

    // Tarih formatını kontrol et (YYYY-MM-DD)
    const dateRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    const matches = dateStr.match(dateRegex)

    if (!matches) {
      console.warn(
        'Geçersiz default date formatı. Lütfen YYYY-MM-DD formatını kullanın.',
      )
      return null
    }

    const year = parseInt(matches[1])
    const month = parseInt(matches[2]) - 1 // Ay 0-tabanlı (0-11)
    const day = parseInt(matches[3])

    // Geçerli tarih kontrolü
    if (
      isNaN(year) ||
      isNaN(month) ||
      isNaN(day) ||
      month < 0 ||
      month > 11 ||
      day < 1 ||
      day > 31
    ) {
      console.warn('Geçersiz tarih değerleri.')
      return null
    }

    const date = new Date(year, month, day)

    // Tarih geçerliliğini kontrol et (örn. 31 Şubat gibi hatalı tarihler)
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      console.warn('Geçersiz tarih.')
      return null
    }

    return date
  }

  /**
   * String formatındaki tarihi parse et
   */
  private parseDisplayDate(dateStr: string): Date | null {
    if (!dateStr) return null

    // Tam tarih formatı (11 Mar 2025 gibi)
    if (this.config.output?.fullFormat) {
      const parts = dateStr.split(' ')
      if (parts.length !== 3) return null

      const day = parseInt(parts[0])
      const monthStr = parts[1]
      const year = parseInt(parts[2])

      // Ay ismini indekse çevir
      const { monthNames } = this.getSelectedLanguage()
      const monthIndex = monthNames.findIndex(name =>
        name.toLowerCase().includes(monthStr.toLowerCase()),
      )

      if (monthIndex === -1) return null

      return new Date(year, monthIndex, day)
    }

    // Normal format (11/03/2025 gibi)
    const separator = this.config.output?.slash || '/'
    const parts = dateStr.split(separator)

    if (parts.length !== 3) return null

    const order = this.config.output?.order || ['day', 'month', 'year']
    const dateObj: { [key: string]: number } = {}

    for (let i = 0; i < order.length; i++) {
      dateObj[order[i]] = parseInt(parts[i])
    }

    // Ay 0-tabanlı
    if (dateObj.month) dateObj.month--

    return new Date(dateObj.year, dateObj.month, dateObj.day)
  }

  /**
   * Tarihi konfigürasyon temelli formatla
   */
  private formatDateBasedOnConfig(
    date: Date,
    type: 'display' | 'backend' = 'display',
  ): string {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString()

    const { monthNames } = this.getSelectedLanguage()

    // Backend formatı
    if (type === 'backend' && this.config.output?.backendFormat) {
      const parts: Record<string, string> = {
        day,
        month,
        year,
      }
      return this.config.output.backendFormat
        .map(part => parts[part])
        .join(this.config.output?.slash || '-')
    }

    // Eğer fullFormat true ise özel formatlama
    if (this.config.output?.fullFormat) {
      const monthName = monthNames[date.getMonth()]
      return `${date.getDate()} ${monthName.slice(0, 3)} ${year}`
    }

    const parts: Record<string, string> = {
      day,
      month,
      year,
    }

    const output = this.config.output || {
      order: ['day', 'month', 'year'],
      slash: '/',
      between: ' - ',
    }

    return output.order.map(part => parts[part]).join(output.slash)
  }

  /**
   * Aktif dil seçimini al
   */
  private getSelectedLanguage(): LanguageConfig {
    // Önce container'dan dil bilgisini almaya çalış
    const containerLanguage =
      this.containerElement?.getAttribute('data-language')

    // Eğer container'da dil bilgisi varsa ve config'de bu dil mevcutsa onu kullan
    if (
      containerLanguage &&
      this.config.language.find(lang => lang.language === containerLanguage)
    ) {
      return this.config.language.find(
        lang => lang.language === containerLanguage,
      )!
    }

    // Yoksa default dili kullan (ilk dil)
    return this.config.language[0]
  }

  /**
   * Belirli bir bağlantı için tarih döndür
   */
  private getDateForConnection(connectionId: string): Date | null {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.selectedDate) return null

    // Eğer timePicker aktifse, saat bilgisini de ekle
    if (this.config.timePicker?.enabled) {
      const date = new Date(connection.selectedDate)
      let hours = connection.hours

      // 12 saatlik formatta PM ise ve saat 12'den küçükse, 12 ekle
      if (
        !this.config.timePicker.use24HourFormat &&
        connection.isPM &&
        hours < 12
      ) {
        hours += 12
      }
      // 12 saatlik formatta AM ise ve saat 12 ise, 0 yap
      else if (
        !this.config.timePicker.use24HourFormat &&
        !connection.isPM &&
        hours === 12
      ) {
        hours = 0
      }

      date.setHours(hours, connection.minutes, 0, 0)
      return date
    }

    return new Date(connection.selectedDate)
  }

  /**
   * Belirli bir bağlantı için minimum tarihi değiştir
   */
  private changeMinDateForConnection(
    connectionId: string,
    date: Date,
    resetIfInvalid: boolean = true,
  ): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection) return false

    // Saat bilgisini sıfırla
    const newMinDate = this.stripTime(date)
    connection.minDate = newMinDate

    // Mevcut seçim geçerliliğini kontrol et
    if (
      connection.selectedDate &&
      this.stripTime(connection.selectedDate) < newMinDate
    ) {
      if (resetIfInvalid) {
        // Seçimi sıfırla
        if (connection.maxDate && newMinDate > connection.maxDate) {
          // Minimum tarih maksimum tarihten büyükse, seçimi tamamen temizle
          this.resetStateForConnection(connectionId, { type: 'all' })
          return false
        } else {
          // Seçimi minimum tarihe ayarla
          this.selectDate(newMinDate)
        }
      }
    }

    // Input'a min-date attribute'unu ekle
    if (connection.input) {
      connection.input.setAttribute(
        'data-min-date',
        this.formatDateForAttribute(newMinDate),
      )
    }

    // Takvimi güncelle
    this.renderCalendar()
    this.updateNavigationState()
    return true
  }

  /**
   * Belirli bir bağlantı için maksimum tarihi değiştir
   */
  private changeMaxDateForConnection(
    connectionId: string,
    date: Date,
    resetIfInvalid: boolean = true,
  ): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection) return false

    // Saat bilgisini sıfırla
    const newMaxDate = this.stripTime(date)
    connection.maxDate = newMaxDate

    // Mevcut seçim geçerliliğini kontrol et
    if (
      connection.selectedDate &&
      this.stripTime(connection.selectedDate) > newMaxDate
    ) {
      if (resetIfInvalid) {
        // Seçimi sıfırla
        if (connection.minDate && newMaxDate < connection.minDate) {
          // Maksimum tarih minimum tarihten küçükse, seçimi tamamen temizle
          this.resetStateForConnection(connectionId, { type: 'all' })
          return false
        } else {
          // Seçimi maksimum tarihe ayarla
          this.selectDate(newMaxDate)
        }
      }
    }

    // Input'a max-date attribute'unu ekle
    if (connection.input) {
      connection.input.setAttribute(
        'data-max-date',
        this.formatDateForAttribute(newMaxDate),
      )
    }

    // Takvimi güncelle
    this.renderCalendar()
    this.updateNavigationState()
    return true
  }

  /**
   * Tarihi YYYY-MM-DD formatında döndürür (data attribute için)
   */
  private formatDateForAttribute(date: Date): string {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * DatePicker'ı yok et (event listener'ları temizle)
   */
  public destroy(): void {
    window.removeEventListener('resize', this.handleWindowResize)
  }

  /**
   * Input elemanına odaklan ve gerekirse date picker'ı aç (eski method - sınıf genelinde)
   * @param openDatePicker Date picker'ın otomatik açılıp açılmayacağı
   * @returns İşlem başarılı mı
   */
  public focus(openDatePicker: boolean = true): boolean {
    // Aktif bağlantı yoksa işlem yapma
    if (!this.activeConnectionId) {
      console.warn('Aktif bağlantı bulunamadı, focus başarısız.')
      return false
    }

    const connection = this.connections.get(this.activeConnectionId)
    if (!connection || !connection.input) {
      console.warn('Geçerli bir bağlantı veya input bulunamadı.')
      return false
    }

    try {
      // Input'a odaklan
      connection.input.focus()

      // Focus container'ı güncelle
      if (connection.focusContainer) {
        connection.focusContainer.setAttribute('data-focus', 'true')
      }

      // Eğer isteniyorsa date picker'ı aç
      if (openDatePicker) {
        // Öncelikle input'ta tarih varsa, o tarihi yükle
        if (connection.input.value) {
          const dateStr = connection.input.value.split(' & ')[0] // Tarih kısmını al
          const date = this.parseDisplayDate(dateStr)

          if (date) {
            this.currentDate = new Date(date)
            connection.selectedDate = new Date(date)
          }
        }

        // Takvimi güncel tarih ve seçimlerle göster
        this.renderCalendar()
        this.renderMonthHeader()

        if (connection.timePickerEnabled && this.timeContainer) {
          this.renderTimePicker()
          // TimePicker event listener'larını yeniden ekle
          this.addTimePickerEventListeners()
        }

        this.updateNavigationState()
        this.positionDatePickerUnderInput()
        this.showDatePicker()
      }

      return true
    } catch (error) {
      console.error('Focus sırasında hata oluştu:', error)
      return false
    }
  }

  /**
   * Seçili tarihi Date objesi olarak döndürür (eski method - sınıf genelinde)
   * @returns Seçili tarih veya null
   */
  public getDate(): Date | null {
    // Aktif bağlantı yoksa null döndür
    if (!this.activeConnectionId) {
      console.warn('Aktif bağlantı bulunamadı, getDate başarısız.')
      return null
    }

    const connection = this.connections.get(this.activeConnectionId)
    if (!connection || !connection.selectedDate) {
      return null
    }

    // Eğer timePicker aktifse, saat bilgisini de ekle
    if (connection.timePickerEnabled) {
      const date = new Date(connection.selectedDate)
      let hours = connection.hours

      // 12 saatlik formatta PM ise ve saat 12'den küçükse, 12 ekle
      if (
        !(connection.use24HourFormat || false) &&
        connection.isPM &&
        hours < 12
      ) {
        hours += 12
      }
      // 12 saatlik formatta AM ise ve saat 12 ise, 0 yap
      else if (
        !(connection.use24HourFormat || false) &&
        !connection.isPM &&
        hours === 12
      ) {
        hours = 0
      }

      date.setHours(hours, connection.minutes, 0, 0)
      return date
    }

    return new Date(connection.selectedDate)
  }

  /**
   * Minimum tarihi değiştirir ve gerekirse mevcut seçimi günceller (eski method - sınıf genelinde)
   * @param date Yeni minimum tarih
   * @param resetIfInvalid Eğer true ise ve mevcut seçim minimum tarihten önceyse, seçimi sıfırlar
   * @returns Tarih değişikliği yapıldı mı
   */
  public changeMinDate(date: Date, resetIfInvalid: boolean = true): boolean {
    // Aktif bağlantı yoksa işlem yapma
    if (!this.activeConnectionId) {
      console.warn(
        'Aktif bağlantı bulunamadı, minimum tarih değişimi başarısız.',
      )
      return false
    }

    return this.changeMinDateForConnection(
      this.activeConnectionId,
      date,
      resetIfInvalid,
    )
  }

  /**
   * Maksimum tarihi değiştirir ve gerekirse mevcut seçimi günceller (eski method - sınıf genelinde)
   * @param date Yeni maksimum tarih
   * @param resetIfInvalid Eğer true ise ve mevcut seçim maksimum tarihten sonraysa, seçimi sıfırlar
   * @returns Tarih değişikliği yapıldı mı
   */
  public changeMaxDate(date: Date, resetIfInvalid: boolean = true): boolean {
    // Aktif bağlantı yoksa işlem yapma
    if (!this.activeConnectionId) {
      console.warn(
        'Aktif bağlantı bulunamadı, maksimum tarih değişimi başarısız.',
      )
      return false
    }

    return this.changeMaxDateForConnection(
      this.activeConnectionId,
      date,
      resetIfInvalid,
    )
  }

  /**
   * Merkezi reset yönetim fonksiyonu
   * @param options Reset seçenekleri
   * @param connectionId İsteğe bağlı bağlantı ID'si. Belirtilmezse aktif bağlantı kullanılır.
   * @returns İşlemin başarı durumu
   */
  private handleReset(options: ResetOptions, connectionId?: string): boolean {
    // 1. Bağlantı belirleme
    let connection: ConnectionState | null = null

    // Eğer connectionId belirtilmişse, o bağlantıyı kullan
    if (connectionId) {
      connection = this.connections.get(connectionId) || null
    }
    // Değilse aktif bağlantıyı kullan
    else if (this.activeConnectionId) {
      connection = this.connections.get(this.activeConnectionId) || null
    }

    // Geçerli bir bağlantı bulunamazsa, işlemi sonlandır
    if (!connection) {
      console.warn('Reset işlemi için geçerli bir bağlantı bulunamadı.')
      return false
    }

    const { type, date, language } = options
    const isActiveConnection = connection.id === this.activeConnectionId

    // Dil seçeneği varsa container'ı güncelle
    if (language && this.containerElement) {
      this.containerElement.setAttribute('data-language', language)
    }

    // Reset tipi belirleme ve işlemi uygulama
    let success = true
    switch (type) {
      case 'today':
        success = this.applyTodayReset(connection)
        break

      case 'all':
        success = this.applyFullReset(connection)
        break

      case 'soft':
        success = this.applySoftReset(connection)
        break

      default:
        console.warn(`Bilinmeyen reset tipi: ${type}`)
        success = false
    }

    // Sadece aktif bağlantıysa ve işlem başarılıysa görünümü güncelle
    if (isActiveConnection && success) {
      this.renderCalendar()
      this.renderMonthHeader()

      if (connection.timePickerEnabled && this.timeContainer) {
        this.renderTimePicker()
      }

      this.updateNavigationState()
    }

    return success
  }

  /**
   * Bugüne sıfırlama işlemini uygular
   */
  private applyTodayReset(connection: ConnectionState): boolean {
    // Önceki değeri sakla
    const oldSelectedDate = connection.selectedDate

    // Bugünün tarihini al
    const today = this.stripTime(new Date())

    // Minimum tarih kontrolü
    if (connection.minDate && this.stripTime(connection.minDate) > today) {
      // Eğer minDate bugünden büyükse, bugüne değil minDate'e ayarla
      connection.selectedDate = new Date(connection.minDate)

      // Eğer aktif bağlantıysa currentDate'i de güncelle
      if (connection.id === this.activeConnectionId) {
        this.currentDate = new Date(connection.minDate)
      }

      console.warn(
        'Bugün tarihi, minimum tarihten küçük olduğu için minimum tarih kullanıldı:',
        this.formatDateForAttribute(connection.minDate),
      )
    } else {
      // Normal durumda bugüne ayarla
      connection.selectedDate = today

      // Eğer aktif bağlantıysa currentDate'i de güncelle
      if (connection.id === this.activeConnectionId) {
        this.currentDate = new Date(today)
      }
    }

    // Saati varsayılan değerlere döndür
    if (connection.timePickerEnabled) {
      connection.hours = this.config.timePicker?.defaultHours || 12
      connection.minutes = this.getNearestValidMinute(
        this.config.timePicker?.defaultMinutes || 0,
        connection.minuteInterval || 1,
      )
      connection.isPM =
        !(connection.use24HourFormat || false) && connection.hours >= 12

      // 24 saat formatında 12 varsayılan değerse 0 olarak ayarla
      if ((connection.use24HourFormat || false) && connection.hours === 12) {
        connection.hours = 0
      }
    }

    // Input değerini güncelle
    this.updateInputValue(connection.id)

    return true
  }

  /**
   * Tüm değerleri sıfırlama işlemini uygular
   */
  private applyFullReset(connection: ConnectionState): boolean {
    // Eski değeri sakla
    const oldSelectedDate = connection.selectedDate

    connection.selectedDate = null

    // Eğer aktif bağlantıysa currentDate'i günün tarihine ayarla
    if (connection.id === this.activeConnectionId) {
      this.currentDate = this.stripTime(new Date())
    }

    // Saati varsayılan değerlere döndür
    if (connection.timePickerEnabled) {
      connection.hours = this.config.timePicker?.defaultHours || 12
      connection.minutes = this.getNearestValidMinute(
        this.config.timePicker?.defaultMinutes || 0,
        connection.minuteInterval || 1,
      )
      connection.isPM =
        !(connection.use24HourFormat || false) && connection.hours >= 12

      // 24 saat formatında 12 varsayılan değerse 0 olarak ayarla
      if ((connection.use24HourFormat || false) && connection.hours === 12) {
        connection.hours = 0
      }
    }

    // Input değerini temizle
    if (connection.input) {
      connection.input.value = ''
      connection.input.removeAttribute('data-selected')
      connection.input.removeAttribute('data-hours')
      connection.input.removeAttribute('data-minutes')
      connection.input.removeAttribute('data-ampm')
      connection.input.removeAttribute('data-ampm-state')

      // onChange callback'i çağır
      if (connection.onChange) {
        connection.onChange(null)
      }

      // Custom event tetikle
      const changeEvent = new Event('change', { bubbles: true })
      connection.input.dispatchEvent(changeEvent)
    }

    return true
  }

  /**
   * Yumuşak sıfırlama işlemini uygular (sadece input)
   */
  private applySoftReset(connection: ConnectionState): boolean {
    if (!connection.input) return false

    // Input değerini temizle ama bağlantı durumundaki değerleri korur
    connection.input.value = ''
    connection.input.removeAttribute('data-selected')
    connection.input.removeAttribute('data-hours')
    connection.input.removeAttribute('data-minutes')
    connection.input.removeAttribute('data-ampm')
    connection.input.removeAttribute('data-ampm-state')

    // onChange callback'i çağır
    if (connection.onChange) {
      connection.onChange(null)
    }

    // Custom event tetikle
    const changeEvent = new Event('change', { bubbles: true })
    connection.input.dispatchEvent(changeEvent)

    return true
  }

  /**
   * Tarih ve saati sıfırla
   */
  private resetState(options: ResetOptions): void {
    this.handleReset(options)
  }

  /**
   * Belirli bir bağlantı için reset işlemi
   */
  private resetStateForConnection(
    connectionId: string,
    options: ResetOptions,
  ): void {
    this.handleReset(options, connectionId)
  }

  /**
   * Bugüne döndür (eski method - sınıf genelinde)
   */
  private handleTodayReset(): void {
    this.handleReset({ type: 'today' })
  }

  /**
   * Tüm değerleri temizle (eski method - sınıf genelinde)
   */
  private handleFullReset(): void {
    this.handleReset({ type: 'all' })
  }

  /**
   * Yumuşak sıfırlama (eski method - sınıf genelinde)
   */
  private handleSoftReset(): void {
    this.handleReset({ type: 'soft' })
  }

  /**
   * Public API: Bugüne döndür
   */
  public resetToToday(): void {
    this.handleReset({ type: 'today' })
  }

  /**
   * Public API: Tüm değerleri temizle
   */
  public resetAllInputs(): void {
    this.handleReset({ type: 'all' })
  }

  /**
   * Belirli bir bağlantı için tarihi belirtilen tarihe ayarla
   */
  private resetDateForConnection(
    connectionId: string,
    date: Date,
    updateInput: boolean = true,
  ): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection) return false

    const newDate = this.stripTime(date)

    // Tarih geçerli mi kontrol et
    if (!this.isDateValid(newDate, connectionId)) {
      console.warn(
        'Geçersiz tarih: Minimum ve maksimum tarih sınırları dışında.',
      )
      return false
    }

    // Tarihi seç
    connection.selectedDate = newDate

    // Eğer bu aktif bağlantı ise, current date'i de güncelle
    if (this.activeConnectionId === connectionId) {
      this.currentDate = new Date(newDate)
    }

    // Saati varsayılan değerlere veya belirtilen değerlere ayarla
    if (connection.timePickerEnabled) {
      // Belirtilen saati kullan veya varsayılan değerleri koru
      const hours = date.getHours()
      if (hours !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0) {
        // Tarih nesnesinde saat bilgisi var, kullan
        if (connection.use24HourFormat) {
          // 24 saat formatında doğrudan kullan
          connection.hours = hours
        } else {
          // 12 saat formatına dönüştür
          connection.isPM = hours >= 12
          connection.hours = hours % 12
          if (connection.hours === 0) connection.hours = 12 // 0 saat yerine 12 AM göster
        }

        // Dakikaları en yakın geçerli değere yuvarla
        connection.minutes = this.getNearestValidMinute(
          date.getMinutes(),
          connection.minuteInterval || 1,
        )
      }
    }

    // Aktif bağlantı ise takvimi güncelle
    if (this.activeConnectionId === connectionId) {
      this.renderCalendar()
      this.renderMonthHeader()

      if (connection.timePickerEnabled && this.timeContainer) {
        this.renderTimePicker()
      }

      this.updateNavigationState()
    }

    // Input değerini güncelle
    if (updateInput) {
      this.updateInputValue(connectionId)
    }

    return true
  }

  /**
   * Tarih geçerliliğini kontrol et
   */
  private isDateValid(date: Date, connectionId?: string): boolean {
    const strippedDate = this.stripTime(date)

    // Eğer bağlantı belirtilmişse o bağlantının min/max tarihlerini kullan
    if (connectionId) {
      const connection = this.connections.get(connectionId)
      if (connection) {
        if (
          connection.minDate &&
          strippedDate < this.stripTime(connection.minDate)
        ) {
          return false
        }

        if (
          connection.maxDate &&
          strippedDate > this.stripTime(connection.maxDate)
        ) {
          return false
        }

        return true
      }
    }

    // Bağlantı belirtilmemişse genel ayarları kullan
    const { minDate, maxDate } = this.config

    if (minDate && strippedDate < this.stripTime(minDate)) {
      return false
    }

    if (maxDate && strippedDate > this.stripTime(maxDate)) {
      console.warn('Seçilen tarih, genel maksimum tarihten büyük')
      return false
    }

    return true
  }
}

export { DatePickerWithTime }
export type {
  DatePickerWithTimeConfig,
  LanguageConfig,
  TimePickerConfig,
  ConnectionConfig,
  DatePickerConnection,
}
