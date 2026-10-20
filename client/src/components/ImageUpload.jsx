import { useRef, useState } from 'react';
import { FiCamera } from 'react-icons/fi';
import { api } from '../api.js';

export default function ImageUpload({ value, onChange, size = 64, round = true, label = 'Logo', contain = false, icon = <FiCamera /> }) {
  const input = useRef(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      onChange(await api.upload(file));
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  }

  return (
    <button
      type="button"
      className={`image-upload ${value ? 'has-image' : ''} ${contain ? 'contain' : ''}`}
      style={{ width: size, height: size, borderRadius: round ? '50%' : 16 }}
      onClick={() => input.current.click()}
      title={`Enviar ${label.toLowerCase()}`}
    >
      {value ? <img src={value} alt={label} /> : <span className="image-upload-empty">{loading ? '...' : icon}</span>}
      {value && <span className="image-upload-hover">{icon}</span>}
      <input ref={input} type="file" accept="image/*" hidden onChange={handleFile} />
    </button>
  );
}
