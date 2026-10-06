function linkLabel(href) {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, '');
    const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    return `${host}${path}`;
  } catch {
    return href;
  }
}

export default function Sidebar({ ward, onClose }) {
  const open = Boolean(ward);

  return (
    <aside
      className={`sidebar${open ? ' sidebar--open' : ''}`}
      aria-hidden={!open}
      aria-label={ward?.kind === 'mayor' ? 'Mayoral recommendation' : 'Ward recommendation'}
    >
      {ward && (
        <div className="sidebar__panel" key={ward.code}>
          <button type="button" className="sidebar__close" onClick={onClose} aria-label="Close">
            ×
          </button>
          <p className="sidebar__kicker">{ward.kicker}</p>
          <h2 className="sidebar__title">{ward.name}</h2>
          <div className="sidebar__candidate">
            {ward.photo ? (
              <img
                className="sidebar__photo"
                src={`${import.meta.env.BASE_URL}${ward.photo}`}
                alt=""
                style={ward.photoPosition ? { objectPosition: ward.photoPosition } : undefined}
              />
            ) : null}
            <div>
              <p className="sidebar__label">Recommended candidate</p>
              <p className="sidebar__name">{ward.candidate || 'Name not added yet'}</p>
            </div>
          </div>
          {ward.description ? <p className="sidebar__description">{ward.description}</p> : null}
          {ward.links?.length ? (
            <ul className="sidebar__links">
              {ward.links.map((href) => (
                <li key={href}>
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {linkLabel(href)}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </aside>
  );
}
