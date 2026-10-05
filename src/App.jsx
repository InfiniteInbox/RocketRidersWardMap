import { useState } from 'react';
import WardMap from './components/MapContainer.jsx';
import Sidebar from './components/Sidebar.jsx';
import { candidates, mayor } from './data/candidates.js';

export default function App() {
  const [ward, setWard] = useState(null);

  function handleSelect(feature) {
    const { AREA_SHORT_CODE: code, AREA_NAME: name } = feature.properties;
    const recommendation = candidates[code] ?? { name: '', description: '', links: [] };
    setWard({
      kind: 'ward',
      code,
      kicker: `Ward ${Number(code)}`,
      name,
      candidate: recommendation.name,
      description: recommendation.description,
      links: recommendation.links ?? [],
    });
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
        onMayor={handleMayor}
      />
      <Sidebar ward={ward} onClose={() => setWard(null)} />
    </div>
  );
}
