export const DEFAULT_THEME = {
  background: '#3f3f3f',
  buttonColor: '#5a5a5a',
  buttonTextColor: '#ffffff',
  textColor: '#ffffff',
  buttonStyle: 'pill',
  borderWidth: 0,
  borderColor: '#ffffff',
  backgroundImage: '',
  backgroundOpacity: 100,
  font: 'Inter',
};

export const withDefaults = (theme) => ({ ...DEFAULT_THEME, ...theme });

export const PRESETS = [
  { name: 'Grafite', background: '#3f3f3f', buttonColor: '#5a5a5a', buttonTextColor: '#ffffff', textColor: '#ffffff' },
  { name: 'Claro', background: '#f4f4f0', buttonColor: '#ffffff', buttonTextColor: '#1e1e1e', textColor: '#1e1e1e' },
  { name: 'Noite', background: '#0f172a', buttonColor: '#1e293b', buttonTextColor: '#e2e8f0', textColor: '#f8fafc' },
  { name: 'Oceano', background: '#0e7490', buttonColor: '#ecfeff', buttonTextColor: '#155e75', textColor: '#ffffff' },
  { name: 'Floresta', background: '#14532d', buttonColor: '#dcfce7', buttonTextColor: '#14532d', textColor: '#f0fdf4' },
  { name: 'Vinho', background: '#7f1d1d', buttonColor: '#ffffff', buttonTextColor: '#b91c1c', textColor: '#ffffff' },
  { name: 'Lavanda', background: '#ede9fe', buttonColor: '#7c3aed', buttonTextColor: '#ffffff', textColor: '#3b0764' },
  { name: 'Areia', background: '#fdf6e3', buttonColor: '#d97706', buttonTextColor: '#ffffff', textColor: '#78350f' },
  { name: 'Neon', background: '#0a0a0a', buttonColor: '#a3e635', buttonTextColor: '#0a0a0a', textColor: '#ffffff' },
  { name: 'Coral', background: '#fda4af', buttonColor: '#ffffff', buttonTextColor: '#be123c', textColor: '#4c0519' },
];

// weights: null = fonte só tem peso 400 no Google Fonts
export const FONTS = [
  { name: 'Inter', weights: '400;600;700' },
  { name: 'Poppins', weights: '400;600;700' },
  { name: 'Montserrat', weights: '400;600;700' },
  { name: 'Roboto', weights: '400;500;700' },
  { name: 'Open Sans', weights: '400;600;700' },
  { name: 'Lato', weights: '400;700' },
  { name: 'Nunito', weights: '400;600;700' },
  { name: 'DM Sans', weights: '400;600;700' },
  { name: 'Space Grotesk', weights: '400;600;700' },
  { name: 'Rubik', weights: '400;600;700' },
  { name: 'Work Sans', weights: '400;600;700' },
  { name: 'Quicksand', weights: '400;600;700' },
  { name: 'Raleway', weights: '400;600;700' },
  { name: 'Oswald', weights: '400;600;700' },
  { name: 'Playfair Display', weights: '400;600;700' },
  { name: 'Merriweather', weights: '400;700' },
  { name: 'Lora', weights: '400;600;700' },
  { name: 'Bebas Neue', weights: null },
  { name: 'Pacifico', weights: null },
  { name: 'Dancing Script', weights: '400;600;700' },
];

export function loadFont(name) {
  const font = FONTS.find((f) => f.name === name);
  if (!font) return;
  const id = `font-${name.replace(/\s/g, '-')}`;
  if (document.getElementById(id)) return;
  const family = name.replace(/\s/g, '+') + (font.weights ? `:wght@${font.weights}` : '');
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  document.head.appendChild(link);
}
