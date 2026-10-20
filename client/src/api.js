export const ADMIN_PATH = '/gerenciamento';
export const LOGIN_PATH = `${ADMIN_PATH}/login`;

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  // Sessão expirou: volta para o login (menos nas próprias rotas de login)
  if (res.status === 401 && !url.startsWith('/api/auth/') && !location.pathname.startsWith(LOGIN_PATH)) {
    location.href = LOGIN_PATH;
  }
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

export const api = {
  authStatus: () => request('GET', '/api/auth/status'),
  setup: (body) => request('POST', '/api/auth/setup', body),
  login: (body) => request('POST', '/api/auth/login', body),
  logout: () => request('POST', '/api/auth/logout'),
  updateCredentials: (body) => request('PUT', '/api/auth/credentials', body),

  listPages: () => request('GET', '/api/pages'),
  createPage: (body) => request('POST', '/api/pages', body),
  getPage: (id) => request('GET', `/api/pages/${id}`),
  updatePage: (id, body) => request('PUT', `/api/pages/${id}`, body),
  deletePage: (id) => request('DELETE', `/api/pages/${id}`),

  addLink: (pageId, body) => request('POST', `/api/pages/${pageId}/links`, body),
  updateLink: (pageId, linkId, body) => request('PUT', `/api/pages/${pageId}/links/${linkId}`, body),
  deleteLink: (pageId, linkId) => request('DELETE', `/api/pages/${pageId}/links/${linkId}`),
  reorderLinks: (pageId, ids) => request('PUT', `/api/pages/${pageId}/links/reorder`, { ids }),

  listFonts: () => request('GET', '/api/fonts'),

  getPublic: (slug) => request('GET', `/api/public/${slug}`),

  async upload(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    if (res.status === 401) location.href = LOGIN_PATH;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha no upload');
    return data.url;
  },
};
