import { useEffect, useState } from 'react';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

// Campo de cor em hexadecimal. Só chama onChange quando o código é válido;
// aceita com ou sem "#" e o formato curto (#f00 -> #ff0000).
export default function HexInput({ value, onChange, showDot = false }) {
  const [text, setText] = useState(value);

  useEffect(() => setText(value), [value]);

  function handleChange(raw) {
    const trimmed = raw.trim();
    const next = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    setText(next);
    if (HEX.test(next)) {
      const full = next.length === 4 ? `#${[...next.slice(1)].map((c) => c + c).join('')}` : next;
      onChange(full.toLowerCase());
    }
  }

  const valid = text.toLowerCase() === value?.toLowerCase();

  return (
    <label className={`hex-input ${valid ? '' : 'invalid'}`} title="Cor em hexadecimal">
      {showDot && <span style={{ background: value }} />}
      <input
        value={text}
        maxLength={7}
        spellCheck={false}
        placeholder="#000000"
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setText(value)}
      />
    </label>
  );
}
