import {
  FaInstagram,
  FaWhatsapp,
  FaFacebook,
  FaTiktok,
  FaYoutube,
  FaXTwitter,
  FaLinkedin,
  FaEnvelope,
  FaGlobe,
} from 'react-icons/fa6';

export const SOCIALS = {
  instagram: { label: 'Instagram', icon: FaInstagram, placeholder: 'https://instagram.com/seuperfil' },
  whatsapp: { label: 'WhatsApp', icon: FaWhatsapp, placeholder: '5591999999999 ou link' },
  facebook: { label: 'Facebook', icon: FaFacebook, placeholder: 'https://facebook.com/suapagina' },
  tiktok: { label: 'TikTok', icon: FaTiktok, placeholder: 'https://tiktok.com/@seuperfil' },
  youtube: { label: 'YouTube', icon: FaYoutube, placeholder: 'https://youtube.com/@seucanal' },
  x: { label: 'X / Twitter', icon: FaXTwitter, placeholder: 'https://x.com/seuperfil' },
  linkedin: { label: 'LinkedIn', icon: FaLinkedin, placeholder: 'https://linkedin.com/company/...' },
  email: { label: 'E-mail', icon: FaEnvelope, placeholder: 'contato@empresa.com' },
  website: { label: 'Site', icon: FaGlobe, placeholder: 'https://seusite.com' },
};

export function socialHref({ type, url }) {
  const value = String(url || '').trim();
  if (type === 'email' && !value.startsWith('mailto:')) return `mailto:${value}`;
  if (type === 'whatsapp' && /^\+?[\d\s()-]+$/.test(value)) return `https://wa.me/${value.replace(/\D/g, '')}`;
  return /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
}
