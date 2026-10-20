import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, LOGIN_PATH } from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function RequireAuth({ children }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.authStatus().then(setStatus);
  }, []);

  if (!status) return <div className="center-msg">Carregando...</div>;
  if (!status.authenticated) return <Navigate to={LOGIN_PATH} replace />;

  const setUsername = (username) => setStatus((s) => ({ ...s, username }));
  return <AuthContext.Provider value={{ username: status.username, setUsername }}>{children}</AuthContext.Provider>;
}
