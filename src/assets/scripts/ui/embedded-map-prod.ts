import { EmbeddedMap } from '../packages/leaflet.js'

declare global {
  interface Window {
    EmbeddedMapControl: EmbeddedMap
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const embeddedMap = new EmbeddedMap('location-map', {
    zoomInIconUrl: 'assets/images/leaflet/plus.svg',
    zoomOutIconUrl: 'assets/images/leaflet/minus.svg',
    layerControlToggleIconUrl: 'assets/images/leaflet/layer.svg',
    markerShadowUrl: 'assets/images/leaflet/shadow.svg',
    markerIconUrl: 'assets/images/leaflet/marker.png',
    markerIconSize: [24, 24],
    markerIconAnchor: [24, 24],
    markerShadowAnchor: [28, 22],
    markerShadowSize: [41, 24],
  })

  window.EmbeddedMapControl = embeddedMap
})
