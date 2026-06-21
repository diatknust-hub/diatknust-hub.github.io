/**
 * tools/cloudinary-sync.mjs
 * ─────────────────────────────────────────────────────────────
 * Run after ANY Cloudinary upload:
 *   node tools/cloudinary-sync.mjs
 *
 * Automatically updates:
 *   1. diat-gallery.json     — 104+ artwork entries with CDN URLs
 *   2. cloudinary-ref.json   — site/staff/event-posters URL map
 *   3. site.js               — Gallery nav dropdown (new exhibitions auto-appear)
 *
 * gallery.html reads diat-gallery.json and generates its own section
 * ids + hash resolution — no manual edits ever needed there.
 *
 * Credentials in .env — never committed to GitHub.
 * ─────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { writeFileSync, readFileSync, existsSync } from 'fs';

cloudinary.config({
  cloud_name: 'diatknust',
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/* ════════════════════════════════════════════════════════════
   SHARED UTILITIES
   ════════════════════════════════════════════════════════════ */

const EXHIBITION_MAP = {
  'diat 2025 november open sales': { label: 'November 2025 Open Sale', year: '2025' },
  'diat 2026 january open sales':  { label: 'January 2026 Open Sale',  year: '2026' },
  'diat 2026 mphil works':         { label: '2026 MPhil Artwork Exhibition', year: '2026' },
};
const CATEGORY_MAP = {
  'diat fabric':           'Fabric & Textiles',
  'diat innovation':       'Innovation',
  'diat macrame products': 'Macramé Products',
  'diat vases':            'Vases & Ceramics',
  'diat footwear':         'Footwear',
  'diat furniture':        'Furniture',
  'diat wall frames':      'Wall Frames',
  'innovation':            'Innovation',
};
function matchCategory(raw) {
  if (!raw) return 'General';
  const key = raw.toLowerCase();
  if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];
  for (const [k, v] of Object.entries(CATEGORY_MAP))
    if (key.startsWith(k) || k.startsWith(key)) return v;
  if (key.includes('sculpt')) return 'Sculptures & Figures';
  return raw.replace(/^diat\s+/i, '').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * makeHashId — converts an exhibition name to a URL-safe hash.
 * MUST stay identical to the JS version inside gallery.html's
 * buildExhibitionSections() so nav links always resolve correctly.
 *
 * Examples:
 *   "January 2026 Open Sale"         → "jan-2026"
 *   "November 2025 Open Sale"        → "nov-2025"
 *   "2026 MPhil Artwork Exhibition"  → "mphil-2026"
 *   "August 2027 Craft Fair"         → "aug-2027"
 */
function makeHashId(name) {
  const n = name.toLowerCase();
  const year = (n.match(/\d{4}/) || [''])[0];
  const MONTHS = {
    january:'jan', february:'feb', march:'mar',    april:'apr',
    may:'may',     june:'jun',     july:'jul',      august:'aug',
    september:'sep', october:'oct', november:'nov', december:'dec',
  };
  let month = '';
  for (const [full, abbr] of Object.entries(MONTHS)) {
    if (n.includes(full)) { month = abbr; break; }
  }
  if (month && year)         return `${month}-${year}`;
  if (n.includes('mphil') && year) return `mphil-${year}`;
  if (n.includes('phd')   && year) return `phd-${year}`;
  // Fallback: url-safe slug of name minus "diat " prefix
  return n.replace(/^diat\s+/, '')
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .slice(0, 24)
          .replace(/-+$/, '');
}

/** Nav emoji based on exhibition type */
function navEmoji(name) {
  const n = name.toLowerCase();
  if (n.includes('mphil') || n.includes('phd') || n.includes('research')) return '&#127891;';  // 🎓
  if (n.includes('sale')  || n.includes('open') || n.includes('fair'))    return '&#127912;';  // 🎨
  if (n.includes('exhib'))                                                  return '&#127912;';  // 🎨
  return '&#128444;';  // 🖼
}

