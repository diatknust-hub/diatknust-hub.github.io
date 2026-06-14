/**
 * tools/update-cloudinary-urls.mjs
 * ─────────────────────────────────────────────────────────────
 * Replaces all local image paths with Cloudinary CDN URLs.
 * Also fixes staff.html: Senior Lecturer → Lecturer, adds Dr Asmah card.
 *
 * Run: node tools/update-cloudinary-urls.mjs
 * ─────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';

const CDN = 'https://res.cloudinary.com/diatknust/image/upload';
const hero   = id => `${CDN}/q_auto,f_auto,w_1920/${id}.webp`;
const large  = id => `${CDN}/q_auto,f_auto,w_1200/${id}.webp`;
const medium = id => `${CDN}/q_auto,f_auto,w_800/${id}.webp`;
const thumb  = id => `${CDN}/q_auto,f_auto,w_400/${id}.webp`;

/* ── All confirmed mappings ─────────────────────────────────── */
const ALL_MAPS = {
  /* about.html campus photo array + CSS background */
  'diat-murals.webp':       large('diat-murals_fxdnah'),
  'diat-antelope.jpg':      large('diat-antelope_ctnuqe'),
  'diat-sculptures.webp':   large('diat-sculptures_mthwge'),
  'diat-building.jpg':      large('diat-back-entrance_prh81p'),
  'diat-entrance.jpg':      large('diat-main-entrance_vzi1wt'),
  'diat-courtyard.jpg':     medium('diat-courtyard_okefm3'),
  'diat-panorama.webp':     large('diat-panorama_pzzrmo'),
  'diat-garden.webp':       large('diat-garden_dbqxox'),

  /* index.html hero slides (confirmed by Jake) */
  'PXL_20251006_091512942_PORTRAIT_ORIGINAL__2_.webp': hero('diat-antelope_ctnuqe'),
  'PXL_20260530_134703378.webp':                       hero('diat-welcome_yzzznu'),
  'IMG_7811.webp':                                     hero('diat-garden_dbqxox'),
  'PXL_20251006_091638173_PORTRAIT__2_.webp':          hero('dial-wall-murals_l3x7e3'),
  'PXL_20251006_091611384_PORTRAIT_ORIGINAL__2_.webp': hero('diat-sculptures_mthwge'),
  'IMG_7818__2___1_.webp':                             hero('diat-panorama_pzzrmo'),
  'PXL_20251006_091709895_PORTRAIT.webp':              hero('diat-integrated-fencing_ptt0rj'),
  'PXL_20260530_134732278.webp':                       hero('diat-main-entrance_vzi1wt'),

  /* staff.html portrait photos (confirmed by Jake) */
  'PXL_20260112_15332515999.PORTRAIT.webp':          thumb('diat-FA-Clement_nynhgd'),
  'PXL_20260112_1504270822.PORTRAIT.ORIGINAL.webp':  thumb('diat-HA-Quaye_w7xmws'),
  'PXL_20260112_15321691111.PORTRAIT.ORIGINAL.webp': thumb('diat-Dr-K-Agyeman_hhekog'),
  'PXL_20260112_15324159999.PORTRAIT.webp':          thumb('diat-Dr-Ansah_yxiibf'),
  'PXL_20260112_15333767888.PORTRAIT.webp':          thumb('diat-Dr-Milliscent_n3cf4y'),
  'PXL_20260112_15344208111.PORTRAIT.ORIGINAL.webp': thumb('diat-B-Esuman_oc3mm9'),
  'PXL_20260112_15331987333.PORTRAIT.webp':          thumb('diat-S-Lamoh_mkgej9'),
};

/* ── Generic replacement engine ─────────────────────────────── */
function applyMap(content, map) {
  let count = 0;
  for (const [old, neu] of Object.entries(map)) {
    const re = new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const next = content.replace(re, neu);
    if (next !== content) { count++; content = next; }
  }
  return { content, count };
}

