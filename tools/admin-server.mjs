import { createServer } from 'node:http';
import { readFile, writeFile, readdir, mkdir, stat, unlink } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, relative, resolve } from 'node:path';

const root = resolve(process.argv[2] || process.cwd());
const port = Number(process.env.PORT || process.argv[3] || 8090);
const host = '127.0.0.1';
const maxBodyBytes = 8 * 1024 * 1024;

const jsonFiles = {
  content: 'diat-content.json',
  gallery: 'diat-gallery.json',
  webar:   'diat-webar.json'
};

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.glb':  'model/gltf-binary',
  '.usdz': 'model/vnd.usdz+zip',
  '.svg':  'image/svg+xml'
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    'content-type':  'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(JSON.stringify(data, null, 2));
}

function isInsideRoot(target) {
  const rel = relative(root, target);
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith('/'));
}

async function readJson(name, fallback) {
  try { return JSON.parse(await readFile(join(root, name), 'utf8')); }
  catch { return fallback; }
}

/* Read a text body (JSON payloads) */
async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new Error('Request body is too large.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/* Read a raw binary body (file uploads) */
async function readRawBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 20 * 1024 * 1024) throw new Error('File too large (max 20 MB).');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/* Parse a multipart/form-data buffer — returns [{name, filename, data}] */
function parseMultipart(buf, boundary) {
  const sep   = Buffer.from('\r\n' + boundary);
  const parts = [];
  let pos = buf.indexOf(boundary);
  while (pos !== -1) {
    const next  = buf.indexOf(sep, pos + boundary.length);
    const chunk = buf.slice(pos + boundary.length, next === -1 ? undefined : next);
    const hEnd  = chunk.indexOf(Buffer.from('\r\n\r\n'));
    if (hEnd === -1) { pos = next; continue; }
    const hdrs = chunk.slice(0, hEnd).toString('utf8');
    let   data = chunk.slice(hEnd + 4);
    if (data.slice(-2).toString() === '\r\n') data = data.slice(0, -2);
    const nm = (hdrs.match(/name="([^"]+)"/)     || [])[1] || '';
    const fn = (hdrs.match(/filename="([^"]+)"/) || [])[1] || null;
    parts.push({ name: nm, filename: fn, data });
    pos = next;
  }
  return parts;
}

async function listHtmlFiles() {
  const names = await readdir(root);
  return names.filter(n => n.endsWith('.html')).sort();
}

async function listAssets() {
  const names = await readdir(root);
  return names.filter(n => /\.(?:jpg|jpeg|png|webp|glb|usdz)$/i.test(n)).sort();
}

async function extractContentKeys() {
  const files = await listHtmlFiles();
  const keys  = new Map();

  for (const file of files) {
    const html    = await readFile(join(root, file), 'utf8');
    /* Match full element so we can extract the inner default text */
    const pattern = /(<([a-z][a-z0-9]*)\b[^>]*\sdata-cms-key=["']([^"']+)["'][^>]*>)(.*?)(<\/\2>)/gis;

    for (const m of html.matchAll(pattern)) {
      const tag   = m[1];
      const key   = m[3];
      const inner = m[4].trim()
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&[a-z]+;/g,'')
        .replace(/\s+/g,' ').trim()
        .slice(0, 200);
      const label = (tag.match(/\sdata-cms-label=["']([^"']+)["']/i) || [])[1] || key;
      const type  = (tag.match(/\sdata-cms-type=["']([^"']+)["']/i)  || [])[1] || 'html';
      const current = keys.get(key) || { key, label, type, defaultText: inner, pages: [] };
      if (!current.pages.includes(file)) current.pages.push(file);
      keys.set(key, current);
    }
  }
  return Array.from(keys.values()).sort((a, b) => a.key.localeCompare(b.key));
}

async function backupFile(fileName) {
  const source = join(root, fileName);
  try { await stat(source); } catch { return null; }
  const dir   = join(root, '.admin-backups');
  await mkdir(dir, { recursive: true });
  const stamp  = new Date().toISOString().replace(/[:.]/g, '-');
  const target = join(dir, `${fileName}.${stamp}.bak`);
  await writeFile(target, await readFile(source));
  return relative(root, target);
}

