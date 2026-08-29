'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { START, distanceM } from '../../lib/stops';

function markerIcon(label, kind = 'visited') {
  return L.divIcon({
    className: 'galoppen-leaflet-icon',
    html: `<div class="mapPin ${kind}">${label}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19],
  });
}

function beerMarkerIcon(number, current = false) {
  return L.divIcon({
    className: 'galoppen-leaflet-icon',
    html: `<div class="beerMapPin ${current ? 'current' : ''}"><span class="beerEmoji">🍺</span><span class="beerStopNo">${number}</span></div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21],
  });
}

function gpsMarkerIcon() {
  return L.divIcon({
    className: 'galoppen-leaflet-icon',
    html: '<div class="gpsPin"><span></span></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function FitToPoints({ points, fitKey }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [34, 34], maxZoom: 16 });
  }, [map, fitKey]); // intentionally not every GPS tick

  return null;
}

function FollowGps({ position, enabled }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !position) return;
    map.panTo(position, { animate: true, duration: 0.5 });
  }, [map, enabled, position?.[0]?.toFixed(4), position?.[1]?.toFixed(4)]);

  return null;
}

function formatDistance(meters) {
  if (!Number.isFinite(meters)) return '';
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export default function GaloppenMap({
  visited = [],
  currentRider = null,
  phase = '',
  privateChoices = [],
  selected = null,
  privateMode = false,
}) {
  const [gps, setGps] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(true);
  const [walkingRoute, setWalkingRoute] = useState([]);
  const [routeMeta, setRouteMeta] = useState(null);
  const [routeSource, setRouteSource] = useState('');

  const visitedStops = visited.map((v) => v.stop).filter((s) => s?.lat && s?.lng);
  const historyRoute = [START, ...visitedStops.filter((s) => s.id !== START.id)];
  const current = visitedStops[visitedStops.length - 1] || START;

  const displayChoices = privateMode
    ? (selected ? [selected] : privateChoices).filter((s) => s?.lat && s?.lng)
    : [];

  const requestGps = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsLoading(false);
      setGpsError('GPS stöds inte av den här webbläsaren.');
      return () => {};
    }

    setGpsLoading(true);
    setGpsError('');

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsLoading(false);
        setGpsError('');
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError('Tillåt platsåtkomst för att visa din position och vägvisning.');
        } else {
          setGpsError('Kunde inte läsa din GPS-position just nu.');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const cleanup = requestGps();
    return cleanup;
  }, [requestGps]);

  const gpsPosition = gps ? [gps.lat, gps.lng] : null;

  // Real walking route on the leader's private map, based on the phone's live GPS.
  // Uses OpenStreetMap.de's public foot-routing backend. Falls back to a guide line.
  const routeOriginKey = gps
    ? `${gps.lat.toFixed(4)},${gps.lng.toFixed(4)}`
    : '';

  useEffect(() => {
    let cancelled = false;

    if (!privateMode || !selected?.lat || !selected?.lng || !gps) {
      setWalkingRoute([]);
      setRouteMeta(null);
      setRouteSource('');
      return;
    }

    const controller = new AbortController();
    const url =
      `https://routing.openstreetmap.de/routed-foot/route/v1/driving/` +
      `${gps.lng},${gps.lat};${selected.lng},${selected.lat}` +
      `?overview=full&geometries=geojson&steps=false`;

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('routing failed');
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const route = data?.routes?.[0];
        const coords = route?.geometry?.coordinates || [];
        if (!coords.length) throw new Error('no route');

        setWalkingRoute(coords.map(([lng, lat]) => [lat, lng]));
        setRouteMeta({
          distance: route.distance,
          duration: route.duration,
        });
        setRouteSource('walking');
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return;
        const direct = [
          [gps.lat, gps.lng],
          [selected.lat, selected.lng],
        ];
        setWalkingRoute(direct);
        setRouteMeta({
          distance: distanceM(gps, selected),
          duration: null,
        });
        setRouteSource('guide');
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [privateMode, selected?.id, selected?.lat, selected?.lng, routeOriginKey]);

  const points = useMemo(() => {
    const p = historyRoute.map((s) => [s.lat, s.lng]);
    displayChoices.forEach((s) => p.push([s.lat, s.lng]));
    if (gpsPosition) p.push(gpsPosition);
    return p;
  }, [
    visited.length,
    privateMode,
    selected?.id,
    privateChoices.map((c) => c.id).join('|'),
    !!gpsPosition,
  ]);

  const fitKey = `${visited.length}|${privateMode}|${selected?.id || ''}|${privateChoices.map((c) => c.id).join('|')}|${gps ? 'gps' : 'nogps'}`;

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

          {/* Historical Galopp route */}
          <Polyline
            positions={historyRoute.map((s) => [s.lat, s.lng])}
            pathOptions={{ weight: 4, opacity: 0.55 }}
          />

          {/* Live walking guidance for the current rider only */}
          {privateMode && selected && walkingRoute.length > 1 && (
            <Polyline
              positions={walkingRoute}
              pathOptions={{
                weight: 7,
                opacity: 0.9,
                dashArray: routeSource === 'guide' ? '12 10' : undefined,
              }}
            />
          )}

          <Marker position={[START.lat, START.lng]} icon={markerIcon('🏁', 'start')}>
            <Popup><strong>Tennstopet</strong><br />{START.address}</Popup>
          </Marker>

          {visitedStops
            .filter((s) => s.id !== START.id)
            .map((s, i) => (
              <Marker
                key={`${s.id}-${i}`}
                position={[s.lat, s.lng]}
                icon={beerMarkerIcon(i + 2, s.id === current.id)}
              >
                <Popup>
                  <strong>🍺 Stopp {i + 2}: {s.name}</strong><br />
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

          {gpsPosition && (
            <Marker position={gpsPosition} icon={gpsMarkerIcon()}>
              <Popup>
                <strong>📍 Din GPS-position</strong><br />
                <small>Noggrannhet cirka {Math.round(gps.accuracy || 0)} m</small>
              </Popup>
            </Marker>
          )}

          <FitToPoints points={points} fitKey={fitKey} />
          <FollowGps position={gpsPosition} enabled={privateMode && !!selected} />
        </MapContainer>
      </div>

      <div className="mapStatus">
        {privateMode ? (
          selected ? (
            <>
              <strong>🧭 Vägvisning till nästa stopp</strong>
              <span>{selected.name} · {selected.address}</span>
              {gps && routeMeta && (
                <small>
                  📍 Från din GPS · {formatDistance(routeMeta.distance)}
                  {routeMeta.duration ? ` · cirka ${Math.max(1, Math.round(routeMeta.duration / 60))} min gång` : ''}
                </small>
              )}
              {!gps && <small>Aktivera GPS för vägvisning från din position.</small>}
              {routeSource === 'guide' && <small>Streckad linje visar riktningen. Gatunavigering kan öppnas nedan.</small>}
            </>
          ) : (
            <>
              <strong>🤫 Bara du ser alternativen</strong>
              <span>Välj nästa stopp. De andra ser endast var Galoppen varit.</span>
              {gps && <small>📍 Din GPS-position visas på kartan.</small>}
            </>
          )
        ) : (
          <>
            <strong>📍 Galoppens senaste stopp</strong>
            <span>{current.name}</span>
            {gps && <small>🔵 Din egen GPS-position visas på kartan.</small>}
            {phase === 'riding' && currentRider && (
              <small>🏇 {currentRider.nickname} leder vidare till ett hemligt stopp.</small>
            )}
          </>
        )}
      </div>

      {gpsLoading && <div className="gpsInfo">📡 Söker din GPS-position…</div>}
      {gpsError && (
        <div className="gpsInfo gpsWarning">
          <span>{gpsError}</span>
          <button type="button" className="gpsRetry" onClick={requestGps}>AKTIVERA GPS</button>
        </div>
      )}

      <p className="tiny muted">
        {privateMode
          ? selected
            ? 'Vägvisningen och destinationen syns bara på ryttarens telefon.'
            : 'Alternativen på den här kartan är privata för kvällens ryttare.'
          : '🍺 markerar stopp ni redan har besökt. Nästa destination hålls hemlig.'}
      </p>
    </div>
  );
}