/** Clean nav label: remove "diat " prefix, title-case */
function navLabel(name) {
  return name.replace(/^diat\s+/i, '').replace(/\b\w/g, c => c.toUpperCase());
}

/* ════════════════════════════════════════════════════════════
   CLOUDINARY FETCH HELPERS
   ════════════════════════════════════════════════════════════ */

async function getSubfolders(path) {
  try { return (await cloudinary.api.sub_folders(path)).folders || []; }
  catch { return []; }
}
async function fetchFromFolder(folderPath) {
  const resources = [];
  let cursor;
  do {
    const opts = { max_results: 500 };
    if (cursor) opts.next_cursor = cursor;
    try {
      const res = await cloudinary.api.resources_by_asset_folder(folderPath, opts);
      resources.push(...res.resources);
      cursor = res.next_cursor;
    } catch (e) {
      console.warn(`   ⚠ ${folderPath}: ${e.message}`);
      break;
    }
  } while (cursor);
  return resources;
}
async function fetchFlat(folderPath) {
  const imgs = await fetchFromFolder(folderPath);
  console.log(`   📁 ${folderPath}: ${imgs.length} images`);
  return imgs;
}

/* ════════════════════════════════════════════════════════════
   STEP 1 — GALLERY JSON
   ════════════════════════════════════════════════════════════ */

async function walkGallery() {
  const all = [];
  const exFolders = await getSubfolders('gallery');
  console.log(`   Found ${exFolders.length} exhibition folders`);
  for (const ex of exFolders) {
    console.log(`   📁 ${ex.path}`);
    const catFolders = await getSubfolders(ex.path);
    if (!catFolders.length) {
      const imgs = await fetchFromFolder(ex.path);
      console.log(`      └─ ${imgs.length} images (root)`);
      all.push(...imgs);
    } else {
      for (const cat of catFolders) {
        const imgs = await fetchFromFolder(cat.path);
        console.log(`      └─ ${cat.name}: ${imgs.length} images`);
        all.push(...imgs);
        for (const sub of await getSubfolders(cat.path)) {
          const subImgs = await fetchFromFolder(sub.path);
          console.log(`         └─ ${sub.name}: ${subImgs.length} images`);
          all.push(...subImgs);
        }
      }
    }
  }
  return all;
}

function cdnUrl(publicId, format, t = 'q_auto,f_auto') {
  const safe = publicId.split('/').map(encodeURIComponent).join('/');
  return `https://res.cloudinary.com/diatknust/image/upload/${t}/${safe}.${format}`;
}

async function syncGalleryJson() {
  const existingMap = {};
  if (existsSync('diat-gallery.json')) {
    JSON.parse(readFileSync('diat-gallery.json', 'utf8'))
      .forEach(item => { if (item.cloudinary_public_id) existingMap[item.cloudinary_public_id] = item; });
  }

  console.log('📂  Walking gallery/…');
  const raw = await walkGallery();
  console.log(`\n   Total gallery images: ${raw.length}`);

  const gallery = raw.map((r, i) => {
    const parts  = (r.asset_folder || '').split('/');
    const exKey  = (parts[1] || '').toLowerCase();
    const catRaw = parts[2] || '';
    const ex     = EXHIBITION_MAP[exKey] || {
      label: parts[1] || 'General',
      year:  (parts[1] || '').match(/\d{4}/)?.[0] || '2026',
    };
    const prev = existingMap[r.public_id] || {};
    return {
      id:          prev.id      || `artwork-${String(i+1).padStart(3,'0')}`,
      title:       prev.title   || '',
      artist:      prev.artist  || 'DIAT Student',
      year:        ex.year,
      exhibition:  ex.label,
      category:    matchCategory(catRaw),
      description: prev.description || '',
      featured:    prev.featured    || false,
      has_ar:      prev.has_ar      || false,
      glb_file:    prev.glb_file    || '',
      usdz_file:   prev.usdz_file   || '',
      cloudinary_public_id: r.public_id,
      format:  r.format,
      width:   r.width,
      height:  r.height,
      url_thumb: cdnUrl(r.public_id, r.format, 'q_auto,f_auto,w_600'),
      url_full:  cdnUrl(r.public_id, r.format, 'q_auto,f_auto,w_1600'),
    };
  });

  gallery.sort((a, b) =>
    b.year.localeCompare(a.year) ||
    a.exhibition.localeCompare(b.exhibition) ||
    a.category.localeCompare(b.category));

  writeFileSync('diat-gallery.json', JSON.stringify(gallery, null, 2));
  return gallery;
}

