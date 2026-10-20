import crypto from 'node:crypto';
import { db } from './db.js';

const COOKIE = 'session';
const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

// Limite de tentativas de login por IP
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map();

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function checkPassword(password, { salt, hash }) {
  const candidate = Buffer.from(hashPassword(password, salt).hash, 'hex');
  return crypto.timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((c) => c.trim().split('='))
      .filter(([k, v]) => k && v)
      .map(([k, v]) => [k, decodeURIComponent(v)]),
  );
}

function sessions() {
  db.data.sessions ??= {};
  const now = Date.now();
  for (const [token, s] of Object.entries(db.data.sessions)) {
    if (s.expiresAt < now) delete db.data.sessions[token];
  }
  return db.data.sessions;
}

function startSession(req, res) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions()[token] = { expiresAt: Date.now() + SESSION_MS };
  db.save();
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MS / 1000}${secure}`,
  );
}

function currentToken(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  return token && sessions()[token] ? token : null;
}

const validCredentials = (username, password) =>
  typeof username === 'string' && username.trim().length >= 3 && typeof password === 'string' && password.length >= 6;

export function requireAuth(req, res, next) {
  if (!currentToken(req)) return res.status(401).json({ error: 'Faça login para continuar' });
  next();
}

export function authRoutes(app) {
  app.get('/api/auth/status', (req, res) => {
    const auth = db.data.auth;
    const authenticated = Boolean(currentToken(req));
    res.json({ configured: Boolean(auth), authenticated, username: authenticated ? auth.username : null });
  });

  // Primeiro acesso: cria o usuário administrador
  app.post('/api/auth/setup', (req, res) => {
    if (db.data.auth) return res.status(403).json({ error: 'O acesso já foi configurado' });
    const { username, password } = req.body;
    if (!validCredentials(username, password)) {
      return res.status(400).json({ error: 'Usuário com 3+ caracteres e senha com 6+ caracteres' });
    }
    db.data.auth = { username: username.trim(), password: hashPassword(password) };
    startSession(req, res);
    res.json({ username: db.data.auth.username });
  });

  app.post('/api/auth/login', (req, res) => {
    const auth = db.data.auth;
    if (!auth) return res.status(400).json({ error: 'Acesso ainda não configurado' });

    const ip = req.ip;
    const now = Date.now();
    const entry = attempts.get(ip);
    if (entry && now - entry.first < WINDOW_MS && entry.count >= MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em alguns minutos.' });
    }

    const { username, password } = req.body;
    const ok = username === auth.username && typeof password === 'string' && checkPassword(password, auth.password);
    if (!ok) {
      const fresh = !entry || now - entry.first >= WINDOW_MS;
      attempts.set(ip, fresh ? { first: now, count: 1 } : { ...entry, count: entry.count + 1 });
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }

    attempts.delete(ip);
    startSession(req, res);
    res.json({ username: auth.username });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = currentToken(req);
    if (token) {
      delete sessions()[token];
      db.save();
    }
    res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
    res.status(204).end();
  });

  // Trocar usuário e/ou senha (exige a senha atual)
  app.put('/api/auth/credentials', requireAuth, (req, res) => {
    const auth = db.data.auth;
    const { currentPassword, username, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || !checkPassword(currentPassword, auth.password)) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }
    const nextUsername = username?.trim() || auth.username;
    if (!validCredentials(nextUsername, newPassword || currentPassword)) {
      return res.status(400).json({ error: 'Usuário com 3+ caracteres e senha com 6+ caracteres' });
    }

    auth.username = nextUsername;
    if (newPassword) {
      auth.password = hashPassword(newPassword);
      db.data.sessions = {}; // derruba as outras sessões
    }
    startSession(req, res);
    res.json({ username: auth.username });
  });
}
