/**
 * tools/cloudinary-sync.mjs
 * ─────────────────────────────────────────────────────────────
 * Reads every image from Cloudinary (gallery/, event posters/,
 * site/, staff/) and regenerates diat-gallery.json automatically.
 *
 * Run once after any new upload:
 *   node tools/cloudinary-sync.mjs
 *
 * Credentials live in .env — NEVER committed to GitHub.
 * ─────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { writeFileSync, readFileSync, existsSync } from 'fs';

/* ── Cloudinary config (reads from .env) ───────────────────── */
cloudinary.config({
  cloud_name:  'diatknust',
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
  secure:      true,
});

/* ── Human-readable labels for Cloudinary folder names ─────── */
const EXHIBITION_MAP = {
  'diat 2025 november open sales':  { label: 'November 2025 Open Sale', year: '2025' },
  'diat 2026 january open sales':   { label: 'January 2026 Open Sale',  year: '2026' },
  'diat 2026 mphil works':          { label: '2026 MPhil Works',        year: '2026' },
};

const CATEGORY_MAP = {
  'diat fabric':             'Fabric & Textiles',
  'diat innovation':         'Innovation',
  'diat macrame products':   'Macramé Products',
  'diat vases':              'Vases & Ceramics',
  'diat footwear':           'Footwear',
  'diat furniture':          'Furniture',
  'diat wall frames':        'Wall Frames',
  'innovation':              'Innovation',
};

/* Partial match for truncated names like "diat Sculptures and F..." */
function matchCategory(raw) {
  const key = raw.toLowerCase();
  if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];
  for (const [k, v] of Object.entries(CATEGORY_MAP)) {
    if (key.startsWith(k) || k.startsWith(key)) return v;
  }
  if (key.includes('sculpt')) return 'Sculptures & Figures';
  /* Fallback: strip "diat " prefix and title-case */
  return raw.replace(/^diat\s+/i, '').replace(/\b\w/g, c => c.toUpperCase());
}

/* ── Fetch all resources under a folder prefix ──────────────── */
async function fetchAll(prefix) {
  const resources = [];
  let cursor;
  do {
    const opts = { type: 'upload', resource_type: 'image',
                   prefix, max_results: 500 };
    if (cursor) opts.next_cursor = cursor;
    const res = await cloudinary.api.resources(opts);
    resources.push(...res.resources);
    cursor = res.next_cursor;
  } while (cursor);
  return resources;
}

/* ── Build a Cloudinary delivery URL ───────────────────────── */
function cdnUrl(publicId, format, transforms = 'q_auto,f_auto,w_800') {
  /* Encode each path segment but keep the slashes */
  const safePath = publicId.split('/').map(encodeURIComponent).join('/');
  return `https://res.cloudinary.com/diatknust/image/upload/${transforms}/${safePath}.${format}`;
}

/* ── Parse folder path → exhibition + category ─────────────── */
function parsePath(publicId) {
  /* publicId example:
     gallery/diat 2026 January open Sales/diat footwear/PXL_123_abc */
  const parts = publicId.split('/');
  const exhibitionRaw = parts[1] || '';
  const categoryRaw   = parts[2] || '';

  const exhibitionKey = exhibitionRaw.toLowerCase();
  const exhibition = EXHIBITION_MAP[exhibitionKey] || {
    label: exhibitionRaw,
    year:  exhibitionRaw.match(/\d{4}/)?.[0] || '2026',
  };

  return {
    exhibition: exhibition.label,
    year:       exhibition.year,
    category:   matchCategory(categoryRaw),
    category_raw: categoryRaw,
  };
}

/* ── Main ───────────────────────────────────────────────────── */
async function main() {
  console.log('🔄  Syncing gallery from Cloudinary…\n');

  /* Load existing JSON to preserve hand-edited metadata */
  const existingMap = {};
  if (existsSync('diat-gallery.json')) {
    const existing = JSON.parse(readFileSync('diat-gallery.json', 'utf8'));
    existing.forEach(item => {
      if (item.cloudinary_public_id) existingMap[item.cloudinary_public_id] = item;
    });
    console.log(`   Found ${existing.length} existing entries (metadata preserved)`);
  }

  /* Fetch gallery images */
  console.log('\n📂  Fetching gallery/…');
  const galleryRaw = await fetchAll('gallery/');
  console.log(`   ${galleryRaw.length} images found`);

  /* Build gallery JSON */
  const gallery = galleryRaw.map((r, i) => {
    const { exhibition, year, category } = parsePath(r.public_id);
    const prev = existingMap[r.public_id] || {};

    return {
      id:           prev.id    || `artwork-${String(i + 1).padStart(3, '0')}`,
      title:        prev.title || '',
      artist:       prev.artist || 'DIAT Student',
      year,
      exhibition,
      category,
      description:  prev.description || '',
      featured:     prev.featured    || false,
      has_ar:       prev.has_ar      || false,
      glb_file:     prev.glb_file    || '',
      usdz_file:    prev.usdz_file   || '',
      /* Cloudinary identifiers */
      cloudinary_public_id: r.public_id,
      format:               r.format,
      width:                r.width,
      height:               r.height,
      /* Pre-built URLs — used directly by gallery.html */
      url_thumb: cdnUrl(r.public_id, r.format, 'q_auto,f_auto,w_600'),
      url_full:  cdnUrl(r.public_id, r.format, 'q_auto,f_auto,w_1600'),
    };
  });

  /* Sort: newest year first, then exhibition, then category */
  gallery.sort((a, b) => {
    if (b.year !== a.year) return b.year.localeCompare(a.year);
    if (a.exhibition !== b.exhibition) return a.exhibition.localeCompare(b.exhibition);
    return a.category.localeCompare(b.category);
  });

  writeFileSync('diat-gallery.json', JSON.stringify(gallery, null, 2));

  /* Summary */
  const byExhibition = {};
  gallery.forEach(({ exhibition }) => {
    byExhibition[exhibition] = (byExhibition[exhibition] || 0) + 1;
  });

  console.log('\n✅  diat-gallery.json updated');
  console.log(`   Total artworks: ${gallery.length}`);
  console.log('\n   Breakdown by exhibition:');
  Object.entries(byExhibition).forEach(([k, v]) =>
    console.log(`   • ${k}: ${v} images`));
  console.log('\n⚠️  Add titles/descriptions by editing diat-gallery.json,');
  console.log('   then commit. Re-running this script preserves your edits.');
}

main().catch(err => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});