/* ════════════════════════════════════════════════════════════
   STEP 2 — CLOUDINARY-REF.JSON
   ════════════════════════════════════════════════════════════ */

async function syncRefJson() {
  console.log('\n📂  Fetching reference folders…');
  const [siteImgs, staffImgs, posterImgs] = await Promise.all([
    fetchFlat('site'),
    fetchFlat('staff'),
    fetchFlat('event posters'),
  ]);

  const ref = { site: {}, staff: {}, 'event posters': {} };
  for (const r of siteImgs) ref.site[r.public_id] = {
    public_id: r.public_id, format: r.format,
    url_full:  cdnUrl(r.public_id, r.format),
    url_hero:  cdnUrl(r.public_id, r.format, 'q_auto,f_auto,w_1920'),
    url_thumb: cdnUrl(r.public_id, r.format, 'q_auto,f_auto,w_800'),
  };
  for (const r of staffImgs) ref.staff[r.public_id] = {
    public_id: r.public_id, format: r.format,
    url_full:  cdnUrl(r.public_id, r.format),
    url_thumb: cdnUrl(r.public_id, r.format, 'q_auto,f_auto,w_400'),
  };
  for (const r of posterImgs) ref['event posters'][r.public_id] = {
    public_id: r.public_id, format: r.format,
    url_hero:  cdnUrl(r.public_id, r.format, 'q_auto,f_auto,w_1920'),
    url_thumb: cdnUrl(r.public_id, r.format, 'q_auto,f_auto,w_800'),
  };

  writeFileSync('cloudinary-ref.json', JSON.stringify(ref, null, 2));
  return { siteImgs, staffImgs, posterImgs };
}

/* ════════════════════════════════════════════════════════════
   STEP 3 — SITE.JS GALLERY NAV (auto-generated)
   ════════════════════════════════════════════════════════════ */

function updateGalleryNav(gallery) {
  /* Collect unique exhibitions sorted newest year first */
  const exSet = {};
  gallery.forEach(a => { if (a.exhibition) exSet[a.exhibition] = true; });
  const exhibitions = Object.keys(exSet).sort((a, b) => {
    const ya = parseInt((a.match(/\d{4}/) || ['0'])[0]);
    const yb = parseInt((b.match(/\d{4}/) || ['0'])[0]);
    return yb - ya;
  });

  /* Build dropdown links */
  const links = exhibitions.map(ex => {
    const hash  = makeHashId(ex);
    const emoji = navEmoji(ex);
    const label = navLabel(ex);
    return `              <a href="gallery.html#${hash}" class="dept-nav__drop-link" role="menuitem">${emoji} ${label}</a>`;
  }).join('\n');

  const newBlock =
`          <!-- Gallery dropdown -->
          <li class="dept-nav__item" role="none">
            <a href="gallery.html" class="dept-nav__link dept-nav__link--drop" aria-haspopup="true" aria-expanded="false">
              Gallery
            </a>
            <div class="dept-nav__dropdown" role="menu" aria-label="Gallery sub-menu">
              <a href="gallery.html" class="dept-nav__drop-link" role="menuitem">&#128444; All Works</a>
              <div class="dept-nav__drop-divider" aria-hidden="true"></div>
${links}
            </div>
          </li>`;

  if (!existsSync('site.js')) {
    console.warn('   ⚠  site.js not found — nav not updated');
    return;
  }

  let siteJs = readFileSync('site.js', 'utf8');
  /* Replace everything from <!-- Gallery dropdown --> up to (not including)
     the next HTML comment, so new exhibitions auto-appear on next sync. */
  const updated = siteJs.replace(
    /[ \t]*<!-- Gallery dropdown -->[\s\S]*?(?=[ \t]*<!-- WebAR dropdown -->)/,
    newBlock + '\n\n          '
  );

  if (updated === siteJs) {
    console.warn('   ⚠  Gallery nav block not found in site.js — skipped');
  } else {
    writeFileSync('site.js', updated);
    console.log(`   ✅ site.js updated — ${exhibitions.length} exhibition(s) in nav:`);
    exhibitions.forEach(ex => console.log(`      • ${navLabel(ex)}  →  #${makeHashId(ex)}`));
  }
}

