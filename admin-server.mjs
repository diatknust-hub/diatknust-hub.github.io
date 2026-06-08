import { createServer } from 'node:http';
import { readFile, writeFile, readdir, mkdir, stat, rename } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, relative, resolve } from 'node:path';

const root = resolve(process.argv[2] || process.cwd());
const port = Number(process.env.PORT || process.argv[3] || 8090);
const host = '127.0.0.1';
const maxBodyBytes = 8 * 1024 * 1024;

const jsonFiles = {
  content: 'diat-content.json',
  gallery: 'diat-gallery.json',
  webar: 'diat-webar.json'
};

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.glb': 'model/gltf-binary',
  '.usdz': 'model/vnd.usdz+zip',
  '.svg': 'image/svg+xml'
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(JSON.stringify(data, null, 2));
}

function isInsideRoot(target) {
  const rel = relative(root, target);
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith('/'));
}

async function readJson(name, fallback) {
  try {
    return JSON.parse(await readFile(join(root, name), 'utf8'));
  } catch {
    return fallback;
  }
}

async function readBody(req) {
  let size = 0;
  const chunks = [];

  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      throw new Error('Request body is too large.');
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

async function listHtmlFiles() {
  const names = await readdir(root);
  return names.filter((name) => name.endsWith('.html')).sort();
}

async function listAssets() {
  const names = await readdir(root);
  return names
    .filter((name) => /\.(?:jpg|jpeg|png|webp|gif|glb|usdz)$/i.test(name))
    .sort();
}

function sanitizeAssetName(name) {
  return String(name || 'upload.webp')
    .replace(/[/\\]/g, '_')
    .replace(/[^a-zA-Z0-9._\- ()]/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

async function makeUniqueAssetName(name) {
  const safe = sanitizeAssetName(name);
  const dot = safe.lastIndexOf('.');
  const base = dot === -1 ? safe : safe.slice(0, dot);
  const ext = dot === -1 ? '' : safe.slice(dot);
  let candidate = safe;
  let count = 2;

  while (true) {
    try {
      await stat(join(root, candidate));
      candidate = `${base}-${count}${ext}`;
      count += 1;
    } catch {
      return candidate;
    }
  }
}

function replaceDeep(value, from, to) {
  if (typeof value === 'string') return value.split(from).join(to);
  if (Array.isArray(value)) return value.map((item) => replaceDeep(item, from, to));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceDeep(item, from, to)])
    );
  }
  return value;
}

async function updateJsonReferences(from, to) {
  const updated = [];

  for (const file of Object.values(jsonFiles)) {
    const before = await readJson(file, null);
    if (before === null) continue;
    const after = replaceDeep(before, from, to);
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      await backupFile(file);
      await writeFile(join(root, file), JSON.stringify(after, null, 2) + '\n', 'utf8');
      updated.push(file);
    }
  }

  return updated;
}

async function extractContentKeys() {
  const files = await listHtmlFiles();
  const keys = new Map();

  for (const file of files) {
    const html = await readFile(join(root, file), 'utf8');
    const pattern = /<[^>]*\sdata-cms-key=["']([^"']+)["'][^>]*>/gi;
    for (const match of html.matchAll(pattern)) {
      const tag = match[0];
      const key = match[1];
      const label = (tag.match(/\sdata-cms-label=["']([^"']+)["']/i) || [])[1] || key;
      const type = (tag.match(/\sdata-cms-type=["']([^"']+)["']/i) || [])[1] || 'text';
      const current = keys.get(key) || { key, label, type, pages: [] };
      current.pages.push(file);
      keys.set(key, current);
    }
  }

  return Array.from(keys.values()).sort((a, b) => a.key.localeCompare(b.key));
}

async function backupFile(fileName) {
  const source = join(root, fileName);
  try {
    await stat(source);
  } catch {
    return null;
  }

  const dir = join(root, '.admin-backups');
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = join(dir, `${fileName}.${stamp}.bak`);
  await writeFile(target, await readFile(source));
  return relative(root, target);
}

