import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { START, nextChoices } from './stops';

export function normalizeRideName(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9åäö]+/gi, '-').replace(/^-+|-+$/g, '');
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

export async function createSession({ rideName, capacity, user, nickname }) {
  const rideId = normalizeRideName(rideName);
  if (!rideId) throw new Error('Ge Galoppen ett namn.');
  const ref = sessionRef(rideId);
  const existing = await getDoc(ref);
  if (existing.exists()) throw new Error('Det finns redan en Galopp med det namnet.');

  await setDoc(ref, {
    rideId, rideName: rideName.trim(), capacity,
    status: 'lobby', ownerUid: user.uid, hostUid: user.uid,
    currentRiderUid: null, currentPayerUid: null, currentStop: START,
    visited: [], foodPromptAt: 5, foodMode: false,
    createdAt: serverTimestamp(), startedAt: null,
  });
  await setDoc(playerRef(rideId, user.uid), {
    uid: user.uid, nickname: nickname.trim(), joinedAt: serverTimestamp(),
    active: true, host: true,
  });
  return rideId;
}

export async function joinSession({ rideName, user, nickname }) {
  const rideId = normalizeRideName(rideName);
  const ref = sessionRef(rideId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Jag hittar ingen Galopp med det namnet.');
  if (snap.data().status !== 'lobby') throw new Error('Galoppen har redan startat.');

  const existingPlayer = await getDoc(playerRef(rideId, user.uid));
  if (existingPlayer.exists()) return rideId;

  await setDoc(playerRef(rideId, user.uid), {
    uid: user.uid, nickname: nickname.trim(), joinedAt: serverTimestamp(),
    active: true, host: false,
  });
  return rideId;
}

export function watchSession(code, callback) {
  return onSnapshot(sessionRef(code), (snap) => callback(snap.exists() ? snap.data() : null));
}

export function watchPlayers(code, callback) {
  return onSnapshot(collection(db, 'galoppenSessions', code, 'players'), (snap) => {
    const players = snap.docs.map((d) => d.data()).filter((p) => p.active !== false);
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
  const nextIndex = (hostIndex + 1) % players.length;
  const firstEntry = {
    stop: START,
    payerUid: hostUid,
    payerName: players[hostIndex].nickname,
    host: true,
    timeIso: new Date().toISOString(),
  };
  await updateDoc(sessionRef(code), {
    status: 'playing',
    hostUid,
    currentPayerUid: hostUid,
    currentRiderUid: players[nextIndex].uid,
    currentStop: START,
    visited: [firstEntry],
    startedAt: serverTimestamp(),
  });
}

export async function prepareNextLeg({ code, session, players }) {
  const currentPayerIndex = players.findIndex((p) => p.uid === session.currentPayerUid);
  const rider = players[(currentPayerIndex + 1) % players.length];
  const visitedIds = (session.visited || []).map((v) => v.stop.id);
  const choices = nextChoices(session.currentStop, visitedIds);

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
  });
}

export async function selectDestination({ code, uid, choice }) {
  await updateDoc(privateRef(code, uid), {
    selected: choice,
    phase: 'navigate',
    updatedAt: serverTimestamp(),
  });
}

export async function arriveAtDestination({ code, session, rider, selected }) {
  const entry = {
    stop: selected,
    payerUid: rider.uid,
    payerName: rider.nickname,
    host: false,
    foodStop: !!session.foodMode,
    timeIso: new Date().toISOString(),
  };
  const nextVisited = [...(session.visited || []), entry];
  const shouldAskFood = nextVisited.length >= (session.foodPromptAt || 5);

  await updateDoc(sessionRef(code), {
    currentStop: selected,
    currentPayerUid: rider.uid,
    visited: arrayUnion(entry),
    phase: shouldAskFood ? 'food' : 'atStop',
    foodMode: false,
  });

  await setDoc(privateRef(code, rider.uid), { phase: 'done', selected: null, choices: [] }, { merge: true });
}

export async function answerFood({ code, session, wantsFood }) {
  await updateDoc(sessionRef(code), {
    foodMode: wantsFood,
    foodPromptAt: wantsFood ? 9999 : (session.foodPromptAt || 5) + 2,
    phase: 'atStop',
  });
}

export async function finishGame(code) {
  await updateDoc(sessionRef(code), { status: 'finished', finishedAt: serverTimestamp() });
}
