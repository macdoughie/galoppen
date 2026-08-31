import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { START, nextChoices } from './stops';

export function normalizeRideName(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9åäö]+/gi, '-').replace(/^-+|-+$/g, '');
}

function makeJoinCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

async function uniqueJoinCode() {
  for (let i = 0; i < 8; i += 1) {
    const joinCode = makeJoinCode();
    const q = query(collection(db, 'galoppenSessions'), where('joinCode', '==', joinCode));
    const snap = await getDocs(q);
    if (snap.empty) return joinCode;
  }
  throw new Error('Kunde inte skapa en unik anslutningskod. Försök igen.');
}

export function watchActiveSessions(callback) {
  return onSnapshot(collection(db, 'galoppenSessions'), (snap) => {
    const sessions = snap.docs
      .map((d) => ({ ...d.data(), rideId: d.id }))
      .filter((s) => s.status === 'lobby' || s.status === 'playing')
      .sort((a, b) => {
        const at = a.createdAt?.seconds || 0;
        const bt = b.createdAt?.seconds || 0;
        return bt - at;
      });
    callback(sessions);
  });
}

export function sessionRef(rideId) {
  return doc(db, 'galoppenSessions', rideId);
}
export function playerRef(rideId, uid) {
  return doc(db, 'galoppenSessions', rideId, 'players', uid);
}
export function privateRef(rideId, uid) {
  return doc(db, 'galoppenSessions', rideId, 'private', uid);
}

export async function findFinishedSession(rideName) {
  const rideId = normalizeRideName(rideName);
  if (!rideId) throw new Error('Skriv Galoppens namn.');

  const snap = await getDoc(sessionRef(rideId));
  if (!snap.exists()) throw new Error('Jag hittar ingen Galopp med det namnet.');

  const session = snap.data();
  if (session.status !== 'finished' && session.phase !== 'finished') {
    throw new Error('Den Galoppen är inte avslutad ännu. Använd Join the ride om du vill ansluta.');
  }

  return rideId;
}

export async function createSession({ rideName, capacity, user, nickname }) {
  const baseId = normalizeRideName(rideName);
  if (!baseId) throw new Error('Ge Galoppen ett namn.');

  // Allow the same display name on different nights by making the Firestore id unique.
  const rideId = `${baseId}-${Date.now().toString(36)}`;
  const ref = sessionRef(rideId);
  const joinCode = await uniqueJoinCode();

  await setDoc(ref, {
    rideId, rideName: rideName.trim(), joinCode, capacity,
    status: 'lobby', ownerUid: user.uid, hostUid: user.uid,
    currentRiderUid: null, currentPayerUid: null, currentStop: START,
    visited: [], foodPromptAt: 5, foodMode: false,
    createdAt: serverTimestamp(), startedAt: null,
  });
  await setDoc(playerRef(rideId, user.uid), {
    uid: user.uid, nickname: nickname.trim(), joinedAt: serverTimestamp(),
    active: true, host: true, beerFinishedStop: 0,
  });
  return rideId;
}

export async function joinSession({ joinCode, user, nickname }) {
  const cleanCode = (joinCode || '').trim().toUpperCase();
  if (!cleanCode) throw new Error('Skriv anslutningskoden.');

  const q = query(collection(db, 'galoppenSessions'), where('joinCode', '==', cleanCode));
  const matches = await getDocs(q);
  if (matches.empty) throw new Error('Jag hittar ingen Galopp med den koden.');

  const docSnap = matches.docs[0];
  const rideId = docSnap.id;
  const session = docSnap.data();

  if (session.status === 'finished' || session.phase === 'finished') {
    throw new Error('Galoppen är redan avslutad.');
  }

  const existingPlayer = await getDoc(playerRef(rideId, user.uid));
  if (existingPlayer.exists()) return rideId;

  const currentPlayersSnap = await getDocs(collection(db, 'galoppenSessions', rideId, 'players'));
  const activeCount = currentPlayersSnap.docs
    .map((d) => d.data())
    .filter((p) => p.active !== false).length;

  if (session.capacity && activeCount >= session.capacity) {
    throw new Error('Galoppen är full.');
  }

  const alreadyStarted = session.status === 'playing';
  const currentStopNumber = (session.visited || []).length;

  await setDoc(playerRef(rideId, user.uid), {
    uid: user.uid,
    nickname: nickname.trim(),
    joinedAt: serverTimestamp(),
    active: true,
    host: false,
    joinedLate: alreadyStarted,
    joinedAtStop: currentStopNumber,
    beerFinishedStop: currentStopNumber,
  });

  return rideId;
}

export function watchSession(code, callback) {
  return onSnapshot(sessionRef(code), (snap) => callback(snap.exists() ? snap.data() : null));
}