async function saveJsonFiles(payload) {
  const saved = [];
  const backups = [];

  for (const [name, file] of Object.entries(jsonFiles)) {
    if (!(name in payload)) continue;
    backups.push(await backupFile(file));
    await writeFile(join(root, file), JSON.stringify(payload[name], null, 2) + '\n', 'utf8');
    saved.push(file);
  }

  return { saved, backups: backups.filter(Boolean) };
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/status' && req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      mode: 'local-admin',
      root,
      files: jsonFiles
    });
  }

  if (url.pathname === '/api/site-data' && req.method === 'GET') {
    return sendJson(res, 200, {
      content: await readJson(jsonFiles.content, {}),
      gallery: await readJson(jsonFiles.gallery, []),
      webar: await readJson(jsonFiles.webar, []),
      keys: await extractContentKeys(),
      pages: await listHtmlFiles(),
      assets: await listAssets()
    });
  }

  if (url.pathname === '/api/save' && req.method === 'POST') {
    try {
      const payload = JSON.parse(await readBody(req));
      const result = await saveJsonFiles(payload);
      return sendJson(res, 200, {
        ok: true,
        ...result,
        savedAt: new Date().toISOString()
      });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message });
    }
  }

  // ── Upload image ─────────────────────────────────────────────────────
  if (url.pathname === '/api/upload-image' && req.method === 'POST') {
    try {
      const contentType = req.headers['content-type'] || '';
      // Expect multipart/form-data — parse boundary
      const boundaryMatch = contentType.match(/boundary=([^;]+)/);
      if (!boundaryMatch) return sendJson(res, 400, { ok: false, error: 'No boundary in multipart data.' });
      const boundary = '--' + boundaryMatch[1];
      const body = await readRawBody(req);

      // Parse multipart body to extract filename and file bytes
      const parts = parseMultipart(body, boundary);
      const filePart = parts.find(p => p.name === 'file');
      if (!filePart) return sendJson(res, 400, { ok: false, error: 'No file field in upload.' });

      // Sanitise filename and avoid overwriting an existing media file.
      const originalName = await makeUniqueAssetName(filePart.filename || 'upload.webp');
      const target = join(root, originalName);
      if (!isInsideRoot(target)) return sendJson(res, 403, { ok: false, error: 'Forbidden path.' });

      await writeFile(target, filePart.data);
      return sendJson(res, 200, { ok: true, filename: originalName, url: '/' + encodeURIComponent(originalName) });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // ── Delete image ──────────────────────────────────────────────────────
  if (url.pathname === '/api/delete-image' && req.method === 'POST') {
    try {
      const { filename } = JSON.parse(await readBody(req));
      if (!filename) return sendJson(res, 400, { ok: false, error: 'No filename.' });
      const target = join(root, filename);
      if (!isInsideRoot(target)) return sendJson(res, 403, { ok: false, error: 'Forbidden.' });
      // Only allow deleting media assets, never HTML/JS/CSS/content files.
      if (!/\.(jpg|jpeg|png|webp|gif|glb|usdz)$/i.test(filename)) {
        return sendJson(res, 400, { ok: false, error: 'Only media files can be deleted here.' });
      }
      const { unlink } = await import('node:fs/promises');
      await unlink(target);
      return sendJson(res, 200, { ok: true, deleted: filename });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  if (url.pathname === '/api/rename-asset' && req.method === 'POST') {
    try {
      const { from, to } = JSON.parse(await readBody(req));
      if (!from || !to) return sendJson(res, 400, { ok: false, error: 'Missing filename.' });
      if (!/\.(jpg|jpeg|png|webp|gif|glb|usdz)$/i.test(from)) {
        return sendJson(res, 400, { ok: false, error: 'Only media files can be renamed here.' });
      }

      const safeTo = sanitizeAssetName(to);
      if (!/\.(jpg|jpeg|png|webp|gif|glb|usdz)$/i.test(safeTo)) {
        return sendJson(res, 400, { ok: false, error: 'New filename must keep a media extension.' });
      }

      const source = join(root, from);
      const target = join(root, safeTo);
      if (!isInsideRoot(source) || !isInsideRoot(target)) {
        return sendJson(res, 403, { ok: false, error: 'Forbidden path.' });
      }

      try {
        await stat(target);
        return sendJson(res, 409, { ok: false, error: 'A file with that name already exists.' });
      } catch {}

      await rename(source, target);
      const updatedJson = await updateJsonReferences(from, safeTo);
      return sendJson(res, 200, { ok: true, from, to: safeTo, updatedJson });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  return sendJson(res, 404, { ok: false, error: 'Unknown API endpoint.' });
}

// ── Multipart helpers ─────────────────────────────────────────────────────

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

function parseMultipart(buffer, boundary) {
  const sep = Buffer.from('\r\n' + boundary);
  const parts = [];
  let pos = buffer.indexOf(boundary);
  while (pos !== -1) {
    const next = buffer.indexOf(sep, pos + boundary.length);
    const chunk = buffer.slice(pos + boundary.length, next === -1 ? undefined : next);
    // Split headers from body at \r\n\r\n
    const headerEnd = chunk.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) { pos = next; continue; }
    const headerStr = chunk.slice(0, headerEnd).toString('utf8');
    const data = chunk.slice(headerEnd + 4);
    // Strip trailing \r\n
    const body = data.slice(-2).toString() === '\r\n' ? data.slice(0, -2) : data;
    const nameMatch    = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    parts.push({
      name: nameMatch ? nameMatch[1] : '',
      filename: filenameMatch ? filenameMatch[1] : null,
      data: body
    });
    pos = next;
  }
  return parts;
}

async function serveStatic(req, res, url) {
  const cleanPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const target = normalize(join(root, cleanPath));

  if (!isInsideRoot(target)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const info = await stat(target);
    if (!info.isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, {
      'content-type': mime[extname(target).toLowerCase()] || 'application/octet-stream',
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