function updateFile(path, map, extraFn) {
  if (!existsSync(path)) { console.warn(`  ⚠ Not found: ${path}`); return; }
  const bak = path + '.bak-cdn';
  if (!existsSync(bak)) copyFileSync(path, bak);
  let content = readFileSync(path, 'utf8');
  const { content: replaced, count } = applyMap(content, map);
  content = replaced;
  if (extraFn) content = extraFn(content);
  writeFileSync(path, content);
  console.log(`  ✅ ${path} — ${count} image URL(s) replaced`);
}

/* ── Staff-specific fixes ───────────────────────────────────── */
function fixStaff(content) {
  let out = content;

  /* 1. Change "Senior Lecturer" → "Lecturer" on FA-Clement card only */
  out = out.replace(
    /(<article class="staff-card"><img class="staff-card__photo" src="[^"]*diat-FA-Clement[^"]*"[^>]*alt=")Senior Lecturer( profile photo")/,
    '$1Lecturer$2'
  );
  out = out.replace(
    /(<p class="staff-card__role"[^>]*>)Senior Lecturer(<\/p>[\s\S]{0,300}diat-FA-Clement)/,
    '$1Lecturer$2'
  );
  /* Also catches the inline version where alt and role are on same card */
  out = out.replace(
    'alt="Senior Lecturer profile photo" loading="lazy" draggable="false" oncontextmenu="return false"><div class="staff-card__body"><p class="staff-card__role" data-cms-key="staff-ac1-role" data-cms-type="text">Senior Lecturer',
    'alt="Lecturer profile photo" loading="lazy" draggable="false" oncontextmenu="return false"><div class="staff-card__body"><p class="staff-card__role" data-cms-key="staff-ac1-role" data-cms-type="text">Lecturer'
  );

  /* 2. Insert Dr Asmah card after the last ac6 lecturer card (B-Esuman) */
  const asmahCard = '<article class="staff-card">'
    + `<img class="staff-card__photo" src="${thumb('diat-Dr-EE-Asmah_q01xa9')}" `
    + 'alt="Lecturer profile photo" loading="lazy" draggable="false" oncontextmenu="return false">'
    + '<div class="staff-card__body">'
    + '<p class="staff-card__role" data-cms-key="staff-ac7-role" data-cms-type="text">Lecturer</p>'
    + '<h3 class="staff-card__name" data-cms-key="staff-ac7-name" data-cms-type="text">[Name]</h3>'
    + '<p class="staff-card__quals" data-cms-key="staff-ac7-quals" data-cms-type="text">[Qualifications]</p>'
    + '<a class="staff-card__email" data-cms-key="staff-ac7-email" data-cms-type="text" '
    + 'href="mailto:staff@knust.edu.gh">staff@knust.edu.gh</a>'
    + '</div></article>';

  /* Insert after the B-Esuman (ac6) card — find it by the Cloudinary URL */
  const ac6Marker = 'diat-B-Esuman_oc3mm9';
  const ac6End    = '</div></article>';
  const insertPos = out.indexOf(ac6Marker);
  if (insertPos !== -1) {
    const afterAc6 = out.indexOf(ac6End, insertPos) + ac6End.length;
    if (!out.includes('diat-Dr-EE-Asmah_q01xa9')) {
      out = out.slice(0, afterAc6) + '\n          ' + asmahCard + out.slice(afterAc6);
      console.log('  ✅ Dr Asmah lecturer card inserted after ac6');
    } else {
      console.log('  ℹ  Dr Asmah card already present — skipped');
    }
  } else {
    console.log('  ⚠  Could not locate ac6 anchor — Dr Asmah card NOT inserted');
  }

  return out;
}

/* ── Run ─────────────────────────────────────────────────────── */
console.log('\n🔄  Applying Cloudinary URL replacements…\n');

updateFile('index.html',      ALL_MAPS);
updateFile('about.html',      ALL_MAPS);
updateFile('diat-styles.css', ALL_MAPS);
updateFile('staff.html',      ALL_MAPS, fixStaff);

console.log('\n✅  All replacements done.');
console.log('   Backup files created as *.bak-cdn (safe to delete after checking).');
console.log('\n   Next steps:');
console.log('   1. Open the site locally and check each page');
console.log('   2. Delete old image files from the repo root');
console.log('   3. git add -A && git commit && git push\n');
