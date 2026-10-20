import './env.js';
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { authRoutes, requireAuth } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist');
const PORT = process.env.PORT || 3001;

const app = express();
app.set('trust proxy', 'loopback');
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) =>
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

const DEFAULT_THEME = {
  background: '#3f3f3f',
  buttonColor: '#5a5a5a',
  buttonTextColor: '#ffffff',
  textColor: '#ffffff',
  buttonStyle: 'pill', // pill | rounded | square
  borderWidth: 0,
  borderColor: '#ffffff',
  backgroundImage: '',
  backgroundOpacity: 100,
  font: 'Inter',
};

const slugify = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Endereços que não podem virar slug de empresa (são rotas do sistema)
const RESERVED_SLUGS = new Set(['gerenciamento', 'api', 'go', 'uploads', 'assets']);

const findPage = (id) => db.data.pages.find((p) => p.id === id);

const slugTaken = (slug, exceptId) =>
  RESERVED_SLUGS.has(slug) || db.data.pages.some((p) => p.slug === slug && p.id !== exceptId);

function requirePage(req, res, next) {
  const page = findPage(req.params.id);
  if (!page) return res.status(404).json({ error: 'Página não encontrada' });
  req.page = page;
  next();
}

// ---------- Login ----------
authRoutes(app);
app.use('/api/pages', requireAuth);

// ---------- Google Fonts ----------
// Lista completa das fontes do Google, baixada uma vez e guardada em memória por 24h
const FONTS_URL = 'https://fonts.google.com/metadata/fonts';
const FONTS_TTL = 24 * 60 * 60 * 1000;
const PREFERRED_WEIGHTS = [400, 500, 600, 700];
let fontsCache = { at: 0, list: null };

async function getGoogleFonts() {
  if (fontsCache.list && Date.now() - fontsCache.at < FONTS_TTL) return fontsCache.list;
  const res = await fetch(FONTS_URL);
  if (!res.ok) throw new Error(`Google Fonts respondeu ${res.status}`);
  const text = (await res.text()).replace(/^\)\]\}'/, '');
  const list = JSON.parse(text)
    .familyMetadataList.map((f) => {
      const all = Object.keys(f.fonts)
        .filter((k) => !k.endsWith('i'))
        .map(Number)
        .sort((a, b) => a - b);
      const preferred = all.filter((w) => PREFERRED_WEIGHTS.includes(w));
      return {
        name: f.family,
        category: f.category,
        weights: (preferred.length ? preferred : all.slice(0, 1)).join(';'),
        popularity: f.popularity,
      };
    })
    .sort((a, b) => a.popularity - b.popularity);
  fontsCache = { at: Date.now(), list };
  return list;
}

app.get('/api/fonts', requireAuth, async (_req, res) => {
  try {
    res.json(await getGoogleFonts());
  } catch (err) {
    res.status(502).json({ error: `Não foi possível carregar as fontes: ${err.message}` });
  }
});

// ---------- Upload ----------
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Envie uma imagem válida' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ---------- Páginas (empresas) ----------
app.get('/api/pages', (_req, res) => {
  res.json(
    db.data.pages.map(({ id, slug, name, logo, links, createdAt }) => ({
      id,
      slug,
      name,
      logo,
      linkCount: links.length,
      clicks: links.reduce((sum, l) => sum + (l.clicks || 0), 0),
      createdAt,
    })),
  );
});

app.post('/api/pages', (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Informe o nome da empresa' });

  const slug = slugify(req.body.slug || name);
  if (!slug) return res.status(400).json({ error: 'Slug inválido' });
  if (slugTaken(slug)) return res.status(409).json({ error: 'Esse endereço já está em uso' });

  const page = {
    id: crypto.randomUUID(),
    slug,
    name,
    description: '',
    logo: '',
    socials: [],
    links: [],
    theme: { ...DEFAULT_THEME },
    createdAt: new Date().toISOString(),
  };
  db.data.pages.push(page);
  db.save();
  res.status(201).json(page);
});

