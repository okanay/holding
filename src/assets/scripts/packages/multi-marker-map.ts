import * as leaflet from '../deps/leaflet.js'
const L = leaflet as any

// Marker ile ilgili interfaceler
interface MapMarker {
  coordinate: string // "lat,lng" formatında
  popupContent?: string // Opsiyonel popup içeriği
  tooltip?: string // Opsiyonel tooltip içeriği
  icon?: CustomIcon // Opsiyonel özel ikon
}

interface CustomIcon {
  iconUrl: string
  iconSize?: [number, number]
  iconAnchor?: [number, number]
  shadowUrl?: string
  shadowSize?: [number, number]
  shadowAnchor?: [number, number]
  className?: string
}

// Harita konfigürasyonu için interface
interface MultiMarkerMapConfig {
  containerId: string
  markers: MapMarker[]
  defaultIcon?: CustomIcon
  center?: string // Merkez koordinat "lat,lng" formatında
  zoom?: number
  fitBounds?: boolean // Tüm markerları gösterecek şekilde haritayı ayarla
  layer?: MapLayerType

  // Icon özelleştirmeleri
  zoomInIconUrl?: string
  zoomOutIconUrl?: string
  layerControlToggleIconUrl?: string
  popupCloseIconUrl?: string
  layerControlCheckboxIconUrl?: string
  layerControlRadioIconUrl?: string
}

// Harita katmanları için enum
export enum MapLayerType {
  OpenStreetMap = 'openStreetMap',
  OpenTopoMap = 'openTopoMap',
  CycleMap = 'cycleMap',
  Satellite = 'satellite',
  DarkMatter = 'darkMatter',
  Voyager = 'voyager',
  Watercolor = 'watercolor',
  Streets = 'streets',
}

// Harita katmanları
const mapLayers: {
  [key in MapLayerType]: { url: string; options: any; name: string }
} = {
  [MapLayerType.OpenStreetMap]: {
    name: 'Street Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    },
  },
  [MapLayerType.OpenTopoMap]: {
    name: 'Topo Map',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 17,
      attribution: '© OpenTopoMap contributors',
    },
  },
  [MapLayerType.CycleMap]: {
    name: 'Cycle Map',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    options: {
      maxZoom: 20,
      attribution: '© CyclOSM contributors',
    },
  },
  [MapLayerType.Satellite]: {
    name: 'ESRI Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: '© Esri',
    },
  },
  [MapLayerType.DarkMatter]: {
    name: 'Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 19,
      attribution: '© CARTO',
    },
  },
  [MapLayerType.Voyager]: {
    name: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 19,
      attribution: '© CARTO',
    },
  },
  [MapLayerType.Watercolor]: {
    name: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 19,
      attribution: '© CARTO',
    },
  },
  [MapLayerType.Streets]: {
    name: 'Streets',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution:
        '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team',
    },
  },
}

// MultiMarkerMap Sınıfı
export class MultiMarkerMap {
  private container: HTMLElement
  private config: MultiMarkerMapConfig
  private map: L.Map | null = null
  private markers: L.Marker[] = []
  private currentLayer: L.TileLayer | null = null
  private layerControl: L.Control.Layers | null = null
  private defaultLayerType: MapLayerType
  private markerGroup: L.FeatureGroup | null = null

  constructor(config: MultiMarkerMapConfig) {
    const container = document.getElementById(config.containerId)
    if (!container) {
      throw new Error(`Container with id "${config.containerId}" not found`)
    }
    this.container = container
    this.config = config

    // Varsayılan katmanı belirleme
    this.defaultLayerType = this.getDefaultLayerType()

    // Haritayı başlat
    this.initializeStyles()
    this.initialize()
  }

  // Harita katmanını container veya config'den belirleme
  private getDefaultLayerType(): MapLayerType {
    // Önce config'den kontrol et
    if (
      this.config.layer &&
      Object.values(MapLayerType).includes(this.config.layer)
    ) {
      return this.config.layer
    }

    // Sonra container'dan kontrol et
    const containerLayer = this.container.getAttribute('data-layer')
    if (
      containerLayer &&
      Object.values(MapLayerType).includes(containerLayer as MapLayerType)
    ) {
      return containerLayer as MapLayerType
    }

    // Varsayılan olarak OpenStreetMap
    return MapLayerType.Watercolor
  }

