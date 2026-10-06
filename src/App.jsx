import { useState } from 'react';
import WardMap from './components/MapContainer.jsx';
import Sidebar from './components/Sidebar.jsx';
import { candidates, mayor } from './data/candidates.js';

export default function App() {
  const [ward, setWard] = useState(null);

  function handleSelect(feature) {
    const { AREA_SHORT_CODE: code, AREA_NAME: name } = feature.properties;
    const recommendation = candidates[code] ?? { name: '', description: '', links: [] };
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'select_ward', {
        ward_code: code,
        ward_name: name,
      });
    }
    setWard({
      kind: 'ward',
      code,
      kicker: `Ward ${Number(code)}`,
      name,
      candidate: recommendation.name,
      photo: recommendation.photo ?? '',
      photoPosition: recommendation.photoPosition,
      description: recommendation.description,
      links: recommendation.links ?? [],
    });
  }

  function handleRegister(event) {
    const url = event.currentTarget.href;
    if (typeof window.gtag !== 'function') return;

    event.preventDefault();
    let moved = false;
    const go = () => {
      if (moved) return;
      moved = true;
      window.location.assign(url);
    };
    window.gtag('event', 'register_to_vote', {
      link_url: url,
      event_callback: go,
      event_timeout: 1000,
    });
    window.setTimeout(go, 1000);
  }

  function handleMayor() {
    setWard((current) =>
      current?.kind === 'mayor'
        ? null
        : {
            kind: 'mayor',
            code: 'mayor',
            kicker: 'Mayoral',
            name: 'Toronto',
            candidate: mayor.name,
            photo: mayor.photo ?? '',
            photoPosition: mayor.photoPosition,
            description: mayor.description,
            links: mayor.links ?? [],
          },
    );
  }

  return (
    <div className="app">
      <WardMap
        selectedCode={ward?.kind === 'ward' ? ward.code : null}
        mayorActive={ward?.kind === 'mayor'}
        sidebarOpen={Boolean(ward)}
        onSelect={handleSelect}
        onRegister={handleRegister}
        onMayor={handleMayor}
      />
      <Sidebar ward={ward} onClose={() => setWard(null)} />
    </div>
  );
}
