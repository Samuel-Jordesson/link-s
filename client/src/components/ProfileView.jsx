import { useEffect } from 'react';
import { SOCIALS, socialHref } from '../socials.js';
import { withDefaults, loadFont } from '../theme.js';

const RADIUS = { pill: '999px', rounded: '14px', square: '4px' };

// Usado tanto na página pública quanto no preview do editor
export default function ProfileView({ page, preview = false }) {
  const theme = withDefaults(page.theme);
  const links = page.links.filter((l) => l.active !== false);

  useEffect(() => loadFont(theme.font), [theme.font]);

  const style = {
    '--bg': theme.background,
    '--text': theme.textColor,
    '--btn': theme.buttonColor,
    '--btn-text': theme.buttonTextColor,
    '--radius': RADIUS[theme.buttonStyle] || RADIUS.pill,
    '--border': theme.borderWidth > 0 ? `${theme.borderWidth}px solid ${theme.borderColor}` : 'none',
    fontFamily: `'${theme.font}', system-ui, sans-serif`,
  };

  return (
    <div className="profile" style={style}>
      {theme.backgroundImage && (
        <div
          className="profile-bg"
          style={{ backgroundImage: `url("${theme.backgroundImage}")`, opacity: theme.backgroundOpacity / 100 }}
        />
      )}
      <div className="profile-inner">
        <div className="profile-avatar">
          {page.logo ? <img src={page.logo} alt={page.name} /> : <span>{page.name?.[0]?.toUpperCase()}</span>}
        </div>
        <h1 className="profile-name">{page.name}</h1>
        {page.description && <p className="profile-desc">{page.description}</p>}

        {page.socials?.length > 0 && (
          <div className="profile-socials">
            {page.socials.map((s, i) => {
              const Icon = SOCIALS[s.type]?.icon;
              if (!Icon || !s.url) return null;
              return (
                <a key={i} href={preview ? undefined : socialHref(s)} target="_blank" rel="noreferrer" title={SOCIALS[s.type].label}>
                  <Icon />
                </a>
              );
            })}
          </div>
        )}

        <div className="profile-links">
          {links.map((link) => (
            <a
              key={link.id}
              className="profile-link"
              href={preview ? undefined : `/go/${page.slug}/${link.id}`}
              target="_blank"
              rel="noreferrer"
            >
              {link.image ? (
                <img className={`profile-link-img ${link.icon ? 'is-icon' : ''}`} src={link.image} alt="" />
              ) : (
                <span className="profile-link-img" />
              )}
              <span className="profile-link-text">
                <strong>{link.title}</strong>
                {link.subtitle && <small>{link.subtitle}</small>}
              </span>
              <span className="profile-link-img placeholder" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
