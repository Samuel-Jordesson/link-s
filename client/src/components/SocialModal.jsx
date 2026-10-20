import { useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import Modal from './Modal.jsx';
import { SOCIALS } from '../socials.js';

// social = null (adicionar) ou { index, type, url } (editar)
export default function SocialModal({ social, onSave, onRemove, onClose }) {
  const [type, setType] = useState(social?.type || null);
  const [url, setUrl] = useState(social?.url || '');

  if (!type) {
    return (
      <Modal title="Adicionar rede social" onClose={onClose}>
        <div className="social-pick">
          {Object.entries(SOCIALS).map(([key, s]) => (
            <button key={key} onClick={() => setType(key)}>
              <s.icon />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    );
  }

  const { icon: Icon, label, placeholder } = SOCIALS[type];

  return (
    <Modal
      title={label}
      onClose={onClose}
      footer={
        <>
          {social ? (
            <button className="btn btn-danger-ghost" onClick={onRemove}>
              Remover
            </button>
          ) : (
            <button className="btn btn-light" onClick={() => setType(null)}>
              <FiArrowLeft /> Voltar
            </button>
          )}
          <button className="btn btn-dark" disabled={!url.trim()} onClick={() => onSave({ type, url: url.trim() })}>
            Salvar
          </button>
        </>
      }
    >
      <form
        className="social-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) onSave({ type, url: url.trim() });
        }}
      >
        <span className="social-form-icon">
          <Icon />
        </span>
        <input autoFocus value={url} placeholder={placeholder} onChange={(e) => setUrl(e.target.value)} />
      </form>
    </Modal>
  );
}
