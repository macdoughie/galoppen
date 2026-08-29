'use client';

import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { START } from '../../lib/stops';

function markerIcon(label, kind = 'visited') {
  return L.divIcon({
    className: 'galoppen-leaflet-icon',
    html: `<div class="mapPin ${kind}">${label}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

function FitToPoints({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 16 });
  }, [map, points]);

  return null;
}

export default function GaloppenMap({
  visited = [],
  currentRider = null,
  phase = '',
  privateChoices = [],
  selected = null,
  privateMode = false,
}) {
  const visitedStops = visited.map((v) => v.stop).filter((s) => s?.lat && s?.lng);
  const route = [START, ...visitedStops.filter((s) => s.id !== START.id)];
  const current = visitedStops[visitedStops.length - 1] || START;

  const displayChoices = privateMode
    ? (selected ? [selected] : privateChoices).filter((s) => s?.lat && s?.lng)
    : [];

  const points = useMemo(() => {
    const p = route.map((s) => [s.lat, s.lng]);
    displayChoices.forEach((s) => p.push([s.lat, s.lng]));
    return p;
  }, [visited.length, privateMode, selected?.id, privateChoices.map((c) => c.id).join('|')]);

  return (
    <div className="card realMapCard">
      <div className="sectionHeader">
        <h3>{privateMode ? 'Din hemliga karta' : 'Galoppkartan'}</h3>
        <span>{visited.length ? `${visited.length} stopp` : 'Start'}</span>
      </div>

      <div className="leafletWrap">
        <MapContainer
          center={[current.lat, current.lng]}
          zoom={15}
          scrollWheelZoom={false}
          className="galoppenLeaflet"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Polyline
            positions={route.map((s) => [s.lat, s.lng])}
            pathOptions={{ weight: 5, opacity: 0.72 }}
          />

          <Marker position={[START.lat, START.lng]} icon={markerIcon('🏁', 'start')}>
            <Popup><strong>Tennstopet</strong><br />{START.address}</Popup>
          </Marker>

          {visitedStops
            .filter((s) => s.id !== START.id)
            .map((s, i) => (
              <Marker
                key={`${s.id}-${i}`}
                position={[s.lat, s.lng]}
                icon={markerIcon(String(i + 2), s.id === current.id ? 'current' : 'visited')}
              >
                <Popup>
                  <strong>{s.name}</strong><br />
                  {s.address}<br />
                  <small>{s.type}</small>
                </Popup>
              </Marker>
            ))}

          {displayChoices.map((s, i) => (
            <Marker
              key={`private-${s.id}`}
              position={[s.lat, s.lng]}
              icon={markerIcon(selected ? '★' : String.fromCharCode(65 + i), 'choice')}
            >
              <Popup>
                <strong>{s.name}</strong><br />
                {s.address}<br />
                <small>🚶 ca {s.mins} min · {s.type}</small>
              </Popup>
            </Marker>
          ))}

          <FitToPoints points={points} />
        </MapContainer>
      </div>

      <div className="mapStatus">
        {privateMode ? (
          selected ? (
            <>
              <strong>🏇 Led gruppen hit</strong>
              <span>{selected.name} · {selected.address}</span>
            </>
          ) : (
            <>
              <strong>🤫 Bara du ser alternativen</strong>
              <span>Välj nästa stopp. De andra ser endast var Galoppen varit.</span>
            </>
          )
        ) : (
          <>
            <strong>📍 Ni är här nu</strong>
            <span>{current.name}</span>
            {phase === 'riding' && currentRider && (
              <small>🏇 {currentRider.nickname} leder vidare till ett hemligt stopp.</small>
            )}
          </>
        )}
      </div>
      <p className="tiny muted">
        {privateMode
          ? 'Alternativen på den här kartan är privata för kvällens ryttare.'
          : 'Kartan visar bara stopp som redan är besökta. Nästa destination hålls hemlig.'}
      </p>
    </div>
  );
}
