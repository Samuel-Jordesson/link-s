import { useEffect, useMemo, useState } from 'react';
import { FiSearch, FiCheck } from 'react-icons/fi';
import Modal from './Modal.jsx';
import { api } from '../api.js';
import { loadFontPreview } from '../theme.js';

const MAX_RESULTS = 60;

const CATEGORIES = [
  ['all', 'Todas'],
  ['Sans Serif', 'Sem serifa'],
  ['Serif', 'Serifada'],
  ['Display', 'Decorativa'],
  ['Handwriting', 'Manuscrita'],
  ['Monospace', 'Monoespaçada'],
];

// A lista só é baixada uma vez por sessão
let fontsPromise = null;

const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export default function FontSearch({ current, onSelect, onClose }) {
  const [fonts, setFonts] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    fontsPromise ??= api.listFonts().catch((err) => {
      fontsPromise = null;
      throw err;
    });
    fontsPromise.then(setFonts).catch((err) => setError(err.message));
  }, []);

  const { results, total } = useMemo(() => {
    if (!fonts) return { results: [], total: 0 };
    const q = normalize(query);
    const matches = fonts.filter(
      (f) => (category === 'all' || f.category === category) && (!q || normalize(f.name).includes(q)),
    );
    // Quem começa com o termo pesquisado aparece primeiro
    if (q) matches.sort((a, b) => normalize(b.name).startsWith(q) - normalize(a.name).startsWith(q));
    return { results: matches.slice(0, MAX_RESULTS), total: matches.length };
  }, [fonts, query, category]);

  useEffect(() => results.forEach((f) => loadFontPreview(f.name, f.weights)), [results]);

  return (
    <Modal title="Pesquisar fonte" wide onClose={onClose}>
      <div className="icon-search">
        <FiSearch />
        <input
          autoFocus
          placeholder={fonts ? `Pesquisar entre ${fonts.length.toLocaleString('pt-BR')} fontes do Google...` : 'Pesquisar fonte...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="chips">
        {CATEGORIES.map(([key, label]) => (
          <button key={key} className={category === key ? 'active' : ''} onClick={() => setCategory(key)}>
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="icon-empty">{error}</p>
      ) : !fonts ? (
        <p className="icon-empty">Carregando fontes...</p>
      ) : results.length === 0 ? (
        <p className="icon-empty">Nenhuma fonte encontrada para “{query}”.</p>
      ) : (
        <>
          <div className="font-results">
            {results.map((f) => (
              <button
                key={f.name}
                className={`font-result ${current === f.name ? 'active' : ''}`}
                onClick={() => onSelect(f)}
              >
                <span className="font-result-name" style={{ fontFamily: `'${f.name}', system-ui`, fontWeight: f.weights.split(';')[0] }}>
                  {f.name}
                </span>
                <span className="font-result-cat">{CATEGORIES.find(([k]) => k === f.category)?.[1] || f.category}</span>
                {current === f.name && <FiCheck />}
              </button>
            ))}
          </div>
          {total > MAX_RESULTS && (
            <p className="icon-empty">
              Mostrando {MAX_RESULTS} de {total.toLocaleString('pt-BR')}. Pesquise pelo nome para achar a fonte certa.
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
