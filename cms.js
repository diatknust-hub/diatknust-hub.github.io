/**
 * DIAT CMS v2 — Content Management Script
 * ─────────────────────────────────────────
 * Add to every page:  <script src="cms.js"></script>
 * Tag any editable:   data-cms-key="unique-id"
 * Optional label:     data-cms-label="Friendly Name"
 * Optional type:      data-cms-type="html|text"  (default: html)
 *
 * HOW IT WORKS:
 * 1. Checks localStorage for admin session set by admin.html login
 * 2. If admin: injects gold bar at top of every page + gold outline on hover
 * 3. Click any highlighted element → edit modal opens
 * 4. Save → writes to localStorage → updates DOM instantly
 * 5. On any page load: reads localStorage and restores saved content
 */
(function () {
  'use strict';

  const ADMIN_KEY   = 'diat_admin_session';
  const CONTENT_KEY = 'diat_content';
  const PAGE_NAME   = document.title.split('—')[0].trim();

  /* ─── Helpers ─────────────────────────────────────────────── */
  function getContent() {
    try { return JSON.parse(localStorage.getItem(CONTENT_KEY) || '{}'); }
    catch(e) { return {}; }
  }
  function saveContent(key, val) {
    const c = getContent();
    c[key] = val;
    localStorage.setItem(CONTENT_KEY, JSON.stringify(c));
  }
  function isAdmin() {
    return localStorage.getItem(ADMIN_KEY) === 'true';
  }

  /* ─── 1. RESTORE saved content on every page load ─────────── */
  function loadSavedContent() {
    const saved = getContent();
    document.querySelectorAll('[data-cms-key]').forEach(function(el) {
      var key  = el.dataset.cmsKey;
      var type = el.dataset.cmsType || 'html';
      if (saved[key] !== undefined && saved[key] !== '') {
        if (type === 'text') { el.textContent = saved[key]; }
        else                 { el.innerHTML   = saved[key]; }
      }
    });
  }

  /* ─── 2. INJECT shared CSS ────────────────────────────────── */
  function injectCSS() {
    var style = document.createElement('style');
    style.id  = 'diat-cms-style';
    style.textContent = [

      /* Admin bar ─────────────────────────────────────────── */
      '#diat-cms-bar{',
        'position:fixed;top:0;left:0;right:0;z-index:2147483647;',
        'background:#1A1A4E;color:#fff;',
        'height:46px;display:flex;align-items:center;',
        'justify-content:space-between;padding:0 20px;',
        'font-family:"Inter",system-ui,sans-serif;font-size:.78rem;',
        'box-shadow:0 2px 16px rgba(0,0,0,.35);',
      '}',
      '#diat-cms-bar .cb-left{display:flex;align-items:center;gap:10px}',
      '#diat-cms-bar .cb-icon{font-size:1rem;color:#C9952A}',
      '#diat-cms-bar .cb-mode{font-weight:700;color:#C9952A;letter-spacing:.08em;text-transform:uppercase;font-size:.72rem}',
      '#diat-cms-bar .cb-page{color:rgba(255,255,255,.4);font-size:.68rem;border-left:1px solid rgba(255,255,255,.15);padding-left:10px;margin-left:2px}',
      '#diat-cms-bar .cb-right{display:flex;align-items:center;gap:8px}',
      '#diat-cms-bar .cb-count{font-size:.68rem;color:rgba(255,255,255,.35);margin-right:4px}',
      '#diat-cms-bar .cb-btn{',
        'font-family:"Inter",system-ui,sans-serif;font-size:.7rem;font-weight:600;',
        'padding:6px 14px;border-radius:50px;cursor:pointer;border:none;white-space:nowrap;',
        'text-decoration:none;transition:all .2s ease;display:inline-flex;align-items:center;',
      '}',
      '#diat-cms-bar .cb-panel{background:transparent;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.2)}',
      '#diat-cms-bar .cb-panel:hover{background:rgba(255,255,255,.08);color:#fff}',
      '#diat-cms-bar .cb-logout{background:rgba(220,53,69,.15);color:#ff8585;border:1px solid rgba(220,53,69,.2)}',
      '#diat-cms-bar .cb-logout:hover{background:rgba(220,53,69,.3)}',

      /* Push page content below bar ────────────────────────── */
      'body.diat-admin-mode{padding-top:46px !important}',

      /* Gold outline on hoverable/editable elements ─────────  */
      'body.diat-admin-mode [data-cms-key]{',
        'cursor:pointer !important;',
        'position:relative;',
        'transition:outline .15s ease,background-color .15s ease;',
      '}',
      'body.diat-admin-mode [data-cms-key]:hover{',
        'outline:2px dashed #C9952A !important;',
        'outline-offset:4px;',
        'background-color:rgba(201,149,42,.04) !important;',
        'border-radius:3px;',
      '}',

      /* Floating edit tooltip ─────────────────────────────── */
      '#diat-cms-tooltip{',
        'position:fixed;z-index:2147483646;',
        'background:#C9952A;color:#fff;',
        'font-family:"Inter",system-ui,sans-serif;',
        'font-size:.68rem;font-weight:700;',
        'padding:5px 12px;border-radius:50px;',
        'pointer-events:none;',
        'white-space:nowrap;',
        'box-shadow:0 4px 12px rgba(201,149,42,.4);',
        'letter-spacing:.04em;',
        'display:none;',
        'transform:translateY(-4px);',
      '}',

      /* Edited badge ─────────────────────────────────────── */
      'body.diat-admin-mode [data-cms-edited="true"]{',
        'box-shadow:0 0 0 2px rgba(201,149,42,.3) !important;',
        'border-radius:3px;',
      '}',

      /* MODAL ─────────────────────────────────────────────── */
      '#diat-cms-modal{',
        'display:none;position:fixed;inset:0;z-index:2147483647;',
        'background:rgba(0,0,0,.65);backdrop-filter:blur(4px);',
        'align-items:center;justify-content:center;padding:20px;',
      '}',
      '#diat-cms-modal.cms-open{display:flex}',
      '.cms-mbox{',
        'background:#fff;border-radius:14px;',
        'padding:32px;width:100%;max-width:680px;',
        'box-shadow:0 24px 64px rgba(0,0,0,.3);',
        'font-family:"Inter",system-ui,sans-serif;',
        'max-height:90vh;display:flex;flex-direction:column;',
        'animation:cmsIn .25s ease;',
      '}',
      '@keyframes cmsIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
      '.cms-mhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}',
      '.cms-mtitle{font-size:1rem;font-weight:700;color:#1A1A4E}',
      '.cms-mclose{background:none;border:none;font-size:1.2rem;cursor:pointer;color:#999;padding:4px 8px;border-radius:6px}',
      '.cms-mclose:hover{background:#f0f0f0}',
      '.cms-mkey{font-size:.65rem;color:#bbb;font-family:monospace;margin-bottom:14px}',
      '.cms-mhint{font-size:.74rem;color:#777;background:#FBF4E6;border-left:3px solid #C9952A;padding:8px 12px;border-radius:4px;margin-bottom:12px;line-height:1.55}',
      '.cms-mta{',
        'width:100%;min-height:160px;max-height:340px;',
        'font-family:"Inter",system-ui,sans-serif;font-size:.88rem;',
        'color:#222;border:1.5px solid #E8E4DC;border-radius:8px;',
        'padding:12px;outline:none;resize:vertical;line-height:1.7;flex:1;',
      '}',
      '.cms-mta:focus{border-color:#C9952A;box-shadow:0 0 0 3px rgba(201,149,42,.12)}',
      '.cms-mactions{display:flex;gap:10px;margin-top:14px;align-items:center;flex-wrap:wrap}',
      '.cms-msave{background:#C9952A;color:#fff;font-size:.84rem;font-weight:600;padding:11px 28px;border-radius:50px;border:none;cursor:pointer;font-family:"Inter",system-ui,sans-serif}',
      '.cms-msave:hover{background:#9A6F10}',
      '.cms-mcancel{background:#f4f4f4;color:#555;font-size:.84rem;padding:10px 22px;border-radius:50px;border:1px solid #ddd;cursor:pointer;font-family:"Inter",system-ui,sans-serif}',
      '.cms-mcancel:hover{background:#eee}',
      '.cms-mreset{margin-left:auto;background:none;color:#dc3545;font-size:.72rem;border:none;cursor:pointer;font-family:"Inter",system-ui,sans-serif;padding:4px 8px;border-radius:4px}',
      '.cms-mreset:hover{background:#fff5f5}',
      '.cms-msaved{font-size:.74rem;color:#198754;font-weight:600;display:none;align-items:center;gap:4px}',
      '.cms-msaved.show{display:flex}',

      /* Toast ─────────────────────────────────────────────── */
      '#diat-cms-toast{',
        'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);',
        'z-index:2147483647;background:#1A1A4E;color:#fff;',
        'font-size:.8rem;font-weight:500;padding:10px 22px;',
        'border-radius:50px;display:none;white-space:nowrap;',
        'font-family:"Inter",system-ui,sans-serif;',
        'box-shadow:0 4px 16px rgba(0,0,0,.25);',
        'animation:cmsIn .3s ease;',
      '}',
      '#diat-cms-toast.show{display:block}',

    ].join('');
    document.head.appendChild(style);
  }

  /* ─── 3. BUILD admin bar ──────────────────────────────────── */
  function buildAdminBar() {
    document.body.classList.add('diat-admin-mode');

    var els   = document.querySelectorAll('[data-cms-key]');
    var saved = getContent();
    var editedCount = 0;
    els.forEach(function(el) {
      if (saved[el.dataset.cmsKey] !== undefined) {
        el.dataset.cmsEdited = 'true';
        editedCount++;
      }
    });

    var bar = document.createElement('div');
    bar.id  = 'diat-cms-bar';
    bar.innerHTML =
      '<div class="cb-left">' +
        '<span class="cb-icon">&#9998;</span>' +
        '<span class="cb-mode">Admin Mode</span>' +
        '<span class="cb-page">' + PAGE_NAME + '</span>' +
      '</div>' +
      '<div class="cb-right">' +
        '<span class="cb-count" id="cms-count">' + els.length + ' editable &nbsp;|&nbsp; ' + editedCount + ' edited</span>' +
        '<a href="admin.html" class="cb-btn cb-panel">&#9776; Admin Panel</a>' +
        '<button class="cb-btn cb-logout" onclick="diatCMSLogout()">&#x2B05; Sign Out</button>' +
      '</div>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  /* ─── 4. FLOATING tooltip that follows hover ──────────────── */
  function buildTooltip() {
    var tip = document.createElement('div');
    tip.id  = 'diat-cms-tooltip';
    document.body.appendChild(tip);

    document.addEventListener('mouseover', function(e) {
      var el = e.target.closest('[data-cms-key]');
      if (!el) { tip.style.display = 'none'; return; }
      var label = el.dataset.cmsLabel || el.dataset.cmsKey;
      tip.textContent = '✏ Edit: ' + label;
      tip.style.display = 'block';
    });

    document.addEventListener('mouseout', function(e) {
      if (!e.target.closest('[data-cms-key]')) {
        tip.style.display = 'none';
      }
    });

    document.addEventListener('mousemove', function(e) {
      tip.style.left = (e.clientX + 14) + 'px';
      tip.style.top  = (e.clientY - 32) + 'px';
    });
  }

  /* ─── 5. BUILD modal ──────────────────────────────────────── */
  var _activeKey  = null;
  var _activeEl   = null;
  var _activeType = 'html';
  var _origVal    = '';

  function buildModal() {
    var m = document.createElement('div');
    m.id  = 'diat-cms-modal';
    m.innerHTML =
      '<div class="cms-mbox">' +
        '<div class="cms-mhead">' +
          '<span class="cms-mtitle" id="cms-mtitle">Edit Content</span>' +
          '<button class="cms-mclose" onclick="diatCMSClose()">&#10005;</button>' +
        '</div>' +
        '<div class="cms-mkey" id="cms-mkey"></div>' +
        '<div class="cms-mhint" id="cms-mhint"></div>' +
        '<textarea class="cms-mta" id="cms-mta" placeholder="Enter content here…"></textarea>' +
        '<div class="cms-mactions">' +
          '<button class="cms-msave"   onclick="diatCMSSave()">&#10003; Save Changes</button>' +
          '<button class="cms-mcancel" onclick="diatCMSClose()">Cancel</button>' +
          '<span class="cms-msaved" id="cms-msaved">&#10003; Saved!</span>' +
          '<button class="cms-mreset"  onclick="diatCMSReset()">&#8635; Reset to Default</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(m);

    /* Close on overlay click */
    m.addEventListener('click', function(e) {
      if (e.target === m) diatCMSClose();
    });
    /* Close on Escape */
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') diatCMSClose();
    });
  }

  function openModal(el) {
    _activeEl   = el;
    _activeKey  = el.dataset.cmsKey;
    _activeType = el.dataset.cmsType || 'html';
    var label   = el.dataset.cmsLabel || _activeKey;
    var saved   = getContent();

    _origVal = _activeType === 'text'
      ? el.textContent.trim()
      : el.innerHTML.trim();

    var current = (saved[_activeKey] !== undefined)
      ? saved[_activeKey]
      : _origVal;

    document.getElementById('cms-mtitle').textContent = 'Edit: ' + label;
    document.getElementById('cms-mkey').textContent   = 'Key: ' + _activeKey;
    document.getElementById('cms-mhint').textContent  = _activeType === 'text'
      ? 'Plain text — do not use HTML tags here.'
      : 'HTML allowed: <strong>, <em>, <br>, <a href="…">. For plain paragraphs just type normally.';
    document.getElementById('cms-mta').value = current;
    document.getElementById('cms-msaved').classList.remove('show');
    document.getElementById('diat-cms-modal').classList.add('cms-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function() {
      document.getElementById('cms-mta').focus();
    }, 120);
  }

  /* ─── 6. CLICK delegation — click any tagged element to edit ─ */
  function bindClicks() {
    document.addEventListener('click', function(e) {
      /* Only fire in admin mode */
      if (!document.body.classList.contains('diat-admin-mode')) return;
      /* Don't intercept link clicks */
      if (e.target.closest('a[href]') &&
          !e.target.closest('[data-cms-key]')) return;
      var el = e.target.closest('[data-cms-key]');
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      openModal(el);
    });
  }

  /* ─── 7. GLOBAL save / close / reset / logout ─────────────── */
  window.diatCMSSave = function() {
    if (!_activeKey || !_activeEl) return;
    var val = document.getElementById('cms-mta').value;
    saveContent(_activeKey, val);
    if (_activeType === 'text') { _activeEl.textContent = val; }
    else                        { _activeEl.innerHTML   = val; }
    _activeEl.dataset.cmsEdited = 'true';
    document.getElementById('cms-msaved').classList.add('show');
    showToast('Saved ✓');
    setTimeout(diatCMSClose, 700);
  };

  window.diatCMSClose = function() {
    var m = document.getElementById('diat-cms-modal');
    if (m) m.classList.remove('cms-open');
    document.body.style.overflow = '';
    _activeKey = null; _activeEl = null;
  };

  window.diatCMSReset = function() {
    if (!confirm('Reset to original default text? Your saved edit will be removed.')) return;
    if (!_activeKey || !_activeEl) return;
    var c = getContent();
    delete c[_activeKey];
    localStorage.setItem(CONTENT_KEY, JSON.stringify(c));
    _activeEl.removeAttribute('data-cms-edited');
    diatCMSClose();
    location.reload();
  };

  window.diatCMSLogout = function() {
    localStorage.removeItem(ADMIN_KEY);
    showToast('Signed out of Admin Mode');
    setTimeout(function() { location.reload(); }, 900);
  };

  /* ─── 8. TOAST ─────────────────────────────────────────────── */
  function buildToast() {
    var t = document.createElement('div');
    t.id  = 'diat-cms-toast';
    document.body.appendChild(t);
  }

  function showToast(msg) {
    var t = document.getElementById('diat-cms-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2500);
  }

  /* ─── INIT ─────────────────────────────────────────────────── */
  function init() {
    /* Always restore saved content */
    loadSavedContent();

    /* Admin-only UI */
    if (isAdmin()) {
      injectCSS();
      buildAdminBar();
      buildTooltip();
      buildModal();
      buildToast();
      bindClicks();
    }
  }

  /* Run as soon as DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init(); /* DOM already ready — run immediately */
  }

})();
