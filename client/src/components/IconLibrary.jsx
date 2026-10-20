// Carregado sob demanda (React.lazy) — os pacotes de ícones são grandes
import { useEffect, useMemo, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FiSearch } from 'react-icons/fi';
import Modal from './Modal.jsx';
import HexInput from './HexInput.jsx';

const SETS = [
  // 'fa' e não 'fa6': o fa6 já é importado estaticamente em socials.js e viria inteiro no bundle principal
  { key: 'fa', prefix: 'Fa', label: 'Font Awesome', load: () => import('react-icons/fa') },
  { key: 'si', prefix: 'Si', label: 'Marcas', load: () => import('react-icons/si') },
  { key: 'lu', prefix: 'Lu', label: 'Lucide', load: () => import('react-icons/lu') },
  { key: 'md', prefix: 'Md', label: 'Material', load: () => import('react-icons/md') },
  { key: 'bs', prefix: 'Bs', label: 'Bootstrap', load: () => import('react-icons/bs') },
];

const COLORS = ['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#25d366', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#e1306c'];

const MAX_RESULTS = 300;

// Os nomes dos ícones são em inglês: traduz as buscas mais comuns
const PT = {
  carrinho: 'cart', loja: 'store', compra: 'shop', compras: 'shop', sacola: 'bag', telefone: 'phone', celular: 'mobile',
  casa: 'home', inicio: 'home', email: 'mail', mensagem: 'message', conversa: 'chat', mapa: 'map', localizacao: 'location',
  endereco: 'location', dinheiro: 'money', preco: 'tag', etiqueta: 'tag', desconto: 'percent', promocao: 'tag',
  presente: 'gift', estrela: 'star', coracao: 'heart', calendario: 'calendar', agenda: 'calendar', relogio: 'clock',
  hora: 'clock', musica: 'music', foto: 'camera', imagem: 'image', livro: 'book', comida: 'food', restaurante: 'utensils',
  cafe: 'coffee', carro: 'car', usuario: 'user', pessoa: 'user', grupo: 'users', site: 'globe', mundo: 'globe',
  seta: 'arrow', busca: 'search', pesquisa: 'search', configuracao: 'gear', ferramenta: 'tool', escola: 'school',
  saude: 'heart', aviao: 'plane', viagem: 'plane', roupa: 'shirt', jogo: 'game', fogo: 'fire', raio: 'bolt',
  documento: 'file', arquivo: 'file', sino: 'bell', notificacao: 'bell', cartao: 'card', pagamento: 'credit',
  banco: 'bank', trabalho: 'briefcase', cadeado: 'lock', chave: 'key', nuvem: 'cloud', sol: 'sun', lua: 'moon',
  agua: 'water', planta: 'leaf', folha: 'leaf', cachorro: 'dog', gato: 'cat', bebida: 'wine', cerveja: 'beer',
  pizza: 'pizza', hamburguer: 'burger', bolo: 'cake', entrega: 'truck', caminhao: 'truck', moto: 'motorcycle',
  bicicleta: 'bicycle', livraria: 'book', video: 'video', ao_vivo: 'live', microfone: 'microphone', fone: 'headphones',
  curtir: 'thumbs', joia: 'thumbs', baixar: 'download', enviar: 'send', compartilhar: 'share', ajuda: 'help',
  informacao: 'info', aviso: 'warning', verificado: 'check', certo: 'check', lista: 'list', grafico: 'chart',
};

const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function iconToDataUrl(Icon, color) {
  const svg = renderToStaticMarkup(<Icon size={64} color={color} />).replaceAll('currentColor', color);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// onPreview: chamado a cada troca de ícone/cor, para o preview atualizar em tempo real
export default function IconLibrary({ initial, defaultColor = '#000000', onSelect, onPreview, onClose }) {
  const [icons, setIcons] = useState(null);
  const [query, setQuery] = useState('');
  const [set, setSet] = useState('all');
  const [selected, setSelected] = useState(initial ? { set: initial.set, name: initial.name } : null);
  const [color, setColor] = useState(initial?.color || defaultColor);

  useEffect(() => {
    Promise.all(SETS.map((s) => s.load().then((mod) => ({ s, mod })))).then((loaded) => {
      const list = [];
      for (const { s, mod } of loaded) {
        for (const [name, Icon] of Object.entries(mod)) {
          if (typeof Icon !== 'function') continue;
          const words = name
            .slice(s.prefix.length)
            .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
            .toLowerCase();
          list.push({ set: s.key, name, Icon, words });
        }
      }
      setIcons(list);
    });
  }, []);

  const results = useMemo(() => {
    if (!icons) return [];
    const q = normalize(query);
    const term = PT[q.replace(/\s+/g, '_')] || q;
    const out = [];
    for (const icon of icons) {
      if (set !== 'all' && icon.set !== set) continue;
      if (q && !icon.words.includes(term) && !icon.words.includes(q) && !icon.name.toLowerCase().includes(q)) continue;
      out.push(icon);
      if (out.length >= MAX_RESULTS) break;
    }
    return out;
  }, [icons, query, set]);

  const current = selected && icons?.find((i) => i.set === selected.set && i.name === selected.name);

  const build = () => ({ image: iconToDataUrl(current.Icon, color), icon: { set: current.set, name: current.name, color } });

  useEffect(() => {
    if (current) onPreview?.(build());
  }, [current, color]);

  function confirm() {
    onSelect(build());
  }

  return (
    <Modal
      title="Biblioteca de ícones"
      wide
      onClose={onClose}
      footer={
        <>
          <div className="icon-pick">
            <div className="icon-pick-preview">{current ? <current.Icon color={color} /> : <span>?</span>}</div>
            <div className="icon-colors">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`swatch ${c === color ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
              <label className="swatch swatch-custom" title="Outra cor">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              </label>
              <HexInput value={color} onChange={setColor} showDot />
            </div>
          </div>
          <button className="btn btn-dark" disabled={!current} onClick={confirm}>
            Usar ícone
          </button>
        </>
      }
    >
      <div className="icon-search">
        <FiSearch />
        <input autoFocus placeholder="Pesquisar ícone (ex: whatsapp, carrinho, loja, instagram...)" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="chips">
        <button className={set === 'all' ? 'active' : ''} onClick={() => setSet('all')}>
          Todos
        </button>
        {SETS.map((s) => (
          <button key={s.key} className={set === s.key ? 'active' : ''} onClick={() => setSet(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {!icons ? (
        <p className="icon-empty">Carregando ícones...</p>
      ) : results.length === 0 ? (
        <p className="icon-empty">Nenhum ícone encontrado para “{query}”.</p>
      ) : (
        <>
          <div className="icon-grid">
            {results.map(({ set: s, name, Icon }) => (
              <button
                key={`${s}-${name}`}
                className={selected?.set === s && selected?.name === name ? 'active' : ''}
                onClick={() => setSelected({ set: s, name })}
                title={name}
              >
                <Icon />
              </button>
            ))}
          </div>
          {results.length >= MAX_RESULTS && (
            <p className="icon-empty">Mostrando {MAX_RESULTS} de {icons.length.toLocaleString('pt-BR')} ícones. Pesquise para refinar.</p>
          )}
        </>
      )}
    </Modal>
  );
}
