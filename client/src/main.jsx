import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Editor from './pages/Editor.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import PublicPage from './pages/PublicPage.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import { ADMIN_PATH, LOGIN_PATH } from './api.js';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path={LOGIN_PATH} element={<Login />} />
        <Route path={ADMIN_PATH} element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path={`${ADMIN_PATH}/:id`} element={<RequireAuth><Editor /></RequireAuth>} />
        <Route path="/:slug" element={<PublicPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
