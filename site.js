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

  /* Read saved site-wide content from localStorage */
  var _sc = {};
  try { _sc = JSON.parse(localStorage.getItem('diat_content') || '{}'); } catch(e) {}
  function _scv(key, def) { return (_sc[key] !== undefined && _sc[key] !== '') ? _sc[key] : def; }

  var ANNOUNCE = `<div class="site-announce" role="region" aria-label="Site announcement">
    <span data-cms-key="site-announce-text" data-cms-label="Announcement Bar Text">${_scv('site-announce-text','&#127881; DIAT@50 &mdash; Est. 1976 &nbsp;&middot;&nbsp; Ghana&#39;s premier indigenous art department')}</span>
    <a href="#signup" class="site-announce__link" data-cms-key="site-announce-link" data-cms-label="Announcement Button Text" data-cms-type="text">${_scv('site-announce-link','Register for Updates &#8594;')}</a>
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

          <!-- Home — no dropdown -->
          <li><a href="index.html" class="dept-nav__link dept-nav__link--active" aria-current="page">Home</a></li>

          <!-- Gallery dropdown -->
          <li class="dept-nav__item" role="none">
            <a href="gallery.html" class="dept-nav__link dept-nav__link--drop" aria-haspopup="true" aria-expanded="false">
              Gallery <span class="dept-nav__chevron" aria-hidden="true">&#9660;</span>
            </a>
            <div class="dept-nav__dropdown" role="menu" aria-label="Gallery sub-menu">
              <a href="gallery.html"           class="dept-nav__drop-link" role="menuitem">&#128444; All Works</a>
              <div class="dept-nav__drop-divider" aria-hidden="true"></div>
              <a href="gallery.html?disc=clay"    class="dept-nav__drop-link" role="menuitem">&#127994; Clay &amp; Earthenware</a>
              <a href="gallery.html?disc=fibres"  class="dept-nav__drop-link" role="menuitem">&#129525; Fibres &amp; Fabrics</a>
              <a href="gallery.html?disc=leather" class="dept-nav__drop-link" role="menuitem">&#128092; Leather Technology</a>
              <a href="gallery.html?disc=metal"   class="dept-nav__drop-link" role="menuitem">&#9881; Metal Production</a>
              <a href="gallery.html?disc=rattan"  class="dept-nav__drop-link" role="menuitem">&#127819; Rattan &amp; Bamboo</a>
              <a href="gallery.html?disc=wood"    class="dept-nav__drop-link" role="menuitem">&#129683; Wood &amp; Furniture</a>
            </div>
          </li>

          <!-- WebAR dropdown -->
          <li class="dept-nav__item" role="none">
            <a href="webar.html" class="dept-nav__link dept-nav__link--drop" aria-haspopup="true" aria-expanded="false">
              WebAR <span class="dept-nav__chevron" aria-hidden="true">&#9660;</span>
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
              About <span class="dept-nav__chevron" aria-hidden="true">&#9660;</span>
            </a>
            <div class="dept-nav__dropdown" role="menu" aria-label="About sub-menu">
              <a href="about.html"                  class="dept-nav__drop-link" role="menuitem">&#127963; Our Story</a>
              <a href="about.html#history-heading"  class="dept-nav__drop-link" role="menuitem">&#128205; History &amp; Timeline</a>
              <a href="about.html#gallery-heading"  class="dept-nav__drop-link" role="menuitem">&#128247; Department Photos</a>
            </div>
          </li>

          <!-- Programmes — MEGA MENU -->
          <li class="dept-nav__item dept-nav__item--mega" role="none">
            <a href="programmes.html" class="dept-nav__link dept-nav__link--drop" aria-haspopup="true" aria-expanded="false">
              Programmes <span class="dept-nav__chevron" aria-hidden="true">&#9660;</span>
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
              Community <span class="dept-nav__chevron" aria-hidden="true">&#9660;</span>
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
              Staff <span class="dept-nav__chevron" aria-hidden="true">&#9660;</span>
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
              Archive <span class="dept-nav__chevron" aria-hidden="true">&#9660;</span>
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
      <a href="index.html" class="dept-nav__drawer-link" onclick="closeDrawer()">Home</a>

      <!-- Gallery accordion -->
      <div class="dept-nav__drawer-group">
        <button class="dept-nav__drawer-link dept-nav__drawer-toggle"
                onclick="toggleDrawerGroup(this)" aria-expanded="false">
          Artwork Gallery <span class="dept-nav__chevron" aria-hidden="true">&#9660;</span>
        </button>
        <div class="dept-nav__drawer-sub" aria-hidden="true">
          <a href="gallery.html"              class="dept-nav__drawer-sublink" onclick="closeDrawer()">All Works</a>
          <a href="gallery.html?disc=clay"    class="dept-nav__drawer-sublink" onclick="closeDrawer()">Clay &amp; Earthenware</a>
          <a href="gallery.html?disc=fibres"  class="dept-nav__drawer-sublink" onclick="closeDrawer()">Fibres &amp; Fabrics</a>
          <a href="gallery.html?disc=leather" class="dept-nav__drawer-sublink" onclick="closeDrawer()">Leather Technology</a>
          <a href="gallery.html?disc=metal"   class="dept-nav__drawer-sublink" onclick="closeDrawer()">Metal Production</a>
          <a href="gallery.html?disc=rattan"  class="dept-nav__drawer-sublink" onclick="closeDrawer()">Rattan &amp; Bamboo</a>
          <a href="gallery.html?disc=wood"    class="dept-nav__drawer-sublink" onclick="closeDrawer()">Wood &amp; Furniture</a>
        </div>
      </div>

      <!-- WebAR -->
      <a href="webar.html" class="dept-nav__drawer-link" onclick="closeDrawer()">WebAR Viewer</a>

      <!-- About -->
      <a href="about.html" class="dept-nav__drawer-link" onclick="closeDrawer()">About DIAT</a>

      <!-- Programmes accordion -->
      <div class="dept-nav__drawer-group">
        <button class="dept-nav__drawer-link dept-nav__drawer-toggle"
                onclick="toggleDrawerGroup(this)" aria-expanded="false">
          Programmes <span class="dept-nav__chevron" aria-hidden="true">&#9660;</span>
        </button>
        <div class="dept-nav__drawer-sub" aria-hidden="true">
          <a href="programmes.html"         class="dept-nav__drawer-sublink" onclick="closeDrawer()">All Programmes</a>
          <a href="product-design.html"     class="dept-nav__drawer-sublink" onclick="closeDrawer()">&#128208; Product Design</a>
          <a href="clay-earthenware.html"   class="dept-nav__drawer-sublink" onclick="closeDrawer()">&#127994; Clay &amp; Earthenware</a>
          <a href="fibres-fabrics.html"     class="dept-nav__drawer-sublink" onclick="closeDrawer()">&#129525; Fibres &amp; Fabrics</a>
          <a href="leather-technology.html" class="dept-nav__drawer-sublink" onclick="closeDrawer()">&#128092; Leather Technology</a>
          <a href="metal-production.html"   class="dept-nav__drawer-sublink" onclick="closeDrawer()">&#9881; Metal Production</a>
          <a href="rattan-bamboo.html"      class="dept-nav__drawer-sublink" onclick="closeDrawer()">&#127819; Rattan &amp; Bamboo</a>
          <a href="wood-furniture.html"     class="dept-nav__drawer-sublink" onclick="closeDrawer()">&#129683; Wood &amp; Furniture</a>
        </div>
      </div>

      <!-- Community -->
      <a href="community.html" class="dept-nav__drawer-link" onclick="closeDrawer()">Community &amp; Internship</a>

      <!-- Staff accordion -->
      <div class="dept-nav__drawer-group">
        <button class="dept-nav__drawer-link dept-nav__drawer-toggle"
                onclick="toggleDrawerGroup(this)" aria-expanded="false">
          Staff &amp; Students <span class="dept-nav__chevron" aria-hidden="true">&#9660;</span>
        </button>
        <div class="dept-nav__drawer-sub" aria-hidden="true">
          <a href="staff.html"                    class="dept-nav__drawer-sublink" onclick="closeDrawer()">All Staff</a>
          <a href="staff.html#academic-heading"   class="dept-nav__drawer-sublink" onclick="closeDrawer()">Academic Staff</a>
          <a href="staff.html#technical-heading"  class="dept-nav__drawer-sublink" onclick="closeDrawer()">Technical Staff</a>
          <a href="staff.html#siat-reps-heading"  class="dept-nav__drawer-sublink" onclick="closeDrawer()">SIAT Representatives</a>
          <a href="staff.html#siat-hub-heading"   class="dept-nav__drawer-sublink" onclick="closeDrawer()">SIAT Student Hub</a>
        </div>
      </div>

      <!-- Archive -->
      <a href="archive.html" class="dept-nav__drawer-link" onclick="closeDrawer()">Digital Archive</a>
      <a href="contact.html"    class="dept-nav__drawer-link" onclick="closeDrawer()">Contact</a>
      <a href="gallery.html"    class="dept-nav__drawer-cta"  onclick="closeDrawer()">View Gallery &#8594;</a>
    </nav>
  </header>`;

  var FOOTER = `<footer class="site-footer" role="contentinfo" aria-label="Site footer">
    <div class="container">
      <div class="site-footer__grid">
        <div>
          <p class="site-footer__brand-name" data-cms-key="site-footer-brand" data-cms-label="Footer Brand Name" data-cms-type="text">${_scv('site-footer-brand','Dept. of Indigenous Art &amp; Technology')}</p>
          <span class="site-footer__brand-sub" data-cms-key="site-footer-sub" data-cms-label="Footer Sub-line" data-cms-type="text">${_scv('site-footer-sub','KNUST &middot; College of Art and Built Environment &middot; Kumasi, Ghana')}</span>
          <p class="site-footer__description" data-cms-key="site-footer-desc" data-cms-label="Footer Description">${_scv('site-footer-desc','DIAT is dedicated to the preservation, teaching, and global promotion of Ghana&#39;s indigenous art and craft heritage &mdash; Est. 1976.')}</p>
          <nav class="site-footer__social" aria-label="Social media">
            <a href="${_scv('site-social-ig','#')}" class="site-footer__social-link" aria-label="Instagram">&#128247;</a>
            <a href="${_scv('site-social-fb','#')}" class="site-footer__social-link" aria-label="Facebook">&#127760;</a>
            <a href="${_scv('site-social-tt','#')}" class="site-footer__social-link" aria-label="TikTok">&#127925;</a>
            <a href="${_scv('site-social-wa','#')}" class="site-footer__social-link" aria-label="WhatsApp">&#128172;</a>
            <a href="${_scv('site-social-yt','#')}" class="site-footer__social-link" aria-label="YouTube">&#9654;</a>
          </nav>
        </div>
        <nav aria-label="Explore"><h3 class="site-footer__col-title">Explore</h3><ul class="site-footer__col-links" role="list"><li><a href="gallery.html" class="site-footer__col-link">Artwork Gallery</a></li><li><a href="webar.html" class="site-footer__col-link">WebAR Viewer</a></li><li><a href="about.html" class="site-footer__col-link">About DIAT</a></li><li><a href="archive.html" class="site-footer__col-link">Digital Archive</a></li></ul></nav>
        <nav aria-label="Academic"><h3 class="site-footer__col-title">Academic</h3><ul class="site-footer__col-links" role="list"><li><a href="programmes.html" class="site-footer__col-link">All Programmes</a></li><li><a href="staff.html" class="site-footer__col-link">Staff Directory</a></li><li><a href="community.html" class="site-footer__col-link">Internship</a></li></ul></nav>
        <nav aria-label="Connect"><h3 class="site-footer__col-title">Connect</h3><ul class="site-footer__col-links" role="list"><li><a href="contact.html" class="site-footer__col-link">Contact Us</a></li><li><a href="#signup" class="site-footer__col-link">Newsletter</a></li><li><a href="contact.html" class="site-footer__col-link">Commission Artwork</a></li></ul></nav>
      </div>
      <div class="site-footer__bottom">
        <p class="site-footer__bottom-text" data-cms-key="site-footer-copy" data-cms-label="Footer Copyright Line 1">${_scv('site-footer-copy','&copy; 2026 DIAT, <strong>KNUST</strong>. All rights reserved.')}</p>
        <p class="site-footer__bottom-text" data-cms-key="site-footer-copy2" data-cms-label="Footer Copyright Line 2">${_scv('site-footer-copy2','MPhil research project &mdash; <strong>CABE, KNUST.</strong>')}</p>
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

  /* Global closeDrawer — called by inline onclick on drawer links */
  window.closeDrawer = function () {
    var d = document.getElementById('nav-drawer');
    var t = document.getElementById('nav-toggle');
    if (d) d.classList.remove('is-open');
    if (t) t.setAttribute('aria-expanded', 'false');
    if (d) d.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  /* Mobile drawer accordion — tap to expand sub-link groups */
  window.toggleDrawerGroup = function (btn) {
    var sub  = btn.nextElementSibling;
    var open = btn.getAttribute('aria-expanded') === 'true';
    /* Close all other groups */
    document.querySelectorAll('.dept-nav__drawer-toggle').forEach(function(b) {
      if (b !== btn) {
        b.setAttribute('aria-expanded', 'false');
        var s = b.nextElementSibling;
        if (s) { s.setAttribute('aria-hidden', 'true'); s.style.maxHeight = '0'; }
      }
    });
    /* Toggle this one */
    btn.setAttribute('aria-expanded', String(!open));
    if (sub) {
      sub.setAttribute('aria-hidden', String(open));
      sub.style.maxHeight = open ? '0' : sub.scrollHeight + 'px';
    }
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
