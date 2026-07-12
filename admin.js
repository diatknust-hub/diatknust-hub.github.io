/**
 * admin.js v3 — DIAT KNUST Hub
 * Full image management: existing images shown, uploadable, replaceable, deletable.
 * Existing artworks and WebAR models loaded from JSON, editable in-place.
 */
(function () {
  'use strict';

  /* ── Styles ───────────────────────────────────────────────────────────── */
  var S$ = document.createElement('style');
  S$.textContent = `
    .page-sec{margin-bottom:12px;border:1px solid var(--admin-line);border-radius:10px;overflow:hidden;background:#fff}
    .page-sec__hd{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#fff;cursor:pointer;user-select:none;border:none;width:100%;font:inherit;text-align:left}
    .page-sec__hd:hover{background:#faf8f4}
    .page-sec__name{font-weight:800;font-size:.9rem}
    .page-sec__count{font-size:.74rem;color:var(--admin-muted);margin-left:8px}
    .page-sec__arrow{transition:transform .2s;display:inline-block;font-size:.8rem;color:var(--admin-muted)}
    .page-sec__arrow.open{transform:rotate(180deg)}
    .page-sec__body{padding:12px 14px;border-top:1px solid var(--admin-line);display:grid;gap:10px}
    .page-sec__body.closed{display:none}
    .cf{display:grid;gap:4px}
    .cf label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--admin-muted)}
    .cf input,.cf textarea{width:100%;padding:8px 11px;border:1px solid var(--admin-line);border-radius:7px;font:inherit;font-size:.86rem;color:var(--admin-ink);background:#fff;outline:none}
    .cf textarea{resize:vertical;min-height:68px;line-height:1.5}
    .cf input:focus,.cf textarea:focus{border-color:var(--admin-gold);box-shadow:0 0 0 3px rgba(201,149,42,.1)}

    /* Cards */
    .crud-empty{padding:28px;text-align:center;color:var(--admin-muted);font-size:.86rem}
    .crud-grid{display:grid;gap:10px}
    .crud-card{border:1px solid var(--admin-line);border-radius:10px;background:#fff;overflow:hidden}
    .crud-card[draggable=true]{cursor:grab}
    .crud-card.dragging{opacity:.55}
    .crud-card.drag-over{box-shadow:0 0 0 3px rgba(201,149,42,.18);border-color:var(--admin-gold)}

    /* Image thumbnail in card header */
    .crud-card__thumb{width:64px;height:64px;object-fit:cover;border-radius:6px;flex-shrink:0;background:#f1ede5;display:flex;align-items:center;justify-content:center;font-size:1.4rem}
    .crud-card__thumb img{width:64px;height:64px;object-fit:cover;border-radius:6px;display:block}
    .crud-card__top{display:flex;align-items:flex-start;gap:12px;padding:12px 14px}
    .crud-card__info{flex:1;min-width:0}
    .crud-card__title{font-weight:800;font-size:.92rem;margin:0 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .crud-card__meta{font-size:.76rem;color:var(--admin-muted)}
    .crud-card__actions{display:flex;gap:6px;flex-shrink:0;align-items:flex-start}
    .crud-card__badge{display:inline-block;padding:2px 8px;border-radius:50px;font-size:.68rem;font-weight:700;margin-right:4px}
    .badge-clay{background:#FFF0E0;color:#a05c00}.badge-fibres{background:#F0E8FF;color:#6b3aad}
    .badge-leather{background:#FFF4E8;color:#8a4a00}.badge-metal{background:#F0F4FF;color:#2a3aad}
    .badge-rattan{background:#EEFFEE;color:#1a6b2a}.badge-wood{background:#FDF4E0;color:#7a4a00}
    .badge-pd{background:#E8F4FF;color:#0050ad}.badge-ar{background:#E8FFF0;color:#006b3a}

    /* Edit form */
    .crud-form{border-top:2px solid var(--admin-gold);background:#faf8f4;padding:16px;display:none}
    .crud-form.open{display:block}
    .form-2col{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .form-2col .full{grid-column:1/-1}
    .ff{display:grid;gap:3px}
    .ff label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--admin-muted)}
    .ff input,.ff textarea,.ff select{width:100%;padding:8px 11px;border:1px solid var(--admin-line);border-radius:7px;font:inherit;font-size:.84rem;color:var(--admin-ink);background:#fff;outline:none}
    .ff textarea{resize:vertical;min-height:60px;line-height:1.5}
    .ff input:focus,.ff textarea:focus,.ff select:focus{border-color:var(--admin-gold)}
    .ff .hint{font-size:.68rem;color:var(--admin-muted);margin-top:2px}
    .form-footer{display:flex;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--admin-line)}
    .toggle-row{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.84rem;padding:4px 0}
    .toggle-row input[type=checkbox]{width:15px;height:15px;accent-color:var(--admin-gold)}
    .ar-block{margin-top:10px;padding:12px;background:#fff;border:1px solid var(--admin-line);border-radius:8px;display:none}
    .ar-block.open{display:block}

    /* Image upload zone */
    .img-zone{border:2px dashed var(--admin-line);border-radius:8px;padding:14px;text-align:center;cursor:pointer;background:#fff;transition:border-color .15s;position:relative}
    .img-zone:hover,.img-zone.drag{border-color:var(--admin-gold);background:#fffdf7}
    .img-zone input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
    .img-zone__preview{width:100%;max-height:140px;object-fit:contain;border-radius:6px;display:block;margin:0 auto 8px}
    .img-zone__label{font-size:.78rem;color:var(--admin-gold);font-weight:700}
    .img-zone__sub{font-size:.7rem;color:var(--admin-muted);margin-top:3px}
    .img-zone__actions{display:flex;gap:6px;justify-content:center;margin-top:8px}
    .img-btn{padding:5px 12px;border-radius:6px;border:1px solid var(--admin-line);background:#fff;font:inherit;font-size:.74rem;cursor:pointer}
    .img-btn:hover{border-color:var(--admin-gold)}
    .img-btn--danger{color:var(--admin-danger);border-color:rgba(180,35,24,.25)}
    .img-uploading{font-size:.78rem;color:var(--admin-muted);padding:8px}

    /* Multi-image strip */
    .img-strip{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
    .img-strip-item{position:relative;width:72px;height:72px;border-radius:6px;overflow:hidden;border:1px solid var(--admin-line)}
    .img-strip-item img{width:100%;height:100%;object-fit:cover;display:block}
    .img-strip-item .del-img{position:absolute;top:2px;right:2px;background:rgba(180,35,24,.85);color:#fff;border:none;border-radius:4px;width:18px;height:18px;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1}
    .img-strip-add{width:72px;height:72px;border-radius:6px;border:2px dashed var(--admin-line);display:flex;align-items:center;justify-content:center;font-size:1.4rem;cursor:pointer;background:#fff;color:var(--admin-muted);position:relative}
    .img-strip-add:hover{border-color:var(--admin-gold);color:var(--admin-gold)}
    .img-strip-add input{position:absolute;inset:0;opacity:0;cursor:pointer}

    /* WebAR 3D preview */
    .model-preview{background:#f7f4ee;border-radius:8px;text-align:center;padding:20px;border:1px solid var(--admin-line)}
    .model-preview model-viewer{width:100%;height:200px;border-radius:6px}
    .model-preview__empty{padding:20px;color:var(--admin-muted);font-size:.82rem}

    /* Save bar */
    .save-bar{position:fixed;bottom:0;left:0;right:0;background:var(--admin-indigo);color:#fff;padding:12px 24px;display:none;align-items:center;justify-content:space-between;gap:12px;z-index:9999;border-top:3px solid var(--admin-gold)}
    .save-bar.visible{display:flex}
    .save-bar__msg{font-size:.83rem;color:rgba(255,255,255,.75)}
    .save-bar__btn{background:var(--admin-gold);color:#fff;border:none;padding:9px 22px;border-radius:8px;font:inherit;font-weight:700;cursor:pointer}

    /* Assets */
    .asset-copy{display:block;width:100%;padding:5px 10px;background:none;border:none;border-top:1px solid var(--admin-line);font:inherit;font-size:.72rem;color:var(--admin-muted);cursor:pointer;text-align:left}
    .asset-copy:hover{color:var(--admin-gold);background:#faf8f4}
    .asset-del{display:block;width:100%;padding:5px 10px;background:none;border:none;border-top:1px solid var(--admin-line);font:inherit;font-size:.72rem;color:var(--admin-danger);cursor:pointer;text-align:left}
    .asset-del:hover{background:#fff5f5}
    .asset-upload-row{margin-bottom:14px;padding:14px;background:#fff;border:1px solid var(--admin-line);border-radius:10px}
    .asset-upload-row h4{margin:0 0 8px;font-size:.88rem}
    .upload-drop{border:2px dashed var(--admin-line);border-radius:8px;padding:18px;text-align:center;cursor:pointer;position:relative;background:#faf8f4}
    .upload-drop:hover{border-color:var(--admin-gold)}
    .upload-drop input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
    .upload-drop p{margin:0;font-size:.82rem;color:var(--admin-muted)}
    .upload-drop p strong{color:var(--admin-gold)}
  `;
  document.head.appendChild(S$);

  /* ── Save bar ──────────────────────────────────────────────────────────── */
  var saveBar = document.createElement('div');
  saveBar.className = 'save-bar';
  saveBar.innerHTML = '<span class="save-bar__msg">⚠ Unsaved changes</span><button class="save-bar__btn" id="bar-save-btn">💾 Save All Changes</button>';
  document.body.appendChild(saveBar);

  /* ── State ─────────────────────────────────────────────────────────────── */
  var S = { content:{}, gallery:[], webar:[], keys:[], pages:[], assets:[], assetDetails:[], dirty:false };
  var DISCS = ['Product Design','Clay & Earthenware','Fibres & Fabrics','Leather Technology','Metal Production','Rattan & Bamboo','Wood & Furniture'];
  var LVLS  = ['Year 1','Year 2','Year 3','Year 4','MPhil','Staff/Faculty'];
  var PAGE_NAMES = {
    'index.html': 'Home',
    'about.html': 'About',
    'gallery.html': 'Gallery',
    'webar.html': 'WebAR',
    'staff.html': 'Staff',
    'archive.html': 'Archive',
    'community.html': 'Community',
    'programmes.html': 'Programmes',
    'product-design.html': 'Product Design',
    'clay-earthenware.html': 'Clay & Earthenware',
    'fibres-fabrics.html': 'Fibres & Fabrics',
    'leather-technology.html': 'Leather Technology',
    'metal-production.html': 'Metal Production',
    'rattan-bamboo.html': 'Rattan & Bamboo',
    'wood-furniture.html': 'Wood & Furniture',
    'contact.html': 'Contact',
    'admin.html': 'Admin'
  };

  /* ── Utils ─────────────────────────────────────────────────────────────── */
  function $(id){ return document.getElementById(id); }
  function mk(t,c,h){ var e=document.createElement(t); if(c)e.className=c; if(h!==undefined)e.innerHTML=h; return e; }
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function setDirty(){ S.dirty=true; saveBar.classList.add('visible'); }
  function clearDirty(){ S.dirty=false; saveBar.classList.remove('visible'); }
  function badgeCls(d){ if(!d)return''; d=d.toLowerCase(); if(d.includes('clay'))return'badge-clay'; if(d.includes('fibres'))return'badge-fibres'; if(d.includes('leather'))return'badge-leather'; if(d.includes('metal'))return'badge-metal'; if(d.includes('rattan'))return'badge-rattan'; if(d.includes('wood'))return'badge-wood'; return'badge-pd'; }

  function status(msg,kind){
    var el=$('status'); if(!el) return;
    el.textContent=msg; el.className='admin-status is-visible '+(kind==='bad'?'is-bad':'is-good');
    clearTimeout(el._t); el._t=setTimeout(function(){ el.className='admin-status'; },5000);
  }

  function moveItem(list, from, to) {
    if (!Array.isArray(list) || from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return false;
    var item = list.splice(from, 1)[0];
    list.splice(to, 0, item);
    setDirty();
    return true;
  }

  function duplicateItem(list, index) {
    if (!Array.isArray(list) || index < 0 || index >= list.length) return false;
    var copy = JSON.parse(JSON.stringify(list[index] || {}));
    copy.title = (copy.title || 'Untitled') + ' Copy';
    list.splice(index + 1, 0, copy);
    setDirty();
    return true;
  }

  function wireDragSort(card, list, index, renderFn) {
    card.draggable = true;
    card.addEventListener('dragstart', function(e) {
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    });
    card.addEventListener('dragend', function() {
      card.classList.remove('dragging');
      document.querySelectorAll('.crud-card.drag-over').forEach(function(el){ el.classList.remove('drag-over'); });
    });
    card.addEventListener('dragover', function(e) {
      e.preventDefault();
      card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', function() {
      card.classList.remove('drag-over');
    });
    card.addEventListener('drop', function(e) {
      e.preventDefault();
      card.classList.remove('drag-over');
      var from = Number(e.dataTransfer.getData('text/plain'));
      if (moveItem(list, from, index)) {
        renderFn();
        status('Order updated. Save All to write it to disk.', 'good');
      }
    });
  }

  /* ── Nav ───────────────────────────────────────────────────────────────── */
  var NAV = {
    content: 'Content',
    gallery: 'Gallery',
    webar: 'WebAR Models',
    assets: 'Assets',
    performance: 'Performance',
    preview: 'Preview',
    backup: 'Backup'
  };
  document.querySelectorAll('[data-panel]').forEach(function(btn){
    if(NAV[btn.dataset.panel]) btn.textContent=NAV[btn.dataset.panel];
    btn.addEventListener('click',function(){ switchPanel(btn.dataset.panel); });
  });
  function switchPanel(name){
    document.querySelectorAll('.admin-panel').forEach(function(p){ p.classList.toggle('is-active',p.id==='panel-'+name); });
    document.querySelectorAll('[data-panel]').forEach(function(b){ b.classList.toggle('is-active',b.dataset.panel===name); });
    if(name==='assets') renderAssets();
    if(name==='performance') renderPerformance();
    if(name==='preview') refreshPreview();
  }

  /* ── Load ──────────────────────────────────────────────────────────────── */
  function load(){
    status('Loading…','good');
    fetch('/api/site-data',{cache:'no-store'}).then(function(r){ return r.json(); })
    .then(function(d){
      S.content=d.content||{}; S.gallery=d.gallery||[]; S.webar=d.webar||[];
      S.keys=d.keys||[]; S.pages=d.pages||[]; S.assets=d.assets||[]; S.assetDetails=d.assetDetails||[];
      clearDirty(); renderContent(); renderGallery(); renderWebar(); renderPerformance(); buildPreviewSelect();
      status('Loaded — '+S.gallery.length+' artworks · '+S.webar.length+' AR models · '+S.assets.length+' files.','good');
    }).catch(function(e){ status('Load failed: '+e.message,'bad'); });
  }

  /* ── Image upload helper ───────────────────────────────────────────────── */
  function uploadImage(file, onSuccess, onError) {
    var form = new FormData();
    form.append('file', file, file.name);
    fetch('/api/upload-image', { method:'POST', body: form })
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d.ok) { S.assets.push(d.filename); onSuccess(d.filename); }
        else onError(d.error || 'Upload failed');
      })
      .catch(function(e){ onError(e.message); });
  }

  function deleteImageFile(filename, onDone) {
    if (!confirm('Delete file "'+filename+'" from the site? This cannot be undone.')) return;
    fetch('/api/delete-image', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({filename:filename}) })
      .then(function(r){ return r.json(); })
      .then(function(d){ if(d.ok){ status('"'+filename+'" deleted.','good'); onDone(); } else status('Delete failed: '+d.error,'bad'); })
      .catch(function(e){ status('Error: '+e.message,'bad'); });
  }

  function renameAssetFile(filename, onDone) {
    var next = prompt('Rename this media file:', filename);
    if (!next || next === filename) return;
    fetch('/api/rename-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: filename, to: next })
    })
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (!d.ok) {
          status('Rename failed: '+d.error, 'bad');
          return;
        }
        status('Renamed to "'+d.to+'". Updated references in '+(d.updatedJson || []).length+' JSON file(s).', 'good');
        onDone(d.to);
      })
      .catch(function(e){ status('Rename error: '+e.message, 'bad'); });
  }

  /* ── Image zone component ──────────────────────────────────────────────── */
  // Returns {el, getValue, setValue} 
  function makeImageZone(currentSrc, label) {
    var zone = mk('div','img-zone');
    var fileInput = mk('input');
    fileInput.type = 'file'; fileInput.accept = 'image/*';
    var preview = mk('img','img-zone__preview');
    var lbl = mk('div');
    var sub = mk('div','img-zone__sub','Recommended: WebP format for fast loading');
    var actions = mk('div','img-zone__actions');
    var uploadBtn = mk('button','img-btn','📂 Choose Image');
    var clearBtn  = mk('button','img-btn img-btn--danger','✕ Remove');
    actions.appendChild(uploadBtn);
    actions.appendChild(clearBtn);

    var currentVal = currentSrc || '';

    function render() {
      zone.innerHTML = '';
      if (currentVal) {
        preview.src = currentVal;
        preview.onerror = function(){ preview.src=''; lbl.textContent='(image not found)'; };
        lbl.className = 'img-zone__label'; lbl.textContent = currentVal.split('/').pop();
        zone.appendChild(preview);
        zone.appendChild(lbl);
        zone.appendChild(sub);
        zone.appendChild(actions);
      } else {
        lbl.className = 'img-zone__label'; lbl.textContent = label || 'Click to upload image';
        zone.appendChild(fileInput);
        zone.appendChild(lbl);
        zone.appendChild(sub);
      }
    }

    function handleFile(file) {
      if (!file) return;
      var warningShown = !file.name.toLowerCase().endsWith('.webp');
      if (warningShown && !confirm('For best performance, convert images to WebP first.\nUse squoosh.app (free).\n\nContinue uploading "'+file.name+'"?')) return;
      lbl.textContent = 'Uploading…'; lbl.className = 'img-uploading';
      uploadImage(file, function(filename) {
        currentVal = filename;
        render();
        status('Image "'+filename+'" uploaded ✓','good');
      }, function(err) {
        lbl.className = 'img-zone__label'; lbl.textContent = 'Upload failed: '+err;
        status('Upload failed: '+err,'bad');
      });
    }

    fileInput.addEventListener('change', function(){ handleFile(fileInput.files[0]); });
    uploadBtn.addEventListener('click', function(e){ e.stopPropagation(); var tmp=mk('input'); tmp.type='file'; tmp.accept='image/*'; tmp.addEventListener('change',function(){ handleFile(tmp.files[0]); }); tmp.click(); });
    clearBtn.addEventListener('click', function(e){ e.stopPropagation(); currentVal=''; render(); });
    zone.addEventListener('dragover', function(e){ e.preventDefault(); zone.classList.add('drag'); });
    zone.addEventListener('dragleave', function(){ zone.classList.remove('drag'); });
    zone.addEventListener('drop', function(e){ e.preventDefault(); zone.classList.remove('drag'); handleFile(e.dataTransfer.files[0]); });

    render();
    return { el: zone, getValue: function(){ return currentVal; } };
  }

  /* ════ CONTENT PANEL ═════════════════════════════════════════════════════ */
  function renderContent(search,pf){
    var list=$('content-list'),cnt=$('content-count'); if(!list) return;
    var keys=S.keys;
    if(pf) keys=keys.filter(function(k){ return k.pages.indexOf(pf)!==-1; });
    if(search){ var q=search.toLowerCase(); keys=keys.filter(function(k){ return k.key.toLowerCase().includes(q)||k.label.toLowerCase().includes(q); }); }
    if(cnt) cnt.textContent=keys.length+' field'+(keys.length!==1?'s':'');
    buildPageFilter();
    var grps={},ord=[];
    keys.forEach(function(k){ var p=(k.pages&&k.pages[0])||'Other'; if(!grps[p]){grps[p]=[];ord.push(p);} grps[p].push(k); });
    list.innerHTML='';
    if(!keys.length){ list.innerHTML='<p style="color:var(--admin-muted);padding:12px">No fields match.</p>'; return; }
    ord.forEach(function(page){
      var sec=mk('div','page-sec');
      var hd=mk('button','page-sec__hd');
      var arr=mk('span','page-sec__arrow open','▾');
      hd.innerHTML='<span class="page-sec__name">'+(PAGE_NAMES[page]||page)+'</span><span class="page-sec__count">'+grps[page].length+' field'+(grps[page].length!==1?'s':'')+'</span>';
      hd.appendChild(arr);
      var body=mk('div','page-sec__body');
      hd.addEventListener('click',function(){ body.classList.toggle('closed'); arr.classList.toggle('open'); });
      grps[page].forEach(function(k){
        var val=S.content[k.key]!==undefined?S.content[k.key]:(k.defaultText||'');
        var wrap=mk('div','cf'); var lbl=mk('label'); lbl.textContent=k.label; wrap.appendChild(lbl);
        var inp;
        if(k.type==='html'||val.length>100){ inp=mk('textarea'); inp.rows=3; inp.value=val; }
        else{ inp=mk('input'); inp.type='text'; inp.value=val; }
        inp.dataset.key=k.key;
        inp.addEventListener('input',function(){ S.content[k.key]=inp.value; setDirty(); });
        wrap.appendChild(inp); body.appendChild(wrap);
      });
      sec.appendChild(hd); sec.appendChild(body); list.appendChild(sec);
    });
  }

  function buildPageFilter(){
    var sel=$('page-filter'); if(!sel||sel.dataset.built) return; sel.dataset.built='1';
    sel.innerHTML='<option value="">All pages</option>';
    S.pages.forEach(function(p){ var o=mk('option'); o.value=p; o.textContent=PAGE_NAMES[p]||p; sel.appendChild(o); });
    sel.addEventListener('change',applySearch);
  }
  function applySearch(){ renderContent($('content-search')?$('content-search').value:'', $('page-filter')?$('page-filter').value:''); }
  var cs=$('content-search'); if(cs) cs.addEventListener('input',applySearch);
  var addCBtn=$('add-content-btn');
  if(addCBtn) addCBtn.addEventListener('click',function(){
    var key=prompt('New content key (e.g. home-my-text):'); if(!key||!key.trim()) return;
    key=key.trim(); if(S.content[key]!==undefined){status('Key exists','bad');return;}
    S.keys.push({key:key,label:key,type:'text',pages:['(custom)']}); S.content[key]=''; setDirty(); applySearch();
    status('"'+key+'" added','good');
  });

  /* ════ GALLERY PANEL — with image management ═════════════════════════════ */
  function buildGalleryPanel(){
    var pb=document.querySelector('#panel-gallery .admin-card__body'); if(!pb) return;
    pb.innerHTML='';
    var tb=mk('div','admin-toolbar');
    var ab=mk('button','admin-btn admin-btn--primary','+ Add New Artwork');
    tb.appendChild(ab); pb.appendChild(tb);
    var af=buildArtForm(null,-1); af.id='gal-add-form'; pb.appendChild(af);
    var grid=mk('div','crud-grid'); grid.id='gal-grid'; pb.appendChild(grid);
    ab.addEventListener('click',function(){
      var f=$('gal-add-form'); f.classList.toggle('open');
      ab.textContent=f.classList.contains('open')?'✕ Cancel':'+ Add New Artwork';
      ab.className=f.classList.contains('open')?'admin-btn admin-btn--danger':'admin-btn admin-btn--primary';
    });
  }

  function renderGallery(){
    buildGalleryPanel();
    var grid=$('gal-grid'); if(!grid) return;
    grid.innerHTML='';
    if(!S.gallery.length){ grid.innerHTML='<div class="crud-empty">No artworks yet.</div>'; return; }
    S.gallery.forEach(function(art,i){
      var card=mk('div','crud-card');
      var bc=badgeCls(art.discipline);
      var arB=art.has_ar?'<span class="crud-card__badge badge-ar">🥽 AR</span>':'';
      var ftB=art.featured?'<span class="crud-card__badge" style="background:#FFF8E0;color:#7a5400">⭐</span>':'';
      var top=mk('div','crud-card__top');

      // Thumbnail
      var thumb=mk('div','crud-card__thumb');
      if(art.image_path){
        var tImg=mk('img'); tImg.src=art.image_path; tImg.alt=art.title||'';
        tImg.onerror=function(){ thumb.textContent='🖼'; };
        thumb.innerHTML=''; thumb.appendChild(tImg);
      } else { thumb.textContent='🖼'; }

      top.appendChild(thumb);
      var info=mk('div','crud-card__info');
      info.innerHTML='<p class="crud-card__title">'+esc(art.title||'Untitled')+'</p><div class="crud-card__meta"><span class="crud-card__badge '+bc+'">'+esc(art.discipline||'')+'</span>'+arB+ftB+(art.artist?esc(art.artist)+' · ':''  )+(art.year?esc(String(art.year)):'')+'</div>';
      var acts=mk('div','crud-card__actions');
      var upBtn=mk('button','admin-btn','Up'); upBtn.style.cssText='font-size:.76rem;padding:5px 11px';
      var downBtn=mk('button','admin-btn','Down'); downBtn.style.cssText='font-size:.76rem;padding:5px 11px';
      var copyBtn=mk('button','admin-btn','Duplicate'); copyBtn.style.cssText='font-size:.76rem;padding:5px 11px';
      var editBtn=mk('button','admin-btn','Edit'); editBtn.style.cssText='font-size:.76rem;padding:5px 11px';
      var delBtn=mk('button','admin-btn admin-btn--danger','Delete'); delBtn.style.cssText='font-size:.76rem;padding:5px 11px';
      upBtn.disabled=i===0; downBtn.disabled=i===S.gallery.length-1;
      acts.appendChild(upBtn); acts.appendChild(downBtn); acts.appendChild(copyBtn); acts.appendChild(editBtn); acts.appendChild(delBtn);
      top.appendChild(info); top.appendChild(acts);

      var ef=buildArtForm(art,i); ef.id='af-'+i;
      upBtn.addEventListener('click',function(){ if(moveItem(S.gallery,i,i-1)){ renderGallery(); status('Artwork moved up. Save All to keep the order.','good'); } });
      downBtn.addEventListener('click',function(){ if(moveItem(S.gallery,i,i+1)){ renderGallery(); status('Artwork moved down. Save All to keep the order.','good'); } });
      copyBtn.addEventListener('click',function(){ if(duplicateItem(S.gallery,i)){ renderGallery(); status('Artwork duplicated. Edit the copy, then Save All.','good'); } });
      editBtn.addEventListener('click',function(){ ef.classList.toggle('open'); editBtn.textContent=ef.classList.contains('open')?'✕ Close':'Edit'; });
      delBtn.addEventListener('click',function(){
        if(!confirm('Delete "'+( art.title||'this artwork')+'"?')) return;
        S.gallery.splice(i,1); setDirty(); renderGallery();
      });
      wireDragSort(card,S.gallery,i,renderGallery);
      card.appendChild(top); card.appendChild(ef); grid.appendChild(card);
    });
  }

  function buildArtForm(art,idx){
    art=art||{}; var isNew=(idx===-1);
    var f=mk('div','crud-form');

    var dOpts=DISCS.map(function(d){ return '<option'+(art.discipline===d?' selected':'')+'>'+esc(d)+'</option>'; }).join('');
    var lOpts=LVLS.map(function(l){ return '<option'+(art.level===l?' selected':'')+'>'+esc(l)+'</option>'; }).join('');

    f.innerHTML='<div class="form-2col">'+
      '<div class="ff"><label>Title *</label><input type="text" name="title" value="'+esc(art.title||'')+'" placeholder="e.g. Figurative Ceramic Vessels"></div>'+
      '<div class="ff"><label>Artist / Student Name</label><input type="text" name="artist" value="'+esc(art.artist||'')+'"></div>'+
      '<div class="ff"><label>Year</label><input type="number" name="year" value="'+esc(art.year||new Date().getFullYear())+'" min="1976" max="2035"></div>'+
      '<div class="ff"><label>Student Level</label><select name="level">'+lOpts+'</select></div>'+
      '<div class="ff full"><label>Discipline</label><select name="discipline">'+dOpts+'</select></div>'+
      '<div class="ff full"><label>Description</label><textarea name="description" rows="2">'+esc(art.description||art.desc||'')+'</textarea></div>'+
      '<div class="ff full"><label>Tags (comma-separated)</label><input type="text" name="tags" value="'+esc(Array.isArray(art.tags)?art.tags.join(', '):(art.tags||''))+'"></div>'+
      '<div class="ff full" id="img-zone-wrap-'+idx+'"><label>Artwork Image</label></div>'+
      '<div class="ff full"><label>Additional Views (up to 3 extra photos)</label><div class="img-strip" id="extras-'+idx+'"></div></div>'+
      '<div class="ff full" style="display:flex;gap:20px">'+
        '<label class="toggle-row"><input type="checkbox" name="featured" '+(art.featured?'checked':'')+'>  Featured</label>'+
        '<label class="toggle-row"><input type="checkbox" name="has_ar" '+(art.has_ar?'checked':'')+'>  Has WebAR 3D model</label>'+
      '</div>'+
      '<div class="ar-block full '+(art.has_ar?'open':'')+'">'+
        '<div class="form-2col">'+
          '<div class="ff"><label>.glb Filename</label><input type="text" name="glb_file" value="'+esc(art.glb_file||art.glb||'')+'" placeholder="model-name.glb"><div class="hint">CDN: cdn.jsdelivr.net/gh/diatknust-hub/diatknust@main/<em>file</em></div></div>'+
          '<div class="ff"><label>.usdz Filename (iPhone AR)</label><input type="text" name="usdz_file" value="'+esc(art.usdz_file||art.usdz||'')+'" placeholder="model-name.usdz"></div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="form-footer">'+
      '<button type="button" class="admin-btn admin-btn--primary sv">'+(isNew?'Add Artwork':'Update Artwork')+'</button>'+
      (isNew?'':'<button type="button" class="admin-btn cx">Cancel</button>')+
    '</div>';

    // Wire image zone
    var imgWrap=f.querySelector('#img-zone-wrap-'+idx);
    var imgZ = makeImageZone(art.image_path||'', 'Click to upload artwork photo');
    imgWrap.appendChild(imgZ.el);

    // Wire extra images strip
    var extras = (art.extra_images||[]).slice();
    function renderExtras(){
      var strip=f.querySelector('#extras-'+idx); if(!strip) return;
      strip.innerHTML='';
      extras.forEach(function(src,ei){
        var item=mk('div','img-strip-item');
        var eImg=mk('img'); eImg.src=src; eImg.alt='Extra view '+(ei+1);
        var dBtn=mk('button','del-img','✕');
        dBtn.title='Remove this view';
        dBtn.addEventListener('click',function(e){ e.stopPropagation(); extras.splice(ei,1); renderExtras(); });
        item.appendChild(eImg); item.appendChild(dBtn); strip.appendChild(item);
      });
      if(extras.length<4){
        var addItem=mk('div','img-strip-add'); addItem.title='Add another view';
        addItem.innerHTML='<input type="file" accept="image/*">+';
        addItem.querySelector('input').addEventListener('change',function(e){
          var file=e.target.files[0]; if(!file) return;
          uploadImage(file, function(fn){ extras.push(fn); renderExtras(); status('Extra image added','good'); },
            function(err){ status('Upload failed: '+err,'bad'); });
        });
        strip.appendChild(addItem);
      }
    }
    renderExtras();

    // AR toggle
    f.querySelector('[name=has_ar]').addEventListener('change',function(){ f.querySelector('.ar-block').classList.toggle('open',this.checked); });

    // Save
    f.querySelector('.sv').addEventListener('click',function(){
      var t=f.querySelector('[name=title]').value.trim(); if(!t){alert('Please enter a title.');return;}
      var obj={
        title:t, artist:f.querySelector('[name=artist]').value.trim(),
        year:f.querySelector('[name=year]').value, level:f.querySelector('[name=level]').value,
        discipline:f.querySelector('[name=discipline]').value,
        description:f.querySelector('[name=description]').value.trim(),
        tags:f.querySelector('[name=tags]').value.split(',').map(function(x){return x.trim();}).filter(Boolean),
        featured:f.querySelector('[name=featured]').checked,
        has_ar:f.querySelector('[name=has_ar]').checked,
        image_path:imgZ.getValue(),
        extra_images:extras.slice(),
        glb_file:f.querySelector('[name=glb_file]').value.trim(),
        usdz_file:f.querySelector('[name=usdz_file]').value.trim(),
      };
      if(isNew) S.gallery.push(obj); else S.gallery[idx]=obj;
      setDirty(); renderGallery(); status((isNew?'Artwork added':'Updated')+' — Save All to write to disk.','good');
    });
    var cx=f.querySelector('.cx'); if(cx) cx.addEventListener('click',function(){ f.classList.remove('open'); });
    return f;
  }

  /* ════ WEBAR PANEL — with 3D preview ═════════════════════════════════════ */
  var CDN='https://cdn.jsdelivr.net/gh/diatknust-hub/diatknust@main/';

  function buildWebarPanel(){
    var pb=document.querySelector('#panel-webar .admin-card__body'); if(!pb) return;
    pb.innerHTML='';

    // Load model-viewer script if not already loaded
    if(!document.querySelector('script[src*="model-viewer"]')){
      var mv=mk('script'); mv.type='module';
      mv.src='https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
      document.head.appendChild(mv);
    }

    var tb=mk('div','admin-toolbar');
    var ab=mk('button','admin-btn admin-btn--primary','+ Add WebAR Model');
    tb.appendChild(ab); pb.appendChild(tb);
    var af=buildWearForm(null,-1); af.id='wear-add-form'; pb.appendChild(af);
    var grid=mk('div','crud-grid'); grid.id='wear-grid'; pb.appendChild(grid);
    ab.addEventListener('click',function(){
      var f=$('wear-add-form'); f.classList.toggle('open');
      ab.textContent=f.classList.contains('open')?'✕ Cancel':'+ Add WebAR Model';
      ab.className=f.classList.contains('open')?'admin-btn admin-btn--danger':'admin-btn admin-btn--primary';
    });
  }

  function renderWebar(){
    buildWebarPanel();
    var grid=$('wear-grid'); if(!grid) return;
    grid.innerHTML='';
    if(!S.webar.length){ grid.innerHTML='<div class="crud-empty">No WebAR models yet.</div>'; return; }
    S.webar.forEach(function(m,i){
      var card=mk('div','crud-card');
      var bc=badgeCls(m.discipline);
      var ac=m.is_active!==false?'<span class="crud-card__badge badge-ar">Active</span>':'<span class="crud-card__badge" style="background:#f1ede5;color:var(--admin-muted)">Hidden</span>';
      var top=mk('div','crud-card__top');

      // 3D model mini-viewer icon
      var thumb=mk('div','crud-card__thumb'); thumb.textContent='🥽'; thumb.style.cssText='font-size:1.8rem;display:flex;align-items:center;justify-content:center;background:#f0f4ff;border-radius:6px;width:64px;height:64px';
      top.appendChild(thumb);

      var info=mk('div','crud-card__info');
      info.innerHTML='<p class="crud-card__title">'+esc(m.title||'Untitled')+'</p><div class="crud-card__meta"><span class="crud-card__badge '+bc+'">'+esc(m.discipline||'')+'</span>'+ac+(m.glb_file?'<code style="font-size:.7rem;color:var(--admin-muted);margin-left:4px">'+esc(m.glb_file)+'</code>':'')+'</div>';
      var acts=mk('div','crud-card__actions');
      var upBtn=mk('button','admin-btn','Up'); upBtn.style.cssText='font-size:.76rem;padding:5px 11px';
      var downBtn=mk('button','admin-btn','Down'); downBtn.style.cssText='font-size:.76rem;padding:5px 11px';
      var copyBtn=mk('button','admin-btn','Duplicate'); copyBtn.style.cssText='font-size:.76rem;padding:5px 11px';
      var editBtn=mk('button','admin-btn','Edit'); editBtn.style.cssText='font-size:.76rem;padding:5px 11px';
      var prevBtn=mk('button','admin-btn','Preview 3D'); prevBtn.style.cssText='font-size:.76rem;padding:5px 11px';
      var delBtn=mk('button','admin-btn admin-btn--danger','Delete'); delBtn.style.cssText='font-size:.76rem;padding:5px 11px';
      upBtn.disabled=i===0; downBtn.disabled=i===S.webar.length-1;
      acts.appendChild(upBtn); acts.appendChild(downBtn); acts.appendChild(copyBtn); acts.appendChild(editBtn); acts.appendChild(prevBtn); acts.appendChild(delBtn);
      top.appendChild(info); top.appendChild(acts);

      var ef=buildWearForm(m,i); ef.id='wf-'+i;

      // Inline 3D preview
      var preview=mk('div'); preview.id='wp-'+i; preview.style.display='none';
      preview.innerHTML='<div style="padding:14px;border-top:1px solid var(--admin-line)">'+
        '<model-viewer src="'+esc(m.glbUrl || (CDN + (m.glb_file || '')))+'"'+
        ' ios-src="'+esc(m.usdzUrl || (CDN + (m.usdz_file || '')))+'"'+
        ' camera-controls auto-rotate style="width:100%;height:260px;border-radius:8px;background:#f0f4ff"'+
        ' alt="'+esc(m.title||'3D model')+'"></model-viewer>'+
        '<p style="font-size:.74rem;color:var(--admin-muted);margin-top:6px;text-align:center">Rotate · Pinch to zoom · AR button to view in your space</p>'+
        '</div>';

      upBtn.addEventListener('click',function(){ if(moveItem(S.webar,i,i-1)){ renderWebar(); status('WebAR model moved up. Save All to keep the order.','good'); } });
      downBtn.addEventListener('click',function(){ if(moveItem(S.webar,i,i+1)){ renderWebar(); status('WebAR model moved down. Save All to keep the order.','good'); } });
      copyBtn.addEventListener('click',function(){ if(duplicateItem(S.webar,i)){ renderWebar(); status('WebAR model duplicated. Edit the copy, then Save All.','good'); } });
      editBtn.addEventListener('click',function(){ ef.classList.toggle('open'); editBtn.textContent=ef.classList.contains('open')?'✕ Close':'Edit'; });
      prevBtn.addEventListener('click',function(){
        var pv=$('wp-'+i); pv.style.display=pv.style.display==='none'?'block':'none';
        prevBtn.textContent=pv.style.display==='none'?'Preview 3D':'Close Preview';
      });
      delBtn.addEventListener('click',function(){
        if(!confirm('Remove "'+( m.title||'this model')+'"?')) return;
        S.webar.splice(i,1); setDirty(); renderWebar();
      });

      wireDragSort(card,S.webar,i,renderWebar);
      card.appendChild(top); card.appendChild(ef); card.appendChild(preview); grid.appendChild(card);
    });
  }

  function buildWearForm(m,idx){
    m=m||{}; var isNew=(idx===-1);
    var f=mk('div','crud-form');
    var dOpts=DISCS.map(function(d){ return '<option'+(m.discipline===d?' selected':'')+'>'+esc(d)+'</option>'; }).join('');
    f.innerHTML='<div class="form-2col">'+
      '<div class="ff"><label>Title *</label><input type="text" name="title" value="'+esc(m.title||'')+'" placeholder="e.g. Traditional Drum Stool"></div>'+
      '<div class="ff"><label>Discipline</label><select name="discipline">'+dOpts+'</select></div>'+
      '<div class="ff full"><label>Description</label><textarea name="description" rows="2">'+esc(m.description||'')+'</textarea></div>'+
      '<div class="ff"><label>.glb Filename (3D model)</label><input type="text" name="glb_file" value="'+esc(m.glb_file||m.glb||'')+'" placeholder="model-name.glb"><div class="hint">CDN: cdn.jsdelivr.net/gh/diatknust-hub/diatknust@main/<em>file.glb</em></div></div>'+
      '<div class="ff"><label>.usdz Filename (iPhone AR)</label><input type="text" name="usdz_file" value="'+esc(m.usdz_file||m.usdz||'')+'" placeholder="model-name.usdz"></div>'+
      '<div class="ff"><label>Upload .glb file</label><input type="file" name="glb_upload" accept=".glb,.gltf"><div class="hint">Keep GLB under 5 MB where possible for faster AR loading.</div></div>'+
      '<div class="ff"><label>Upload .usdz file</label><input type="file" name="usdz_upload" accept=".usdz"><div class="hint">Required for iPhone Quick Look AR.</div></div>'+
      '<div class="ff"><label>Scale (x y z) — 1 1 1 is normal size</label><input type="text" name="scale" value="'+esc(m.scale||'1 1 1')+'" placeholder="1 1 1"></div>'+
      '<div class="ff" style="align-items:flex-start;padding-top:6px"><label class="toggle-row"><input type="checkbox" name="is_active" '+(m.is_active!==false?'checked':'')+'>  Show in WebAR viewer</label></div>'+
    '</div>'+
    '<div class="form-footer"><button type="button" class="admin-btn admin-btn--primary sv">'+(isNew?'Add Model':'Update Model')+'</button>'+(isNew?'':'<button type="button" class="admin-btn cx">Cancel</button>')+'</div>';

    f.querySelector('[name=glb_upload]').addEventListener('change',function(e){
      var file=e.target.files[0]; if(!file) return;
      if(file.size > 5 * 1024 * 1024 && !confirm('This GLB is over 5 MB and may load slowly in WebAR. Upload anyway?')) return;
      uploadImage(file,function(fn){ f.querySelector('[name=glb_file]').value=fn; status('GLB uploaded. Save the model, then Save All.','good'); },function(err){ status('GLB upload failed: '+err,'bad'); });
    });
    f.querySelector('[name=usdz_upload]').addEventListener('change',function(e){
      var file=e.target.files[0]; if(!file) return;
      if(file.size > 8 * 1024 * 1024 && !confirm('This USDZ is over 8 MB and may load slowly on iPhone. Upload anyway?')) return;
      uploadImage(file,function(fn){ f.querySelector('[name=usdz_file]').value=fn; status('USDZ uploaded. Save the model, then Save All.','good'); },function(err){ status('USDZ upload failed: '+err,'bad'); });
    });

    f.querySelector('.sv').addEventListener('click',function(){
      var t=f.querySelector('[name=title]').value.trim(); if(!t){alert('Please enter a title.');return;}
      var glb=f.querySelector('[name=glb_file]').value.trim();
      var usdz=f.querySelector('[name=usdz_file]').value.trim();
      var obj={title:t,discipline:f.querySelector('[name=discipline]').value,description:f.querySelector('[name=description]').value.trim(),
        glb_file:glb,usdz_file:usdz,glbUrl:CDN+glb,usdzUrl:CDN+usdz,
        scale:f.querySelector('[name=scale]').value.trim()||'1 1 1',is_active:f.querySelector('[name=is_active]').checked};
      if(isNew) S.webar.push(obj); else S.webar[idx]=obj;
      setDirty(); renderWebar(); status((isNew?'Model added':'Updated')+' — Save All.','good');
    });
    var cx=f.querySelector('.cx'); if(cx) cx.addEventListener('click',function(){ f.classList.remove('open'); });
    return f;
  }

  /* ════ ASSETS PANEL — with upload and delete ═════════════════════════════ */
  function renderAssets(){
    var list=$('asset-list'),cnt=$('asset-count'); if(!list) return;
    if(cnt) cnt.textContent=S.assets.length+' file'+(S.assets.length!==1?'s':'');

    // Upload zone at top of assets panel
    var pb=document.querySelector('#panel-assets .admin-card__body'); if(!pb) return;
    pb.innerHTML='';

    var upRow=mk('div','asset-upload-row');
    upRow.innerHTML='<h4>📤 Upload New Media to Site</h4>';
    var dropZone=mk('div','upload-drop');
    dropZone.innerHTML='<input type="file" accept="image/*,.glb,.gltf,.usdz" multiple><p><strong>Click to upload</strong> or drag images, GLB, or USDZ files here · WebP and compressed models recommended</p>';
    var ui=dropZone.querySelector('input');
    ui.addEventListener('change',function(){
      Array.from(ui.files).forEach(function(file){
        uploadImage(file,function(fn){ status('"'+fn+'" uploaded ✓','good'); renderAssets(); },function(e){ status('Upload failed: '+e,'bad'); });
      });
    });
    upRow.appendChild(dropZone); pb.appendChild(upRow);

    var al=mk('div','asset-list'); al.id='asset-list-inner'; pb.appendChild(al);
    if(cnt) cnt.textContent=S.assets.length+' file'+(S.assets.length!==1?'s':'');

    var imgX=/\.(jpg|jpeg|png|webp)$/i;
    S.assets.forEach(function(name){
      var item=mk('div','asset-item');
      if(imgX.test(name)){
        var img=mk('img'); img.src=encodeURIComponent(name); img.alt=name; img.loading='lazy'; item.appendChild(img);
      } else {
        var ph=mk('div'); ph.style.cssText='width:100%;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;font-size:2rem;background:#f1ede5';
        ph.textContent=(name.endsWith('.glb')||name.endsWith('.usdz'))?'🥽':'📄'; item.appendChild(ph);
      }
      item.appendChild(mk('p','asset-item__name',esc(name)));
      var cb=mk('button','asset-copy','📋 Copy filename');
      cb.addEventListener('click',function(){ navigator.clipboard.writeText(name).then(function(){ cb.textContent='✓ Copied!'; setTimeout(function(){ cb.textContent='📋 Copy filename'; },1500); }); });
      item.appendChild(cb);
      var rb=mk('button','asset-copy','Rename file');
      rb.addEventListener('click',function(){
        renameAssetFile(name,function(newName){
          S.assets=S.assets.map(function(a){ return a===name ? newName : a; });
          load();
        });
      });
      item.appendChild(rb);
      if(imgX.test(name)){
        var db=mk('button','asset-del','🗑 Delete from site');
        db.addEventListener('click',function(){
          deleteImageFile(name,function(){ S.assets=S.assets.filter(function(a){return a!==name;}); renderAssets(); });
        });
        item.appendChild(db);
      }
      al.appendChild(item);
    });
    if(!S.assets.length) al.innerHTML='<p style="color:var(--admin-muted);padding:12px">No media assets found.</p>';
  }

  /* ════ PREVIEW ════════════════════════════════════════════════════════════ */
  function fmtBytes(n) {
    if (!n && n !== 0) return 'unknown size';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function addPerf(items, level, title, body) {
    items.push({ level: level || 'good', title: title, body: body });
  }

  function renderPerformance() {
    var summary = $('performance-summary');
    var list = $('performance-list');
    if (!summary || !list) return;

    var items = [];
    var details = S.assetDetails || [];
    var localImages = details.filter(function(a){ return /\.(jpg|jpeg|png|webp|gif)$/i.test(a.name); });
    var localModels = details.filter(function(a){ return /\.(glb|usdz)$/i.test(a.name); });
    var largeImages = localImages.filter(function(a){ return a.size > 500 * 1024; });
    var largeModels = localModels.filter(function(a){ return a.size > 5 * 1024 * 1024; });
    var nonWebp = localImages.filter(function(a){ return !/\.webp$/i.test(a.name); });
    var missingGalleryImages = S.gallery.filter(function(a){ return !a.image_path; });
    var galleryNoCloudinary = S.gallery.filter(function(a){
      return a.image_path && !/^https:\/\/res\.cloudinary\.com\//i.test(a.image_path) && !/\.webp($|\?)/i.test(a.image_path);
    });
    var missingWebarFiles = S.webar.filter(function(m){ return !m.glb_file || !m.usdz_file; });
    var missingThumbs = S.webar.filter(function(m){ return !m.thumbnail; });

    if (largeModels.length) addPerf(items, 'bad', 'Large WebAR model files', largeModels.map(function(a){ return a.name + ' (' + fmtBytes(a.size) + ')'; }).join(', ') + '. Compress these first because AR load time depends heavily on model size.');
    else addPerf(items, 'good', 'Local WebAR model sizes look safe', 'No local GLB/USDZ file is over the 5 MB warning threshold.');

    if (largeImages.length) addPerf(items, 'warn', 'Large local images', largeImages.map(function(a){ return a.name + ' (' + fmtBytes(a.size) + ')'; }).join(', ') + '. Convert or resize before publishing.');
    else addPerf(items, 'good', 'Local image sizes look fine', 'No local image is over 500 KB.');

    if (nonWebp.length) addPerf(items, 'warn', 'Images not in WebP format', nonWebp.map(function(a){ return a.name; }).join(', ') + '. WebP is usually better for the public site.');
    if (missingGalleryImages.length) addPerf(items, 'warn', 'Gallery items without a main image', missingGalleryImages.length + ' artwork item(s) need a main image before publishing.');
    if (galleryNoCloudinary.length) addPerf(items, 'warn', 'Gallery images not using Cloudinary or WebP', galleryNoCloudinary.length + ' gallery image(s) may miss automatic CDN image optimization.');
    if (missingWebarFiles.length) addPerf(items, 'bad', 'WebAR models missing GLB or USDZ', missingWebarFiles.length + ' model(s) are missing a GLB or USDZ filename.');
    if (missingThumbs.length) addPerf(items, 'warn', 'WebAR models without thumbnails', missingThumbs.length + ' model(s) should have thumbnails so users see a fast image before loading 3D.');

    if (!items.some(function(i){ return i.level !== 'good'; })) {
      addPerf(items, 'good', 'Publishing checklist looks healthy', 'No obvious local asset, gallery, or WebAR performance issue was found.');
    }

    summary.innerHTML =
      '<div class="perf-summary">'+
        '<div class="perf-stat"><strong>'+S.gallery.length+'</strong><span>Gallery items</span></div>'+
        '<div class="perf-stat"><strong>'+S.webar.length+'</strong><span>WebAR models</span></div>'+
        '<div class="perf-stat"><strong>'+localImages.length+'</strong><span>Local images</span></div>'+
        '<div class="perf-stat"><strong>'+localModels.length+'</strong><span>Local 3D files</span></div>'+
      '</div>';
    list.innerHTML = items.map(function(item){
      return '<div class="perf-item is-'+esc(item.level)+'"><h4>'+esc(item.title)+'</h4><p>'+esc(item.body)+'</p></div>';
    }).join('');
  }

  var prb=$('refresh-performance-btn');
  if(prb) prb.addEventListener('click',function(){ renderPerformance(); status('Performance checks refreshed.','good'); });

  function buildPreviewSelect(){
    var sel=$('preview-page'); if(!sel) return; sel.innerHTML='';
    S.pages.forEach(function(p){ var o=mk('option'); o.value=p; o.textContent=PAGE_NAMES[p]||p; sel.appendChild(o); });
    sel.addEventListener('change',refreshPreview);
  }
  function refreshPreview(){ var s=$('preview-page'),f=$('preview-frame'); if(!s||!f) return; f.src='/'+s.value+'?t='+Date.now(); }
  var phb=$('preview-home-btn'); if(phb) phb.addEventListener('click',function(){ switchPanel('preview'); var s=$('preview-page'); if(s) s.value='index.html'; refreshPreview(); });

  /* ════ BACKUP ══════════════════════════════════════════════════════════════ */
  var dlb=$('download-backup-btn');
  if(dlb) dlb.addEventListener('click',function(){
    var b=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),content:S.content,gallery:S.gallery,webar:S.webar},null,2)],{type:'application/json'});
    var a=mk('a'); a.href=URL.createObjectURL(b); a.download='diat-backup-'+new Date().toISOString().slice(0,10)+'.json'; a.click(); URL.revokeObjectURL(a.href);
    status('Backup downloaded','good');
  });
  var ri=$('restore-input');
  if(ri) ri.addEventListener('change',function(){
    var file=ri.files[0]; if(!file) return;
    var reader=new FileReader();
    reader.onload=function(e){
      try{ var bk=JSON.parse(e.target.result); if(!bk.content)throw new Error('Invalid.');
        if(!confirm('Replace all content with this backup?')) return;
        S.content=bk.content||{}; S.gallery=bk.gallery||[]; S.webar=bk.webar||[];
        setDirty(); renderContent(); renderGallery(); renderWebar(); status('Restored — Save All.','good');
      }catch(err){ status('Invalid backup: '+err.message,'bad'); } ri.value='';
    };
    reader.readAsText(file);
  });

  /* ════ SAVE ════════════════════════════════════════════════════════════════ */
  function saveAll(){
    var btns=[document.querySelector('#bar-save-btn'),$('save-btn')];
    btns.forEach(function(b){ if(b){b.disabled=true;b.textContent='Saving…';} });
    fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:S.content,gallery:S.gallery,webar:S.webar})})
    .then(function(r){ return r.json(); })
    .then(function(d){ if(d.ok){clearDirty();status('Saved ✓  '+new Date(d.savedAt).toLocaleTimeString(),'good');}else status('Failed: '+(d.error||'?'),'bad'); })
    .catch(function(e){ status('Error: '+e.message,'bad'); })
    .finally(function(){ btns.forEach(function(b){ if(b){b.disabled=false;b.textContent=b.id==='bar-save-btn'?'💾 Save All Changes':'Save All';} }); });
  }

  var sv=$('save-btn'); if(sv) sv.addEventListener('click',saveAll);
  var bsv=$('bar-save-btn'); if(bsv) bsv.addEventListener('click',saveAll);
  var rb=$('reload-btn'); if(rb) rb.addEventListener('click',function(){ if(S.dirty&&!confirm('Reload discards unsaved changes. Continue?')) return; load(); });
  window.addEventListener('beforeunload',function(e){ if(S.dirty){e.preventDefault();e.returnValue='Unsaved changes.';} });

  /* ════ BOOTSTRAP ════════════════════════════════════════════════════════════ */
  fetch('/api/status',{cache:'no-store'}).then(function(r){return r.json();})
  .then(function(d){
    if(d.ok&&d.mode==='local-admin'){
      var dis=$('public-disabled'),app=$('admin-app');
      if(dis)dis.classList.add('admin-hidden');
      if(app)app.classList.remove('admin-hidden');
      load();
    }
  }).catch(function(){});

})();