export function watchPlayers(code, callback) {
  return onSnapshot(collection(db, 'galoppenSessions', code, 'players'), (snap) => {
    const players = snap.docs.map((d) => d.data());
    players.sort((a, b) => (a.joinedAt?.seconds || 0) - (b.joinedAt?.seconds || 0));
    callback(players);
  });
}

export function watchPrivate(code, uid, callback) {
  return onSnapshot(privateRef(code, uid), (snap) => callback(snap.exists() ? snap.data() : null));
}

export async function startGame({ code, players, hostUid }) {
  if (players.length < 2) throw new Error('Minst två ryttare behövs.');
  const hostIndex = players.findIndex((p) => p.uid === hostUid);
  if (hostIndex < 0) throw new Error('Hosten finns inte bland deltagarna.');

  await updateDoc(sessionRef(code), {
    status: 'playing',
    hostUid,
    currentPayerUid: hostUid,
    currentRiderUid: hostUid,
    currentStop: START,
    visited: [],
    phase: 'awaitingCheckIn',
    pendingFoodPrompt: false,
    startedAt: serverTimestamp(),
  });
}

function getNextRider(players, currentPayerUid) {
  const activePlayers = players.filter((p) => p.active !== false);
  if (!activePlayers.length) return null;

  const currentIndex = activePlayers.findIndex((p) => p.uid === currentPayerUid);
  if (currentIndex < 0) return activePlayers[0];
  return activePlayers[(currentIndex + 1) % activePlayers.length];
}

