/**
 * admin.js  — DIAT KNUST Hub local admin dashboard
 *
 * Works only when served by the local Node server (tools/admin-server.mjs).
 * On GitHub Pages the server is unavailable, so the disabled notice shows
 * instead and this script does nothing sensitive.
 *
 * Flow:
 *  1. Hit /api/status — if the server responds, unlock the admin shell.
 *  2. Load /api/site-data — content keys, current JSON values, pages, assets.
 *  3. Render editable fields in the Content panel.
 *  4. Wire nav, save, search, filter, format-JSON, backup, and preview.
 */

(function () {
  'use strict';

  /* ── State ────────────────────────────────────────────────── */
  var state = {
    content:  {},   // current diat-content.json values
    gallery:  [],   // current diat-gallery.json array
    webar:    [],   // current diat-webar.json array
    keys:     [],   // [{key, label, type, pages}]  extracted from HTML
    pages:    [],   // ['index.html', 'about.html', …]
    assets:   [],   // image / model filenames
    dirty:    false
  };

  /* ── Convenience ─────────────────────────────────────────── */
  function $(id)  { return document.getElementById(id); }
  function show(el) { el.classList.remove('admin-hidden'); }
  function hide(el) { el.classList.add('admin-hidden'); }

  function setStatus(msg, kind) {
    var el = $('status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'admin-status is-visible ' + (kind === 'bad' ? 'is-bad' : 'is-good');
    clearTimeout(el._t);
    el._t = setTimeout(function () {
      el.className = 'admin-status';
      el.textContent = '';
    }, 4000);
  }

  /* ── Panel navigation ────────────────────────────────────── */
  function activatePanel(name) {
    document.querySelectorAll('.admin-panel').forEach(function (p) {
      p.classList.toggle('is-active', p.id === 'panel-' + name);
    });
    document.querySelectorAll('.admin-nav__btn').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.panel === name);
    });
    if (name === 'preview') refreshPreview();
    if (name === 'assets')  renderAssets();
  }

  document.querySelectorAll('[data-panel]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activatePanel(btn.dataset.panel);
    });
  });

  /* ── Load data from server ───────────────────────────────── */
  function loadSiteData() {
    setStatus('Loading site data…', 'good');
    return fetch('/api/site-data', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        state.content  = d.content  || {};
        state.gallery  = d.gallery  || [];
        state.webar    = d.webar    || [];
        state.keys     = d.keys     || [];
        state.pages    = d.pages    || [];
        state.assets   = d.assets   || [];
        state.dirty    = false;
        renderContent();
        renderGalleryJson();
        renderWebarJson();
        renderPreviewSelect();
        setStatus('Loaded ' + state.keys.length + ' content keys from ' + state.pages.length + ' pages.', 'good');
      })
      .catch(function (err) {
        setStatus('Could not load site data: ' + err.message, 'bad');
      });
  }

  /* ── Content panel ───────────────────────────────────────── */
  function renderContent(filterText, filterPage) {
    var list   = $('content-list');
    var count  = $('content-count');
    if (!list) return;

    var keys = state.keys;

    /* Apply page filter */
    if (filterPage) {
      keys = keys.filter(function (k) {
        return k.pages.indexOf(filterPage) !== -1;
      });
    }

    /* Apply search filter */
    if (filterText) {
      var q = filterText.toLowerCase();
      keys = keys.filter(function (k) {
        return k.key.toLowerCase().indexOf(q) !== -1 ||
               k.label.toLowerCase().indexOf(q) !== -1;
      });
    }

    if (count) count.textContent = keys.length + ' field' + (keys.length !== 1 ? 's' : '');

    list.innerHTML = '';

    if (keys.length === 0) {
      list.innerHTML = '<p style="color:var(--admin-muted);padding:12px">No fields match your filter.</p>';
      return;
    }

    keys.forEach(function (k) {
      var val  = state.content[k.key] !== undefined ? state.content[k.key] : '';
      var row  = document.createElement('div');
      row.className = 'content-row';

      var isHtml  = k.type === 'html';
      var isImage = k.type === 'image';
      var pages   = k.pages.join(', ');

      var inputHtml;
      if (isHtml) {
        inputHtml = '<textarea class="admin-textarea" data-key="' + esc(k.key) + '" rows="3">' +
                    esc(val) + '</textarea>';
      } else if (isImage) {
        inputHtml = '<input class="admin-input" type="text" data-key="' + esc(k.key) +
                    '" placeholder="Filename or URL" value="' + esc(val) + '">';
      } else {
        inputHtml = '<input class="admin-input" type="text" data-key="' + esc(k.key) +
                    '" value="' + esc(val) + '">';
      }

      row.innerHTML =
        '<div class="content-row__meta">' +
          '<div>' +
            '<span class="content-row__label">' + esc(k.label) + '</span>' +
            '<code class="content-row__key">' + esc(k.key) + '</code>' +
          '</div>' +
          '<span class="content-row__pages">' + esc(pages) + '</span>' +
        '</div>' +
        inputHtml;

      /* Track changes */
      var input = row.querySelector('[data-key]');
      input.addEventListener('input', function () {
        state.content[k.key] = input.value;
        state.dirty = true;
      });

      list.appendChild(row);
    });

    /* Populate page filter dropdown */
    buildPageFilter();
  }

  function buildPageFilter() {
    var sel = $('page-filter');
    if (!sel || sel.dataset.built) return;
    sel.dataset.built = '1';
    var current = sel.value;
    sel.innerHTML = '<option value="">All pages</option>';
    state.pages.forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      if (p === current) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  /* Search and filter */
  var searchInput  = $('content-search');
  var pageFilter   = $('page-filter');

  function applyFilters() {
    renderContent(
      searchInput  ? searchInput.value  : '',
      pageFilter   ? pageFilter.value   : ''
    );
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (pageFilter)  pageFilter.addEventListener('change', applyFilters);

  /* Add custom content key */
  var addBtn = $('add-content-btn');
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      var key = prompt('Enter a new content key (e.g. home-my-new-field):');
      if (!key) return;
      key = key.trim();
      if (!key) return;
      if (state.content[key] !== undefined) {
        setStatus('Key "' + key + '" already exists.', 'bad');
        return;
      }
      state.keys.push({ key: key, label: key, type: 'text', pages: ['(custom)'] });
      state.content[key] = '';
      state.dirty = true;
      applyFilters();
      setStatus('Added "' + key + '". Fill in the value and save.', 'good');
    });
  }

  /* ── Gallery JSON panel ──────────────────────────────────── */
  function renderGalleryJson() {
    var ta = $('gallery-json');
    if (ta) ta.value = JSON.stringify(state.gallery, null, 2);
  }

  var galleryTa = $('gallery-json');
  if (galleryTa) {
    galleryTa.addEventListener('input', function () {
      try {
        state.gallery = JSON.parse(galleryTa.value);
        state.dirty = true;
        galleryTa.style.borderColor = '';
      } catch (e) {
        galleryTa.style.borderColor = 'var(--admin-danger)';
      }
    });
  }

  /* ── WebAR JSON panel ────────────────────────────────────── */
  function renderWebarJson() {
    var ta = $('webar-json');
    if (ta) ta.value = JSON.stringify(state.webar, null, 2);
  }

  var webarTa = $('webar-json');
  if (webarTa) {
    webarTa.addEventListener('input', function () {
      try {
        state.webar = JSON.parse(webarTa.value);
        state.dirty = true;
        webarTa.style.borderColor = '';
      } catch (e) {
        webarTa.style.borderColor = 'var(--admin-danger)';
      }
    });
  }

  /* Format JSON buttons */
  document.querySelectorAll('[data-format-json]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-format-json');
      var ta = $(id);
      if (!ta) return;
      try {
        ta.value = JSON.stringify(JSON.parse(ta.value), null, 2);
        ta.style.borderColor = '';
        setStatus('JSON formatted.', 'good');
      } catch (e) {
        setStatus('Invalid JSON — cannot format.', 'bad');
      }
    });
  });

  /* ── Assets panel ────────────────────────────────────────── */
  function renderAssets() {
    var list  = $('asset-list');
    var count = $('asset-count');
    if (!list) return;

    if (count) count.textContent = state.assets.length + ' file' + (state.assets.length !== 1 ? 's' : '');

    list.innerHTML = '';
    var imgExts = /\.(jpg|jpeg|png|webp)$/i;

    state.assets.forEach(function (name) {
      var item = document.createElement('div');
      item.className = 'asset-item';

      var nameEl = document.createElement('p');
      nameEl.className = 'asset-item__name';
      nameEl.textContent = name;

      if (imgExts.test(name)) {
        var img = document.createElement('img');
        img.src = encodeURIComponent(name);
        img.alt = name;
        img.loading = 'lazy';
        item.appendChild(img);
      } else {
        var placeholder = document.createElement('div');
        placeholder.style.cssText = 'width:100%;aspect-ratio:16/9;display:flex;align-items:center;' +
          'justify-content:center;font-size:2rem;background:#f1ede5';
        placeholder.textContent = name.endsWith('.glb') || name.endsWith('.usdz') ? '🥽' : '📄';
        item.appendChild(placeholder);
      }

      item.appendChild(nameEl);
      list.appendChild(item);
    });

    if (state.assets.length === 0) {
      list.innerHTML = '<p style="color:var(--admin-muted);padding:12px">No media assets found in the site folder.</p>';
    }
  }

  /* ── Preview panel ───────────────────────────────────────── */
  function renderPreviewSelect() {
    var sel = $('preview-page');
    if (!sel) return;
    sel.innerHTML = '';
    state.pages.forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', refreshPreview);
  }

  function refreshPreview() {
    var sel   = $('preview-page');
    var frame = $('preview-frame');
    if (!sel || !frame) return;
    var page = sel.value || 'index.html';
    frame.src = '/' + page + '?preview=1&t=' + Date.now();
  }

  var previewHomeBtn = $('preview-home-btn');
  if (previewHomeBtn) {
    previewHomeBtn.addEventListener('click', function () {
      activatePanel('preview');
      var sel = $('preview-page');
      if (sel) sel.value = 'index.html';
      refreshPreview();
    });
  }

  /* ── Save all ────────────────────────────────────────────── */
  function saveAll() {
    var btn = $('save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
    setStatus('Saving…', 'good');

    fetch('/api/save', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: state.content,
        gallery: state.gallery,
        webar:   state.webar
      })
    })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.ok) {
        state.dirty = false;
        var files = d.saved ? d.saved.join(', ') : 'files';
        setStatus('Saved: ' + files + ' at ' + new Date(d.savedAt).toLocaleTimeString(), 'good');
      } else {
        setStatus('Save failed: ' + (d.error || 'Unknown error'), 'bad');
      }
    })
    .catch(function (err) {
      setStatus('Save error: ' + err.message, 'bad');
    })
    .finally(function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Save All'; }
    });
  }

  var saveBtn = $('save-btn');
  if (saveBtn) saveBtn.addEventListener('click', saveAll);

  /* Warn before leaving with unsaved changes */
  window.addEventListener('beforeunload', function (e) {
    if (state.dirty) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes.';
    }
  });

  /* Reload button */
  var reloadBtn = $('reload-btn');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', function () {
      if (state.dirty && !confirm('Reload will discard unsaved changes. Continue?')) return;
      loadSiteData();
    });
  }

  /* ── Backup panel ────────────────────────────────────────── */
  var downloadBtn = $('download-backup-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      var backup = {
        exportedAt: new Date().toISOString(),
        content:    state.content,
        gallery:    state.gallery,
        webar:      state.webar
      };
      var blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      var a    = document.createElement('a');
      a.href   = URL.createObjectURL(blob);
      a.download = 'diat-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
      setStatus('Backup downloaded.', 'good');
    });
  }

  var restoreInput = $('restore-input');
  if (restoreInput) {
    restoreInput.addEventListener('change', function () {
      var file = restoreInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var backup = JSON.parse(e.target.result);
          if (!backup.content) throw new Error('Missing content field.');
          if (!confirm('This will overwrite all current content with the backup. Continue?')) return;
          state.content = backup.content || {};
          state.gallery = backup.gallery || [];
          state.webar   = backup.webar   || [];
          state.dirty   = true;
          renderContent();
          renderGalleryJson();
          renderWebarJson();
          setStatus('Backup restored. Click "Save All" to write to disk.', 'good');
        } catch (err) {
          setStatus('Invalid backup file: ' + err.message, 'bad');
        }
        restoreInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  /* ── Escape helper ───────────────────────────────────────── */
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Bootstrap ───────────────────────────────────────────── */
  fetch('/api/status', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.ok && d.mode === 'local-admin') {
        /* Running locally — unlock the dashboard */
        var disabled = $('public-disabled');
        var app      = $('admin-app');
        if (disabled) hide(disabled);
        if (app)      show(app);
        return loadSiteData();
      }
    })
    .catch(function () {
      /* Server not running — leave the disabled notice visible */
    });

})();