  // Stil özelleştirmeleri için CSS ekleme
  private initializeStyles(): void {
    const styles: string[] = []

    // Zoom kontrolleri
    if (this.config.zoomInIconUrl) {
      styles.push(`
        .leaflet-control-zoom-in {
          background-image: url('${this.config.zoomInIconUrl}') !important;
          background-size: contain !important;
        }
      `)
    }

    if (this.config.zoomOutIconUrl) {
      styles.push(`
        .leaflet-control-zoom-out {
          background-image: url('${this.config.zoomOutIconUrl}') !important;
          background-size: contain !important;
        }
      `)
    }

    // Layer kontrolleri
    if (this.config.layerControlCheckboxIconUrl) {
      styles.push(`
        .leaflet-control-layers-overlays input[type="checkbox"] {
          background-image: url('${this.config.layerControlCheckboxIconUrl}') !important;
          -webkit-appearance: none;
          appearance: none;
          background-size: contain !important;
          width: 16px;
          height: 16px;
        }
      `)
    }

    if (this.config.layerControlRadioIconUrl) {
      styles.push(`
        .leaflet-control-layers-base input[type="radio"] {
          background-image: url('${this.config.layerControlRadioIconUrl}') !important;
          -webkit-appearance: none;
          appearance: none;
          background-size: contain !important;
          width: 16px;
          height: 16px;
        }
      `)
    }

    // Layer control toggle ikonu
    if (this.config.layerControlToggleIconUrl) {
      styles.push(`
        .leaflet-control-layers-toggle {
          background-image: url('${this.config.layerControlToggleIconUrl}') !important;
          background-size: contain !important;
          width: 36px !important;
          height: 36px !important;
        }
      `)
    }

    // Popup close ikonu
    if (this.config.popupCloseIconUrl) {
      styles.push(`
        .leaflet-popup-close-button {
          background-image: url('${this.config.popupCloseIconUrl}') !important;
          background-size: contain !important;
          width: 20px !important;
          height: 20px !important;
        }
      `)
    }

    if (styles.length > 0) {
      const styleElement = document.createElement('style')
      styleElement.textContent = styles.join('\n')
      document.head.appendChild(styleElement)
    }
  }

  // Harita katmanlarını ekle
  private addMapLayers(): void {
    if (!this.map) return

    const baseLayers: { [key: string]: L.TileLayer } = {}

    Object.entries(mapLayers).forEach(([layerType, layer]) => {
      const tileLayer = L.tileLayer(layer.url, layer.options)

      if (layerType === this.defaultLayerType) {
        this.currentLayer = tileLayer
        tileLayer.addTo(this.map!)
      }

      baseLayers[layer.name] = tileLayer
    })

    this.layerControl = L.control
      .layers(
        baseLayers,
        {},
        {
          position: 'topright',
        },
      )
      .addTo(this.map)
  }

  // Koordinat stringi parse etme
  private parseCoordinates(
    coordString: string,
  ): { lat: number; lng: number } | null {
    try {
      const [lat, lng] = coordString.split(',').map(Number)
      if (isNaN(lat) || isNaN(lng)) return null
      return { lat, lng }
    } catch {
      return null
    }
  }

  // Özel ikon oluşturma
  private createCustomIcon(iconConfig: CustomIcon): L.Icon {
    return L.icon({
      iconUrl: iconConfig.iconUrl,
      iconSize: iconConfig.iconSize || [25, 41],
      iconAnchor: iconConfig.iconAnchor || [12, 41],
      shadowUrl: iconConfig.shadowUrl,
      shadowSize: iconConfig.shadowSize,
      shadowAnchor: iconConfig.shadowAnchor,
      className: iconConfig.className,
    })
  }

  // Markerları haritaya ekleme
  private addMarkers(): void {
    if (!this.map) return

    // Marker grubu oluştur - bu bounds hesaplaması için kullanılacak
    this.markerGroup = L.featureGroup().addTo(this.map)

    this.config.markers.forEach(markerConfig => {
      const coords = this.parseCoordinates(markerConfig.coordinate)
      if (!coords) return

      // Ikon belirleme (marker özel ikonu veya varsayılan ikon)
      let icon = undefined
      if (markerConfig.icon) {
        icon = this.createCustomIcon(markerConfig.icon)
      } else if (this.config.defaultIcon) {
        icon = this.createCustomIcon(this.config.defaultIcon)
      }

      // Marker oluştur
      const marker = L.marker([coords.lat, coords.lng], { icon })

      // Popup ekle (varsa)
      if (markerConfig.popupContent) {
        marker.bindPopup(markerConfig.popupContent)
      }

      // Tooltip ekle (varsa)
      if (markerConfig.tooltip) {
        marker.bindTooltip(markerConfig.tooltip)
      }

      // Marker'ı haritaya ekle ve diziye kaydet
      marker.addTo(this.markerGroup!)
      this.markers.push(marker)
    })

    // Tüm markerları gösterecek şekilde haritayı ayarla (fitBounds true ise)
    if (this.config.fitBounds && this.markerGroup!.getLayers().length > 0) {
      this.map.fitBounds(this.markerGroup!.getBounds(), {
        padding: [50, 50], // Kenarlardan biraz boşluk bırak
      })
    }
  }