export async function prepareNextLeg({ code, session, players, riderOverride = null }) {
  const rider = riderOverride || getNextRider(players, session.currentPayerUid);
  if (!rider) throw new Error('Kan inte hitta nästa ryttare.');

  const visitedIds = (session.visited || []).map((v) => v.stop.id);
  const choices = nextChoices(session.currentStop, visitedIds, { foodMode: !!session.foodMode });

  await setDoc(privateRef(code, rider.uid), {
    riderUid: rider.uid,
    choices,
    selected: null,
    phase: 'choose',
    foodMode: !!session.foodMode,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(sessionRef(code), {
    currentRiderUid: rider.uid,
    phase: 'riding',
    pendingFoodPrompt: false,
  });
}

export async function checkInStart({ code, session, players, leader }) {
  if (session.phase !== 'awaitingCheckIn') return;
  if (leader.uid !== session.currentPayerUid) {
    throw new Error('Bara den som leder rundan kan markera att rundan är beställd.');
  }

  const entry = {
    stop: START,
    payerUid: leader.uid,
    payerName: leader.nickname,
    host: true,
    timeIso: new Date().toISOString(),
  };

  const nextVisited = [entry];
  const nextRider = getNextRider(players, leader.uid);
  const shouldAskFood = nextVisited.length >= (session.foodPromptAt || 5);

  await updateDoc(sessionRef(code), {
    visited: nextVisited,
    currentStop: START,
    currentPayerUid: leader.uid,
    currentRiderUid: nextRider?.uid || null,
    phase: 'drinking',
    pendingFoodPrompt: shouldAskFood,
  });
}

export async function markBeerFinished({ code, session, players, uid }) {
  const stopNumber = (session.visited || []).length;
  if (!stopNumber || session.phase !== 'drinking') return;

  const nextRider = getNextRider(players, session.currentPayerUid);
  if (!nextRider) throw new Error('Kan inte hitta nästa ryttare.');

  let everyoneFinished = false;

  const activePlayers = players.filter((p) => p.active !== false);

  await runTransaction(db, async (tx) => {
    const refs = activePlayers.map((p) => playerRef(code, p.uid));
    const snaps = [];
    for (const ref of refs) {
      snaps.push(await tx.get(ref));
    }

    const myIndex = activePlayers.findIndex((p) => p.uid === uid);
    if (myIndex < 0) throw new Error('Du finns inte bland ryttarna.');

    const mine = snaps[myIndex]?.data() || {};
    if ((mine.beerFinishedStop || 0) < stopNumber) {
      tx.update(refs[myIndex], {
        beerFinishedStop: stopNumber,
        beerFinishedAt: serverTimestamp(),
      });
    }

    everyoneFinished = snaps.every((snap, index) => {
      if (index === myIndex) return true;
      const data = snap.data() || {};
      return (data.beerFinishedStop || 0) >= stopNumber;
    });

    if (everyoneFinished) {
      tx.update(sessionRef(code), {
        phase: session.pendingFoodPrompt ? 'food' : 'preparingNext',
        currentRiderUid: nextRider.uid,
      });
    }
  });

  if (!everyoneFinished) return;

  if (session.pendingFoodPrompt) return;

  await prepareNextLeg({
    code,
    session: { ...session, phase: 'preparingNext' },
    players,
    riderOverride: nextRider,
  });
}

export async function leaveRide({ code, session, players, uid }) {
  const leaving = players.find((p) => p.uid === uid);
  if (!leaving || leaving.active === false) return;

  const activePlayers = players.filter((p) => p.active !== false);
  const stopNumber = (session.visited || []).length;
  const isLastActiveRider = activePlayers.length === 1;

  await updateDoc(playerRef(code, uid), {
    active: false,
    leftAt: serverTimestamp(),
    leftAfterStop: stopNumber,
    beersAtCheckout: leaving.beerFinishedStop || 0,
  });

  // If the final active rider leaves, finish and save the ride automatically.
  if (isLastActiveRider) {
    const finishedAt = new Date().toISOString();
    const visited = session.visited || [];

    const paymentStats = players.reduce((acc, p) => {
      acc[p.uid] = visited.filter((v) => v.payerUid === p.uid).length;
      return acc;
    }, {});

    await updateDoc(sessionRef(code), {
      status: 'finished',
      phase: 'finished',
      currentRiderUid: null,
      finishedAt,
      savedAt: serverTimestamp(),
      summary: {
        rideName: session.rideName || code,
        totalStops: visited.length,
        startedAt: session.startedAt || null,
        finishedAt,
        hostUid: session.hostUid,
        playerCount: players.length,
        paymentStats,
        endedBecauseLastRiderLeft: true,
      },
    });
    return;
  }

  const remainingPlayers = players.filter((p) => p.uid !== uid && p.active !== false);
  const nextRider = getNextRider(
    remainingPlayers,
    session.currentPayerUid === uid ? uid : session.currentPayerUid
  );

  // If the rider who leaves was next/current rider, move the turn forward.
  if (session.currentRiderUid === uid && nextRider) {
    await updateDoc(sessionRef(code), {
      currentRiderUid: nextRider.uid,
    });

    if (session.phase === 'riding' || session.phase === 'preparingNext') {
      await prepareNextLeg({
        code,
        session,
        players: remainingPlayers,
        riderOverride: nextRider,
      });
    }
  }
}

export async function selectDestination({ code, uid, choice }) {
  await updateDoc(privateRef(code, uid), {
    selected: choice,
    phase: 'navigate',
    updatedAt: serverTimestamp(),
  });
}

export async function arriveAtDestination({ code, session, players, rider, selected }) {
  if (!selected) throw new Error('Ingen destination är vald.');
  if (rider.uid !== session.currentRiderUid) {
    throw new Error('Bara den ledande ryttaren kan markera att rundan är beställd.');
  }

  const entry = {
    stop: selected,
    payerUid: rider.uid,
    payerName: rider.nickname,
    host: false,
    foodStop: !!session.foodMode,
    timeIso: new Date().toISOString(),
  };

  const nextVisited = [...(session.visited || []), entry];
  const nextRider = getNextRider(players, rider.uid);
  const shouldAskFood = nextVisited.length >= (session.foodPromptAt || 5);

  await updateDoc(sessionRef(code), {
    currentStop: selected,
    currentPayerUid: rider.uid,
    currentRiderUid: nextRider?.uid || null,
    visited: arrayUnion(entry),
    phase: 'drinking',
    pendingFoodPrompt: shouldAskFood,
    foodMode: false,
  });

  await setDoc(
    privateRef(code, rider.uid),
    { phase: 'done', selected: null, choices: [] },
    { merge: true }
  );
}

export async function answerFood({ code, session, players, wantsFood }) {
  const nextRider = getNextRider(players, session.currentPayerUid);
  if (!nextRider) throw new Error('Kan inte hitta nästa ryttare.');

  const updatedSession = {
    ...session,
    foodMode: wantsFood,
    foodPromptAt: wantsFood ? 9999 : (session.foodPromptAt || 5) + 2,
    pendingFoodPrompt: false,
  };

  await updateDoc(sessionRef(code), {
    foodMode: wantsFood,
    foodPromptAt: updatedSession.foodPromptAt,
    pendingFoodPrompt: false,
  });

  await prepareNextLeg({
    code,
    session: updatedSession,
    players,
    riderOverride: nextRider,
  });
}

export async function finishGame({ code, session, players }) {
  const finishedAt = new Date().toISOString();
  const visited = session.visited || [];

  const paymentStats = players.reduce((acc, p) => {
    acc[p.uid] = visited.filter((v) => v.payerUid === p.uid).length;
    return acc;
  }, {});

  await updateDoc(sessionRef(code), {
    status: 'finished',
    phase: 'finished',
    finishedAt,
    savedAt: serverTimestamp(),
    summary: {
      rideName: session.rideName || code,
      totalStops: visited.length,
      startedAt: session.startedAt || null,
      finishedAt,
      hostUid: session.hostUid,
      playerCount: players.length,
      paymentStats,
    },
  });
}
