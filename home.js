/* ==========================================================================
   Savoya Home page scripts  (savoyaground/home → home.js)
   Loaded in the Home page footer with defer.

   Sections
     1. Vehicle selector  – Swiper + vehicle-selection-v1.js, loaded near the section
     2. Stat icons        – still images on phones/tablets, Lordicon player on desktop
     3. Count-ups         – "6 / 300+ / 1" numbers in Where We Serve
     4. Sliders           – four Splide sliders, Splide loaded on first need
     5. Review schema     – Review JSON-LD built from the testimonial cards

   Everything runs inside one function, so nothing leaks onto window
   except window.SavoyaIcons, which core/lordicons.js reads.
   Third-party URLs are pinned (full commit hash or exact version).
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Shared helpers ---------- */

  var IS_SMALL = window.matchMedia('(max-width: 991px)').matches;

  // Folder this file was served from, so images ship with the same commit
  var BASE = (function () {
    var s = document.currentScript && document.currentScript.src;
    return s ? s.slice(0, s.lastIndexOf('/') + 1) : 'https://cdn.jsdelivr.net/gh/savoyaground/home@main/';
  })();

  function addScript(src, onload) {
    var s = document.createElement('script');
    s.src = src;
    if (onload) s.onload = onload;
    document.head.appendChild(s);
  }

  // Run fn once, when any of the elements gets within margin of the screen
  function whenNear(els, margin, fn) {
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(); }
    }, { rootMargin: margin + ' 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }


  /* ==========================================================================
     1. Vehicle selector (.vehicle-showcase)
     Swiper and vehicle-selection-v1.js load once the visitor is within 800px
     of the section. vehicle-selection-v1.js waits for DOMContentLoaded, which
     has already fired by then, so its listener is run right away.
     ========================================================================== */
  var VEHICLES = {
    swiper: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
    script: 'https://cdn.jsdelivr.net/gh/savoyaground/swiper@e690f04c443cc2f7a753e7abbe91d408820165e9/vehicle-selection-v1.js'
  };

  function loadVehicleSelector() {
    addScript(VEHICLES.swiper, function () {
      var orig = document.addEventListener;
      document.addEventListener = function (type, fn, opts) {
        if (type === 'DOMContentLoaded') {
          try { fn.call(document, new Event('DOMContentLoaded')); } catch (e) { console.error(e); }
          return;
        }
        return orig.call(this, type, fn, opts);
      };
      addScript(VEHICLES.script, function () { document.addEventListener = orig; });
    });
  }


  /* ==========================================================================
     2. Stat icons (.statbar-icon-block lord-icon)
     Phones/tablets: show still WebP images and never load the player
     (it costs ~0.5 s of phone CPU).
     Desktop: load core/lordicons.js on the visitor's first mouse move, scroll
     or key press, once an icon is fully on screen.
     ========================================================================== */
  var ICONS = {
    player: 'https://cdn.jsdelivr.net/gh/savoyaground/core@7732114a40fe9d58a1ebb9fee356864efd68c73b/lordicons.js',
    blocks: {
      'statbar-icon-block': ['cprqqkky', 'hsnymvfu', 'jprswwur', 'srnhabba', 'uhrslskd']
    },
    // Ids with a still image in img/ (uhrslskd has none; it isn't on the page)
    stills: ['cprqqkky', 'hsnymvfu', 'jprswwur', 'srnhabba']
  };

  window.SavoyaIcons = { blocks: ICONS.blocks };

  function paintStillIcons() {
    Object.keys(ICONS.blocks).forEach(function (cls) {
      var ids = ICONS.blocks[cls];
      document.querySelectorAll('.' + cls).forEach(function (block) {
        block.querySelectorAll('lord-icon.lordicon-dynamic').forEach(function (icon, i) {
          var id = ids[i];
          if (!id || ICONS.stills.indexOf(id) === -1 || icon.querySelector('img')) return;
          var img = new Image();
          img.src = BASE + 'img/stat-' + id + '.webp';
          img.width = 48; img.height = 48; img.alt = ''; img.decoding = 'async';
          img.style.cssText = 'display:block;width:100%;height:100%';
          icon.style.display = 'inline-block';
          icon.style.opacity = '1';
          icon.appendChild(img);
        });
      });
    });
  }

  function startAnimatedIcons() {
    var loaded = false;
    function load() { if (!loaded) { loaded = true; addScript(ICONS.player); } }

    function start() {
      var els = document.querySelectorAll('lord-icon');
      if (!els.length || !('IntersectionObserver' in window)) { load(); return; }
      // Load once an icon is fully on screen, so it draws in as the visitor arrives
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.intersectionRatio >= 0.99; })) { io.disconnect(); load(); }
      }, { threshold: 1 });
      els.forEach(function (el) { io.observe(el); });
    }

    // Wait for the first interaction, so the player never runs during first paint (or a speed test)
    var begun = false;
    function begin() { if (!begun) { begun = true; start(); } }
    ['pointermove', 'mousemove', 'scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, begin, { once: true, passive: true });
    });
  }


  /* ==========================================================================
     3. Count-ups (.countup2 inside Where We Serve, triggered by .service-area)
     Counts from 0 to the number written in the element over 4 s, easing out,
     then adds thousands separators.
     ========================================================================== */
  var COUNT = { duration: 4000, numbers: '.countup2', trigger: '.service-area' };

  function countUp(el) {
    var target = parseInt(el.textContent, 10);
    if (isNaN(target)) return;
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / COUNT.duration, 1);
      var eased = t * (2 - t);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = target.toLocaleString('en-US');
    }
    requestAnimationFrame(frame);
  }

  function initCountUps() {
    var trigger = document.querySelector(COUNT.trigger);
    var nums = document.querySelectorAll(COUNT.numbers);
    if (!trigger || !nums.length) return;
    if (!('IntersectionObserver' in window)) { nums.forEach(countUp); return; }
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      nums.forEach(countUp);
    });
    io.observe(trigger);
  }


  /* ==========================================================================
     4. Sliders (Splide)
     Each slider mounts when it gets within 600px of the screen. Splide itself
     is fetched the first time any slider needs it.
       .slider1  How We Do It (fade)
       .slider2  Customer testimonials
       .slider3  Chauffeur spotlight
       .slider4  Service areas
     ========================================================================== */
  var SPLIDE_SRC = 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.0.7/dist/js/splide.min.js';

  var SLIDERS = {
    slider1: {
      type: 'fade',
      arrows: true,
      speed: 600,
      autoWidth: false,
      rewind: true,
      rewindSpeed: 400,
      waitForTransition: false,
      updateOnMove: true,
      trimSpace: false,
      classes: { pagination: 'splide__pagination how-we-do-it-pagination' }
    },
    slider2: {
      type: 'loop',
      drag: true,
      snap: true,
      perPage: 3,
      focus: 0,
      breakpoints: {
        991: { perPage: 2 },
        767: { perPage: 1, padding: '24px' }
      }
    },
    slider3: {
      type: 'loop',
      drag: true,
      snap: true,
      speed: 600,
      rewind: true,
      rewindSpeed: 400,
      breakpoints: {
        767: { padding: '32px', gap: '12px' },
        479: { padding: '16px' }
      }
    },
    slider4: {
      type: 'loop',
      drag: 'free',
      snap: true,
      pagination: false,
      perPage: 4,
      perMove: 1,
      gap: '16px',
      breakpoints: {
        991: { perPage: 3 },
        767: { perPage: 2, padding: '24px' },
        479: { perPage: 1 }
      }
    }
  };

  var splideState = 0, splideQueue = [];   // 0 not loaded, 1 loading, 2 ready
  function withSplide(fn) {
    if (splideState === 2) { fn(); return; }
    splideQueue.push(fn);
    if (splideState) return;
    splideState = 1;
    addScript(SPLIDE_SRC, function () {
      splideState = 2;
      splideQueue.splice(0).forEach(function (f) { f(); });
    });
  }

  function initSliders() {
    Object.keys(SLIDERS).forEach(function (cls) {
      var els = document.querySelectorAll('.' + cls);
      whenNear(Array.prototype.slice.call(els, 0, 1), '600px', function () {
        withSplide(function () {
          els.forEach(function (el) { new window.Splide(el, SLIDERS[cls]).mount(); });
        });
      });
    });
  }


  /* ==========================================================================
     5. Review schema (.review-schema data-author / data-review)
     ========================================================================== */
  function addReviewSchema() {
    document.querySelectorAll('.review-schema').forEach(function (item) {
      var s = document.createElement('script');
      s.type = 'application/ld+json';
      s.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Review',
        itemReviewed: { '@type': 'Organization', name: 'Savoya' },
        author: { '@type': 'Person', name: item.dataset.author },
        reviewBody: item.dataset.review
      });
      document.head.appendChild(s);
    });
  }


  /* ---------- Start ---------- */

  // Each feature starts on its own, so one failing can't stop the others
  function safely(name, fn) {
    try { fn(); } catch (e) { console.error('[home] ' + name + ' failed', e); }
  }

  onReady(function () {
    safely('vehicle selector', function () {
      whenNear(Array.prototype.slice.call(document.querySelectorAll('.vehicle-showcase')), '800px', loadVehicleSelector);
    });
    safely('stat icons', IS_SMALL ? paintStillIcons : startAnimatedIcons);
    safely('count-ups', initCountUps);
    safely('sliders', initSliders);
    safely('review schema', addReviewSchema);
  });
})();
