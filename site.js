/*
 * ============================================================
 * site.js — DIAT KNUST Hub shared component injector
 * ============================================================
 *
 * ARCHITECTURE:
 *   This single file owns ALL shared UI: announce bar, header,
 *   nav, footer, and their JavaScript behaviour.
 *
 *   Every HTML page loads only:
 *     <script src="site.js"></script>
 *     <script src="cms.js?v=4"></script>
 *
 *   To update the nav, footer, or announcement for the entire
 *   site: edit THIS file, push once, done.
 *   No individual page downloads needed ever again.
 *
 * HOW IT WORKS:
 *   1. Injects announce bar, header (with nav), and footer into
 *      every page using known DOM landmarks.
 *   2. Reads data-page attribute on <body> to set aria-current
 *      on the correct nav link.
 *   3. Attaches all nav event listeners (hamburger, scroll shadow).
 *   4. Handles scroll-reveal for .js-reveal elements.
 *
 * USAGE in each HTML page:
 *   <body data-page="about">   ← matches nav link href prefix
 *   <body data-page="gallery">
 *   <body data-page="home">    ← for index.html
 *   etc.
 * ============================================================
 */

(function () {
  'use strict';

  /* ── 1. SHARED HTML BLOCKS ──────────────────────────────── */

  var ANNOUNCE = `<div class="site-announce" role="region" aria-label="Site announcement">
    &#127881; DIAT@50 &mdash; Est. 1976 &nbsp;&middot;&nbsp; Ghana&#39;s premier indigenous art department
    <a href="#signup" class="site-announce__link">Register for Updates &#8594;</a>
  </div>`;

  var HEADER = `<header class="site-header" role="banner" aria-label="Site brand">
    <div class="site-header__logo-container">
      <!--
        Replace the SVG below with your actual DIAT logo file.
        Minimum: 2× resolution PNG or true SVG vector.
        Alt text follows the pattern: "[Org Name] official logo"
      -->
      <svg class="site-header__logo" viewBox="0 0 160 48" fill="none"
           xmlns="http://www.w3.org/2000/svg"
           aria-label="DIAT — Department of Indigenous Art and Technology, KNUST"
           role="img" focusable="false">
        <!-- Wordmark placeholder — replace src with real logo asset -->
        <text x="0" y="34" font-family="Georgia, serif" font-size="22"
              font-weight="700" fill="#1A1A4E" letter-spacing="-0.5">DIAT</text>
        <text x="60" y="34" font-family="Georgia, serif" font-size="12"
              fill="#C9952A" letter-spacing="0">&#183; KNUST</text>
        <line x1="0" y1="40" x2="160" y2="40" stroke="#C9952A"
              stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
  </header>
    <nav class="dept-nav" id="dept-nav" aria-label="Primary navigation">
      <div class="container dept-nav__inner">
        <a href="index.html" class="dept-nav__brand" aria-label="DIAT KNUST home">
          <!-- 50th Anniversary logo replaces the SVG Sankofa.
               .nav-badge-wrap provides perspective + float animation
               identical to the hero badge. Scaled smaller for nav. -->
          <div class="nav-badge-wrap" aria-hidden="true">
            <img class="dept-nav__logo nav-badge-logo"
                 src="50TH%20DIAT%20-%20KNUST_logo_final-03.webp"
                 alt=""
                 draggable="false"
                 loading="eager">
            <div class="nav-badge-shadow"></div>
          </div>
          <div class="dept-nav__brand-text">
            <span class="dept-nav__brand-name">DIAT &middot; KNUST</span>
            <span class="dept-nav__brand-sub">Dept. of Indigenous Art &amp; Technology</span>
          </div>
        </a>
        <ul class="dept-nav__links" role="list">

          <!-- Home — no dropdown -->
          <li><a href="index.html" class="dept-nav__link">Home</a></li>

          <!-- Gallery dropdown -->
          <li class="dept-nav__item" role="none">
            <a href="gallery.html" class="dept-nav__link dept-nav__link--drop" aria-haspopup="true" aria-expanded="false">
              Gallery
            </a>
            <div class="dept-nav__dropdown" role="menu" aria-label="Gallery sub-menu">
              <a href="gallery.html" class="dept-nav__drop-link" role="menuitem">&#128444; All Works</a>
              <div class="dept-nav__drop-divider" aria-hidden="true"></div>
              <a href="gallery.html#jan-2026" class="dept-nav__drop-link" role="menuitem">&#127912; 2026 January Open Sales</a>
              <a href="gallery.html#elearning-2026" class="dept-nav__drop-link" role="menuitem">&#127912; 2026 July E-Learning Int. Conference Exhibition</a>
              <a href="gallery.html#jul-2026" class="dept-nav__drop-link" role="menuitem">&#127912; 2026 July Open Sale</a>
              <a href="gallery.html#mphil-2026" class="dept-nav__drop-link" role="menuitem">&#127891; 2026 MPhil Artwork Exhibition</a>
              <a href="gallery.html#nov-2025" class="dept-nav__drop-link" role="menuitem">&#127912; 2025 November Open Sales</a>
            </div>
          </li>

                                                                                                                                                                                                                                                                                                                                                    <!-- WebAR dropdown -->
          <li class="dept-nav__item" role="none">
            <a href="webar.html" class="dept-nav__link dept-nav__link--drop" aria-haspopup="true" aria-expanded="false">
              WebAR
            </a>
            <div class="dept-nav__dropdown" role="menu" aria-label="WebAR sub-menu">
              <a href="webar.html"          class="dept-nav__drop-link" role="menuitem">&#127918; Launch 3D Viewer</a>
              <div class="dept-nav__drop-divider" aria-hidden="true"></div>
              <a href="webar.html?art=Traditional+Drum+Stool" class="dept-nav__drop-link" role="menuitem">&#9656; Traditional Drum Stool</a>
              <a href="webar.html?art=3-Faced+Pots"           class="dept-nav__drop-link" role="menuitem">&#9656; 3-Faced Pots</a>
              <a href="webar.html?art=Metal+Sculpture+Parrot" class="dept-nav__drop-link" role="menuitem">&#9656; Metal Sculpture — Parrot</a>
            </div>
          </li>

          <!-- About dropdown -->
          <li class="dept-nav__item" role="none">
            <a href="about.html" class="dept-nav__link dept-nav__link--drop" aria-haspopup="true" aria-expanded="false">
              About
            </a>
            <div class="dept-nav__dropdown" role="menu" aria-label="About sub-menu">
              <a href="about.html"                  class="dept-nav__drop-link" role="menuitem">&#127963; Our Story</a>
              <a href="about.html#history-heading"  class="dept-nav__drop-link" role="menuitem">&#128205; History &amp; Timeline</a>
              <a href="about.html#gallery-heading"  class="dept-nav__drop-link" role="menuitem">&#128247; Department Photos</a>
              <a href="contact.html"                     class="dept-nav__drop-link" role="menuitem">&#128222; Contact</a>
            </div>
          </li>

          <!-- Programmes — MEGA MENU -->
          <li class="dept-nav__item dept-nav__item--mega" role="none">
            <a href="programmes.html" class="dept-nav__link dept-nav__link--drop" aria-haspopup="true" aria-expanded="false">
              Programmes
            </a>
            <div class="dept-nav__mega" role="menu" aria-label="Programmes sub-menu">
              <div class="dept-nav__mega-col">
                <span class="dept-nav__mega-heading">&#127891; Academic Programmes</span>
                <a href="programmes.html"          class="dept-nav__drop-link dept-nav__drop-link--sub" role="menuitem">View All Programmes</a>
                <div class="dept-nav__drop-divider" aria-hidden="true"></div>
                <a href="product-design.html"      class="dept-nav__drop-link dept-nav__drop-link--sub" role="menuitem">&#128208; Product Design</a>
                <a href="clay-earthenware.html"    class="dept-nav__drop-link dept-nav__drop-link--sub" role="menuitem">&#127994; Clay &amp; Earthenware</a>
                <a href="fibres-fabrics.html"      class="dept-nav__drop-link dept-nav__drop-link--sub" role="menuitem">&#129525; Fibres &amp; Fabrics</a>
                <a href="leather-technology.html"  class="dept-nav__drop-link dept-nav__drop-link--sub" role="menuitem">&#128092; Leather Technology</a>
                <a href="metal-production.html"    class="dept-nav__drop-link dept-nav__drop-link--sub" role="menuitem">&#9881; Metal Production</a>
                <a href="rattan-bamboo.html"       class="dept-nav__drop-link dept-nav__drop-link--sub" role="menuitem">&#127819; Rattan &amp; Bamboo</a>
                <a href="wood-furniture.html"      class="dept-nav__drop-link dept-nav__drop-link--sub" role="menuitem">&#129683; Wood &amp; Furniture</a>
              </div>
              <div class="dept-nav__mega-col">
                <span class="dept-nav__mega-heading">&#127807; Community &amp; Outreach</span>
                <a href="community.html"  class="dept-nav__drop-link dept-nav__drop-link--sub" role="menuitem">Community Overview</a>
                <a href="community.html#how-heading" class="dept-nav__drop-link dept-nav__drop-link--sub" role="menuitem">Internship Programme</a>
                <a href="community.html#comm-cta-heading" class="dept-nav__drop-link dept-nav__drop-link--sub" role="menuitem">Mastercard Partnership</a>
                <div class="dept-nav__drop-divider" aria-hidden="true"></div>
                <span class="dept-nav__mega-heading" style="margin-top:var(--sp-sm)">&#128203; Resources</span>
                <a href="archive.html"    class="dept-nav__drop-link dept-nav__drop-link--sub" role="menuitem">Digital Archive</a>
                <a href="staff.html"      class="dept-nav__drop-link dept-nav__drop-link--sub" role="menuitem">Staff Directory</a>
              </div>
            </div>
          </li>

          <!-- Community dropdown -->
          <li class="dept-nav__item" role="none">
            <a href="community.html" class="dept-nav__link dept-nav__link--drop" aria-haspopup="true" aria-expanded="false">
              Community
            </a>
            <div class="dept-nav__dropdown" role="menu" aria-label="Community sub-menu">
              <a href="community.html"                        class="dept-nav__drop-link" role="menuitem">&#127807; Community Overview</a>
              <a href="community.html#how-heading"            class="dept-nav__drop-link" role="menuitem">&#128205; Internship Programme</a>
              <a href="community.html#partner-heading"        class="dept-nav__drop-link" role="menuitem">&#127775; Mastercard Partnership</a>
            </div>
          </li>

          <!-- Staff dropdown -->
          <li class="dept-nav__item" role="none">
            <a href="staff.html" class="dept-nav__link dept-nav__link--drop" aria-haspopup="true" aria-expanded="false">
              Staff
            </a>
            <div class="dept-nav__dropdown" role="menu" aria-label="Staff sub-menu">
              <a href="staff.html"                      class="dept-nav__drop-link" role="menuitem">&#128100; All Staff</a>
              <div class="dept-nav__drop-divider" aria-hidden="true"></div>
              <a href="staff.html#academic-heading"     class="dept-nav__drop-link" role="menuitem">&#127891; Academic Staff</a>
              <a href="staff.html#technical-heading"    class="dept-nav__drop-link" role="menuitem">&#9881; Technical Staff</a>
              <div class="dept-nav__drop-divider" aria-hidden="true"></div>
              <a href="staff.html#siat-reps-heading"   class="dept-nav__drop-link" role="menuitem">&#127775; SIAT Representatives</a>
              <a href="staff.html#siat-hub-heading"     class="dept-nav__drop-link" role="menuitem">&#128250; SIAT Student Hub</a>
            </div>
          </li>

          <!-- Archive dropdown -->
          <li class="dept-nav__item" role="none">
            <a href="archive.html" class="dept-nav__link dept-nav__link--drop" aria-haspopup="true" aria-expanded="false">
              Archive
            </a>
            <div class="dept-nav__dropdown" role="menu" aria-label="Archive sub-menu">
              <a href="archive.html"                    class="dept-nav__drop-link" role="menuitem">&#128203; Digital Archive</a>
              <div class="dept-nav__drop-divider" aria-hidden="true"></div>
              <a href="archive.html?filter=research"    class="dept-nav__drop-link" role="menuitem">&#128240; Research Papers</a>
              <a href="archive.html?filter=history"     class="dept-nav__drop-link" role="menuitem">&#127963; Historical Records</a>
              <a href="archive.html?filter=student"     class="dept-nav__drop-link" role="menuitem">&#127891; Student Works</a>
              <a href="archive.html?filter=community"   class="dept-nav__drop-link" role="menuitem">&#127807; Community Reports</a>
            </div>
          </li>

        </ul>
        <a href="gallery.html" class="dept-nav__cta">View Gallery</a>
        <button class="dept-nav__toggle" id="nav-toggle"
                aria-label="Open navigation menu" aria-expanded="false" aria-controls="nav-drawer">
          <span class="dept-nav__toggle-bar"></span>
          <span class="dept-nav__toggle-bar"></span>
          <span class="dept-nav__toggle-bar"></span>
        </button>
      </div>
    </nav>
    <nav class="dept-nav__drawer" id="nav-drawer"
         aria-label="Mobile navigation" aria-hidden="true">
      <!-- Home -->
      <a href="index.html"      class="dept-nav__drawer-link">Home</a>
      <a href="gallery.html"    class="dept-nav__drawer-link">Artwork Gallery</a>
      <a href="webar.html"      class="dept-nav__drawer-link">WebAR Viewer</a>
      <a href="about.html"      class="dept-nav__drawer-link">About DIAT</a>
      <a href="programmes.html" class="dept-nav__drawer-link">Programmes</a>
      <a href="community.html"  class="dept-nav__drawer-link">Community &amp; Internship</a>
      <a href="staff.html"      class="dept-nav__drawer-link">Staff &amp; Students</a>
      <!-- Archive -->
      <a href="archive.html" class="dept-nav__drawer-link">Digital Archive</a>
      <a href="contact.html"    class="dept-nav__drawer-link">Contact</a>
      <a href="gallery.html"    class="dept-nav__drawer-cta">View Gallery &#8594;</a>
    </nav>`;

  var FOOTER = `<footer class="site-footer" role="contentinfo" aria-label="Site footer">
    <div class="container">
      <div class="site-footer__grid">
        <div>
          <p class="site-footer__brand-name">Dept. of Indigenous Art &amp; Technology</p>
          <span class="site-footer__brand-sub">KNUST &middot; College of Art and Built Environment &middot; Kumasi, Ghana</span>
          <p class="site-footer__description">DIAT is dedicated to the preservation, teaching, and global promotion of Ghana&#39;s indigenous art and craft heritage &mdash; Est. 1976.</p>
          <nav class="site-footer__social" aria-label="Social media">
            <a href="#" class="site-footer__social-link" aria-label="Instagram">&#128247;</a>
            <a href="#" class="site-footer__social-link" aria-label="Facebook">&#127760;</a>
            <a href="#" class="site-footer__social-link" aria-label="TikTok">&#127925;</a>
            <a href="#" class="site-footer__social-link" aria-label="WhatsApp">&#128172;</a>
            <a href="#" class="site-footer__social-link" aria-label="YouTube">&#9654;</a>
          </nav>
        </div>
        <nav aria-label="Explore"><h3 class="site-footer__col-title">Explore</h3><ul class="site-footer__col-links" role="list"><li><a href="gallery.html" class="site-footer__col-link">Artwork Gallery</a></li><li><a href="webar.html" class="site-footer__col-link">WebAR Viewer</a></li><li><a href="about.html" class="site-footer__col-link">About DIAT</a></li><li><a href="archive.html" class="site-footer__col-link">Digital Archive</a></li></ul></nav>
        <nav aria-label="Academic"><h3 class="site-footer__col-title">Academic</h3><ul class="site-footer__col-links" role="list"><li><a href="programmes.html" class="site-footer__col-link">All Programmes</a></li><li><a href="staff.html" class="site-footer__col-link">Staff Directory</a></li><li><a href="community.html" class="site-footer__col-link">Internship</a></li></ul></nav>
        <nav aria-label="Connect"><h3 class="site-footer__col-title">Connect</h3><ul class="site-footer__col-links" role="list"><li><a href="contact.html" class="site-footer__col-link">Contact Us</a></li><li><a href="#signup" class="site-footer__col-link">Newsletter</a></li><li><a href="contact.html" class="site-footer__col-link">Commission Artwork</a></li></ul></nav>
      </div>
      <div class="site-footer__bottom">
        <p class="site-footer__bottom-text">&copy; 2026 DIAT, <strong>KNUST</strong>. All rights reserved.</p>
        <p class="site-footer__bottom-text">MPhil research project &mdash; <strong>CABE, KNUST.</strong></p>
      </div>
    </div>
  </footer>`;

  /* ── 2. INJECT INTO PAGE ─────────────────────────────────── */

  function inject() {
    var body = document.body;

    /* ── Inject compact-nav styles into <head> ──────────────────
     * Putting critical layout rules here in JS means they are
     * ALWAYS present, never cached away, never overridden by load order.
     * These fix the nav overflow on mobile desktop mode (~980px viewport).
     */
    var navStyle = document.createElement('style');
    navStyle.id  = 'diat-nav-compact';
    navStyle.textContent = [
      /* Force the nav inner to never wrap */
      '.dept-nav__inner{flex-wrap:nowrap!important;gap:4px!important;}',
      /* Hide optional CTA before it can collide with the last nav item */
      '@media (min-width: 1201px) and (max-width: 1360px){',
        '.dept-nav__cta{display:none!important;}',
      '}',
      /* At narrower desktop/tablet widths: compress everything to fit in one row */
      '@media (min-width: 769px) and (max-width: 1200px){',
        '.dept-nav__inner{padding-inline:8px!important;gap:2px!important;}',
        '.dept-nav__brand-name{font-size:.78rem!important;letter-spacing:0!important;}',
        '.dept-nav__brand-sub{display:none!important;}',
        '.dept-nav__logo{width:26px!important;height:26px!important;}',
        '.dept-nav__links{gap:0!important;flex-wrap:nowrap!important;}',
        '.dept-nav__link{font-size:.68rem!important;padding:4px 5px!important;white-space:nowrap!important;}',
        '/* chevron removed */',
        '.dept-nav__cta{display:none!important;}',
      '}'
    ].join('');
    if (!document.getElementById('diat-nav-compact')) {
      document.head.appendChild(navStyle);
    }

    /* Announce bar — prepend before everything */
    var annEl = document.createElement('div');
    annEl.innerHTML = ANNOUNCE;
    body.insertBefore(annEl.firstElementChild, body.firstChild);

    /* Header (site-header + nav + drawer) — after announce */
    var annNode = body.querySelector('.site-announce');
    var headerEl = document.createElement('div');
    headerEl.innerHTML = HEADER;
    while (headerEl.firstChild) {
      body.insertBefore(headerEl.firstChild, annNode ? annNode.nextSibling : body.firstChild);
    }

    /* Footer — before closing body */
    var main = body.querySelector('main');
    var footerEl = document.createElement('div');
    footerEl.innerHTML = FOOTER;
    if (main && main.nextSibling) {
      body.insertBefore(footerEl.firstElementChild, main.nextSibling);
    } else {
      body.appendChild(footerEl.firstElementChild);
    }

    /* Set active nav link based on <body data-page="..."> */
    var page = body.getAttribute('data-page') || 'home';
    var links = document.querySelectorAll('.dept-nav__link, .dept-nav__drawer-link');
    links.forEach(function(link) {
      var href = link.getAttribute('href') || '';
      var isHome    = page === 'home' && (href === 'index.html' || href === '/');
      var isMatch   = page !== 'home' && href.indexOf(page) !== -1;
      if (isHome || isMatch) {
        link.classList.add('dept-nav__link--active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ── 3. NAV BEHAVIOUR ─────────────────────────────────────── */

  function initNav() {
    var nav    = document.getElementById('dept-nav');
    var toggle = document.getElementById('nav-toggle');
    var drawer = document.getElementById('nav-drawer');

    if (nav) {
      window.addEventListener('scroll', function () {
        nav.classList.toggle('is-scrolled', window.scrollY > 8);
      }, { passive: true });
    }

    if (toggle && drawer) {
      toggle.addEventListener('click', function () {
        var open = drawer.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        drawer.setAttribute('aria-hidden', String(!open));
        document.body.style.overflow = open ? 'hidden' : '';
      });
    }

    document.querySelectorAll('.dept-nav__drawer-link, .dept-nav__drawer-cta')
      .forEach(function (link) {
        link.addEventListener('click', closeDrawer);
      });

    /*
     * DROPDOWN HOVER — JS mouseenter/mouseleave handlers.
     * More reliable than CSS :hover alone because parent overflow:hidden
     * can silently block :hover on absolutely-positioned children.
     * Adds/removes .is-open class; CSS rules above target .is-open.
     * A 100ms close delay prevents the dropdown from flickering when
     * the mouse briefly passes through the 6px gap between link and panel.
     */
    var closeTimers = {};
    document.querySelectorAll('.dept-nav__item').forEach(function(item, idx) {
      var panel = item.querySelector('.dept-nav__dropdown, .dept-nav__mega');
      if (!panel) return;
      var id = 'drop-' + idx;

      item.addEventListener('mouseenter', function () {
        clearTimeout(closeTimers[id]);
        panel.classList.add('is-open');
        var link = item.querySelector('.dept-nav__link--drop');
        if (link) link.setAttribute('aria-expanded', 'true');
      });

      item.addEventListener('mouseleave', function () {
        closeTimers[id] = setTimeout(function () {
          panel.classList.remove('is-open');
          var link = item.querySelector('.dept-nav__link--drop');
          if (link) link.setAttribute('aria-expanded', 'false');
        }, 100);
      });

      /* Keep open if mouse re-enters the panel itself */
      panel.addEventListener('mouseenter', function () {
        clearTimeout(closeTimers[id]);
      });
      panel.addEventListener('mouseleave', function () {
        closeTimers[id] = setTimeout(function () {
          panel.classList.remove('is-open');
          var link = item.querySelector('.dept-nav__link--drop');
          if (link) link.setAttribute('aria-expanded', 'false');
        }, 100);
      });

      /* Keyboard: Escape closes open panel */
      item.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          panel.classList.remove('is-open');
          var link = item.querySelector('.dept-nav__link--drop');
          if (link) { link.setAttribute('aria-expanded', 'false'); link.focus(); }
        }
      });
    });

    /* Close all dropdowns when clicking outside the nav */
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.dept-nav__item')) {
        document.querySelectorAll('.dept-nav__dropdown.is-open, .dept-nav__mega.is-open')
          .forEach(function(p) { p.classList.remove('is-open'); });
      }
    });
  }

  function closeDrawer() {
    var d = document.getElementById('nav-drawer');
    var t = document.getElementById('nav-toggle');
    if (d) d.classList.remove('is-open');
    if (t) t.setAttribute('aria-expanded', 'false');
    if (d) d.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  window.closeDrawer = closeDrawer;

  /* toggleDrawerGroup removed — drawer uses simple links */

  /* ── 4. SCROLL REVEAL ─────────────────────────────────────── */

  function initReveal() {
    var els = document.querySelectorAll('.js-reveal');
    if (!els.length) return;
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
        });
      }, { threshold: 0.08 });
      els.forEach(function (el) { obs.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  /* ── 5. BOOT ──────────────────────────────────────────────── */

  function boot() {
    inject();
    initNav();
    initReveal();
  }

  /* ── 6. SCROLL RESTORATION — reset position on every page load ── */
  /* Prevents browser from restoring scroll position after back/forward */
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  /* ── 7. BACK-TO-TOP BUTTON ─────────────────────────────────────
   * Injected into every page. Appears (bottom-right) once user scrolls
   * past 500px. Smooth-scrolls to top on click. Keyboard accessible.
   * ─────────────────────────────────────────────────────────────── */
  function initScrollTop() {
    /* Inject button */
    var btn = document.createElement('button');
    btn.id = 'scroll-top-btn';
    btn.className = 'scroll-top-btn';
    btn.setAttribute('aria-label', 'Scroll back to top');
    btn.setAttribute('title', 'Back to top');
    btn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(btn);

    /* Show/hide on scroll */
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          btn.classList.toggle('scroll-top-btn--visible', window.scrollY > 500);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    /* Smooth scroll to top */
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Scroll to top after full page load (fixes reload-stay-in-place) */
  window.addEventListener('load', function () {
    window.scrollTo(0, 0);
    initScrollTop();
  });

})();
