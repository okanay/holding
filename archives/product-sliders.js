import { MultiGroupImageGallery } from '../packages/multi-group-gallery.js'
import { UpdateElementInnerHTMLById } from '../packages/multi-group-gallery.js'
import { UpdateProductSliderDataItems } from '../packages/multi-group-gallery.js'
import { TouchDirectionDetector } from '../packages/touch-event.js'
import { Slider } from '../packages/slider.js'

// Görseldeki ürünlerin sayısını otomatik olarak hesaplar ve slider'ın data-items değerini günceller
document.addEventListener('DOMContentLoaded', () => {
  const productSliderElement = document.getElementById('product-slider')
  const childCount = productSliderElement
    ? productSliderElement.children.length
    : 0
  UpdateProductSliderDataItems('product-slider', {
    min: 1,
    max: 5,
    childElements: childCount,
    dataItems: 'auto-detected',
  })
  UpdateElementInnerHTMLById(
    'product-slider-image-count',
    childCount.toString(),
  )
})

// Main slider
document.addEventListener('DOMContentLoaded', () => {
  const mainSlider = new Slider({
    container: '#product-slider-container',
    slideSelector: '.product-slide',
    buttonSelector: '.product-slider-btn',
    nextButtonSelector: '#slider-next',
    prevButtonSelector: '#slider-prev',
    defaultActiveIndex: 0,
    activeButtonClass: 'product-slider-active-btn',
    activeButtonClassTarget: '.product-slider-btn-item',
    ...mainConfig,
    ...config,
  })
  new TouchDirectionDetector('product-slider-container', {
    threshold: 50,
    onSwipe: direction => {
      if (direction === 'right') {
        return mainSlider.prev()
      }
      if (direction === 'left') {
        return mainSlider.next()
      }
    },
  })
  const multiGroupGallery = new MultiGroupImageGallery({
    groups: [
      {
        containerId: 'product-slider',
        slideItemClass: 'product-slide',
      },
    ],
    ...galleryConfig,
  })
  new TouchDirectionDetector('multi-gallery-main-image-container', {
    threshold: 50,
    onSwipe: direction => {
      if (direction === 'right') {
        return multiGroupGallery.navigateGallery('prev')
      }
      if (direction === 'left') {
        return multiGroupGallery.navigateGallery('next')
      }
    },
  })
})

//  Silver Package Slider
document.addEventListener('DOMContentLoaded', () => {
  const mobileSlider1 = new Slider({
    container: '#slider-container-1',
    slideSelector: '.slide-1',
    buttonSelector: '.slide-1-btn',
    nextButtonSelector: '#slider-1-next',
    prevButtonSelector: '#slider-1-prev',
    defaultActiveIndex: 0,
    activeButtonClass: 'product-slider-active-btn',
    activeButtonClassTarget: '.slide-1-btn',
    ...config,
  })
  new TouchDirectionDetector('slider-container-1', {
    threshold: 50,
    onSwipe: direction => {
      if (direction === 'right') {
        return mobileSlider1.prev()
      }
      if (direction === 'left') {
        return mobileSlider1.next()
      }
    },
  })
  const multiGroupGallery = new MultiGroupImageGallery({
    groups: [
      {
        containerId: 'slider-1',
        slideItemClass: 'slide-1',
      },
    ],
    ...galleryConfig,
  })
  new TouchDirectionDetector('multi-gallery-main-image-container', {
    threshold: 50,
    onSwipe: direction => {
      if (direction === 'right') {
        return multiGroupGallery.navigateGallery('prev')
      }
      if (direction === 'left') {
        return multiGroupGallery.navigateGallery('next')
      }
    },
  })
})

//  Gold Package Slider
document.addEventListener('DOMContentLoaded', () => {
  const mobileSlider2 = new Slider({
    container: '#slider-container-2',
    slideSelector: '.slide-2',
    buttonSelector: '.slide-2-btn',
    nextButtonSelector: '#slider-2-next',
    prevButtonSelector: '#slider-2-prev',
    defaultActiveIndex: 0,
    activeButtonClass: 'product-slider-active-btn',
    activeButtonClassTarget: '.slide-2-btn',
    ...config,
  })
  new TouchDirectionDetector('slider-container-2', {
    threshold: 50,
    onSwipe: direction => {
      if (direction === 'right') {
        return mobileSlider2.prev()
      }
      if (direction === 'left') {
        return mobileSlider2.next()
      }
    },
  })
  const multiGroupGallery = new MultiGroupImageGallery({
    groups: [
      {
        containerId: 'slider-2',
        slideItemClass: 'slide-2',
      },
    ],
    ...galleryConfig,
  })
  new TouchDirectionDetector('multi-gallery-main-image-container', {
    threshold: 50,
    onSwipe: direction => {
      if (direction === 'right') {
        return multiGroupGallery.navigateGallery('prev')
      }
      if (direction === 'left') {
        return multiGroupGallery.navigateGallery('next')
      }
    },
  })
})