app.get('/api/pages/:id', requirePage, (req, res) => res.json(req.page));

app.put('/api/pages/:id', requirePage, (req, res) => {
  const { page } = req;
  const { name, description, logo, socials, theme } = req.body;

  if (req.body.slug !== undefined) {
    const slug = slugify(req.body.slug);
    if (!slug) return res.status(400).json({ error: 'Slug inválido' });
    if (slugTaken(slug, page.id)) return res.status(409).json({ error: 'Esse endereço já está em uso' });
    page.slug = slug;
  }
  if (name !== undefined) page.name = String(name);
  if (description !== undefined) page.description = String(description);
  if (logo !== undefined) page.logo = String(logo);
  if (Array.isArray(socials)) page.socials = socials;
  if (theme) page.theme = { ...page.theme, ...theme };

  db.save();
  res.json(page);
});

app.delete('/api/pages/:id', requirePage, (req, res) => {
  db.data.pages = db.data.pages.filter((p) => p.id !== req.page.id);
  db.save();
  res.status(204).end();
});

// ---------- Links ----------
app.post('/api/pages/:id/links', requirePage, (req, res) => {
  const { title, url, subtitle = '', image = '' } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'Título e URL são obrigatórios' });

  const link = {
    id: crypto.randomUUID(),
    title: String(title),
    subtitle: String(subtitle),
    url: String(url),
    image: String(image),
    icon: req.body.icon || null, // { set, name, color } quando vem da biblioteca
    active: true,
    clicks: 0,
  };
  req.page.links.push(link);
  db.save();
  res.status(201).json(link);
});

app.put('/api/pages/:id/links/reorder', requirePage, (req, res) => {
  const ids = req.body.ids || [];
  const byId = new Map(req.page.links.map((l) => [l.id, l]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
  const rest = req.page.links.filter((l) => !ids.includes(l.id));
  req.page.links = [...ordered, ...rest];
  db.save();
  res.json(req.page.links);
});

app.put('/api/pages/:id/links/:linkId', requirePage, (req, res) => {
  const link = req.page.links.find((l) => l.id === req.params.linkId);
  if (!link) return res.status(404).json({ error: 'Link não encontrado' });

  for (const key of ['title', 'subtitle', 'url', 'image']) {
    if (req.body[key] !== undefined) link[key] = String(req.body[key]);
  }
  if (req.body.icon !== undefined) link.icon = req.body.icon || null;
  if (req.body.active !== undefined) link.active = Boolean(req.body.active);

  db.save();
  res.json(link);
});

app.delete('/api/pages/:id/links/:linkId', requirePage, (req, res) => {
  req.page.links = req.page.links.filter((l) => l.id !== req.params.linkId);
  db.save();
  res.status(204).end();
});

// ---------- Público ----------
app.get('/api/public/:slug', (req, res) => {
  const page = db.data.pages.find((p) => p.slug === req.params.slug);
  if (!page) return res.status(404).json({ error: 'Página não encontrada' });

  const { id, slug, name, description, logo, socials, theme } = page;
  res.json({
    id,
    slug,
    name,
    description,
    logo,
    socials,
    theme,
    links: page.links
      .filter((l) => l.active)
      .map(({ id, title, subtitle, image, icon }) => ({ id, title, subtitle, image, icon })),
  });
});

// Conta o clique e redireciona para o destino
app.get('/go/:slug/:linkId', (req, res) => {
  const page = db.data.pages.find((p) => p.slug === req.params.slug);
  const link = page?.links.find((l) => l.id === req.params.linkId && l.active);
  if (!link) return res.status(404).send('Link não encontrado');

  link.clicks = (link.clicks || 0) + 1;
  db.save();
  const target = /^[a-z][a-z0-9+.-]*:/i.test(link.url) ? link.url : `https://${link.url}`;
  res.redirect(target);
});

// ---------- Front em produção ----------
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

// IPv4 da máquina na rede (para acessar de outro aparelho)
const networkIps = () =>
  Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  for (const ip of networkIps()) console.log(`  Rede:    http://${ip}:${PORT}`);
});
