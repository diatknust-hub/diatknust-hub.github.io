/**
 * DIAT CMS v3 — Content Management
 * Activate: open any page with ?cms=on in the URL
 * Example:  index.html?cms=on
 */
(function() {

  var KEY = 'diat_admin_session';
  var STORE = 'diat_content';

  /* ── 1. Activate via URL param ?cms=on ──────────────────── */
  try {
    if (new URLSearchParams(window.location.search).get('cms') === 'on') {
      localStorage.setItem(KEY, 'true');
    }
  } catch(e) {}

  /* ── 2. Restore saved content on every page load ────────── */
  function loadContent() {
    var saved;
    try { saved = JSON.parse(localStorage.getItem(STORE) || '{}'); }
    catch(e) { return; }
    document.querySelectorAll('[data-cms-key]').forEach(function(el) {
      var val = saved[el.dataset.cmsKey];
      if (val !== undefined && val !== '') {
        if (el.dataset.cmsType === 'text') { el.textContent = val; }
        else { el.innerHTML = val; }
      }
    });
  }

  /* ── 3. Check if admin — URL param OR localStorage ─────── */
  function isAdmin() {
    try {
      if (new URLSearchParams(window.location.search).get('cms') === 'on') {
        return true;
      }
    } catch(e) {}
    return localStorage.getItem(KEY) === 'true';
  }

  /* ── 4. Build the gold admin bar ───────────────────────── */
  function buildBar() {
    document.body.style.paddingTop = '46px';

    var bar = document.createElement('div');
    bar.id = 'cms-bar';
    bar.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:2147483647',
      'height:46px', 'background:#1A1A4E', 'color:#fff',
      'display:flex', 'align-items:center', 'justify-content:space-between',
      'padding:0 20px', 'font-family:Inter,system-ui,sans-serif',
      'font-size:13px', 'box-shadow:0 2px 12px rgba(0,0,0,.4)'
    ].join(';');

    var count = document.querySelectorAll('[data-cms-key]').length;
    var page  = document.title.split('—')[0].trim();

    bar.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<span style="color:#C9952A;font-size:16px">&#9998;</span>' +
        '<strong style="color:#C9952A;letter-spacing:.06em;text-transform:uppercase;font-size:11px">Admin Mode</strong>' +
        '<span style="color:rgba(255,255,255,.4);font-size:11px;border-left:1px solid rgba(255,255,255,.15);padding-left:10px">' + page + ' &nbsp;|&nbsp; ' + count + ' editable</span>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<a href="admin.html" style="color:rgba(255,255,255,.7);text-decoration:none;border:1px solid rgba(255,255,255,.2);padding:5px 14px;border-radius:50px;font-size:11px">&#9776; Admin</a>' +
        '<button onclick="diatCMSLogout()" style="background:rgba(220,53,69,.2);color:#ff8585;border:1px solid rgba(220,53,69,.3);padding:5px 14px;border-radius:50px;font-size:11px;cursor:pointer;font-family:inherit">&#x2B05; Sign Out</button>' +
      '</div>';

    document.body.insertBefore(bar, document.body.firstChild);
  }

  /* ── 5. Hover tooltip ───────────────────────────────────── */
  function buildTooltip() {
    var tip = document.createElement('div');
    tip.id  = 'cms-tip';
    tip.style.cssText = 'position:fixed;z-index:2147483646;background:#C9952A;color:#fff;font-family:Inter,system-ui,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:50px;pointer-events:none;display:none;white-space:nowrap;box-shadow:0 2px 8px rgba(201,149,42,.5)';
    document.body.appendChild(tip);

    document.addEventListener('mouseover', function(e) {
      var el = e.target.closest('[data-cms-key]');
      if (!el) { tip.style.display = 'none'; return; }
      tip.textContent = '✏ ' + (el.dataset.cmsLabel || el.dataset.cmsKey);
      tip.style.display = 'block';
    });
    document.addEventListener('mouseout', function(e) {
      if (!e.target.closest('[data-cms-key]')) tip.style.display = 'none';
    });
    document.addEventListener('mousemove', function(e) {
      tip.style.left = (e.clientX + 12) + 'px';
      tip.style.top  = (e.clientY - 30) + 'px';
    });
  }

  /* ── 6. Hover highlight on editable elements ────────────── */
  function buildStyles() {
    var s = document.createElement('style');
    s.textContent =
      '[data-cms-key]{cursor:pointer!important}' +
      '[data-cms-key]:hover{outline:2px dashed #C9952A!important;outline-offset:3px;border-radius:3px}' +
      '#cms-modal{display:none;position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.6);backdrop-filter:blur(3px);align-items:center;justify-content:center;padding:20px}' +
      '#cms-modal.open{display:flex}' +
      '#cms-mbox{background:#fff;border-radius:12px;padding:28px;width:100%;max-width:660px;max-height:90vh;display:flex;flex-direction:column;font-family:Inter,system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3)}' +
      '#cms-mbox h3{font-size:15px;font-weight:700;color:#1A1A4E;margin-bottom:4px}' +
      '#cms-mbox .sub{font-size:11px;color:#aaa;font-family:monospace;margin-bottom:14px}' +
      '#cms-mbox textarea{width:100%;min-height:150px;font-family:Inter,system-ui,sans-serif;font-size:14px;border:1.5px solid #E8E4DC;border-radius:8px;padding:10px;outline:none;resize:vertical;line-height:1.7}' +
      '#cms-mbox textarea:focus{border-color:#C9952A}' +
      '#cms-mbox .actions{display:flex;gap:8px;margin-top:12px}' +
      '.cms-save{background:#C9952A;color:#fff;border:none;padding:10px 24px;border-radius:50px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700}' +
      '.cms-save:hover{background:#9A6F10}' +
      '.cms-cancel{background:#f4f4f4;color:#555;border:1px solid #ddd;padding:10px 20px;border-radius:50px;cursor:pointer;font-family:inherit;font-size:13px}' +
      '.cms-reset{margin-left:auto;background:none;color:#dc3545;border:none;cursor:pointer;font-family:inherit;font-size:12px}' +
      '#cms-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1A1A4E;color:#fff;font-family:Inter,system-ui,sans-serif;font-size:13px;padding:9px 20px;border-radius:50px;display:none;z-index:2147483647;box-shadow:0 4px 14px rgba(0,0,0,.2)}' +
      '#cms-toast.on{display:block}';
    document.head.appendChild(s);
  }

  /* ── 7. Edit modal ──────────────────────────────────────── */
  var _el = null, _key = null, _type = 'html';

  function buildModal() {
    var m = document.createElement('div');
    m.id  = 'cms-modal';
    m.innerHTML =
      '<div id="cms-mbox">' +
        '<h3 id="cms-mtitle">Edit</h3>' +
        '<div class="sub" id="cms-mkey"></div>' +
        '<textarea id="cms-mta"></textarea>' +
        '<div class="actions">' +
          '<button class="cms-save" onclick="diatCMSSave()">&#10003; Save</button>' +
          '<button class="cms-cancel" onclick="diatCMSClose()">Cancel</button>' +
          '<button class="cms-reset" onclick="diatCMSReset()">&#8635; Reset to default</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', function(e){ if(e.target===m) diatCMSClose(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') diatCMSClose(); });

    var t = document.createElement('div');
    t.id  = 'cms-toast';
    document.body.appendChild(t);
  }

  function openModal(el) {
    _el   = el;
    _key  = el.dataset.cmsKey;
    _type = el.dataset.cmsType || 'html';
    var label = el.dataset.cmsLabel || _key;
    var saved;
    try { saved = JSON.parse(localStorage.getItem(STORE)||'{}'); }
    catch(e) { saved = {}; }
    var current = saved[_key] !== undefined ? saved[_key] : (_type==='text' ? el.textContent.trim() : el.innerHTML.trim());
    document.getElementById('cms-mtitle').textContent = 'Edit: ' + label;
    document.getElementById('cms-mkey').textContent   = 'Key: ' + _key;
    document.getElementById('cms-mta').value          = current;
    document.getElementById('cms-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function(){ document.getElementById('cms-mta').focus(); }, 100);
  }

  window.diatCMSSave = function() {
    if (!_key || !_el) return;
    var val = document.getElementById('cms-mta').value;
    var saved;
    try { saved = JSON.parse(localStorage.getItem(STORE)||'{}'); }
    catch(e) { saved = {}; }
    saved[_key] = val;
    localStorage.setItem(STORE, JSON.stringify(saved));
    if (_type==='text') { _el.textContent = val; }
    else                { _el.innerHTML   = val; }
    showToast('Saved ✓');
    setTimeout(diatCMSClose, 600);
  };

  window.diatCMSClose = function() {
    var m = document.getElementById('cms-modal');
    if (m) m.classList.remove('open');
    document.body.style.overflow = '';
    _el = null; _key = null;
  };

  window.diatCMSReset = function() {
    if (!confirm('Reset to original? Your saved edit will be removed.')) return;
    if (!_key) return;
    var saved;
    try { saved = JSON.parse(localStorage.getItem(STORE)||'{}'); }
    catch(e) { saved = {}; }
    delete saved[_key];
    localStorage.setItem(STORE, JSON.stringify(saved));
    diatCMSClose();
    location.reload();
  };

  /* ── Re-scan DOM after dynamic content is built ────────────── */
  window.diatCMSRefresh = function() {
    /* Re-apply saved content to any newly added data-cms-key elements */
    loadContent();
  };

  /* Re-scan DOM after dynamic content loads */
  window.diatCMSRefresh = function() { loadContent(); };

    window.diatCMSLogout = function() {
    localStorage.removeItem(KEY);
    showToast('Signed out');
    setTimeout(function(){ location.reload(); }, 800);
  };

  function showToast(msg) {
    var t = document.getElementById('cms-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('on');
    setTimeout(function(){ t.classList.remove('on'); }, 2000);
  }

  /* ── 8. Click delegation ────────────────────────────────── */
  function bindClicks() {
    document.addEventListener('click', function(e) {
      var el = e.target.closest('[data-cms-key]');
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      /* Route image-type fields to upload modal, others to text modal */
      if (el.dataset.cmsType === 'image') {
        openImgModal(el);
      } else {
        openModal(el);
      }
    });
  }

  /* ── INIT ───────────────────────────────────────────────── */
  
  /* ─── IMAGE UPLOAD MODAL ─────────────────────────────────────── */
  var _imgKey = null, _imgEl = null, _imgLabel = '', _pendingImgData = null;

  function buildImageModal() {
    var m = document.createElement('div');
    m.id = 'cms-img-modal';
    m.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:20px';
    m.innerHTML =
      '<div style="background:#fff;border-radius:14px;padding:28px;width:100%;max-width:520px;font-family:Inter,system-ui,sans-serif;box-shadow:0 24px 64px rgba(0,0,0,.3)">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
          '<h3 id="cim-title" style="font-size:1rem;font-weight:700;color:#1A1A4E"></h3>' +
          '<button onclick="closeImgModal()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#999;padding:4px 8px;border-radius:6px">&#10005;</button>' +
        '</div>' +
        '<p id="cim-key" style="font-size:.7rem;color:#bbb;font-family:monospace;margin-bottom:18px"></p>' +
        '<div id="cim-drop" style="border:2.5px dashed #C9952A;border-radius:12px;padding:40px 24px;text-align:center;cursor:pointer;background:#FBF4E6;transition:background .2s"' +
             ' onclick="document.getElementById(\'cim-input\').click()"' +
             ' ondragover="event.preventDefault()"' +
             ' ondrop="cimDrop(event)">' +
          '<input type="file" id="cim-input" accept="image/*" style="display:none" onchange="cimFile(this.files[0])">' +
          '<div id="cim-idle">' +
            '<div style="font-size:3rem;margin-bottom:12px;opacity:.45">&#128247;</div>' +
            '<p style="font-size:1rem;font-weight:700;color:#C9952A;margin-bottom:6px">Click here to upload your image</p>' +
            '<p style="font-size:.78rem;color:#999">or drag and drop a photo here</p>' +
            '<p style="font-size:.68rem;color:#bbb;margin-top:8px">JPG or PNG &mdash; max 3 MB recommended</p>' +
          '</div>' +
          '<div id="cim-prev" style="display:none">' +
            '<img id="cim-prev-img" style="max-height:180px;max-width:100%;border-radius:8px;margin:0 auto;display:block;object-fit:contain">' +
            '<p id="cim-prev-name" style="font-size:.75rem;color:#555;margin-top:10px;text-align:center"></p>' +
          '</div>' +
        '</div>' +
        '<div id="cim-warn" style="display:none;font-size:.7rem;color:#dc3545;margin-top:8px">&#9888; Image is large — may slow the page. Consider resizing before upload.</div>' +
        '<div style="display:flex;gap:10px;margin-top:16px;align-items:center">' +
          '<button id="cim-save" onclick="cimSave()" style="display:none;background:#C9952A;color:#fff;border:none;padding:11px 24px;border-radius:50px;cursor:pointer;font-family:inherit;font-size:.84rem;font-weight:700">&#10003; Apply Photo</button>' +
          '<button onclick="closeImgModal()" style="background:#f4f4f4;color:#555;border:1px solid #ddd;padding:10px 20px;border-radius:50px;cursor:pointer;font-family:inherit;font-size:.84rem">Cancel</button>' +
        '</div>' +
        '<div style="margin-top:14px;background:#f0f4ff;border-radius:8px;padding:10px 14px;font-size:.72rem;color:#555;line-height:1.6">' +
          '&#128161; <strong>Tip:</strong> Photo saves to your browser. To make it permanent for all visitors, also copy the file to your <strong>diatknust-hub.github.io</strong> folder and push to GitHub.' +
        '</div>' +
      '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', function(e){ if(e.target===m) closeImgModal(); });
  }

  function cimFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    var kb = file.size / 1024;
    document.getElementById('cim-warn').style.display = kb > 2048 ? 'block' : 'none';
    var reader = new FileReader();
    reader.onload = function(e) {
      _pendingImgData = e.target.result;
      document.getElementById('cim-prev-img').src = _pendingImgData;
      document.getElementById('cim-prev-name').textContent = file.name + ' (' + Math.round(kb) + ' KB)';
      document.getElementById('cim-idle').style.display = 'none';
      document.getElementById('cim-prev').style.display = 'block';
      document.getElementById('cim-save').style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
  }

  function cimDrop(e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    if (file) cimFile(file);
  }

  function cimSave() {
    if (!_pendingImgData || !_imgKey || !_imgEl) return;
    var saved;
    try { saved = JSON.parse(localStorage.getItem(STORE)||'{}'); } catch(ex) { saved={}; }
    saved[_imgKey] = _pendingImgData;
    try {
      localStorage.setItem(STORE, JSON.stringify(saved));
    } catch(ex) {
      showToast('Image too large — try a smaller photo', true);
      return;
    }
    var img = _imgEl.querySelector('img');
    if (img) {
      img.src = _pendingImgData;
    } else {
      _imgEl.innerHTML = '<img src="' + _pendingImgData + '" alt="' + _imgLabel + '" draggable="false" oncontextmenu="return false" style="width:100%;height:100%;object-fit:cover;display:block">';
    }
    if (typeof buildGrid === 'function') buildGrid();
    showToast('Photo updated ✓');
    closeImgModal();
  }

  function openImgModal(el) {
    _imgEl = el; _imgKey = el.dataset.cmsKey;
    _imgLabel = el.dataset.cmsLabel || _imgKey;
    _pendingImgData = null;
    document.getElementById('cim-title').textContent = 'Upload: ' + _imgLabel;
    document.getElementById('cim-key').textContent   = 'Key: ' + _imgKey;
    document.getElementById('cim-idle').style.display = 'block';
    document.getElementById('cim-prev').style.display = 'none';
    document.getElementById('cim-save').style.display = 'none';
    document.getElementById('cim-warn').style.display = 'none';
    document.getElementById('cim-input').value = '';
    document.getElementById('cms-img-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeImgModal() {
    var m = document.getElementById('cms-img-modal');
    if (m) m.style.display = 'none';
    document.body.style.overflow = '';
    _imgEl = null; _imgKey = null; _pendingImgData = null;
  }

  window.cimFile = cimFile; window.cimDrop = cimDrop;
  window.cimSave = cimSave; window.closeImgModal = closeImgModal;

  function init() {
    loadContent();
    if (isAdmin()) {
      buildStyles();
      buildBar();
      buildTooltip();
      buildModal();
      buildImageModal();
      buildToast();
      bindClicks();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