  // Haritayı başlatma
  private initialize(): void {
    const mapContainer = this.container.querySelector('.map-container')
    if (!mapContainer) {
      console.error('Map container not found within the specified container')
      return
    }

    mapContainer.innerHTML = ''

    const mapDiv = document.createElement('div')
    mapDiv.className = 'absolute inset-0 w-full h-full'
    mapContainer.appendChild(mapDiv)

    try {
      // Başlangıç merkezi belirle
      let initialCenter: [number, number] = [41.0082, 28.9784] // Varsayılan (İstanbul)
      let initialZoom = this.config.zoom || 10

      // Eğer merkez koordinat belirtilmişse kullan
      if (this.config.center) {
        const centerCoords = this.parseCoordinates(this.config.center)
        if (centerCoords) {
          initialCenter = [centerCoords.lat, centerCoords.lng]
        }
      }
      // Merkez belirtilmemişse ve sadece 1 marker varsa, o marker'ı merkez al
      else if (this.config.markers.length === 1) {
        const firstMarkerCoords = this.parseCoordinates(
          this.config.markers[0].coordinate,
        )
        if (firstMarkerCoords) {
          initialCenter = [firstMarkerCoords.lat, firstMarkerCoords.lng]
        }
      }

      // Haritayı oluştur
      this.map = L.map(mapDiv, {
        zoomControl: false,
        attributionControl: true,
      }).setView(initialCenter, initialZoom)

      // Katmanları ekle
      this.addMapLayers()

      // Markerları ekle
      this.addMarkers()

      // Zoom kontrollerini ekle
      L.control
        .zoom({
          position: 'bottomright',
        })
        .addTo(this.map)
    } catch (error) {
      console.error('Error initializing map:', error)
    }
  }

  // Haritayı yeniden yükleme
  public refresh(): void {
    if (this.map) {
      // Mevcut kaynakları temizle
      this.markers.forEach(marker => marker.remove())
      this.markers = []

      if (this.markerGroup) {
        this.markerGroup.clearLayers()
        this.markerGroup.remove()
        this.markerGroup = null
      }

      if (this.layerControl) {
        this.layerControl.remove()
        this.layerControl = null
      }

      if (this.currentLayer) {
        this.currentLayer.remove()
        this.currentLayer = null
      }

      this.map.remove()
      this.map = null
    }

    // Haritayı tekrar başlat
    this.initialize()
  }

  // Yeni marker ekle
  public addMarker(markerConfig: MapMarker): void {
    this.config.markers.push(markerConfig)

    // Harita mevcutsa, hemen marker ekle
    if (this.map && this.markerGroup) {
      const coords = this.parseCoordinates(markerConfig.coordinate)
      if (!coords) return

      // İkon belirleme
      let icon = undefined
      if (markerConfig.icon) {
        icon = this.createCustomIcon(markerConfig.icon)
      } else if (this.config.defaultIcon) {
        icon = this.createCustomIcon(this.config.defaultIcon)
      }

      // Marker oluştur
      const marker = L.marker([coords.lat, coords.lng], { icon })

      // Popup ekle (varsa)
      if (markerConfig.popupContent) {
        marker.bindPopup(markerConfig.popupContent)
      }

      // Tooltip ekle (varsa)
      if (markerConfig.tooltip) {
        marker.bindTooltip(markerConfig.tooltip)
      }

      // Marker'ı haritaya ekle ve diziye kaydet
      marker.addTo(this.markerGroup)
      this.markers.push(marker)

      // Bounds'ları güncelle
      if (this.config.fitBounds) {
        this.map.fitBounds(this.markerGroup.getBounds(), {
          padding: [50, 50],
        })
      }
    }
  }

  // Mevcut markerları temizle ve yenilerini ekle
  public updateMarkers(markers: MapMarker[]): void {
    this.config.markers = markers

    if (this.map) {
      // Mevcut markerları temizle
      this.markers.forEach(marker => marker.remove())
      this.markers = []

      if (this.markerGroup) {
        this.markerGroup.clearLayers()
      }

      // Yeni markerları ekle
      this.addMarkers()
    }
  }

  // Haritayı belirli bir konuma merkeze al ve zoom yap
  public centerOn(coordinate: string, zoom?: number): void {
    if (!this.map) return

    const coords = this.parseCoordinates(coordinate)
    if (coords) {
      this.map.setView([coords.lat, coords.lng], zoom || this.map.getZoom())
    }
  }

  // Belirli bir koordinata popup aç
  public openPopupAt(coordinate: string): void {
    if (!this.map) return

    const coords = this.parseCoordinates(coordinate)
    if (!coords) return

    // Koordinata en yakın marker'ı bul
    let closestMarker: L.Marker | null = null
    let minDistance = Infinity

    this.markers.forEach(marker => {
      const markerLatLng = marker.getLatLng()
      const distance = Math.sqrt(
        Math.pow(markerLatLng.lat - coords.lat, 2) +
          Math.pow(markerLatLng.lng - coords.lng, 2),
      )

      if (distance < minDistance) {
        minDistance = distance
        closestMarker = marker
      }
    })

    // En yakın marker'ın popup'ını aç
    if (closestMarker) {
      ;(closestMarker as L.Marker).openPopup()
    }
  }
}

// Global erişim için window nesnesi genişletmesi
declare global {
  interface Window {
    MultiMarkerMap: typeof MultiMarkerMap
  }
}

// Global erişim için MultiMarkerMap sınıfını window nesnesine ekle
window.MultiMarkerMap = MultiMarkerMap
