import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiExternalLink, FiTrash2 } from 'react-icons/fi';
import { api, ADMIN_PATH } from '../api.js';
import AdminActions from '../components/AdminActions.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.listPages().then(setPages);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      const page = await api.createPage({ name });
      navigate(`${ADMIN_PATH}/${page.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(page) {
    if (!confirm(`Excluir a página "${page.name}"?`)) return;
    await api.deletePage(page.id);
    setPages((list) => list.filter((p) => p.id !== page.id));
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <span className="brand">✳ Link's</span>
        <div className="topbar-right">
          <AdminActions />
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-head">
          <h1>Minhas empresas</h1>
          <button className="btn btn-dark" onClick={() => setCreating(true)}>
            <FiPlus /> Nova empresa
          </button>
        </div>

        {creating && (
          <form className="card create-form" onSubmit={handleCreate}>
            <input autoFocus placeholder="Nome da empresa (ex: Olha O Preço)" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-dark" disabled={!name.trim()}>
              Criar
            </button>
            <button type="button" className="btn btn-light" onClick={() => setCreating(false)}>
              Cancelar
            </button>
            {error && <p className="error">{error}</p>}
          </form>
        )}

        {pages.length === 0 && !creating && <p className="muted">Nenhuma empresa ainda. Crie a primeira!</p>}

        <div className="page-grid">
          {pages.map((p) => (
            <div key={p.id} className="card page-card">
              <Link to={`${ADMIN_PATH}/${p.id}`} className="page-card-main">
                <div className="avatar-sm">{p.logo ? <img src={p.logo} alt="" /> : p.name[0]?.toUpperCase()}</div>
                <div>
                  <strong>{p.name}</strong>
                  <small>/{p.slug}</small>
                  <small>
                    {p.linkCount} links · {p.clicks} cliques
                  </small>
                </div>
              </Link>
              <div className="page-card-actions">
                <a className="icon-btn" href={`/${p.slug}`} target="_blank" rel="noreferrer" title="Abrir página">
                  <FiExternalLink />
                </a>
                <button className="icon-btn" onClick={() => handleDelete(p)} title="Excluir">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
