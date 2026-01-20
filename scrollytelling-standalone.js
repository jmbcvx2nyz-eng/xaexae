// Scrollytelling Component - Vanilla JS Version
// Add this script to your HTML file

(function() {
  'use strict';

  const TOTAL_FRAMES = 240;
  let images = [];
  let currentFrame = 0;
  let imagesLoaded = false;
  let canvas, ctx, container;

  // Initialize
  function init() {
    container = document.getElementById('scrollytelling-container');
    if (!container) {
      console.error('Scrollytelling container not found');
      return;
    }

    canvas = document.getElementById('scrollytelling-canvas');
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    ctx = canvas.getContext('2d');
    setupCanvas();
    loadImages();
    setupScroll();
    setupTextAnimations();
  }

  // Setup canvas
  function setupCanvas() {
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (imagesLoaded) drawFrame(currentFrame);
    }
    resize();
    window.addEventListener('resize', resize);
  }

  // Load all images
  function loadImages() {
    const loadingEl = document.getElementById('scrollytelling-loading');
    const loadingText = loadingEl ? loadingEl.querySelector('p') : null;
    let loaded = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = i.toString().padStart(3, '0');
      
      img.onload = () => {
        loaded++;
        if (loadingText) {
          loadingText.textContent = `Loading... ${Math.round((loaded / TOTAL_FRAMES) * 100)}%`;
        }
        if (loaded === TOTAL_FRAMES) {
          imagesLoaded = true;
          if (loadingEl) loadingEl.style.display = 'none';
          drawFrame(0);
        }
      };
      
      img.onerror = () => {
        loaded++;
        if (loadingText) {
          loadingText.textContent = `Loading... ${Math.round((loaded / TOTAL_FRAMES) * 100)}%`;
        }
        if (loaded === TOTAL_FRAMES) {
          imagesLoaded = true;
          if (loadingEl) loadingEl.style.display = 'none';
          drawFrame(0);
        }
      };

      img.src = `sequence/ezgif-frame-${frameNum}.png`;
      images.push(img);
    }
  }

  // Draw frame to canvas
  function drawFrame(index) {
    if (!ctx || images.length === 0) return;
    
    const clamped = Math.max(0, Math.min(Math.floor(index), images.length - 1));
    const img = images[clamped];
    if (!img || !img.complete) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imgAspect = img.width / img.height;
    const canvasAspect = canvas.width / canvas.height;
    let w, h, x, y;

    if (imgAspect > canvasAspect) {
      h = canvas.height;
      w = h * imgAspect;
      x = (canvas.width - w) / 2;
      y = 0;
    } else {
      w = canvas.width;
      h = w / imgAspect;
      x = 0;
      y = (canvas.height - h) / 2;
    }

    ctx.drawImage(img, x, y, w, h);
  }

  // Setup scroll tracking
  function setupScroll() {
    const scrollContainer = document.getElementById('scrollytelling-scroll');
    if (!scrollContainer) return;

    function updateFrame() {
      const rect = scrollContainer.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const containerTop = scrollContainer.offsetTop;
      const containerHeight = scrollContainer.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      const scrollProgress = Math.max(0, Math.min(1, 
        (scrollTop - containerTop + viewportHeight) / containerHeight
      ));
      
      const frame = Math.floor(scrollProgress * (TOTAL_FRAMES - 1));
      if (frame !== currentFrame && imagesLoaded) {
        currentFrame = frame;
        drawFrame(frame);
      }
    }

    window.addEventListener('scroll', updateFrame);
    updateFrame();
  }

  // Setup text animations
  function setupTextAnimations() {
    const textElements = {
      title: document.getElementById('scrollytelling-title'),
      params: document.getElementById('scrollytelling-params'),
      speed: document.getElementById('scrollytelling-speed'),
      cta: document.getElementById('scrollytelling-cta')
    };

    function updateText() {
      const scrollContainer = document.getElementById('scrollytelling-scroll');
      if (!scrollContainer) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const containerTop = scrollContainer.offsetTop;
      const containerHeight = scrollContainer.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      const progress = Math.max(0, Math.min(1, 
        (scrollTop - containerTop + viewportHeight) / containerHeight
      ));

      // Title (0-0.2)
      if (textElements.title) {
        const titleOpacity = progress < 0.1 ? 1 : progress < 0.2 ? 1 - (progress - 0.1) * 10 : 0;
        const titleBlur = progress < 0.1 ? 0 : progress < 0.2 ? (progress - 0.1) * 100 : 10;
        textElements.title.style.opacity = titleOpacity;
        textElements.title.style.filter = `blur(${titleBlur}px)`;
      }

      // Params (0.35-0.65) - delayed to appear later
      if (textElements.params) {
        const paramsOpacity = progress < 0.35 ? 0 : progress < 0.45 ? (progress - 0.35) * 10 : progress < 0.55 ? 1 : progress < 0.65 ? 1 - (progress - 0.55) * 10 : 0;
        const paramsY = progress < 0.35 ? 30 : progress < 0.45 ? 30 - (progress - 0.35) * 300 : progress < 0.55 ? 0 : progress < 0.65 ? (progress - 0.55) * 100 : 10;
        const paramsBlur = progress < 0.35 ? 10 : progress < 0.45 ? 10 - (progress - 0.35) * 100 : progress < 0.55 ? 0 : progress < 0.65 ? (progress - 0.55) * 100 : 10;
        textElements.params.style.opacity = paramsOpacity;
        textElements.params.style.transform = `translateY(${paramsY}px)`;
        textElements.params.style.filter = `blur(${paramsBlur}px)`;
      }

      // Speed (0.65-0.85) - adjusted to follow params
      if (textElements.speed) {
        const speedOpacity = progress < 0.65 ? 0 : progress < 0.72 ? (progress - 0.65) * 14.3 : progress < 0.78 ? 1 : progress < 0.85 ? 1 - (progress - 0.78) * 14.3 : 0;
        const speedY = progress < 0.65 ? 30 : progress < 0.72 ? 30 - (progress - 0.65) * 428 : progress < 0.78 ? 0 : progress < 0.85 ? (progress - 0.78) * 142 : 10;
        const speedBlur = progress < 0.65 ? 10 : progress < 0.72 ? 10 - (progress - 0.65) * 143 : progress < 0.78 ? 0 : progress < 0.85 ? (progress - 0.78) * 143 : 10;
        textElements.speed.style.opacity = speedOpacity;
        textElements.speed.style.transform = `translateY(${speedY}px)`;
        textElements.speed.style.filter = `blur(${speedBlur}px)`;
      }

      // CTA (0.85-1) - adjusted to follow speed
      if (textElements.cta) {
        const ctaOpacity = progress < 0.85 ? 0 : progress < 0.92 ? (progress - 0.85) * 14.3 : 1;
        const ctaY = progress < 0.85 ? 30 : progress < 0.92 ? 30 - (progress - 0.85) * 428 : 0;
        const ctaScale = progress < 0.85 ? 0.95 : progress < 0.92 ? 0.95 + (progress - 0.85) * 0.71 : 1;
        const ctaBlur = progress < 0.85 ? 10 : progress < 0.92 ? 10 - (progress - 0.85) * 143 : 0;
        textElements.cta.style.opacity = ctaOpacity;
        textElements.cta.style.transform = `translateY(${ctaY}px) scale(${ctaScale})`;
        textElements.cta.style.filter = `blur(${ctaBlur}px)`;
      }
    }

    window.addEventListener('scroll', updateText);
    updateText();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
