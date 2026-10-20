import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiShare,
  FiLayers,
  FiDroplet,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiExternalLink,
  FiGrid,
  FiUpload,
  FiCheck,
  FiImage,
} from 'react-icons/fi';
import { RxDragHandleDots2 } from 'react-icons/rx';
import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { api, ADMIN_PATH } from '../api.js';
import AdminActions from '../components/AdminActions.jsx';
import { SOCIALS } from '../socials.js';
import { withDefaults, PRESETS, FONTS, loadFont } from '../theme.js';
import ProfileView from '../components/ProfileView.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import SocialModal from '../components/SocialModal.jsx';

const IconLibrary = lazy(() => import('../components/IconLibrary.jsx'));

const EMPTY_LINK = { title: '', subtitle: '', url: '', image: '', icon: null };

export default function Editor() {
  const { id } = useParams();
  const [page, setPage] = useState(null);
  const [tab, setTab] = useState('content');
  const [status, setStatus] = useState('');
  const pending = useRef({});
  const timer = useRef(null);

  useEffect(() => {
    api.getPage(id).then(setPage);
  }, [id]);

  // Atualiza o estado local na hora e salva no servidor com debounce
  function patch(fields) {
    setPage((p) => ({ ...p, ...fields, theme: fields.theme ? { ...p.theme, ...fields.theme } : p.theme }));
    pending.current = {
      ...pending.current,
      ...fields,
      theme: fields.theme ? { ...pending.current.theme, ...fields.theme } : pending.current.theme,
    };
    setStatus('Salvando...');
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const body = pending.current;
      pending.current = {};
      try {
        const saved = await api.updatePage(id, body);
        setPage((p) => ({ ...p, slug: saved.slug }));
        setStatus('Salvo');
      } catch (err) {
        setStatus(err.message);
      }
    }, 600);
  }

  if (!page) return <div className="center-msg">Carregando...</div>;

  const publicUrl = `${window.location.origin}/${page.slug}`;

  return (
    <div className="editor">
      <header className="topbar">
        <div className="topbar-left">
          <Link to={ADMIN_PATH} className="icon-btn" title="Voltar">
            <FiArrowLeft />
          </Link>
          <span className="brand">✳ Link's</span>
        </div>
        <div className="topbar-title">
          <div className="avatar-xs">{page.logo ? <img src={page.logo} alt="" /> : page.name[0]}</div>
          <span>{page.name}</span>
          {status && <span className={`status ${status === 'Salvo' || status === 'Link copiado!' ? 'ok' : ''}`}>{status}</span>}
        </div>
        <div className="topbar-right">
          <a className="btn btn-light btn-sm" href={`/${page.slug}`} target="_blank" rel="noreferrer">
            <FiExternalLink /> <span className="hide-sm">Ver página</span>
          </a>
          <button
            className="btn btn-dark btn-sm"
            onClick={() => navigator.clipboard.writeText(publicUrl).then(() => setStatus('Link copiado!'))}
          >
            <FiShare /> <span className="hide-sm">Compartilhar</span>
          </button>
          <span className="topbar-divider" />
          <AdminActions />
        </div>
      </header>

      <div className="editor-body">
        <nav className="sidebar">
          <button className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>
            <FiLayers />
            <span>Conteúdo</span>
          </button>
          <button className={tab === 'design' ? 'active' : ''} onClick={() => setTab('design')}>
            <FiDroplet />
            <span>Design</span>
          </button>
        </nav>

        <section className="panel">
          <div className="panel-inner">
            {tab === 'content' ? (
              <ContentTab page={page} setPage={setPage} patch={patch} />
            ) : (
              <DesignTab page={page} patch={patch} />
            )}
          </div>
        </section>

        <aside className="preview">
          <div className="phone">
            <ProfileView page={page} preview />
          </div>
          <p className="preview-url">{publicUrl.replace(/^https?:\/\//, '')}</p>
        </aside>
      </div>
    </div>
  );
}

function ContentTab({ page, setPage, patch }) {
  const [form, setForm] = useState(null); // null | { ...link } (com id = edição)
  const [library, setLibrary] = useState(false);
  const [social, setSocial] = useState(undefined); // undefined = fechado, null = novo, objeto = editar

  function saveSocial(value) {
    const socials =
      social == null ? [...page.socials, value] : page.socials.map((s, i) => (i === social.index ? value : s));
    patch({ socials });
    setSocial(undefined);
  }

  function removeSocial() {
    patch({ socials: page.socials.filter((_, i) => i !== social.index) });
    setSocial(undefined);
  }

  async function saveLink(e) {
    e.preventDefault();
    if (form.id) {
      const saved = await api.updateLink(page.id, form.id, form);
      setPage((p) => ({ ...p, links: p.links.map((l) => (l.id === saved.id ? saved : l)) }));
    } else {
      const saved = await api.addLink(page.id, form);
      setPage((p) => ({ ...p, links: [saved, ...p.links] }));
      await api.reorderLinks(page.id, [saved.id, ...page.links.map((l) => l.id)]);
    }
    setForm(null);
  }

  async function toggleLink(link) {
    const saved = await api.updateLink(page.id, link.id, { active: !link.active });
    setPage((p) => ({ ...p, links: p.links.map((l) => (l.id === saved.id ? saved : l)) }));
  }

  async function removeLink(link) {
    if (!confirm(`Excluir o link "${link.title}"?`)) return;
    await api.deleteLink(page.id, link.id);
    setPage((p) => ({ ...p, links: p.links.filter((l) => l.id !== link.id) }));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const from = page.links.findIndex((l) => l.id === active.id);
    const to = page.links.findIndex((l) => l.id === over.id);
    const links = arrayMove(page.links, from, to);
    setPage((p) => ({ ...p, links }));
    await api.reorderLinks(page.id, links.map((l) => l.id));
  }

  return (
    <>
      <div className="panel-head">
        <h2>Conteúdo</h2>
        <p>Edite o perfil e os links da página.</p>
      </div>

      <div className="section">
        <div className="section-title">Perfil</div>
        <div className="profile-edit">
          <ImageUpload value={page.logo} onChange={(logo) => patch({ logo })} size={84} />
          <div className="profile-edit-fields">
            <input className="input-title" value={page.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Nome" />
            <textarea
              rows={2}
              value={page.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Descrição / bio da empresa"
            />
            <label className="slug-field">
              <span>{window.location.host}/</span>
              <input value={page.slug} onChange={(e) => patch({ slug: e.target.value })} />
            </label>
            <div className="social-icons">
              {page.socials.map((s, i) => {
                const Icon = SOCIALS[s.type]?.icon;
                return (
                  Icon && (
                    <button key={i} className="social-icon" title={`Editar ${SOCIALS[s.type].label}`} onClick={() => setSocial({ ...s, index: i })}>
                      <Icon />
                    </button>
                  )
                );
              })}
              <button className="social-icon social-add" title="Adicionar rede social" onClick={() => setSocial(null)}>
                <FiPlus />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">
          Links <span className="count">{page.links.length}</span>
        </div>

        {form ? (
          <form className="link-form" onSubmit={saveLink}>
            <div className="link-form-row">
              <div className="link-form-media">
                <ImageUpload
                  value={form.image}
                  onChange={(image) => setForm({ ...form, image, icon: null })}
                  size={72}
                  round={false}
                  label="Imagem"
                  contain={Boolean(form.icon)}
                />
                <button type="button" className="btn btn-light btn-xs" onClick={() => setLibrary(true)}>
                  <FiGrid /> Biblioteca
                </button>
                {form.image && (
                  <button type="button" className="link-btn" onClick={() => setForm({ ...form, image: '', icon: null })}>
                    Remover
                  </button>
                )}
              </div>
              <div className="link-form-fields">
                <label className="field">
                  <span>Título</span>
                  <input autoFocus required placeholder="Ex: Grupo de descontos" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </label>
                <label className="field">
                  <span>Subtítulo (opcional)</span>
                  <input placeholder="Ex: Comunidade no WhatsApp" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
                </label>
                <label className="field">
                  <span>URL</span>
                  <input required placeholder="chat.whatsapp.com/..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                </label>
              </div>
            </div>
            <div className="link-form-actions">
              <button type="button" className="btn btn-light" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button className="btn btn-dark">
                <FiCheck /> {form.id ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </form>
        ) : (
          <button className="btn btn-dark btn-block" onClick={() => setForm({ ...EMPTY_LINK })}>
            <FiPlus /> Adicionar link
          </button>
        )}

        <div className="link-list">
          {page.links.length === 0 && !form && <p className="empty">Nenhum link ainda. Adicione o primeiro!</p>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
            <SortableContext items={page.links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              {page.links.map((link) => (
                <SortableLink
                  key={link.id}
                  link={link}
                  onToggle={() => toggleLink(link)}
                  onEdit={() => setForm({ ...EMPTY_LINK, ...link })}
                  onRemove={() => removeLink(link)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {library && (
        <Suspense fallback={null}>
          <IconLibrary
            initial={form?.icon}
            onClose={() => setLibrary(false)}
            onSelect={({ image, icon }) => {
              setForm((f) => ({ ...f, image, icon }));
              setLibrary(false);
            }}
          />
        </Suspense>
      )}

      {social !== undefined && (
        <SocialModal social={social} onSave={saveSocial} onRemove={removeSocial} onClose={() => setSocial(undefined)} />
      )}
    </>
  );
}

function SortableLink({ link, onToggle, onEdit, onRemove }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={`link-item ${link.active ? '' : 'inactive'} ${isDragging ? 'dragging' : ''}`}>
      <button ref={setActivatorNodeRef} className="drag-handle" title="Arraste para reordenar" {...attributes} {...listeners}>
        <RxDragHandleDots2 />
      </button>
      <div className={`thumb ${link.icon ? 'is-icon' : ''}`}>{link.image ? <img src={link.image} alt="" /> : <FiImage />}</div>
      <div className="link-item-info">
        <strong>{link.title}</strong>
        <small>{link.url}</small>
      </div>
      <span className="clicks" title="Cliques">
        {link.clicks || 0} cliques
      </span>
      <label className="switch" title={link.active ? 'Desativar' : 'Ativar'}>
        <input type="checkbox" checked={link.active} onChange={onToggle} />
        <span />
      </label>
      <button className="icon-btn" onClick={onEdit} title="Editar">
        <FiEdit2 />
      </button>
      <button className="icon-btn danger" onClick={onRemove} title="Excluir">
        <FiTrash2 />
      </button>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="color-field">
      <span className="color-swatch" style={{ background: value }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      </span>
      <span className="color-label">{label}</span>
      <code>{value}</code>
    </label>
  );
}

function DesignTab({ page, patch }) {
  const theme = withDefaults(page.theme);
  const setTheme = (fields) => patch({ theme: fields });

  useEffect(() => FONTS.forEach((f) => loadFont(f.name)), []);

  return (
    <>
      <div className="panel-head">
        <h2>Design</h2>
        <p>Personalize as cores, o fundo, os botões e a fonte.</p>
      </div>

      <div className="section">
        <div className="section-title">Temas prontos</div>
        <div className="presets">
          {PRESETS.map(({ name, ...colors }) => {
            const active = Object.entries(colors).every(([k, v]) => theme[k] === v);
            return (
              <button key={name} className={`preset ${active ? 'active' : ''}`} onClick={() => setTheme(colors)}>
                <span className="preset-thumb" style={{ background: colors.background }}>
                  <i style={{ background: colors.buttonColor }} />
                  <i style={{ background: colors.buttonColor }} />
                  <i style={{ background: colors.buttonColor }} />
                </span>
                <span>{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="section-title">Fundo</div>
        <ColorField label="Cor de fundo" value={theme.background} onChange={(background) => setTheme({ background })} />

        <div className="bg-image">
          <ImageUpload
            value={theme.backgroundImage}
            onChange={(backgroundImage) => setTheme({ backgroundImage })}
            size={72}
            round={false}
            label="Imagem de fundo"
            icon={<FiUpload />}
          />
          <div className="bg-image-info">
            <strong>Imagem de fundo</strong>
            {theme.backgroundImage ? (
              <>
                <label className="range">
                  <span>Opacidade</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={theme.backgroundOpacity}
                    onChange={(e) => setTheme({ backgroundOpacity: Number(e.target.value) })}
                  />
                  <code>{theme.backgroundOpacity}%</code>
                </label>
                <button className="link-btn" onClick={() => setTheme({ backgroundImage: '' })}>
                  Remover imagem
                </button>
              </>
            ) : (
              <small>Clique no quadro para enviar uma imagem.</small>
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Botões</div>
        <div className="btn-styles">
          {[
            ['pill', 'Arredondado'],
            ['rounded', 'Suave'],
            ['square', 'Quadrado'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`btn-style btn-style-${key} ${theme.buttonStyle === key ? 'active' : ''}`}
              onClick={() => setTheme({ buttonStyle: key })}
            >
              {label}
            </button>
          ))}
        </div>
        <ColorField label="Cor do botão" value={theme.buttonColor} onChange={(buttonColor) => setTheme({ buttonColor })} />
        <ColorField label="Texto do botão" value={theme.buttonTextColor} onChange={(buttonTextColor) => setTheme({ buttonTextColor })} />

        <div className="toggle-row">
          <span>Contorno nos links</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={theme.borderWidth > 0}
              onChange={(e) => setTheme({ borderWidth: e.target.checked ? 2 : 0 })}
            />
            <span />
          </label>
        </div>
        {theme.borderWidth > 0 && (
          <>
            <label className="range">
              <span>Espessura</span>
              <input type="range" min="1" max="6" value={theme.borderWidth} onChange={(e) => setTheme({ borderWidth: Number(e.target.value) })} />
              <code>{theme.borderWidth}px</code>
            </label>
            <ColorField label="Cor do contorno" value={theme.borderColor} onChange={(borderColor) => setTheme({ borderColor })} />
          </>
        )}
      </div>

      <div className="section">
        <div className="section-title">Texto e fonte</div>
        <ColorField label="Cor do texto" value={theme.textColor} onChange={(textColor) => setTheme({ textColor })} />
        <div className="fonts">
          {FONTS.map((f) => (
            <button
              key={f.name}
              className={`font-opt ${theme.font === f.name ? 'active' : ''}`}
              style={{ fontFamily: `'${f.name}'` }}
              onClick={() => setTheme({ font: f.name })}
            >
              <span className="font-aa">Aa</span>
              <span>{f.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
