'use client';

import { useEffect, useMemo, useState } from 'react';
import { ensureAnonymousUser } from '../lib/firebase';
import {
  answerFood,
  arriveAtDestination,
  checkInStart,
  createSession,
  finishGame,
  joinSession,
  leaveRide,
  markBeerFinished,
  selectDestination,
  startGame,
  watchPlayers,
  watchPrivate,
  watchSession,
} from '../lib/game';
import './globals.css';

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}

export default function Page() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('home');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [rideName, setRideName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [privateData, setPrivateData] = useState(null);
  const [hostUid, setHostUid] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ensureAnonymousUser().then(setUser).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!code || !user) return;
    const offSession = watchSession(code, setSession);
    const offPlayers = watchPlayers(code, setPlayers);
    const offPrivate = watchPrivate(code, user.uid, setPrivateData);
    return () => { offSession(); offPlayers(); offPrivate(); };
  }, [code, user]);

  useEffect(() => {
    if (players.length && !hostUid) setHostUid(players[0].uid);
  }, [players, hostUid]);

  const me = players.find((p) => p.uid === user?.uid);
  const activePlayers = players.filter((p) => p.active !== false);
  const hasLeftRide = me?.active === false;
  const currentRider = players.find((p) => p.uid === session?.currentRiderUid);
  const currentPayer = players.find((p) => p.uid === session?.currentPayerUid);
  const amOwner = session?.ownerUid === user?.uid;
  const amRider = session?.currentRiderUid === user?.uid;
  const visited = session?.visited || [];

  const paymentStats = useMemo(() => {
    const stats = Object.fromEntries(players.map((p) => [p.uid, 0]));
    visited.forEach((v) => { if (stats[v.payerUid] !== undefined) stats[v.payerUid] += 1; });
    return stats;
  }, [players, visited]);

  const beerStats = useMemo(() => {
    return Object.fromEntries(
      players.map((p) => [p.uid, Math.max(0, p.beerFinishedStop || 0)])
    );
  }, [players]);


  async function run(fn) {
    try { setBusy(true); setError(''); await fn(); }
    catch (e) { setError(e.message || String(e)); }
    finally { setBusy(false); }
  }

  async function createGame() {
    if (!user || !nickname.trim() || !rideName.trim() || capacity < 2) return;
    await run(async () => {
      const rideId = await createSession({ rideName, capacity, user, nickname });
      setCode(rideId);
      setMode('game');
    });
  }

  async function joinGame() {
    if (!user || !nickname.trim() || !rideName.trim()) return;
    await run(async () => {
      const rideId = await joinSession({ rideName, user, nickname });
      setCode(rideId);
      setMode('game');
    });
  }

  async function leaderCheckInStart() {
    await run(() => checkInStart({ code, session, players, leader: me }));
  }

  async function beerFinished() {
    await run(() => markBeerFinished({ code, session, players, uid: user.uid }));
  }

  async function endRide() {
    const ok = window.confirm('Avsluta Galoppen och spara rundan?');
    if (!ok) return;
    await run(() => finishGame({ code, session, players }));
  }

  async function leaveGaloppen() {
    const ok = window.confirm('Vill du lämna Galoppen? Du tas bort ur turordningen men kan fortsätta följa kvällen. Om du är sista aktiva ryttaren avslutas och sparas Galoppen automatiskt.');
    if (!ok) return;
    await run(() => leaveRide({ code, session, players, uid: user.uid }));
  }

  async function choose(choice) {
    await run(() => selectDestination({ code, uid: user.uid, choice }));
  }

  async function arrived() {
    await run(() => arriveAtDestination({ code, session, players, rider: me, selected: privateData.selected }));
  }

  if (mode === 'home') {
    return (
      <main className="shell">
        <Header />
        <div className="card hero">
          <div className="horse">🏇🍺</div>
          <div className="h1">Galoppen</div>
          <p className="sub">En ryttare i taget. Ett hemligt stopp i taget.</p>
          <button className="btn primary" onClick={() => setMode('create')}>SKAPA GALOPP</button>
          <button className="btn secondary" onClick={() => setMode('join')}>JOIN THE RIDE</button>
        </div>
      </main>
    );
  }

  if (mode === 'create' || mode === 'join') {
    return (
      <main className="shell">
        <Header />
        <div className="card">
          <h2>{mode === 'create' ? 'Skapa kvällens Galopp' : 'Join the ride'}</h2>
          <input className="input" placeholder="Galoppens namn" value={rideName} onChange={(e) => setRideName(e.target.value)} />
          <input className="input" placeholder={mode === 'create' ? 'Hostens smeknamn' : 'Ditt smeknamn'} value={nickname} onChange={(e) => setNickname(e.target.value)} />
          {mode === 'create' && <div className="capacityBox"><div><strong>Antal platser</strong><span>inklusive host</span></div><div className="capacityControls"><button type="button" className="roundBtn" onClick={() => setCapacity(n => Math.max(2,n-1))}>−</button><strong>{capacity}</strong><button type="button" className="roundBtn" onClick={() => setCapacity(n => Math.min(20,n+1))}>+</button></div></div>}
          {error && <div className="errorBox">{error}</div>}
          <button className="btn primary" disabled={busy || !nickname.trim() || !rideName.trim()} onClick={mode === 'create' ? createGame : joinGame}>
            {busy ? '...' : mode === 'create' ? 'SKAPA GALOPPEN 🏇' : 'JOIN THE RIDE 🍺'}
          </button>
          <button className="btn ghost" onClick={() => setMode('home')}>Tillbaka</button>
        </div>
      </main>
    );
  }

  if (!session) return <main className="shell"><Header /><div className="card">Laddar Galoppen…</div></main>;

  if (session.status === 'lobby') {
    return (
      <main className="shell">
        <Header code={session?.rideName || code} />
        <div className="card">
          <div className="tiny">KVÄLLENS GALOPP</div>
          <div className="sessionCode">{session.rideName}</div>
          <p className="sub">Övriga öppnar appen, väljer <strong>Join the ride</strong> och skriver Galoppens namn.</p>
          <div className="lobbyCount"><strong>{players.length}/{session.capacity}</strong> ryttare anslutna</div>
        </div>

        <div className="card">
          <div className="sectionHeader"><h3>🏇 Ryttare</h3><span>{Math.max(0,(session.capacity || 0)-players.length)} platser kvar</span></div>
          <div className="joinedList">
            {players.map((p) => <div className="joined" key={p.uid}><span>🤠</span><strong>{p.nickname}</strong>{p.uid === user?.uid && <small>du</small>}</div>)}
          </div>
        </div>

        {amOwner ? (
          <div className="card">
            <h3>🎩 Du är kvällens host</h3>
            <p className="sub small">Du betalar första ölen på Tennstopet. Starta när alla är inne, eller tidigare om någon lämnar återbud.</p>
            <button className="btn primary" disabled={busy || players.length < 2} onClick={() => run(() => startGame({ code, players, hostUid: user.uid }))}>
              {players.length >= session.capacity ? 'STARTA GALOPPEN 🏇' : `STARTA ÄNDÅ (${players.length}/${session.capacity})`}
            </button>
          </div>
        ) : (
          <div className="card hero"><div className="horse">⏳</div><h3>Inväntar starten</h3><p className="sub">Hosten startar Galoppen när alla är inne.</p></div>
        )}
        {error && <div className="errorBox">{error}</div>}
      </main>
    );
  }

  if (session.status === 'finished') {
    return (
      <main className="shell"><Header code={session?.rideName || code} />
        <div className="card hero finishCard">
          <div className="horse">🏁</div>
          <div className="h1">Galoppen är över</div>
          <div className="savedBadge">✓ Rundans historik är sparad</div>
          <p className="sub">{visited.length} stopp genomförda</p>
        </div>
        <RiderBoard players={players} beerStats={beerStats} currentRiderUid={null} stopNumber={visited.length} finished />
        <History visited={visited} />
        <div className="card compact">
          <div className="sectionHeader"><h3>🍺 Betalda rundor</h3><span>{players.length} ryttare</span></div>
          <div className="statsGrid">
            {players.map((p) => (
              <div className="stat" key={p.uid}>
                <strong>{p.nickname}</strong>
                <span>🍺 {paymentStats[p.uid] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Aktuell ryttare får en unik privat vy på sin egen telefon.
  if (amRider && session.phase === 'riding' && privateData?.phase === 'choose') {
    return (
      <main className="shell"><Header code={session?.rideName || code} />
        <div className="card secret">
          <div className="lock">🎩</div>
          <h2>{me?.nickname}, du leder nästa etapp</h2>
          <div className="roleBox">
            <span>📍 Du väljer nästa stopp.</span>
            <span>🧭 Du leder gruppen dit.</span>
            <span>🍺 Du väljer vilken ölsort som beställs.</span>
            <span>💳 Du betalar rundan.</span>
          </div>
          {session.foodMode && <div className="foodFlag">🍽 Försök välja ett stopp som också fungerar för mat.</div>}
          <p className="sub">Bara du ser alternativen.</p>
          {(privateData.choices || []).map((choice, i) => (
            <div className="choice" key={choice.id}>
              <div className="tiny">ALTERNATIV {i + 1}</div>
              <h3>{choice.name}</h3>
              <div className="meta">🚶 cirka {choice.mins} min</div>
              <button className="btn primary" disabled={busy} onClick={() => choose(choice)}>VÄLJ DETTA STOPP</button>
            </div>
          ))}
        </div>
        <LeaveRideButton hasLeftRide={hasLeftRide} busy={busy} onLeave={leaveGaloppen} />
        {amOwner && !hasLeftRide && (
          <button className="btn danger endRideBtn" disabled={busy} onClick={endRide}>
            AVSLUTA & SPARA RUNDAN
          </button>
        )}
      </main>
    );
  }

  if (amRider && session.phase === 'riding' && privateData?.phase === 'navigate') {
    return (
      <main className="shell"><Header code={session?.rideName || code} />
        <div className="card secret">
          <div className="lock">🗺️</div>
          <h2>Du leder Galoppen</h2>
          <div className="choice destination">
            <div className="tiny">DIN HEMLIGA DESTINATION</div>
            <h3>{privateData.selected?.name}</h3>
            <div className="meta">🚶 cirka {privateData.selected?.mins} min</div>
          </div>
          <div className="roleBox"><strong>På nästa stopp</strong><span>🍺 Du väljer vilken ölsort ni beställer.</span><span>💳 Du betalar rundan.</span></div>
          <p className="sub">När ni kommit fram: beställ öl till hela sällskapet och betala rundan. Tryck sedan här.</p>
          <button className="btn primary" disabled={busy} onClick={arrived}>RUNDAN ÄR BESTÄLLD 🍺</button>
        </div>
        <LeaveRideButton hasLeftRide={hasLeftRide} busy={busy} onLeave={leaveGaloppen} />
        {amOwner && !hasLeftRide && (
          <button className="btn danger endRideBtn" disabled={busy} onClick={endRide}>
            AVSLUTA & SPARA RUNDAN
          </button>
        )}
      </main>
    );
  }

  // Alla andra ser bara vem som leder, aldrig destinationen.
  if (!amRider && session.phase === 'riding') {
    return (
      <main className="shell"><Header code={session?.rideName || code} />
        <div className="card secret">
          <div className="lock">🔒</div>
          <h2>Följ {currentRider?.nickname} 🏇</h2>
          <p className="sub"><strong>{currentRider?.nickname}</strong> leder er till nästa hemliga stopp och betalar nästa runda.</p>
          <div className="roleBox"><span>🧭 Följ ryttaren.</span><span>🍺 Ryttaren väljer ölsort.</span><span>💳 Ryttaren betalar nästa runda.</span><span>📲 När rundan är beställd får du nästa uppgift.</span></div>
        </div>
        <History visited={visited} compact />
        <LeaveRideButton hasLeftRide={hasLeftRide} busy={busy} onLeave={leaveGaloppen} />
        {amOwner && !hasLeftRide && (
          <button className="btn danger endRideBtn" disabled={busy} onClick={endRide}>
            AVSLUTA & SPARA RUNDAN
          </button>
        )}
      </main>
    );
  }

  if (session.phase === 'drinking') {
    const stopNumber = visited.length;
    const beerIsFinished = (me?.beerFinishedStop || 0) >= stopNumber;
    const finishedCount = activePlayers.filter((p) => (p.beerFinishedStop || 0) >= stopNumber).length;
    const waitingFor = activePlayers.filter((p) => (p.beerFinishedStop || 0) < stopNumber);
    const waitingNames = waitingFor.map((p) => p.nickname);
    const allFinished = activePlayers.length > 0 && finishedCount === activePlayers.length;
    const nextRider = currentRider;

    return (
      <main className="shell">
        <Header code={session?.rideName || code} />
        <div className="card currentCard">
          <div className="topline">
            <span className="tiny">STOPP {stopNumber}</span>
            <span className="statusPill">🍺 Rundan är igång · {finishedCount}/{activePlayers.length} klara</span>
          </div>
          <div className="center">
            <div className="beerIcon">🍺</div>
            <div className="bigstop">{session.currentStop?.name}</div>
            <span className="payer">
              {visited[visited.length - 1]?.host
                ? `🎩 ${currentPayer?.nickname} är host och betalar`
                : `${currentPayer?.nickname} betalar rundan`}
            </span>

            {hasLeftRide ? (
              <div className="spectatorBox">
                <div className="horse">👀</div>
                <h3>Du följer Galoppen</h3>
                <p className="sub">Du har lämnat turordningen men kan fortsätta följa resten av kvällen.</p>
              </div>
            ) : !beerIsFinished ? (
              <>
                <p className="sub">Alla aktiva ryttare måste markera när den egna ölen är uppdrucken. Nästa etapp öppnas först när samtliga är klara.</p>
                <button className="btn primary" disabled={busy} onClick={beerFinished}>ÖLEN ÄR SLUT 🍺</button>
              </>
            ) : !allFinished ? (
              <div className="readyBox">
                <div className="horse">✓</div>
                <h3>Du är klar ✓</h3>
                <p className="sub">
                  <strong>{finishedCount}/{activePlayers.length}</strong> är klara.
                  {waitingNames.length > 0 && <> Inväntar <strong>{waitingNames.join(', ')}</strong>.</>}
                </p>
              </div>
            ) : (
              <div className="readyBox">
                <div className="horse">🏇</div>
                <h3>Alla är klara 🏁</h3>
                <p className="sub"><strong>{nextRider?.nickname}</strong> tar över som nästa ryttare.</p>
              </div>
            )}
          </div>
        </div>

        <RiderBoard
          players={players}
          beerStats={beerStats}
          currentRiderUid={session.currentRiderUid}
          stopNumber={stopNumber}
        />

        <LeaveRideButton hasLeftRide={hasLeftRide} busy={busy} onLeave={leaveGaloppen} />
        {amOwner && !hasLeftRide && (
          <button className="btn danger endRideBtn" disabled={busy} onClick={endRide}>
            AVSLUTA & SPARA RUNDAN
          </button>
        )}
        <History visited={visited} compact />
      </main>
    );
  }

  if (session.phase === 'food') {
    if (amRider) {
      return (
        <main className="shell"><Header code={session?.rideName || code} />
          <div className="card foodCard"><div className="foodEmoji">🍔</div><h2>Dags för lite käk?</h2><p className="sub">Ni har gjort <strong>{visited.length} stopp</strong>. Vill du som nästa ryttare få alternativ där det också går att äta?</p>
            <button className="btn primary" disabled={busy} onClick={() => run(() => answerFood({ code, session, players, wantsFood: true }))}>🍽 JA, GÄRNA MAT</button>
            <button className="btn secondary" disabled={busy} onClick={() => run(() => answerFood({ code, session, players, wantsFood: false }))}>🏇 NEJ, FULL GALOPP</button>
          </div>
          <LeaveRideButton hasLeftRide={hasLeftRide} busy={busy} onLeave={leaveGaloppen} />
          {amOwner && !hasLeftRide && (
            <button className="btn danger endRideBtn" disabled={busy} onClick={endRide}>
              AVSLUTA & SPARA RUNDAN
            </button>
          )}
        </main>
      );
    }
    return (
      <main className="shell"><Header code={session?.rideName || code} />
        <div className="card hero"><div className="horse">🍔</div><h3>Nästa ryttare tar ställning till mat</h3><p className="sub"><strong>{currentRider?.nickname}</strong> avgör om nästa stopp ska fungera för käk.</p></div>
        <LeaveRideButton hasLeftRide={hasLeftRide} busy={busy} onLeave={leaveGaloppen} />
        {amOwner && !hasLeftRide && (
          <button className="btn danger endRideBtn" disabled={busy} onClick={endRide}>
            AVSLUTA & SPARA RUNDAN
          </button>
        )}
        <History visited={visited} compact />
      </main>
    );
  }

  // Vid Tennstopet är hosten den första som leder och den enda som checkar in.
  if (session.phase === 'awaitingCheckIn') {
    const amLeader = session.currentPayerUid === user?.uid;
    return (
      <main className="shell">
        <Header code={session?.rideName || code} />
        <div className="card currentCard">
          <div className="topline"><span className="tiny">START</span><span className="statusPill">🍺 Tennstopet</span></div>
          <div className="center">
            <div className="beerIcon">🍺</div>
            <div className="bigstop">{session.currentStop?.name}</div>
            {amLeader ? (
              <>
                <span className="payer">🎩 Du är kvällens host och betalar första rundan</span>
                <p className="sub">Beställ öl till hela sällskapet och betala första rundan. Tryck sedan här.</p>
                <button className="btn primary" disabled={busy} onClick={leaderCheckInStart}>RUNDAN ÄR BESTÄLLD 🍺</button>
              </>
            ) : (
              <>
                <span className="payer">🎩 {currentPayer?.nickname} är kvällens host</span>
                <p className="sub">Hosten beställer och betalar första rundan. När den är beställd går Galoppen vidare.</p>
              </>
            )}
          </div>
        </div>
        <LeaveRideButton hasLeftRide={hasLeftRide} busy={busy} onLeave={leaveGaloppen} />
        {amOwner && !hasLeftRide && (
          <button className="btn danger endRideBtn" disabled={busy} onClick={endRide}>
            AVSLUTA & SPARA RUNDAN
          </button>
        )}
      </main>
    );
  }

  return (
    <main className="shell">
      <Header code={session?.rideName || code} />
      <div className="card hero">
        <div className="horse">⏳</div>
        <h3>Synkar Galoppen…</h3>
        <p className="sub">Väntar på nästa steg.</p>
      </div>
      {amOwner && (
          <button className="btn danger endRideBtn" disabled={busy} onClick={endRide}>
            AVSLUTA & SPARA RUNDAN
          </button>
        )}
      {error && <div className="errorBox">{error}</div>}
    </main>
  );
}

function RiderBoard({ players, beerStats, currentRiderUid, stopNumber, finished = false }) {
  return (
    <div className="card riderCard">
      <div className="sectionHeader">
        <h3>🏇 Ryttarna</h3>
        <span>turordning</span>
      </div>
      <div className="riderList">
        {players.map((p, index) => {
          const beers = beerStats[p.uid] || 0;
          const doneThisStop = stopNumber > 0 && beers >= stopNumber;
          const checkedOut = p.active === false;
          const isNext = !checkedOut && currentRiderUid === p.uid;
          return (
            <div className={`riderRow ${isNext ? 'nextRider' : ''}`} key={p.uid}>
              <div className="riderOrder">{index + 1}</div>
              <div className="riderName">
                <strong>{p.nickname}</strong>
                <span>
                  {finished
                    ? 'Galoppen avslutad'
                    : checkedOut
                      ? 'Har lämnat Galoppen · följer kvällen'
                      : isNext
                        ? 'Nästa ryttare'
                        : doneThisStop
                          ? 'Klar'
                          : 'Dricker sin öl'}
                </span>
              </div>
              <div className="beerCount">🍺 {beers}</div>
              {!finished && <div className={`drinkDot ${checkedOut ? 'left' : doneThisStop ? 'done' : ''}`}>{checkedOut ? '–' : doneThisStop ? '✓' : '…'}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaveRideButton({ hasLeftRide, busy, onLeave }) {
  if (hasLeftRide) {
    return <div className="spectatorNote">👀 Du har lämnat Galoppen men följer fortfarande kvällen.</div>;
  }
  return (
    <button className="btn leaveRideBtn" disabled={busy} onClick={onLeave}>
      LÄMNA GALOPPEN
    </button>
  );
}

function Header({ code }) {
  return <div className="brand"><div className="logo">🏇 GALOPPEN</div><div className="badge">{code || 'Stockholm'}</div></div>;
}

function MapCard({ visited }) {
  const pins = visited.map((entry, i) => ({ entry, left: 12 + (i * 53) % 82, top: 22 + (i * 37) % 68 }));
  return <div className="card"><div className="sectionHeader"><h3>🗺 Galoppkartan</h3><span>{visited.length} platser</span></div><div className="mapfake">{pins.map((p, i) => <span key={`${p.entry.stop.id}-${i}`} className="pin" style={{ left: `${p.left}%`, top: `${p.top}%` }}>{i === pins.length - 1 ? '📍' : '🍺'}</span>)}</div></div>;
}

function History({ visited, compact = false }) {
  return <div className="card"><div className="sectionHeader"><h3>🍺 Kvällens stopp</h3><span>{visited.length}</span></div><div className="historyList">{[...visited].reverse().map((entry, reverseIndex) => {
    const number = visited.length - reverseIndex;
    return <div className="historyItem" key={`${entry.stop.id}-${number}`}><div className="historyNo">{number}</div><div className="historyMain"><strong>{entry.stop.name}</strong><span>{entry.host ? `🎩 ${entry.payerName} · kvällens host` : `🍺 ${entry.payerName} betalade`}</span></div><div className="historyTime">{fmtTime(entry.timeIso)}</div></div>;
  })}</div>{!compact && visited.length === 0 && <p className="sub">Inga stopp ännu.</p>}</div>;
}
