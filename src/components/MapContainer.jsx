import { useEffect, useRef, useState } from 'react';
import { GeoJSON, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ESRI_GRAY =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const ESRI_LABELS =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}';

function wardStyle(selected) {
  return {
    color: selected ? '#163a63' : '#4c86c6',
    weight: selected ? 2.5 : 1.6,
    fillColor: selected ? '#163a63' : '#d7e6f5',
    fillOpacity: selected ? 0.28 : 0.45,
  };
}

function baseWardStyle() {
  return wardStyle(false);
}

function ringArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(sum / 2);
}

function ringCentroid(ring) {
  let area = 0;
  let x = 0;
  let y = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    x += (x0 + x1) * cross;
    y += (y0 + y1) * cross;
  }
  area *= 0.5;
  if (!area) {
    const count = Math.max(ring.length - 1, 1);
    let sx = 0;
    let sy = 0;
    for (let i = 0; i < count; i += 1) {
      sx += ring[i][0];
      sy += ring[i][1];
    }
    return [sy / count, sx / count];
  }
  return [y / (6 * area), x / (6 * area)];
}

function largestRing(geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let best = polygons[0][0];
  let bestArea = -1;
  for (const polygon of polygons) {
    const area = ringArea(polygon[0]);
    if (area > bestArea) {
      bestArea = area;
      best = polygon[0];
    }
  }
  return best;
}

function labelPoints(collection) {
  return collection.features.map((feature) => ({
    code: feature.properties.AREA_SHORT_CODE,
    name: feature.properties.AREA_NAME,
    position: ringCentroid(largestRing(feature.geometry)),
  }));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function FitToWards({ data }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (!data || fitted.current) return;
    const bounds = L.geoJSON(data).getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [28, 28] });
      fitted.current = true;
    }
  }, [data, map]);

  return null;
}

function ResizeMap({ open }) {
  const map = useMap();

  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 260);
    return () => window.clearTimeout(id);
  }, [open, map]);

  return null;
}

export default function WardMap({ selectedCode, onSelect, sidebarOpen, mayorActive, onMayor }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const geoRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selectedCode);
  onSelectRef.current = onSelect;
  selectedRef.current = selectedCode;

  useEffect(() => {
    let cancelled = false;
    fetch('/toronto-wards.geojson')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load ward boundaries');
        return response.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const group = geoRef.current;
    if (!group) return;
    group.eachLayer((layer) => {
      const code = layer.feature?.properties?.AREA_SHORT_CODE;
      const selected = code === selectedCode;
      layer.setStyle(wardStyle(selected));
      if (selected) layer.bringToFront();
    });
  }, [selectedCode, data]);

  function handleEachFeature(feature, layer) {
    layer.on({
      click: () => onSelectRef.current(feature),
      mouseover: () => {
        if (feature.properties.AREA_SHORT_CODE !== selectedRef.current) {
          layer.setStyle({ ...wardStyle(false), fillOpacity: 0.7 });
        }
      },
      mouseout: () => {
        const selected = feature.properties.AREA_SHORT_CODE === selectedRef.current;
        layer.setStyle(wardStyle(selected));
      },
    });
  }

  const points = data ? labelPoints(data) : [];

  return (
    <div className="map-wrap">
      <button
        type="button"
        className={`mayor-button${mayorActive ? ' mayor-button--active' : ''}`}
        aria-pressed={mayorActive}
        onClick={onMayor}
      >
        Mayoral
      </button>
      <MapContainer center={[43.73, -79.38]} zoom={11} className="map">
        <TileLayer
          attribution='Powered by <a href="https://www.esri.com/">Esri</a> | Esri, HERE'
          url={ESRI_GRAY}
        />
        <TileLayer url={ESRI_LABELS} />
        {data && (
          <GeoJSON
            ref={geoRef}
            data={data}
            style={baseWardStyle}
            onEachFeature={handleEachFeature}
          />
        )}
        {points.map((point) => (
          <Marker
            key={point.code}
            position={point.position}
            interactive={false}
            icon={L.divIcon({
              className: 'ward-label',
              html: `<span>${escapeHtml(point.name)}</span>`,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            })}
          />
        ))}
        <FitToWards data={data} />
        <ResizeMap open={sidebarOpen} />
      </MapContainer>
      {error ? <p className="map-error">{error}</p> : null}
    </div>
  );
}
