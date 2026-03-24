const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// ── Configuration ──
const PORT = parseInt(process.env.GALLERY_PORT || '3777', 10);
const HOME = os.homedir();
const MCP_OUTPUT_DIR = process.env.GALLERY_IMAGES_DIR || path.join(HOME, '.config', 'gemini-mcp', 'output');
const GALLERY_DIR = __dirname;
const DATA_DIR = path.join(HOME, '.config', 'ai-gallery');
const META_FILE = path.join(DATA_DIR, 'metadata.json');

// Video directories: comma-separated via env, or auto-detect from current working directory
const VIDEO_DIRS = (process.env.GALLERY_VIDEO_DIRS || '').split(',').map(s => s.trim()).filter(Boolean);

const IMAGE_EXTS = new Set(['.jpeg', '.jpg', '.png', '.webp', '.gif']);
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.avi', '.mkv']);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp',
  '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime',
  '.webm': 'video/webm', '.avi': 'video/x-msvideo',
};

// ── Ensure data directory ──
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Read image dimensions via sips (macOS) ──
function getImageDimensions(filePath) {
  try {
    const out = execSync(`sips -g pixelWidth -g pixelHeight "${filePath}" 2>/dev/null`, { encoding: 'utf8' });
    const wMatch = out.match(/pixelWidth:\s*(\d+)/);
    const hMatch = out.match(/pixelHeight:\s*(\d+)/);
    if (wMatch && hMatch) return { width: parseInt(wMatch[1]), height: parseInt(hMatch[1]) };
  } catch {}
  return null;
}

// ── Metadata store ──
let metadata = {};
function loadMetadata() {
  try {
    if (fs.existsSync(META_FILE)) {
      metadata = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
    }
  } catch { metadata = {}; }
}
function saveMetadata() {
  fs.writeFileSync(META_FILE, JSON.stringify(metadata, null, 2), 'utf8');
}
loadMetadata();

// ── Scan images from MCP output ──
function scanImages() {
  const images = [];
  let needSave = false;
  if (!fs.existsSync(MCP_OUTPUT_DIR)) return images;

  for (const session of fs.readdirSync(MCP_OUTPUT_DIR, { withFileTypes: true })) {
    if (!session.isDirectory()) continue;
    const sessionDir = path.join(MCP_OUTPUT_DIR, session.name);
    let files;
    try { files = fs.readdirSync(sessionDir, { withFileTypes: true }); } catch { continue; }

    for (const file of files) {
      if (!file.isFile()) continue;
      const ext = path.extname(file.name).toLowerCase();
      if (!IMAGE_EXTS.has(ext)) continue;

      const fullPath = path.join(sessionDir, file.name);
      try {
        const stat = fs.statSync(fullPath);
        const key = `${session.name}/${file.name}`;
        if (!metadata[key]) metadata[key] = {};
        const meta = metadata[key];
        if (!meta.width || !meta.height) {
          const dims = getImageDimensions(fullPath);
          if (dims) {
            meta.width = dims.width;
            meta.height = dims.height;
            needSave = true;
          }
        }
        images.push({
          name: file.name,
          session: session.name,
          fullPath,
          key,
          url: `/images/${key}`,
          size: stat.size,
          mtime: stat.mtimeMs,
          width: meta.width || 0,
          height: meta.height || 0,
          prompt: meta.prompt || '',
          notes: meta.notes || '',
          references: meta.references || [],
          tags: meta.tags || [],
        });
      } catch {}
    }
  }
  if (needSave) saveMetadata();
  return images;
}

// ── Scan videos from configured directories ──
function scanVideos() {
  const videos = [];

  function walk(baseDir, dir, rel) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(baseDir, full, relPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!VIDEO_EXTS.has(ext)) continue;
        try {
          const stat = fs.statSync(full);
          const baseName = path.basename(baseDir);
          const key = `video:${baseName}/${relPath}`;
          const meta = metadata[key] || {};
          videos.push({
            name: entry.name,
            relPath: `${baseName}/${relPath}`,
            fullPath: full,
            baseDir,
            key,
            url: `/videos/${baseName}/${relPath}`,
            size: stat.size,
            mtime: stat.mtimeMs,
            prompt: meta.prompt || '',
            notes: meta.notes || '',
            tags: meta.tags || [],
          });
        } catch {}
      }
    }
  }

  for (const dir of VIDEO_DIRS) {
    const resolved = dir.startsWith('/') ? dir : path.resolve(process.cwd(), dir);
    if (fs.existsSync(resolved)) walk(resolved, resolved, '');
  }
  return videos;
}