/* ════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════
   STEP 4 — WEBAR THUMBNAILS (isolated — never affects Gallery sync)
   ════════════════════════════════════════════════════════════ */

async function syncWebarThumbnails() {
  const WEBAR_JSON = 'diat-webar.json';
  if (!existsSync(WEBAR_JSON)) {
    console.warn(`   ⚠  ${WEBAR_JSON} not found — skipped`);
    return { matched: 0, total: 0 };
  }

  console.log('\n📂  Fetching webar thumbnails/…');
  const thumbs = await fetchFlat('webar thumbnails');

  const models = JSON.parse(readFileSync(WEBAR_JSON, 'utf8'));
  let matched = 0;

  for (const model of models) {
    /* Add the pilot collection tag — additive, doesn't touch
       discipline or any other existing field. */
    model.exhibition = model.exhibition || 'WebAR Collection';

    if (!model.glb_file) continue;
    const baseName = model.glb_file.replace(/\.glb$/i, '');

    /* Cloudinary appends a random suffix on upload, e.g.
       "Traditional-Drum-Stool_ghpqln" — match by prefix, not
       exact equality. */
    const match = thumbs.find(t => t.public_id.startsWith(baseName));

    if (match) {
      model.thumbnail = cdnUrl(match.public_id, match.format, 'q_auto,f_auto,w_600');
      matched++;
    } else {
      model.thumbnail = model.thumbnail || '';
    }
  }

  writeFileSync(WEBAR_JSON, JSON.stringify(models, null, 2));
  return { matched, total: models.length };
}

async function main() {
  console.log('🔄  Syncing from Cloudinary (Dynamic folders mode)…\n');

  /* Step 1 */
  const gallery = await syncGalleryJson();

  /* Step 2 */
  const { siteImgs, staffImgs, posterImgs } = await syncRefJson();

  /* Step 3 */
  console.log('\n🧭  Updating Gallery nav in site.js…');
  updateGalleryNav(gallery);

  /* Step 4 — isolated, wrapped so a failure here NEVER breaks
     the Gallery sync above. */
  let webarResult = { matched: 0, total: 0 };
  try {
    webarResult = await syncWebarThumbnails();
  } catch (err) {
    console.warn('\n⚠️  WebAR thumbnail sync failed (Gallery sync unaffected):', err.message);
  }

  /* Summary */
  const byEx = {};
  gallery.forEach(({ exhibition }) => byEx[exhibition] = (byEx[exhibition]||0)+1);

  console.log('\n══════════════════════════════════════════');
  console.log('✅  diat-gallery.json  —', gallery.length, 'artworks');
  console.log('   By exhibition:');
  Object.entries(byEx).forEach(([k,v]) => console.log(`   • ${k}: ${v}`));
  console.log('\n✅  cloudinary-ref.json');
  console.log(`   site: ${siteImgs.length} | staff: ${staffImgs.length} | event posters: ${posterImgs.length}`);
  console.log('\n✅  site.js Gallery nav — auto-updated');
  if (webarResult.total > 0) {
    console.log(`\n✅  diat-webar.json — ${webarResult.matched}/${webarResult.total} thumbnails matched`);
  }
  console.log('══════════════════════════════════════════');
  console.log('\n⚠️  Add titles/descriptions in diat-gallery.json then:');
  console.log('   git add diat-gallery.json site.js && git commit -m "sync: update gallery" && git push\n');
}

main().catch(err => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});
