class RabbitSlider {
    // Sık kullanılan template'leri static metoda taşıyalım
    static #createMainContainer(id) {
        const container = document.createElement('div');
        container.className = 'swiper rabbitSlider-main';
        container.id = `${id}-main`;
        return container;
    }

    static #createThumbContainer(id) {
        const container = document.createElement('div');
        container.className = 'swiper rabbitSlider-thumbs';
        container.id = `${id}-thumbs`;
        return container;
    }

    static #calculateThumbsHeight(thumbContainer, thumbsSwiper) {
        if (!thumbContainer || !thumbsSwiper) return;

        // ID'den ana container'ı bul
		// const mainContainer = thumbContainer.closest('.rabbitSlider-vertical').querySelector('.rabbitSlider-main');
        const mainContainerId = thumbContainer.id.replace('-thumbs', '');
        const mainContainer = document.getElementById(mainContainerId);
        if (!mainContainer) return;

        // Ana görselin aktif slide'ının yüksekliğini al
        const mainSlide = mainContainer.querySelector('.swiper-slide.swiper-slide-active');
        if (!mainSlide) return;

        const mainSlideHeight = mainSlide.offsetHeight;
        console.log('main slide height:', mainSlideHeight);

        if (mainSlideHeight > 0) {
            thumbContainer.style.height = mainSlideHeight + 'px';
            thumbsSwiper.update();
        }
    }

    constructor(element, options = {}) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            console.error('RabbitSlider: Element is required');
            return;
        }

        this.element = element;
        this.options = {
            type: 'classic',
            images: [],
            lazy: true,
            autoplay: false,
            delay: 3000,
            zoomRatio: 2,
            thumbsPerView: 5, // Thumbnail sayısı
            thumbSpacing: 10, // Thumbnail'lar arası boşluk
            ...options
        };
        
        this.element.id ||= 'rabbitSlider_' + Math.random().toString(36).substr(2, 9);
        this.element.classList.add('rabbitSlider');
        this._eventListeners = new Set();
        this.mainSwiper = null;
        this.thumbsSwiper = null;
        
        // Zoom özelliği için gerekli state'ler
        this._isZoomed = false;
        this._zoomElement = null;
        this._resizeObserver = null;
        
        this.init();
        return this;
    }

    static createSlideTemplate(imageData, elementId, isLazy) {
        return `<div class="swiper-slide">
            <a href="${imageData.large}" data-fancybox="gallery-${elementId}">
                <img ${isLazy ? 'data-src' : 'src'}="${imageData.large}" 
                    class="${isLazy ? 'swiper-lazy' : ''}" 
                    alt="${imageData.title || ''}">
                ${isLazy ? '<div class="swiper-lazy-preloader"></div>' : ''}
            </a>
        </div>`;
    }

    static createThumbTemplate(imageData) {
        return `<div class="swiper-slide">
            <img src="${imageData.thumb || imageData.large}" alt="${imageData.title || ''}">
        </div>`;
    }

    _addEventListeners() {
        if (this.options.type === 'zoom') {
            this.element.addEventListener('mousemove', this._handleZoom);
            this._eventListeners.add({
                element: this.element,
                type: 'mousemove',
                handler: this._handleZoom
            });
        }
    }

    _removeEventListeners() {
        for (const {element, type, handler} of this._eventListeners) {
            element.removeEventListener(type, handler);
        }
        this._eventListeners.clear();
    }

    addSlide(image, index) {
        if (!this.mainSwiper || !image) return;

        // Ana slider'a slide ekle
        const mainSlide = RabbitSlider.createSlideTemplate(image, this.element.id, this.options.lazy);
        this.mainSwiper.addSlide(index, mainSlide);

        // Thumbnail slider'a slide ekle
        if (this.thumbsSwiper) {
            const thumbSlide = RabbitSlider.createThumbTemplate(image);
            this.thumbsSwiper.addSlide(index, thumbSlide);

            // Dikey slider ise yüksekliği tekrar hesapla
            if (this.options.type === 'leftThumb' || this.options.type === 'rightThumb') {
                requestAnimationFrame(() => {
                    RabbitSlider.#calculateThumbsHeight(this.thumbsSwiper.el, this.thumbsSwiper);
                });
            }
        }
    }

    removeSlide(index) {
        if (!this.mainSwiper) return;

        if (typeof index !== 'number' || index < 0 || index >= this.mainSwiper.slides.length) {
            index = this.mainSwiper.slides.length - 1;
        }

        requestAnimationFrame(() => {
            this.mainSwiper.removeSlide(index);
            this.thumbsSwiper?.removeSlide(index);
            this.options.images.splice(index, 1);
            this.update();
        });
    }

    removeSlide(index) {
        if (!this.mainSwiper) return;

        this.mainSwiper.removeSlide(index);
        this.thumbsSwiper?.removeSlide(index);

        // Slide silindiğinde yüksekliği güncelle
        if (this.options.type === 'vertical') {
            requestAnimationFrame(() => {
                const mainContainer = this.mainSwiper.el;
                const thumbContainer = this.thumbsSwiper?.el;
                RabbitSlider.#calculateThumbsHeight(thumbContainer, this.thumbsSwiper);
            });
        }
    }

    destroy() {
        if (!this.element) return;

        requestAnimationFrame(() => {
            this.mainSwiper?.destroy(true, true);
            this.thumbsSwiper?.destroy(true, true);
            this._removeEventListeners();

            // ResizeObserver'ı temizle
            if (this._resizeObserver) {
                this._resizeObserver.disconnect();
                this._resizeObserver = null;
            }

            const fragment = document.createDocumentFragment();
            const fancyboxElements = this.element.querySelectorAll('[data-fancybox]');
            
            if (fancyboxElements.length) {
                fancyboxElements.forEach(el => {
                    el.removeAttribute('data-fancybox');
                    fragment.appendChild(el.cloneNode(true));
                });
            }

            this.element.innerHTML = '';
            this.element.classList.remove('rabbitSlider');
            this.element.removeAttribute('data-rabbitslider');

            this.mainSwiper = null;
            this.thumbsSwiper = null;
            this.options = null;
            this.element = null;
        });
    }

    createClassicSlider() {
        const fragment = document.createDocumentFragment();
        const mainContainer = RabbitSlider.#createMainContainer(this.element.id);
        const thumbContainer = RabbitSlider.#createThumbContainer(this.element.id);

        // Template'leri bir kere oluşturup reuse edelim
        const slides = this.options.images.reduce((html, img) => 
            html + RabbitSlider.createSlideTemplate(img, this.element.id, this.options.lazy), '');
            
        const thumbs = this.options.images.reduce((html, img) => 
            html + RabbitSlider.createThumbTemplate(img), '');

        mainContainer.innerHTML = `
            <div class="swiper-wrapper">${slides}</div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>`;

        thumbContainer.innerHTML = `<div class="swiper-wrapper">${thumbs}</div>`;

        fragment.appendChild(mainContainer);
        fragment.appendChild(thumbContainer);
        
        // Tek seferde DOM'a ekleyelim
        requestAnimationFrame(() => {
            this.element.appendChild(fragment);

            // Swiper instance'larını oluşturalım
            this.thumbsSwiper = new Swiper(`#${thumbContainer.id}`, {
                slidesPerView: 'auto',
                spaceBetween: 10,
                watchSlidesProgress: true,
                slideToClickedSlide: true,
                watchSlidesVisibility: true
            });

            this.mainSwiper = new Swiper(`#${mainContainer.id}`, {
                lazy: this.options.lazy,
                navigation: {
                    nextEl: `#${mainContainer.id} .swiper-button-next`,
                    prevEl: `#${mainContainer.id} .swiper-button-prev`
                },
                thumbs: {
                    swiper: this.thumbsSwiper,
                    slideThumbActiveClass: 'swiper-slide-thumb-active'
                },
                autoplay: this.options.autoplay ? {
                    delay: this.options.delay,
                    disableOnInteraction: false
                } : false
            });
        });
    }

    createVerticalSlider(position = 'left') {
        const fragment = document.createDocumentFragment();
        const container = document.createElement('div');
        container.className = 'rabbitSlider-vertical';
        container.style.flexDirection = position === 'right' ? 'row' : 'row-reverse';

        // CSS değişkenlerini ayarla
        container.style.setProperty('--thumbs-per-view', this.options.thumbsPerView);
        container.style.setProperty('--thumbs-spacing', this.options.thumbSpacing + 'px');

        const mainContainer = RabbitSlider.#createMainContainer(this.element.id);
        const thumbContainer = RabbitSlider.#createThumbContainer(this.element.id);
        
        mainContainer.style.flex = '1';

        const slides = this.options.images.reduce((html, img) => 
            html + RabbitSlider.createSlideTemplate(img, this.element.id, this.options.lazy), '');
            
        const thumbs = this.options.images.reduce((html, img) => 
            html + RabbitSlider.createThumbTemplate(img), '');

        mainContainer.innerHTML = `
            <div class="swiper-wrapper">${slides}</div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>`;

        thumbContainer.innerHTML = `
            <div class="swiper-wrapper">${thumbs}</div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>`;

        container.appendChild(mainContainer);
        container.appendChild(thumbContainer);
        fragment.appendChild(container);
        
        requestAnimationFrame(() => {
            this.element.appendChild(fragment);

            // Thumbnail Swiper
            this.thumbsSwiper = new Swiper(`#${thumbContainer.id}`, {
                direction: 'vertical',
                slidesPerView: parseInt(this.options.thumbsPerView) || 3,
                slidesPerGroup: 1,
                spaceBetween: parseInt(this.options.thumbSpacing) || 10,
                watchSlidesProgress: true,
                watchSlidesVisibility: true,
                slideToClickedSlide: true,
                preventInteractionOnTransition: true,
                navigation: {
                    nextEl: `#${thumbContainer.id} .swiper-button-next`,
                    prevEl: `#${thumbContainer.id} .swiper-button-prev`
                },
                on: {
                    init: () => {
                        RabbitSlider.#calculateThumbsHeight(thumbContainer, this.thumbsSwiper);
                    },
                    afterInit: () => {
                        RabbitSlider.#calculateThumbsHeight(thumbContainer, this.thumbsSwiper);
                    },
                    imagesReady: () => {
                        // İlk görsel yüklendiğinde height'ı hesapla
                        RabbitSlider.#calculateThumbsHeight(thumbContainer, this.thumbsSwiper);
                    }
                }
            });

            // Main Swiper
            this.mainSwiper = new Swiper(`#${mainContainer.id}`, {
                lazy: this.options.lazy,
                navigation: {
                    nextEl: `#${mainContainer.id} .swiper-button-next`,
                    prevEl: `#${mainContainer.id} .swiper-button-prev`
                },
                thumbs: {
                    swiper: this.thumbsSwiper,
                    slideThumbActiveClass: 'swiper-slide-thumb-active'
                },
                autoplay: this.options.autoplay ? {
                    delay: this.options.delay,
                    disableOnInteraction: false
                } : false,
                on: {
                    imagesReady: () => {
                        // İlk görsel yüklendiğinde height'ı hesapla
                        RabbitSlider.#calculateThumbsHeight(thumbContainer, this.thumbsSwiper);
                    }
                }
            });

            // Window resize event'ini dinle
            const resizeHandler = () => {
                if (this.options.type === 'leftThumb' || this.options.type === 'rightThumb') {
                    RabbitSlider.#calculateThumbsHeight(thumbContainer, this.thumbsSwiper);
                }
            };

            window.addEventListener('resize', resizeHandler);
            this._eventListeners.add({
                element: window,
                type: 'resize',
                handler: resizeHandler
            });

            // İlk yüklemede bir kez daha dene
            setTimeout(() => {
                RabbitSlider.#calculateThumbsHeight(thumbContainer, this.thumbsSwiper);
            }, 100);
        });
    }

    createGridLayout() {
        this.element.classList.add('rabbitSlider-grid');
        
        // First image (full width)
        const firstImage = this.options.images[0];
        const mainSection = document.createElement('div');
        mainSection.className = 'grid-full';
        mainSection.innerHTML = `
            <a href="${firstImage.large}" data-fancybox="gallery-${this.element.id}">
                <img ${this.options.lazy ? 'data-src' : 'src'}="${firstImage.large}" 
                     class="${this.options.lazy ? 'swiper-lazy' : ''}" 
                     alt="${firstImage.title || ''}"
                     ${!this.options.lazy ? 'loading="lazy"' : ''}>
                ${this.options.lazy ? '<div class="swiper-lazy-preloader"></div>' : ''}
            </a>
        `;
        this.element.appendChild(mainSection);

        // Next 4 images in 2x2 grid
        if (this.options.images.length > 1) {
            const gridMain = document.createElement('div');
            gridMain.className = 'grid-main';
            
            const mainImages = this.options.images.slice(1, 5);
            gridMain.innerHTML = mainImages.map(img => `
                <div>
                    <a href="${img.large}" data-fancybox="gallery-${this.element.id}">
                        <img ${this.options.lazy ? 'data-src' : 'src'}="${img.large}" 
                             class="${this.options.lazy ? 'swiper-lazy' : ''}" 
                             alt="${img.title || ''}"
                             ${!this.options.lazy ? 'loading="lazy"' : ''}>
                        ${this.options.lazy ? '<div class="swiper-lazy-preloader"></div>' : ''}
                    </a>
                </div>
            `).join('');
            this.element.appendChild(gridMain);
        }

        // Remaining images in a single row
        if (this.options.images.length > 5) {
            const gridExtras = document.createElement('div');
            gridExtras.className = 'grid-extras';
            
            const extraImages = this.options.images.slice(5);
            gridExtras.innerHTML = extraImages.map(img => `
                <div>
                    <a href="${img.large}" data-fancybox="gallery-${this.element.id}">
                        <img ${this.options.lazy ? 'data-src' : 'src'}="${img.large}" 
                             class="${this.options.lazy ? 'swiper-lazy' : ''}" 
                             alt="${img.title || ''}"
                             ${!this.options.lazy ? 'loading="lazy"' : ''}>
                        ${this.options.lazy ? '<div class="swiper-lazy-preloader"></div>' : ''}
                    </a>
                </div>
            `).join('');
            this.element.appendChild(gridExtras);
        }

        if (this.options.lazy) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('swiper-lazy');
                        observer.unobserve(img);
                        
                        img.onload = () => {
                            const preloader = img.nextElementSibling;
                            if (preloader && preloader.classList.contains('swiper-lazy-preloader')) {
                                preloader.remove();
                            }
                        };
                    }
                });
            });

            this.element.querySelectorAll('img.swiper-lazy').forEach(img => observer.observe(img));
        }
    }

    createCarousel() {
        const mainContainer = document.createElement('div');
        mainContainer.className = 'swiper rabbitSlider-main';
        mainContainer.id = `${this.element.id}-main`;
        mainContainer.innerHTML = `
            <div class="swiper-wrapper">
                ${this.options.images.map(img => 
                    RabbitSlider.createSlideTemplate(img, this.element.id, this.options.lazy)).join('')}
            </div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>
        `;

        this.element.appendChild(mainContainer);

        this.mainSwiper = new Swiper(`#${mainContainer.id}`, {
            lazy: this.options.lazy,
            navigation: {
                nextEl: `#${mainContainer.id} .swiper-button-next`,
                prevEl: `#${mainContainer.id} .swiper-button-prev`
            },
            autoplay: this.options.autoplay ? {
                delay: this.options.delay,
                disableOnInteraction: false
            } : false
        });
    }

    createZoomSlider() {
        const mainContainer = document.createElement('div');
        mainContainer.className = 'swiper rabbitSlider-main rabbitSlider-zoom';
        mainContainer.id = `${this.element.id}-main`;
        mainContainer.innerHTML = `
            <div class="swiper-wrapper">
                ${this.options.images.map(img => `
                    <div class="swiper-slide">
                        <div class="zoom-container">
                            <a href="${img.large}" data-fancybox="gallery-${this.element.id}">
                                <img ${this.options.lazy ? 'data-src' : 'src'}="${img.large}" 
                                    class="zoom-image ${this.options.lazy ? 'swiper-lazy' : ''}" 
                                    alt="${img.title || ''}"
                                    data-zoom="${img.large}">
                                ${this.options.lazy ? '<div class="swiper-lazy-preloader"></div>' : ''}
                            </a>
                            <div class="zoom-lens"></div>
                            <div class="zoom-result"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        const thumbContainer = document.createElement('div');
        thumbContainer.className = 'swiper rabbitSlider-thumbs';
        thumbContainer.id = `${this.element.id}-thumbs`;
        thumbContainer.innerHTML = `
            <div class="swiper-wrapper">
                ${this.options.images.map(img => 
                    RabbitSlider.createThumbTemplate(img)).join('')}
            </div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>
        `;

        this.element.appendChild(mainContainer);
        this.element.appendChild(thumbContainer);

        this.thumbsSwiper = new Swiper(`#${thumbContainer.id}`, {
            slidesPerView: 'auto',
            spaceBetween: 0,
            watchSlidesProgress: true,
            slideToClickedSlide: true,
            centerInsufficientSlides: false,
            navigation: {
                nextEl: `#${thumbContainer.id} .swiper-button-next`,
                prevEl: `#${thumbContainer.id} .swiper-button-prev`,
            }
        });

        this.mainSwiper = new Swiper(`#${mainContainer.id}`, {
            lazy: this.options.lazy,
            thumbs: { swiper: this.thumbsSwiper }
        });

        // Zoom functionality
        const initZoom = () => {
            const containers = mainContainer.querySelectorAll('.zoom-container');
            containers.forEach(container => {
                const img = container.querySelector('.zoom-image');
                const lens = container.querySelector('.zoom-lens');
                const result = container.querySelector('.zoom-result');
                const link = container.querySelector('a');
                
                if (!img.dataset.zoomInitialized) {
                    const ratio = this.options.zoomRatio;
                    let isZooming = false;
                    let touchStartX = 0;
                    let isTouchZoom = false;

                    const handleZoom = (e) => {
                        const rect = container.getBoundingClientRect();
                        let x, y;

                        if (e.touches) {
                            x = e.touches[0].clientX - rect.left;
                            y = e.touches[0].clientY - rect.top;
                        } else {
                            x = e.clientX - rect.left;
                            y = e.clientY - rect.top;
                        }

                        // Sınırları kontrol et
                        const lensHalfWidth = lens.offsetWidth / 2;
                        const lensHalfHeight = lens.offsetHeight / 2;
                        
                        let lensX = Math.max(lensHalfWidth, Math.min(x, rect.width - lensHalfWidth));
                        let lensY = Math.max(lensHalfHeight, Math.min(y, rect.height - lensHalfHeight));
                        
                        lens.style.left = `${lensX - lensHalfWidth}px`;
                        lens.style.top = `${lensY - lensHalfHeight}px`;

                        // Zoom hesaplama
                        const naturalWidth = img.naturalWidth;
                        const naturalHeight = img.naturalHeight;
                        
                        const scaleX = naturalWidth / rect.width;
                        const scaleY = naturalHeight / rect.height;

                        const zoomX = (lensX - lensHalfWidth) * scaleX;
                        const zoomY = (lensY - lensHalfHeight) * scaleY;
                        
                        result.style.backgroundImage = `url(${img.dataset.zoom || img.src})`;
                        result.style.backgroundPosition = `-${zoomX * ratio}px -${zoomY * ratio}px`;
                        result.style.backgroundSize = `${naturalWidth * ratio}px ${naturalHeight * ratio}px`;
                    };

                    // Desktop events
                    container.addEventListener('mouseenter', (e) => {
                        if (!isTouchZoom) {
                            isZooming = true;
                            lens.style.display = 'block';
                            result.style.display = 'block';
                            handleZoom(e);
                        }
                    });

                    container.addEventListener('mouseleave', () => {
                        if (!isTouchZoom) {
                            isZooming = false;
                            lens.style.display = 'none';
                            result.style.display = 'none';
                        }
                    });

                    container.addEventListener('mousemove', (e) => {
                        if (isZooming && !isTouchZoom) {
                            handleZoom(e);
                        }
                    });

                    // Fancybox kontrolü
                    link.addEventListener('click', (e) => {
                        if (isZooming) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    });
                    
                    // Mobile touch support
                    container.addEventListener('touchstart', (e) => {
                        touchStartX = e.touches[0].clientX;
                        isTouchZoom = true;
                        e.preventDefault();
                        result.style.display = 'block';
                        handleZoom(e);

                        // Swiper'ın touch eventlerini devre dışı bırak
                        this.mainSwiper.allowTouchMove = false;
                    });
                    
                    container.addEventListener('touchend', () => {
                        isTouchZoom = false;
                        result.style.display = 'none';
                        // Swiper’ın touch eventlerini tekrar etkinleştir
                        this.mainSwiper.allowTouchMove = true;
                    });
                    
                    container.addEventListener('touchmove', (e) => {
                        if (isTouchZoom) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Yatay kaydırma mesafesini kontrol et
                            const touchMoveX = e.touches[0].clientX;
                            const touchDiff = Math.abs(touchMoveX - touchStartX);
                            
                            // Eğer yatay kaydırma çok fazlaysa zoom'u kapat
                            if (touchDiff > 50) {
                                isTouchZoom = false;
                                result.style.display = 'none';
                                this.mainSwiper.allowTouchMove = true;
                                return;
                            }
                            
                            handleZoom(e);
                        }
                    });

                    // Preload zoom image
                    const preloadImg = new Image();
                    preloadImg.src = img.dataset.zoom || img.src;
                    preloadImg.onload = () => {
                        img.dataset.zoomInitialized = 'true';
                    };
                }
            });
        };

        this.mainSwiper.on('slideChange', () => setTimeout(initZoom, 100));
        this.mainSwiper.on('lazyImageReady', initZoom);
        setTimeout(initZoom, 100);
    }

    createQuickPreviewSlider() {
        const mainContainer = document.createElement('div');
        mainContainer.className = 'swiper rabbitSlider-main';
        mainContainer.id = `${this.element.id}-main`;
        mainContainer.innerHTML = `
            <div class="swiper-wrapper">
                ${this.options.images.map(img => 
                    RabbitSlider.createSlideTemplate(img, this.element.id, this.options.lazy)).join('')}
            </div>
        `;

        const thumbContainer = document.createElement('div');
        thumbContainer.className = 'swiper rabbitSlider-thumbs rabbitSlider-preview';
        thumbContainer.id = `${this.element.id}-thumbs`;
        thumbContainer.innerHTML = `
            <div class="swiper-wrapper">
                ${this.options.images.map(img => 
                    RabbitSlider.createThumbTemplate(img)).join('')}
            </div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>
        `;

        this.element.appendChild(mainContainer);
        this.element.appendChild(thumbContainer);

        this.thumbsSwiper = new Swiper(`#${thumbContainer.id}`, {
            slidesPerView: 'auto',
            spaceBetween: 10,
            watchSlidesProgress: true,
            slideToClickedSlide: true,
            watchSlidesVisibility: true
        });

        this.mainSwiper = new Swiper(`#${mainContainer.id}`, {
            lazy: this.options.lazy,
            navigation: {
                nextEl: `#${mainContainer.id} .swiper-button-next`,
                prevEl: `#${mainContainer.id} .swiper-button-prev`
            },
            thumbs: {
                swiper: this.thumbsSwiper,
                slideThumbActiveClass: 'swiper-slide-thumb-active'
            },
            autoplay: this.options.autoplay ? {
                delay: this.options.delay,
                disableOnInteraction: false
            } : false
        });

        // Quick preview functionality
        const previewThumbs = thumbContainer.querySelectorAll('.preview-thumb');
        previewThumbs.forEach(thumb => {
            const popup = thumb.querySelector('.preview-popup');
            let timeout;

            thumb.addEventListener('mouseenter', () => {
                timeout = setTimeout(() => {
                    popup.style.display = 'block';
                }, 200);
            });

            thumb.addEventListener('mouseleave', () => {
                clearTimeout(timeout);
                popup.style.display = 'none';
            });
        });
    }

    handleZoom = (e) => {
        if (!this._isZoomed || !this._zoomElement) return;
        
        const rect = this._zoomElement.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 100;
        const y = (e.clientY - rect.top) / rect.height * 100;
        
        if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
            this._zoomElement.style.transformOrigin = `${x}% ${y}%`;
        }
    }

    toggleZoom(element) {
        if (!element || this.options.type !== 'zoom') return;
        
        this._isZoomed = !this._isZoomed;
        this._zoomElement = element;
        
        if (this._isZoomed) {
            element.style.transform = `scale(${this.options.zoomRatio})`;
        } else {
            element.style.transform = '';
            this._zoomElement = null;
        }
    }

    init() {
        switch(this.options.type || this.element.dataset.rabbitslider) {
            case 'zoom':
                this.createZoomSlider();
                break;
            case 'quickPreview':
                this.createQuickPreviewSlider();
                break;
            case 'simple':
                this.createCarousel();
                break;
            case 'grid':
                this.createGridLayout();
                break;
            case 'rightThumb':
                this.createVerticalSlider('right');
                break;
            case 'leftThumb':
                this.createVerticalSlider('left');
                break;
            default:
                this.createClassicSlider();
        }

        if (typeof Fancybox !== 'undefined') {
            Fancybox.bind(`#${this.element.id} [data-fancybox]`);
        }
    }

    next() {
        this.mainSwiper?.slideNext();
    }

    prev() {
        this.mainSwiper?.slidePrev();
    }

    startAutoplay(delay) {
        if (!this.mainSwiper) return;
        
        if (typeof delay === 'number') {
            this.mainSwiper.params.autoplay.delay = delay;
        }
        this.mainSwiper.autoplay.start();
    }

    stopAutoplay() {
        this.mainSwiper?.autoplay.stop();
    }

    slideTo(index) {
        this.mainSwiper?.slideTo(index);
    }

    update() {
        this.mainSwiper?.update();
        this.thumbsSwiper?.update();
    }

    getCurrentIndex() {
        return this.mainSwiper ? this.mainSwiper.activeIndex : 0;
    }

    getTotal() {
        return this.mainSwiper ? this.mainSwiper.slides.length : 0;
    }

    on(event, callback) {
        this.mainSwiper?.on(event, callback);
    }

    static autoInit() {
        const sliders = document.querySelectorAll('[data-rabbitslider-init="true"]');
        if (!sliders.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                
                const element = entry.target;
                const type = element.dataset.rabbitslider || 'classic';
                const autoplay = element.dataset.rabbitsliderAutoplay;
                const lazy = element.dataset.rabbitsliderLazy !== 'false';
                
                const [largeImages, thumbnails] = [
                    element.dataset.images?.split(',') || [],
                    element.dataset.thumbnails?.split(',') || []
                ];
                
                const images = largeImages.map((large, index) => ({
                    large: large.trim(),
                    thumb: (thumbnails[index] || large).trim(),
                    title: `Image ${index + 1}`
                }));

                new RabbitSlider(element, {
                    type,
                    images,
                    lazy,
                    autoplay: !!autoplay,
                    delay: parseInt(autoplay) || 3000
                });

                observer.unobserve(element);
            });
        }, {
            rootMargin: '50px'
        });
        
        sliders.forEach(el => observer.observe(el));
    }
}

// Auto initialize on DOM load
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', RabbitSlider.autoInit);
    } else {
        RabbitSlider.autoInit();
    }
}
