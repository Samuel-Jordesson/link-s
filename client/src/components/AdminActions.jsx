import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSettings, FiLogOut } from 'react-icons/fi';
import { api, LOGIN_PATH } from '../api.js';
import { useAuth } from './RequireAuth.jsx';
import Modal from './Modal.jsx';

// Botões de configurações e sair, usados no header do painel
export default function AdminActions() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function logout() {
    await api.logout();
    navigate(LOGIN_PATH, { replace: true });
  }

  return (
    <>
      <button className="icon-btn" onClick={() => setOpen(true)} title="Configurações">
        <FiSettings />
      </button>
      <button className="icon-btn" onClick={logout} title="Sair">
        <FiLogOut />
      </button>
      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </>
  );
}

function SettingsModal({ onClose }) {
  const { username, setUsername } = useAuth();
  const [form, setForm] = useState({ username, currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.newPassword && form.newPassword !== form.confirm) return setError('As novas senhas não conferem');
    setLoading(true);
    try {
      const res = await api.updateCredentials({
        currentPassword: form.currentPassword,
        username: form.username,
        newPassword: form.newPassword || undefined,
      });
      setUsername(res.username);
      setDone(true);
      setForm({ ...form, currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Configurações de acesso"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-light" onClick={onClose}>
            Fechar
          </button>
          <button className="btn btn-dark" form="settings-form" disabled={loading || !form.currentPassword}>
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </>
      }
    >
      <form id="settings-form" className="settings-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Usuário</span>
          <input autoComplete="username" value={form.username} onChange={set('username')} required />
        </label>
        <label className="field">
          <span>Nova senha (deixe em branco para manter)</span>
          <input type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} />
        </label>
        {form.newPassword && (
          <label className="field">
            <span>Confirmar nova senha</span>
            <input type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} required />
          </label>
        )}
        <hr />
        <label className="field">
          <span>Senha atual (obrigatória para salvar)</span>
          <input type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} required />
        </label>
        {error && <p className="error">{error}</p>}
        {done && <p className="success">Dados de acesso atualizados.</p>}
      </form>
    </Modal>
  );
}