// ── Serve Range requests for streaming ──
function serveFileWithRange(req, res, filePath, mime) {
  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mime,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': mime,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

// ── Request handler ──
function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // API: list images
  if (pathname === '/api/images') {
    const images = scanImages();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ images, total: images.length }));
    return;
  }

  // API: list videos
  if (pathname === '/api/videos') {
    const videos = scanVideos();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ videos, total: videos.length }));
    return;
  }

  // API: update metadata
  if (pathname === '/api/metadata' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { key, prompt, notes, references, tags } = JSON.parse(body);
        if (!key) throw new Error('key required');
        if (!metadata[key]) metadata[key] = {};
        if (prompt !== undefined) metadata[key].prompt = prompt;
        if (notes !== undefined) metadata[key].notes = notes;
        if (references !== undefined) metadata[key].references = references;
        if (tags !== undefined) metadata[key].tags = tags;
        saveMetadata();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: set prompt for recent images
  if (pathname === '/api/set-prompt' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { session, prompt, tags, since } = JSON.parse(body);
        if (!prompt) throw new Error('prompt required');
        const images = scanImages();
        let targets = [];
        if (session) {
          targets = images.filter(i => i.session === session && !i.prompt);
        } else if (since) {
          targets = images.filter(i => i.mtime >= since && !i.prompt);
        } else {
          targets = images.filter(i => !i.prompt).sort((a,b) => b.mtime - a.mtime).slice(0, 4);
        }
        let count = 0;
        for (const img of targets) {
          if (!metadata[img.key]) metadata[img.key] = {};
          metadata[img.key].prompt = prompt;
          if (tags) metadata[img.key].tags = tags;
          count++;
        }
        if (count > 0) saveMetadata();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, updated: count }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Serve images from MCP output
  if (pathname.startsWith('/images/')) {
    const relPath = pathname.slice('/images/'.length);
    const imgPath = path.join(MCP_OUTPUT_DIR, relPath);
    if (!imgPath.startsWith(MCP_OUTPUT_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }
    if (fs.existsSync(imgPath)) {
      const ext = path.extname(imgPath).toLowerCase();
      serveFileWithRange(req, res, imgPath, MIME_TYPES[ext] || 'application/octet-stream');
      return;
    }
    res.writeHead(404); res.end('Not found'); return;
  }

  // Serve videos by fullPath lookup
  if (pathname.startsWith('/videos/')) {
    const relPath = pathname.slice('/videos/'.length);
    // Find video by relPath match
    const videos = scanVideos();
    const vid = videos.find(v => v.relPath === relPath);
    if (vid && fs.existsSync(vid.fullPath)) {
      const ext = path.extname(vid.fullPath).toLowerCase();
      serveFileWithRange(req, res, vid.fullPath, MIME_TYPES[ext] || 'application/octet-stream');
      return;
    }
    res.writeHead(404); res.end('Not found'); return;
  }

  // Serve static gallery files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(GALLERY_DIR, filePath);
  if (!filePath.startsWith(GALLERY_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const stat = fs.statSync(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream', 'Content-Length': stat.size });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Fallback
  const indexPath = path.join(GALLERY_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    const stat = fs.statSync(indexPath);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': stat.size });
    fs.createReadStream(indexPath).pipe(res);
  } else {
    res.writeHead(404); res.end('Not found');
  }
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  const images = scanImages();
  const videos = scanVideos();
  console.log(`
┌───────────────────────────────────────────┐
│          AI Gallery Server                │
├───────────────────────────────────────────┤
│  URL:     http://localhost:${PORT}           │
│  Images:  ${String(images.length).padEnd(31)}│
│  Videos:  ${String(videos.length).padEnd(31)}│
│  Source:  ${MCP_OUTPUT_DIR.replace(HOME, '~').substring(0, 31).padEnd(31)}│
│  Data:    ~/.config/ai-gallery            │
│                                           │
│  Press Ctrl+C to stop                     │
└───────────────────────────────────────────┘
  `);
});
