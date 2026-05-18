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
 *     <script src="cms.js?v=3"></script>
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

  <a href="#main-content" class="skip-link">Skip to main content</a>

  <div class="site-announce" role="region" aria-label="Site announcement">
    &#127881; DIAT@50 &mdash; Est. 1976 &nbsp;&middot;&nbsp; Ghana&#39;s premier indigenous art department
    <a href="#signup" class="site-announce__link">Register for Updates &#8594;</a>
  </div>

  <header>
    <nav class="dept-nav" id="dept-nav" aria-label="Primary navigation">
      <div class="container dept-nav__inner">
        <a href="index.html" class="dept-nav__brand" aria-label="DIAT KNUST home">
          <svg class="dept-nav__logo" aria-hidden="true" focusable="false" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="28" cy="38" rx="14" ry="9" stroke="#C9952A" stroke-width="2"/>
      <path d="M28 29 C28 20 40 16 43 22 C46 28 40 33 35 31" stroke="#C9952A" stroke-width="2" stroke-linecap="round" fill="none"/>
      <circle cx="37" cy="28" r="7" stroke="#C9952A" stroke-width="2" fill="none"/>
      <circle cx="39" cy="26" r="1.5" fill="#C9952A"/>
      <path d="M43 30 L49 28 L43 34" stroke="#C9952A" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
      <ellipse cx="20" cy="32" rx="4.5" ry="5.5" stroke="#C9952A" stroke-width="1.6" fill="none"/>
      <path d="M14 38 C9 43 7 50 11 54" stroke="#C9952A" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>
          <div class="dept-nav__brand-text">
            <span class="dept-nav__brand-name">DIAT &middot; KNUST</span>
            <span class="dept-nav__brand-sub">Dept. of Indigenous Art &amp; Technology</span>
          </div>
        </a>
        <ul class="dept-nav__links" role="list">
          <li><a href="index.html"      class="dept-nav__link dept-nav__link--active" aria-current="page">Home</a></li>
          <li><a href="gallery.html"    class="dept-nav__link">Gallery</a></li>
          <li><a href="webar.html"      class="dept-nav__link">WebAR</a></li>
          <li><a href="about.html"      class="dept-nav__link">About</a></li>
          <li><a href="programmes.html" class="dept-nav__link">Programmes</a></li>
          <li><a href="community.html"  class="dept-nav__link">Community</a></li>
          <li><a href="staff.html"      class="dept-nav__link">Staff</a></li>
          <li><a href="archive.html"    class="dept-nav__link">Archive</a></li>
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
      <a href="index.html"      class="dept-nav__drawer-link" onclick="closeDrawer()">Home</a>
      <a href="gallery.html"    class="dept-nav__drawer-link" onclick="closeDrawer()">Artwork Gallery</a>
      <a href="webar.html"      class="dept-nav__drawer-link" onclick="closeDrawer()">WebAR Viewer</a>
      <a href="about.html"      class="dept-nav__drawer-link" onclick="closeDrawer()">About DIAT</a>
      <a href="programmes.html" class="dept-nav__drawer-link" onclick="closeDrawer()">Academic Programmes</a>
      <a href="community.html"  class="dept-nav__drawer-link" onclick="closeDrawer()">Community &amp; Internship</a>
      <a href="staff.html"      class="dept-nav__drawer-link" onclick="closeDrawer()">Staff Profiles</a>
      <a href="contact.html"    class="dept-nav__drawer-link" onclick="closeDrawer()">Contact</a>
      <a href="gallery.html"    class="dept-nav__drawer-cta"  onclick="closeDrawer()">View Gallery &#8594;</a>
    </nav>
  </header>`;

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
  }

  /* Global closeDrawer — called by inline onclick on drawer links */
  window.closeDrawer = function () {
    var d = document.getElementById('nav-drawer');
    var t = document.getElementById('nav-toggle');
    if (d) d.classList.remove('is-open');
    if (t) t.setAttribute('aria-expanded', 'false');
    if (d) d.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
