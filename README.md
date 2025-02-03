# RabbitSlider (Fancwiper)

> Fancy + Swiper = Fancwiper

Lightweight and powerful slider that turns complexity into simplicity! No more dealing with complex markup, loops, or compatibility issues. Just define your images, pick a style, set a container - and MAGIC happens! Built on top of Swiper.js and Fancybox, it handles all the heavy lifting while you enjoy the show.

[View Multiple Demo Builder](https://burakdursun.com/RabbitSlider-Fancwiper/demo/demo.html)

**Why Fancwiper?**
- 🚀 Zero complexity: No hardcoded markup or loops
- 🎨 Multiple layouts ready to use
- 📱 Full responsive, works everywhere
- 🔄 Dynamic updates, add/remove slides with ease
- 🎯 Simple API, powerful features

## Features
- Multiple slider types:
  - Classic (horizontal thumbnails)
  - Vertical thumbnails (left/right)
  - Grid layout
  - Simple carousel
  - Zoom slider
  - Quick preview
- Lazy loading support
- Touch/swipe support
- Fancybox integration
- Responsive design
- Dynamic thumbnail sizing
- Autoplay support
- Custom events

## Installation

First, include required dependencies:
```html
<!-- Swiper.js -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>

<!-- Fancybox -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.css">
<script src="https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.umd.js"></script>
```

Then include RabbitSlider files:
```html
<link rel="stylesheet" href="rabbitSlider.css">
<script src="rabbitSlider.js"></script>
```

> **Note:** RabbitSlider requires Swiper.js and Fancybox to work properly. Make sure to include them before RabbitSlider files.

## Usage

### Method 1: JavaScript Initialization
```javascript
const slider = new RabbitSlider(element, {
    type: 'classic',           // classic, leftThumb, rightThumb, grid, simple, zoom
    images: [                  // Array of image objects
        {
            large: 'large.jpg',
            thumb: 'thumb.jpg',
            title: 'Image Title'
        }
    ],
    lazy: true,               // Enable lazy loading
    autoplay: true,           // Enable autoplay
    delay: 3000,              // Autoplay delay in ms
    zoomRatio: 2              // Zoom magnification (only for zoom type)
});
```

### Method 2: HTML Data Attributes
You can also initialize the slider using HTML data attributes:
```html
<div 
    data-rabbitslider-init="true"
    data-rabbitslider="classic"
    data-rabbitslider-autoplay="3000"
    data-rabbitslider-lazy="false"
    data-images="large1.jpg,large2.jpg,large3.jpg"
    data-thumbnails="thumb1.jpg,thumb2.jpg,thumb3.jpg"
></div>
```

Available data attributes:
- `data-rabbitslider-init="true"`: Enable auto-initialization
- `data-rabbitslider`: Slider type (classic, leftThumb, rightThumb, grid, simple, zoom)
- `data-rabbitslider-autoplay`: Autoplay delay in ms (false to disable)
- `data-rabbitslider-lazy`: Enable/disable lazy loading
- `data-images`: Comma-separated list of large images
- `data-thumbnails`: Comma-separated list of thumbnail images (optional, will use large images if not provided)

## Slider Types

1. **Classic**: Main image with bottom thumbnails
2. **Left/Right Thumbnails**: Main image with side thumbnails
3. **Grid**: Grid layout with multiple images
4. **Simple**: Basic slider without thumbnails
5. **Zoom**: Main image with zoom functionality
6. **Quick Preview**: Hover preview with thumbnails

## API Methods

```javascript
slider.next()                    // Go to next slide
slider.prev()                    // Go to previous slide
slider.startAutoplay(delay)      // Start autoplay (optional delay in ms)
slider.stopAutoplay()            // Stop autoplay
slider.slideTo(index)            // Go to specific slide
slider.update()                  // Update slider
slider.destroy()                 // Destroy slider instance
slider.getCurrentIndex()         // Get current slide index
slider.getTotal()               // Get total number of slides
slider.on(event, callback)      // Add event listener

// Dynamic Slide Management
slider.addSlide(imageData, index)  // Add new slide, optional index (append if not specified)
slider.removeSlide(index)          // Remove slide at index (removes last if index not specified)

// imageData format:
const imageData = {
    large: 'large.jpg',    // URL to large image
    thumb: 'thumb.jpg',    // URL to thumbnail (optional)
    title: 'Image Title'   // Image title (optional)
}
```

## HTML Structure

```html
<div data-rabbitslider="model-1">
    <!-- Slider will be initialized here -->
</div>
```

## Methods
- `next()` - Go to next slide
- `prev()` - Go to previous slide
- `slideTo(index)` - Go to specific slide
- `startAutoplay(delay)` - Start autoplay
- `stopAutoplay()` - Stop autoplay
- `update()` - Update slider
- `destroy()` - Destroy slider instance
- `addSlide(image, index)` - Add new slide
- `removeSlide(index)` - Remove slide
- `getCurrentIndex()` - Get current slide index
- `getTotal()` - Get total slides
- `on(event, callback)` - Add event listener

## Events
The slider supports all Swiper.js events:
- `slideChange`
- `slideChangeTransitionStart`
- `slideChangeTransitionEnd`
- `imagesReady`
- And more...

## Dependencies
- Swiper.js
- Fancybox (optional, for gallery view)

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- iOS Safari
- Android Chrome

## License
MIT License
