// Scrollytelling Component - Vanilla JS Version
// Add this script to your HTML file

(function() {
  'use strict';

  const TOTAL_FRAMES = 240;
  // Default (dark mode) sequence
  let images = [];
  let imagesLight = [];
  let lightImagesLoaded = false;
  let currentFrame = 0;
  let imagesLoaded = false;
  let canvas, ctx, container;

  // Initialize
  function init() {
    // Mark body as loading to hide content
    document.body.classList.add('scrollytelling-loading');
    
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
    
    // Redraw when theme changes
    const observer = new MutationObserver(() => {
      if (imagesLoaded) {
        drawFrame(currentFrame);
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  // Load all images with optimization for DARK mode (default sequence)
  function loadImages() {
    const loadingEl = document.getElementById('scrollytelling-loading');
    const loadingPercentage = document.getElementById('loading-percentage');
    const loadingTime = document.getElementById('loading-time');
    let loaded = 0;
    const CONCURRENT_LOADS = 8; // Increased for faster loading
    // Optimize batch size based on device
    const isMobile = window.innerWidth <= 768;
    const BATCH_SIZE = isMobile ? 25 : 40; // Larger batches for faster loading

    // Initialize images array for dark-mode sequence
    images = new Array(TOTAL_FRAMES);

    // Start timer
    const startTime = performance.now();

    function updateProgress() {
      const percentage = Math.round((loaded / TOTAL_FRAMES) * 100);
      
      if (loadingPercentage) {
        loadingPercentage.textContent = `${percentage}%`;
      }
      
      // Update timer
      if (loadingTime && loaded < TOTAL_FRAMES) {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        loadingTime.textContent = `${elapsed}s`;
      }
      
      // Wait for ALL frames to load before showing animation and website
      if (loaded === TOTAL_FRAMES) {
        imagesLoaded = true;
        const totalTime = ((performance.now() - startTime) / 1000).toFixed(1);
        
        if (loadingTime) {
          loadingTime.textContent = `Loaded in ${totalTime}s`;
        }
        
        // Small delay to show completion message
        setTimeout(() => {
          if (loadingEl) loadingEl.style.display = 'none';
          
          // Show website content
          document.body.classList.remove('scrollytelling-loading');
          document.body.classList.add('scrollytelling-ready');
          
          // Draw initial frame and start preloading light-mode sequence
          drawFrame(0);
          preloadLightSequence();
        }, 500);
      }
    }

    function loadImage(index) {
      return new Promise((resolve) => {
        const img = new Image();
        const frameNum = (index + 1).toString().padStart(3, '0');
        
        // Try WebP first for better compression, fallback to PNG
        const webpSrc = `sequence/ezgif-frame-${frameNum}.webp`;
        const pngSrc = `sequence/ezgif-frame-${frameNum}.png`;
        
        img.onload = () => {
          loaded++;
          updateProgress();
          resolve();
        };
        
        img.onerror = () => {
          // If WebP fails, try PNG as fallback
          if (img.src.includes('.webp')) {
            img.src = pngSrc;
          } else {
            // Both failed, but continue
            loaded++;
            updateProgress();
            resolve();
          }
        };
        
        // Start with WebP
        img.src = webpSrc;
        images[index] = img;
      });
    }

    // Load all frames in optimized batches
    async function loadAllFrames() {
      for (let start = 0; start < TOTAL_FRAMES; start += BATCH_SIZE) {
        const end = Math.min(start + BATCH_SIZE, TOTAL_FRAMES);
        const batchPromises = [];
        
        // Load batch with concurrency limit
        for (let i = start; i < end; i++) {
          batchPromises.push(loadImage(i));
          
          // Limit concurrent loads to avoid overwhelming browser
          if (batchPromises.length >= CONCURRENT_LOADS) {
            await Promise.all(batchPromises);
            batchPromises.length = 0;
          }
        }
        
        // Load remaining in batch
        if (batchPromises.length > 0) {
          await Promise.all(batchPromises);
        }
        
        // Minimal delay between batches for faster loading
        await new Promise(resolve => setTimeout(resolve, 2));
      }
    }

    // Start loading all frames
    loadAllFrames();
  }

  // Preload LIGHT-MODE sequence in the background (no loading UI)
  function preloadLightSequence() {
    imagesLight = new Array(TOTAL_FRAMES);
    let loaded = 0;
    const CONCURRENT_LOADS = 8;
    const isMobile = window.innerWidth <= 768;
    const BATCH_SIZE = isMobile ? 25 : 40;

    function loadLightImage(index) {
      return new Promise((resolve) => {
        const img = new Image();
        const frameNum = (index + 1).toString().padStart(3, '0');
        const webpSrc = `sequence 2/ezgif-frame-${frameNum}.webp`;
        const pngSrc = `sequence 2/ezgif-frame-${frameNum}.png`;

        img.onload = () => {
          loaded++;
          imagesLight[index] = img;
          resolve();
        };

        img.onerror = () => {
          if (img.src.includes('.webp')) {
            img.src = pngSrc;
          } else {
            // If both formats fail, just skip this frame
            imagesLight[index] = null;
            loaded++;
            resolve();
          }
        };

        img.src = webpSrc;
      });
    }

    async function loadAllLightFrames() {
      for (let start = 0; start < TOTAL_FRAMES; start += BATCH_SIZE) {
        const end = Math.min(start + BATCH_SIZE, TOTAL_FRAMES);
        const batchPromises = [];

        for (let i = start; i < end; i++) {
          batchPromises.push(loadLightImage(i));
          if (batchPromises.length >= CONCURRENT_LOADS) {
            await Promise.all(batchPromises);
            batchPromises.length = 0;
          }
        }

        if (batchPromises.length > 0) {
          await Promise.all(batchPromises);
        }

        await new Promise(resolve => setTimeout(resolve, 2));
      }

      lightImagesLoaded = true;
    }

    loadAllLightFrames();
  }

  // Draw frame to canvas (optimized with interpolation)
  let rafId = null;
  let lastDrawnFrame = -1;
  
  function drawFrame(index) {
    if (!ctx) return;
    
    const isLightMode = document.body.classList.contains('light-mode');
    const sequence = (isLightMode && lightImagesLoaded && imagesLight.length === TOTAL_FRAMES)
      ? imagesLight
      : images;

    if (!sequence || sequence.length === 0) return;
    
    // Use integer frame for now (can add interpolation later if needed)
    const frameIndex = Math.round(index);
    const clamped = Math.max(0, Math.min(frameIndex, sequence.length - 1));
    
    // Skip if same frame is already drawn
    if (clamped === lastDrawnFrame && images[clamped] && images[clamped].complete) {
      return;
    }
    
    const img = sequence[clamped];
    
    // If image not loaded, try to find nearest loaded frame
    if (!img || !img.complete) {
      // Find nearest loaded frame
      for (let offset = 1; offset < 20; offset++) {
        const prevFrame = sequence[clamped - offset];
        const nextFrame = sequence[clamped + offset];
        
        if (prevFrame && prevFrame.complete) {
          drawFrame(clamped - offset);
          return;
        }
        if (nextFrame && nextFrame.complete) {
          drawFrame(clamped + offset);
          return;
        }
      }
      return; // No nearby frames loaded
    }

    // Cancel previous animation frame if pending
    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    // Use requestAnimationFrame for smooth rendering
    rafId = requestAnimationFrame(() => {
      // Use image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
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
      lastDrawnFrame = clamped;
      rafId = null;
    });
  }

  // Setup scroll tracking with smooth interpolation
  let scrollRafId = null;
  let lastScrollTime = 0;
  
  function setupScroll() {
    const scrollContainer = document.getElementById('scrollytelling-scroll');
    if (!scrollContainer) return;

    // Cache container properties for better performance
    let containerTop = scrollContainer.offsetTop;
    let containerHeight = scrollContainer.offsetHeight;
    const viewportHeight = window.innerHeight;

    function updateFrame() {
      // Use requestAnimationFrame for smooth, throttled updates
      if (scrollRafId) {
        cancelAnimationFrame(scrollRafId);
      }

      scrollRafId = requestAnimationFrame(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Recalculate container position if needed (for dynamic layouts)
        const currentContainerTop = scrollContainer.offsetTop;
        const currentContainerHeight = scrollContainer.offsetHeight;
        
        // Update cache if changed significantly
        if (Math.abs(currentContainerTop - containerTop) > 10) {
          containerTop = currentContainerTop;
        }
        if (Math.abs(currentContainerHeight - containerHeight) > 10) {
          containerHeight = currentContainerHeight;
        }
        
        const scrollProgress = Math.max(0, Math.min(1, 
          (scrollTop - containerTop + viewportHeight) / containerHeight
        ));
        
        // Use smooth interpolation instead of floor for smoother transitions
        const exactFrame = scrollProgress * (TOTAL_FRAMES - 1);
        const frame = Math.round(exactFrame);
        
        // Only update if frame changed significantly (reduces unnecessary redraws)
        if (Math.abs(frame - currentFrame) >= 1 && imagesLoaded) {
          currentFrame = frame;
          drawFrame(exactFrame); // Pass exact frame for potential interpolation
        }
        
        scrollRafId = null;
      });
    }

    // Use passive listener for better scroll performance
    window.addEventListener('scroll', updateFrame, { passive: true });
    window.addEventListener('resize', () => {
      containerTop = scrollContainer.offsetTop;
      containerHeight = scrollContainer.offsetHeight;
      updateFrame();
    }, { passive: true });
    updateFrame();
  }

  // Setup text animations with smooth updates
  let textRafId = null;
  
  function setupTextAnimations() {
    const textElements = {
      title: document.getElementById('scrollytelling-title'),
      params: document.getElementById('scrollytelling-params'),
      speed: document.getElementById('scrollytelling-speed'),
      cta: document.getElementById('scrollytelling-cta')
    };

    // Cache container properties
    const scrollContainer = document.getElementById('scrollytelling-scroll');
    if (!scrollContainer) return;
    
    let containerTop = scrollContainer.offsetTop;
    let containerHeight = scrollContainer.offsetHeight;
    const viewportHeight = window.innerHeight;

    function updateText() {
      // Throttle text updates with requestAnimationFrame
      if (textRafId) {
        cancelAnimationFrame(textRafId);
      }

      textRafId = requestAnimationFrame(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Update cache if changed
        const currentContainerTop = scrollContainer.offsetTop;
        const currentContainerHeight = scrollContainer.offsetHeight;
        if (Math.abs(currentContainerTop - containerTop) > 10) {
          containerTop = currentContainerTop;
        }
        if (Math.abs(currentContainerHeight - containerHeight) > 10) {
          containerHeight = currentContainerHeight;
        }
        
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
        
        textRafId = null;
      });
    }

    window.addEventListener('scroll', updateText, { passive: true });
    window.addEventListener('resize', () => {
      containerTop = scrollContainer.offsetTop;
      containerHeight = scrollContainer.offsetHeight;
      updateText();
    }, { passive: true });
    updateText();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
