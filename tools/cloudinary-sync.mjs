/**
 * tools/cloudinary-sync.mjs
 * ─────────────────────────────────────────────────────────────
 * 1. Regenerates diat-gallery.json from gallery/ folder (104 artworks)
 * 2. Writes cloudinary-ref.json — full URL map for site/, staff/,
 *    event posters/ so HTML files can be updated to Cloudinary CDN.
 *
 * Run after any new Cloudinary upload:
 *   node tools/cloudinary-sync.mjs
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

/* ── Labels ─────────────────────────────────────────────────── */
const EXHIBITION_MAP = {
  'diat 2025 november open sales': { label: 'November 2025 Open Sale', year: '2025' },
  'diat 2026 january open sales':  { label: 'January 2026 Open Sale',  year: '2026' },
  'diat 2026 mphil works':         { label: '2026 MPhil Works',        year: '2026' },
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

/* ── Cloudinary helpers ─────────────────────────────────────── */
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

function cdnUrl(publicId, format, transforms = 'q_auto,f_auto') {
  const safe = publicId.split('/').map(encodeURIComponent).join('/');
  return `https://res.cloudinary.com/diatknust/image/upload/${transforms}/${safe}.${format}`;
}

/* ── Walk gallery recursively ───────────────────────────────── */
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

/* ── Flat fetch for site/, staff/, event posters/ ───────────── */
async function fetchFlat(folderPath) {
  const imgs = await fetchFromFolder(folderPath);
  console.log(`   📁 ${folderPath}: ${imgs.length} images`);
  return imgs;
}

/* ── Main ───────────────────────────────────────────────────── */
async function main() {
  console.log('🔄  Syncing from Cloudinary (Dynamic folders mode)…\n');

  /* ── 1. Gallery JSON ── */
  const existingMap = {};
  if (existsSync('diat-gallery.json')) {
    JSON.parse(readFileSync('diat-gallery.json', 'utf8'))
      .forEach(item => { if (item.cloudinary_public_id) existingMap[item.cloudinary_public_id] = item; });
  }

  console.log('📂  Walking gallery/…');
  const galleryRaw = await walkGallery();
  console.log(`\n   Total gallery images: ${galleryRaw.length}`);

  const gallery = galleryRaw.map((r, i) => {
    const parts = (r.asset_folder || '').split('/');
    const exKey  = (parts[1] || '').toLowerCase();
    const catRaw = parts[2] || '';
    const ex = EXHIBITION_MAP[exKey] || { label: parts[1] || 'General', year: parts[1]?.match(/\d{4}/)?.[0] || '2026' };
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

  /* ── 2. Reference map for site/, staff/, event posters/ ── */
  console.log('\n📂  Fetching reference folders…');
  const [siteImgs, staffImgs, posterImgs] = await Promise.all([
    fetchFlat('site'),
    fetchFlat('staff'),
    fetchFlat('event posters'),
  ]);

  const ref = { site: {}, staff: {}, 'event posters': {} };

  for (const r of siteImgs) {
    ref.site[r.public_id] = {
      public_id: r.public_id,
      format: r.format,
      url_full:   cdnUrl(r.public_id, r.format, 'q_auto,f_auto'),
      url_hero:   cdnUrl(r.public_id, r.format, 'q_auto,f_auto,w_1920'),
      url_thumb:  cdnUrl(r.public_id, r.format, 'q_auto,f_auto,w_800'),
    };
  }
  for (const r of staffImgs) {
    ref.staff[r.public_id] = {
      public_id: r.public_id,
      format: r.format,
      url_full:  cdnUrl(r.public_id, r.format, 'q_auto,f_auto'),
      url_thumb: cdnUrl(r.public_id, r.format, 'q_auto,f_auto,w_400'),
    };
  }
  for (const r of posterImgs) {
    ref['event posters'][r.public_id] = {
      public_id: r.public_id,
      format: r.format,
      url_hero:  cdnUrl(r.public_id, r.format, 'q_auto,f_auto,w_1920'),
      url_thumb: cdnUrl(r.public_id, r.format, 'q_auto,f_auto,w_800'),
    };
  }

  writeFileSync('cloudinary-ref.json', JSON.stringify(ref, null, 2));

  /* ── Summary ── */
  const byEx = {};
  gallery.forEach(({ exhibition }) => byEx[exhibition] = (byEx[exhibition]||0)+1);

  console.log('\n✅  diat-gallery.json updated');
  console.log(`   Total artworks: ${gallery.length}`);
  console.log('\n   By exhibition:');
  Object.entries(byEx).forEach(([k,v]) => console.log(`   • ${k}: ${v}`));
  console.log('\n✅  cloudinary-ref.json written');
  console.log(`   site: ${siteImgs.length} | staff: ${staffImgs.length} | event posters: ${posterImgs.length}`);
  console.log('\n⚠️  Commit diat-gallery.json and cloudinary-ref.json.');
  console.log('   Do NOT commit cloudinary-ref.json to production — it is for local use only.');
}

main().catch(err => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});