//  Platinum Package Slider
document.addEventListener('DOMContentLoaded', () => {
  const mobileSlider3 = new Slider({
    container: '#slider-container-3',
    slideSelector: '.slide-3',
    buttonSelector: '.slide-3-btn',
    nextButtonSelector: '#slider-3-next',
    prevButtonSelector: '#slider-3-prev',
    defaultActiveIndex: 0,
    activeButtonClass: 'product-slider-active-btn',
    activeButtonClassTarget: '.slide-3-btn',
    ...config,
  })
  new TouchDirectionDetector('slider-container-3', {
    threshold: 50,
    onSwipe: direction => {
      if (direction === 'right') {
        return mobileSlider3.prev()
      }
      if (direction === 'left') {
        return mobileSlider3.next()
      }
    },
  })
  const multiGroupGallery = new MultiGroupImageGallery({
    groups: [
      {
        containerId: 'slider-3',
        slideItemClass: 'slide-3',
      },
    ],
    ...galleryConfig,
  })
  new TouchDirectionDetector('multi-gallery-main-image-container', {
    threshold: 50,
    onSwipe: direction => {
      if (direction === 'right') {
        return multiGroupGallery.navigateGallery('prev')
      }
      if (direction === 'left') {
        return multiGroupGallery.navigateGallery('next')
      }
    },
  })
})

//  Diamond Package Slider
document.addEventListener('DOMContentLoaded', () => {
  const mobileSlider4 = new Slider({
    container: '#slider-container-4',
    slideSelector: '.slide-4',
    buttonSelector: '.slide-4-btn',
    nextButtonSelector: '#slider-4-next',
    prevButtonSelector: '#slider-4-prev',
    defaultActiveIndex: 0,
    activeButtonClass: 'product-slider-active-btn',
    activeButtonClassTarget: '.slide-4-btn',
    ...config,
  })
  new TouchDirectionDetector('slider-container-4', {
    threshold: 50,
    onSwipe: direction => {
      if (direction === 'right') {
        return mobileSlider4.prev()
      }
      if (direction === 'left') {
        return mobileSlider4.next()
      }
    },
  })
  const multiGroupGallery = new MultiGroupImageGallery({
    groups: [
      {
        containerId: 'slider-4',
        slideItemClass: 'slide-4',
      },
    ],
    ...galleryConfig,
  })
  new TouchDirectionDetector('multi-gallery-main-image-container', {
    threshold: 50,
    onSwipe: direction => {
      if (direction === 'right') {
        return multiGroupGallery.navigateGallery('prev')
      }
      if (direction === 'left') {
        return multiGroupGallery.navigateGallery('next')
      }
    },
  })
})

var config = {
  auto: true,
  autoInterval: 6000,
  animationConfig: {
    duration: 400,
    timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transforms: {
      fromLeft: {
        enter: 'translate(-120%, 0%)',
        exit: 'translate(20%, 0%)',
      },
      fromRight: {
        enter: 'translate(120%, 0%)',
        exit: 'translate(-20%, 0%)',
      },
    },
    opacitySelected: 1,
    opacityNotSelected: 0.75,
    scaleSelected: 1,
    scaleNotSelected: 1,
  },
  options: {
    zIndex: {
      clone: 3,
      selected: 2,
      notSelected: 1,
    },
  },
}

var mainConfig = {
  responsive: {
    enabled: true,
    minWidth: 0,
    maxWidth: 1024,
  },
}

var galleryConfig = {
  elements: {
    modalId: 'multi-gallery',
    modalContentId: 'multi-gallery-content',
    mainImageContainerId: 'multi-gallery-main-image-container',
    thumbnailsContainerId: 'multi-gallery-thumbnails',
    prevButtonId: 'prev-multi-gallery',
    nextButtonId: 'next-multi-gallery',
    closeButtonId: 'close-multi-gallery',
  },
  thumbnailClass: 'thumbnail',
  activeThumbnailClass: 'thumbnail-active',
}
