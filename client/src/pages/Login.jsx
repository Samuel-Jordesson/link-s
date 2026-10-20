import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { api, ADMIN_PATH } from '../api.js';

export default function Login() {
  const navigate = useNavigate();
  const [configured, setConfigured] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.authStatus().then((s) => {
      if (s.authenticated) navigate(ADMIN_PATH, { replace: true });
      else setConfigured(s.configured);
    });
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!configured && password !== confirm) return setError('As senhas não conferem');
    setLoading(true);
    try {
      await (configured ? api.login : api.setup)({ username, password });
      navigate(ADMIN_PATH, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (configured === null) return <div className="center-msg">Carregando...</div>;

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">✳ Link's</div>
        <div>
          <h1>{configured ? 'Entrar no painel' : 'Criar acesso'}</h1>
          <p className="muted">
            {configured ? 'Use seu usuário e senha para gerenciar as páginas.' : 'Primeiro acesso: defina o usuário e a senha do painel.'}
          </p>
        </div>

        <label className="field">
          <span>Usuário</span>
          <input autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>

        <label className="field">
          <span>Senha</span>
          <div className="password-input">
            <input
              type={show ? 'text' : 'password'}
              autoComplete={configured ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="icon-btn" onClick={() => setShow(!show)} title={show ? 'Ocultar' : 'Mostrar'}>
              {show ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </label>

        {!configured && (
          <label className="field">
            <span>Confirmar senha</span>
            <input type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </label>
        )}

        {error && <p className="error">{error}</p>}

        <button className="btn btn-dark btn-block" disabled={loading}>
          {loading ? 'Aguarde...' : configured ? 'Entrar' : 'Criar acesso'}
        </button>
      </form>
    </div>
  );
}
