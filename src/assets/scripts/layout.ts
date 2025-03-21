import { DialogController } from './packages/dialog-controller.js'
import { ScrollObserver } from './packages/scroll-observer.js'

document.addEventListener('DOMContentLoaded', () => {
  new DialogController()
  new ScrollObserver()
})