async function saveJsonFiles(payload) {
  const saved = [], backups = [];
  for (const [name, file] of Object.entries(jsonFiles)) {
    if (!(name in payload)) continue;
    backups.push(await backupFile(file));
    await writeFile(join(root, file), JSON.stringify(payload[name], null, 2) + '\n', 'utf8');
    saved.push(file);
  }
  return { saved, backups: backups.filter(Boolean) };
}

async function handleApi(req, res, url) {

  /* ── Status ─────────────────────────────────────────────────── */
  if (url.pathname === '/api/status' && req.method === 'GET') {
    return sendJson(res, 200, { ok: true, mode: 'local-admin', root, files: jsonFiles });
  }

  /* ── Site data (content + gallery + webar + keys + assets) ─── */
  if (url.pathname === '/api/site-data' && req.method === 'GET') {
    return sendJson(res, 200, {
      content: await readJson(jsonFiles.content, {}),
      gallery: await readJson(jsonFiles.gallery, []),
      webar:   await readJson(jsonFiles.webar,   []),
      keys:    await extractContentKeys(),
      pages:   await listHtmlFiles(),
      assets:  await listAssets()
    });
  }

  /* ── Save JSON files ─────────────────────────────────────────── */
  if (url.pathname === '/api/save' && req.method === 'POST') {
    try {
      const payload = JSON.parse(await readBody(req));
      const result  = await saveJsonFiles(payload);
      return sendJson(res, 200, { ok: true, ...result, savedAt: new Date().toISOString() });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message });
    }
  }

  /* ── Upload image ────────────────────────────────────────────── */
  if (url.pathname === '/api/upload-image' && req.method === 'POST') {
    try {
      const ct    = req.headers['content-type'] || '';
      const bm    = ct.match(/boundary=([^;\s]+)/);
      if (!bm) return sendJson(res, 400, { ok: false, error: 'No multipart boundary.' });

      const raw   = await readRawBody(req);
      const parts = parseMultipart(raw, '--' + bm[1]);
      const file  = parts.find(p => p.name === 'file');
      if (!file) return sendJson(res, 400, { ok: false, error: 'No file field in upload.' });

      /* Sanitise filename: allow letters, numbers, dots, dashes, underscores, spaces, parentheses */
      const safe = (file.filename || 'upload.webp').replace(/[^a-zA-Z0-9._\- ()]/g, '_');
      const dest = join(root, safe);
      if (!isInsideRoot(dest)) return sendJson(res, 403, { ok: false, error: 'Forbidden path.' });

      await writeFile(dest, file.data);
      return sendJson(res, 200, { ok: true, filename: safe });
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: e.message });
    }
  }

  /* ── Delete image ────────────────────────────────────────────── */
  if (url.pathname === '/api/delete-image' && req.method === 'POST') {
    try {
      const { filename } = JSON.parse(await readBody(req));
      if (!filename) return sendJson(res, 400, { ok: false, error: 'No filename provided.' });

      /* Only allow deleting image files — never HTML, JS, CSS etc. */
      if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(filename))
        return sendJson(res, 400, { ok: false, error: 'Only image files can be deleted here.' });

      const target = join(root, filename);
      if (!isInsideRoot(target)) return sendJson(res, 403, { ok: false, error: 'Forbidden.' });

      await unlink(target);
      return sendJson(res, 200, { ok: true, deleted: filename });
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: e.message });
    }
  }

  return sendJson(res, 404, { ok: false, error: 'Unknown API endpoint.' });
}

async function serveStatic(req, res, url) {
  const cleanPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const target    = normalize(join(root, cleanPath));

  if (!isInsideRoot(target)) { res.writeHead(403); res.end('Forbidden'); return; }

  try {
    const info = await stat(target);
    if (!info.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {
      'content-type':  mime[extname(target).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    createReadStream(target).pipe(res);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${host}:${port}`);
  if (url.pathname.startsWith('/api/')) {
    await handleApi(req, res, url);
  } else {
    await serveStatic(req, res, url);
  }
});

server.listen(port, host, () => {
  console.log(`DIAT local admin server running at http://${host}:${port}/admin.html`);
  console.log(`Serving: ${root}`);
  console.log('This server is bound to 127.0.0.1 and is for local editing only.');
});
