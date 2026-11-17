import {
  onAuthStateChanged,
  signInAnonymously,
  User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';
import { handleFirestoreError, OperationType } from './errors';
import {
  AccessoryId,
  BuildingDoc,
  ChatMessageDoc,
  ChayaPresenceDoc,
  CinemaChatDoc,
  CinemaSeatDoc,
  DailyTaskId,
  DoorMessageDoc,
  ElectionCandidateDoc,
  ElectionDoc,
  EmoteType,
  FestivalId,
  FestivalProgressDoc,
  FurnitureId,
  HouseStyle,
  matchBuildingType,
  NewsCategory,
  NewsItemDoc,
  OutfitType,
  PlayerDoc,
  PLOT_SHOP_CATALOG,
  PostcardDoc,
  PostcardStamp,
  RaceDoc,
  RaceParticipantDoc,
  ShopItem,
  ShopOrderDoc,
  ShopType,
  STREAK_MILESTONES,
  SuggestionDoc,
  VallamTeam,
  VillageMetaDoc,
  WardStatDoc,
  YardAddition,
} from '../types/village';
import { getNextBuildingPlot, getNextSpiralPlot } from '../utils/spiral';
import {
  MallAccessoryOption,
  MallFurnitureOption,
  MallOutfitOption,
} from '../utils/townBuildings';
import {
  getLocalDateKey,
  getYesterdayLocalDateKey,
  pickWinningTeam,
} from '../utils/vallamKali';
import { getCurrentWeekKey, getWardNumber } from '../utils/wards';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const STORAGE_UID_KEY = 'ente_veedu_uid';
const STORAGE_USERNAME_KEY = 'ente_veedu_username';
const MUTED_USERS_KEY = 'ente_veedu_muted_uids';

export function saveStoredIdentity(uid: string, username?: string): void {
  try {
    localStorage.setItem(STORAGE_UID_KEY, uid);
    if (username) {
      localStorage.setItem(STORAGE_USERNAME_KEY, username);
    }
  } catch {
    // ignore storage quota errors
  }
}

export function getStoredIdentity(): { uid: string | null; username: string | null } {
  try {
    return {
      uid: localStorage.getItem(STORAGE_UID_KEY),
      username: localStorage.getItem(STORAGE_USERNAME_KEY),
    };
  } catch {
    return { uid: null, username: null };
  }
}

export function loadMutedUids(): string[] {
  try {
    const raw = localStorage.getItem(MUTED_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveMutedUids(uids: string[]): void {
  try {
    localStorage.setItem(MUTED_USERS_KEY, JSON.stringify(uids));
  } catch {
    // ignore
  }
}

function toMillis(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'number') return val;
  return Date.now();
}

export interface AuthBootstrapResult {
  user: User | null;
  demoFallback: boolean;
  reason?: string;
}

export async function bootstrapAnonymousAuth(): Promise<AuthBootstrapResult> {
  if (!isFirebaseConfigured()) {
    return {
      user: null,
      demoFallback: true,
      reason: 'Firebase config not set.',
    };
  }
  if (auth.currentUser) {
    saveStoredIdentity(auth.currentUser.uid);
    return { user: auth.currentUser, demoFallback: false };
  }
  try {
    const cred = await signInAnonymously(auth);
    saveStoredIdentity(cred.user.uid);
    return { user: cred.user, demoFallback: false };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('Anonymous auth unavailable, switching to demo mode:', msg);
    return {
      user: null,
      demoFallback: true,
      reason: msg,
    };
  }
}

export function subscribeAuthChanges(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      saveStoredIdentity(user.uid);
    }
    cb(user);
  });
}

function safeLogFirestoreError(err: unknown, op: OperationType, path: string, onFallback: () => void) {
  try {
    handleFirestoreError(err, op, path);
  } catch {
    onFallback();
  }
}

function mapPlayerDoc(id: string, data: Record<string, unknown>): PlayerDoc {
  return {
    uid: String(data.uid || id),
    username: String(data.username || ''),
    plotX: Number(data.plotX ?? 0),
    plotY: Number(data.plotY ?? 0),
    houseStyle: (data.houseStyle as HouseStyle) || 'tiled',
    roofColor: String(data.roofColor || '#b85038'),
    wallColor: String(data.wallColor || '#f6f2e9'),
    skinTone: String(data.skinTone || '#c68b59'),
    outfitType: (data.outfitType as OutfitType) || 'mundu',
    outfitColor: String(data.outfitColor || '#f8f2dc'),
    additions: Array.isArray(data.additions) ? (data.additions as YardAddition[]) : [],
    heartsCount: Number(data.heartsCount ?? 0),
    coins: Number(data.coins ?? 0),
    streak: Number(data.streak ?? 0),
    lastClaimDate: data.lastClaimDate ? String(data.lastClaimDate) : undefined,
    dailyTasks: Array.isArray(data.dailyTasks) ? (data.dailyTasks as DailyTaskId[]) : [],
    dailyCoinsDate: data.dailyCoinsDate ? String(data.dailyCoinsDate) : undefined,
    dailyCoinsEarned: Number(data.dailyCoinsEarned ?? 0),
    claimedMilestones: Array.isArray(data.claimedMilestones)
      ? (data.claimedMilestones as number[])
      : [],
    unlockedItems: Array.isArray(data.unlockedItems)
      ? (data.unlockedItems as string[])
      : [],
    claimedRaceDates: Array.isArray(data.claimedRaceDates)
      ? (data.claimedRaceDates as string[])
      : [],
    boatBadgeUntil: data.boatBadgeUntil ? Number(data.boatBadgeUntil) : undefined,
    wateredDate: data.wateredDate ? String(data.wateredDate) : undefined,
    fedCowDate: data.fedCowDate ? String(data.fedCowDate) : undefined,
    sweptDate: data.sweptDate ? String(data.sweptDate) : undefined,
    litLampDate: data.litLampDate ? String(data.litLampDate) : undefined,
    shopType: data.shopType ? (String(data.shopType) as ShopType) : undefined,
    shopIncomeDate: data.shopIncomeDate ? String(data.shopIncomeDate) : undefined,
    shopIncomeToday: Number(data.shopIncomeToday ?? 0),
    workShiftDate: data.workShiftDate ? String(data.workShiftDate) : undefined,
    mayorMonth: data.mayorMonth ? String(data.mayorMonth) : undefined,
    lastClaimedOrderId: data.lastClaimedOrderId ? String(data.lastClaimedOrderId) : undefined,
    health: data.health !== undefined ? Number(data.health) : 100,
    lastInjuryReason: data.lastInjuryReason ? String(data.lastInjuryReason) : undefined,
    bankBalance: Number(data.bankBalance ?? 0),
    lastInterestDate: data.lastInterestDate ? String(data.lastInterestDate) : undefined,
    quizDate: data.quizDate ? String(data.quizDate) : undefined,
    accessory: data.accessory ? (String(data.accessory) as AccessoryId) : undefined,
    furniture: Array.isArray(data.furniture) ? (data.furniture as FurnitureId[]) : [],
    lastRestDate: data.lastRestDate ? String(data.lastRestDate) : undefined,
    lastChatAt: data.lastChatAt ? toMillis(data.lastChatAt) : undefined,
    lastEmote: data.lastEmote ? (String(data.lastEmote) as EmoteType) : undefined,
    lastEmoteAt: data.lastEmoteAt ? toMillis(data.lastEmoteAt) : undefined,
    lastWaveAt: data.lastWaveAt ? toMillis(data.lastWaveAt) : undefined,
    lastSuggestionAt: data.lastSuggestionAt ? toMillis(data.lastSuggestionAt) : undefined,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

export function subscribeVillageData(callbacks: {
  onPlayers: (players: PlayerDoc[]) => void;
  onSuggestions: (suggestions: SuggestionDoc[]) => void;
  onBuildings: (buildings: BuildingDoc[]) => void;
  onDoors: (doors: DoorMessageDoc[]) => void;
  onChat: (chat: ChatMessageDoc[]) => void;
  onChayaPresence: (presence: ChayaPresenceDoc[]) => void;
  onMeta: (meta: VillageMetaDoc | null) => void;
  onFallbackToDemo: () => void;
}): () => void {
  const unsubs: (() => void)[] = [];

  const playersPath = 'players';
  unsubs.push(
    onSnapshot(
      collection(db, playersPath),
      (snap) => {
        const list = snap.docs.map((d) => mapPlayerDoc(d.id, d.data()));
        callbacks.onPlayers(list);
      },
      (err) => safeLogFirestoreError(err, OperationType.LIST, playersPath, callbacks.onFallbackToDemo)
    )
  );

  const suggestionsPath = 'suggestions';
  unsubs.push(
    onSnapshot(
      query(collection(db, suggestionsPath), orderBy('votes', 'desc'), limit(60)),
      (snap) => {
        const list: SuggestionDoc[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            text: String(data.text || ''),
            buildingType: String(data.buildingType || 'custom'),
            authorUid: String(data.authorUid || ''),
            authorUsername: String(data.authorUsername || ''),
            votes: Number(data.votes ?? 1),
            status: (data.status as SuggestionDoc['status']) || 'open',
            createdAt: toMillis(data.createdAt),
            updatedAt: toMillis(data.updatedAt),
          };
        });
        callbacks.onSuggestions(list);
      },
      (err) => safeLogFirestoreError(err, OperationType.LIST, suggestionsPath, callbacks.onFallbackToDemo)
    )
  );

  const buildingsPath = 'buildings';
  unsubs.push(
    onSnapshot(
      collection(db, buildingsPath),
      (snap) => {
        const list: BuildingDoc[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: String(data.type || 'chaya_kada'),
            label: String(data.label || ''),
            x: Number(data.x ?? 0),
            y: Number(data.y ?? 0),
            suggestionId: data.suggestionId ? String(data.suggestionId) : undefined,
            electionMonth: data.electionMonth ? String(data.electionMonth) : undefined,
            builtByUid: String(data.builtByUid || ''),
            builtAt: toMillis(data.builtAt),
          };
        });
        callbacks.onBuildings(list);
      },
      (err) => safeLogFirestoreError(err, OperationType.LIST, buildingsPath, callbacks.onFallbackToDemo)
    )
  );

  const doorsPath = 'doors';
  unsubs.push(
    onSnapshot(
      query(collection(db, doorsPath), orderBy('createdAt', 'desc'), limit(200)),
      (snap) => {
        const list: DoorMessageDoc[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            targetUid: String(data.targetUid || ''),
            authorUid: String(data.authorUid || ''),
            authorUsername: String(data.authorUsername || ''),
            message: String(data.message || ''),
            createdAt: toMillis(data.createdAt),
          };
        });
        callbacks.onDoors(list);
      },
      (err) => safeLogFirestoreError(err, OperationType.LIST, doorsPath, callbacks.onFallbackToDemo)
    )
  );

  const chatPath = 'chat';
  unsubs.push(
    onSnapshot(
      query(collection(db, chatPath), orderBy('createdAt', 'desc'), limit(50)),
      (snap) => {
        const list: ChatMessageDoc[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            authorUid: String(data.authorUid || ''),
            authorUsername: String(data.authorUsername || ''),
            text: String(data.text || ''),
            createdAt: toMillis(data.createdAt),
          };
        });
        callbacks.onChat(list);
      },
      (err) => safeLogFirestoreError(err, OperationType.LIST, chatPath, callbacks.onFallbackToDemo)
    )
  );

  const presencePath = 'chayaPresence';
  unsubs.push(
    onSnapshot(
      query(collection(db, presencePath), limit(200)),
      (snap) => {
        const list: ChayaPresenceDoc[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: String(data.uid || d.id),
            username: String(data.username || ''),
            lastSeen: toMillis(data.lastSeen),
          };
        });
        callbacks.onChayaPresence(list);
      },
      (err) => safeLogFirestoreError(err, OperationType.LIST, presencePath, callbacks.onFallbackToDemo)
    )
  );

  const metaPath = 'village_meta/state';
  unsubs.push(
    onSnapshot(
      doc(db, 'village_meta', 'state'),
      (snap) => {
        if (!snap.exists()) {
          callbacks.onMeta(null);
          return;
        }
        const data = snap.data();
        callbacks.onMeta({
          nextResolutionAt: Number(data.nextResolutionAt ?? Date.now() + TWENTY_FOUR_HOURS_MS),
          lastResolvedBuilding: data.lastResolvedBuilding ? String(data.lastResolvedBuilding) : undefined,
          updatedByUid: String(data.updatedByUid || ''),
          updatedAt: toMillis(data.updatedAt),
        });
      },
      (err) => safeLogFirestoreError(err, OperationType.GET, metaPath, callbacks.onFallbackToDemo)
    )
  );

  return () => {
    unsubs.forEach((u) => u());
  };
}

export function subscribeRaceData(params: {
  raceDateId: string;
  uid: string;
  onActiveRace: (race: RaceDoc | null) => void;
  onMyParticipant: (part: RaceParticipantDoc | null) => void;
  onRaceHistory: (history: RaceDoc[]) => void;
}): () => void {
  const { raceDateId, uid, onActiveRace, onMyParticipant, onRaceHistory } = params;
  const unsubs: (() => void)[] = [];

  unsubs.push(
    onSnapshot(
      doc(db, 'races', raceDateId),
      (snap) => {
        if (!snap.exists()) {
          onActiveRace(null);
          return;
        }
        const d = snap.data();
        const s = (d.scores || {}) as Record<string, unknown>;
        onActiveRace({
          id: snap.id,
          date: String(d.date || snap.id),
          status: (d.status as RaceDoc['status']) || 'live',
          scores: {
            chundan_red: Number(s.chundan_red ?? 0),
            backwater_blue: Number(s.backwater_blue ?? 0),
            paddy_green: Number(s.paddy_green ?? 0),
            coconut_gold: Number(s.coconut_gold ?? 0),
          },
          winnerTeam: d.winnerTeam ? (String(d.winnerTeam) as VallamTeam) : undefined,
          participantCount: Number(d.participantCount ?? 0),
          startedAt: toMillis(d.startedAt),
          finishedAt: d.finishedAt ? toMillis(d.finishedAt) : undefined,
        });
      },
      () => onActiveRace(null)
    )
  );

  unsubs.push(
    onSnapshot(
      doc(db, 'races', raceDateId, 'participants', uid),
      (snap) => {
        if (!snap.exists()) {
          onMyParticipant(null);
          return;
        }
        const d = snap.data();
        onMyParticipant({
          uid: String(d.uid || uid),
          username: String(d.username || ''),
          team: String(d.team) as VallamTeam,
          taps: Number(d.taps ?? 0),
          joinedAt: toMillis(d.joinedAt),
        });
      },
      () => onMyParticipant(null)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'races'), orderBy('date', 'desc'), limit(12)),
      (snap) => {
        const finished: RaceDoc[] = [];
        for (const dSnap of snap.docs) {
          const d = dSnap.data();
          if (d.status === 'finished') {
            const s = (d.scores || {}) as Record<string, unknown>;
            finished.push({
              id: dSnap.id,
              date: String(d.date || dSnap.id),
              status: 'finished',
              scores: {
                chundan_red: Number(s.chundan_red ?? 0),
                backwater_blue: Number(s.backwater_blue ?? 0),
                paddy_green: Number(s.paddy_green ?? 0),
                coconut_gold: Number(s.coconut_gold ?? 0),
              },
              winnerTeam: d.winnerTeam ? (String(d.winnerTeam) as VallamTeam) : undefined,
              participantCount: Number(d.participantCount ?? 0),
              startedAt: toMillis(d.startedAt),
              finishedAt: d.finishedAt ? toMillis(d.finishedAt) : undefined,
            });
          }
          if (finished.length >= 5) break;
        }
        onRaceHistory(finished);
      },
      () => onRaceHistory([])
    )
  );

  return () => unsubs.forEach((u) => u());
}

export async function checkUsernameAvailableLive(username: string): Promise<boolean> {
  const path = `usernames/${username}`;
  try {
    const snap = await getDoc(doc(db, 'usernames', username));
    return !snap.exists();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function claimPlotLive(params: {
  uid: string;
  username: string;
  skinTone: string;
  outfitType: OutfitType;
  outfitColor: string;
  existingPlayers: PlayerDoc[];
  existingBuildings: BuildingDoc[];
}): Promise<PlayerDoc> {
  const { uid, username, skinTone, outfitType, outfitColor, existingPlayers, existingBuildings } =
    params;
  const plot = getNextSpiralPlot(existingPlayers, existingBuildings);
  const playerRef = doc(db, 'players', uid);
  const usernameRef = doc(db, 'usernames', username);

  try {
    await runTransaction(db, async (tx) => {
      const existingPlayer = await tx.get(playerRef);
      if (existingPlayer.exists()) {
        throw new Error('You already have a veedu in the village.');
      }
      const existingName = await tx.get(usernameRef);
      if (existingName.exists()) {
        throw new Error('That @username is already claimed.');
      }

      tx.set(usernameRef, {
        uid,
        createdAt: serverTimestamp(),
      });

      tx.set(playerRef, {
        uid,
        username,
        plotX: Math.trunc(plot.x),
        plotY: Math.trunc(plot.y),
        houseStyle: 'tiled',
        roofColor: '#b85038',
        wallColor: '#f6f2e9',
        skinTone,
        outfitType,
        outfitColor,
        additions: ['coconutTree'],
        heartsCount: 0,
        coins: 15,
        streak: 0,
        dailyTasks: [],
        claimedMilestones: [],
        unlockedItems: [],
        claimedRaceDates: [],
        health: 100,
        bankBalance: 0,
        furniture: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    saveStoredIdentity(uid, username);

    return {
      uid,
      username,
      plotX: plot.x,
      plotY: plot.y,
      houseStyle: 'tiled',
      roofColor: '#b85038',
      wallColor: '#f6f2e9',
      skinTone,
      outfitType,
      outfitColor,
      additions: ['coconutTree'],
      heartsCount: 0,
      coins: 15,
      streak: 0,
      dailyTasks: [],
      claimedMilestones: [],
      unlockedItems: [],
      claimedRaceDates: [],
      health: 100,
      bankBalance: 0,
      furniture: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  } catch (err) {
    if (err instanceof Error && (err.message.includes('already') || err.message.includes('claimed'))) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `players/${uid}`);
  }
}

export async function updateCustomizationLive(
  uid: string,
  updates: {
    houseStyle: HouseStyle;
    roofColor: string;
    wallColor: string;
    skinTone: string;
    outfitType: OutfitType;
    outfitColor: string;
    additions: YardAddition[];
  }
): Promise<void> {
  const playerRef = doc(db, 'players', uid);
  try {
    await updateDoc(playerRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function claimDailyTaskLive(
  uid: string,
  taskId: DailyTaskId
): Promise<{ earned: number; completedAll: boolean }> {
  const playerRef = doc(db, 'players', uid);
  const today = getLocalDateKey();
  const yesterday = getYesterdayLocalDateKey();
  let earned = 0;
  let completedAll = false;

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) throw new Error('Player not found.');
      const data = snap.data();
      const prevDate = data.dailyCoinsDate ? String(data.dailyCoinsDate) : '';
      const prevTasks: DailyTaskId[] =
        prevDate === today && Array.isArray(data.dailyTasks) ? (data.dailyTasks as DailyTaskId[]) : [];
      if (prevTasks.includes(taskId)) return;

      const nextTasks = [...prevTasks, taskId];
      completedAll = nextTasks.length === 4;
      earned = completedAll ? 15 : 5;
      const prevEarned = prevDate === today ? Number(data.dailyCoinsEarned ?? 0) : 0;

      let nextStreak = Number(data.streak ?? 0);
      if (String(data.lastClaimDate || '') !== today) {
        nextStreak = String(data.lastClaimDate || '') === yesterday ? nextStreak + 1 : 1;
      }

      const patch: Record<string, unknown> = {
        coins: Math.trunc(Number(data.coins ?? 0) + earned),
        streak: Math.trunc(nextStreak),
        lastClaimDate: today,
        dailyTasks: nextTasks,
        dailyCoinsDate: today,
        dailyCoinsEarned: Math.trunc(prevEarned + earned),
        updatedAt: serverTimestamp(),
      };
      if (taskId === 'waterTree') patch.wateredDate = today;
      if (taskId === 'feedCow') patch.fedCowDate = today;
      if (taskId === 'sweepYard') patch.sweptDate = today;
      if (taskId === 'lightLamp') patch.litLampDate = today;

      tx.update(playerRef, patch);
    });
    if (earned > 0) {
      const snap = await getDoc(playerRef);
      if (snap.exists()) {
        const pData = snap.data();
        const wardId = getWardNumber(Number(pData.plotX ?? 0), Number(pData.plotY ?? 0));
        await incrementWardStatLive(getCurrentWeekKey(), wardId, 'tasksCompleted', 1).catch(() => {});
      }
    }
    return { earned, completedAll };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function claimStreakMilestoneLive(uid: string, days: number): Promise<number> {
  const milestone = STREAK_MILESTONES.find((m) => m.days === days);
  if (!milestone) return 0;
  const playerRef = doc(db, 'players', uid);
  let awarded = 0;

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) throw new Error('Player not found.');
      const data = snap.data();
      const streak = Number(data.streak ?? 0);
      const claimed = Array.isArray(data.claimedMilestones) ? (data.claimedMilestones as number[]) : [];
      if (streak < days || claimed.includes(days)) return;

      awarded = milestone.bonus;
      tx.update(playerRef, {
        coins: Math.trunc(Number(data.coins ?? 0) + milestone.bonus),
        claimedMilestones: [...claimed, days],
        updatedAt: serverTimestamp(),
      });
    });
    return awarded;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function purchaseShopItemLive(uid: string, item: ShopItem): Promise<void> {
  const playerRef = doc(db, 'players', uid);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) throw new Error('Player not found.');
      const data = snap.data();
      const coins = Number(data.coins ?? 0);
      const unlocked = Array.isArray(data.unlockedItems) ? (data.unlockedItems as string[]) : [];
      if (unlocked.includes(item.id)) return;
      if (coins < item.price) throw new Error('NOT_ENOUGH_COINS');

      const currentAdditions = Array.isArray(data.additions)
        ? (data.additions as YardAddition[])
        : [];
      const nextAdditions =
        item.kind === 'addition' && item.additionId && !currentAdditions.includes(item.additionId)
          ? [...currentAdditions, item.additionId]
          : currentAdditions;

      const patch: Record<string, unknown> = {
        coins: Math.trunc(coins - item.price),
        unlockedItems: [...unlocked, item.id],
        additions: nextAdditions,
        updatedAt: serverTimestamp(),
      };
      if (item.kind === 'roof' && item.roofHex) {
        patch.roofColor = item.roofHex;
      }
      tx.update(playerRef, patch);
    });
    const snap = await getDoc(playerRef);
    if (snap.exists()) {
      const pData = snap.data();
      const wardId = getWardNumber(Number(pData.plotX ?? 0), Number(pData.plotY ?? 0));
      await incrementWardStatLive(getCurrentWeekKey(), wardId, 'decorCoinsSpent', item.price).catch(() => {});
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_ENOUGH_COINS') throw err;
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function sendChatMessageLive(params: {
  uid: string;
  username: string;
  text: string;
}): Promise<void> {
  const playerRef = doc(db, 'players', params.uid);
  const chatRef = doc(collection(db, 'chat'));
  const cleanText = params.text.trim().slice(0, 140);

  try {
    await runTransaction(db, async (tx) => {
      const pSnap = await tx.get(playerRef);
      if (!pSnap.exists()) throw new Error('Claim your veedu first.');
      const pData = pSnap.data();
      if (pData.lastChatAt instanceof Timestamp) {
        if (Date.now() - pData.lastChatAt.toMillis() < 2000) {
          throw new Error('COOLDOWN');
        }
      }

      tx.update(playerRef, {
        lastChatAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      tx.set(chatRef, {
        authorUid: params.uid,
        authorUsername: params.username,
        text: cleanText,
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'COOLDOWN') throw err;
    handleFirestoreError(err, OperationType.WRITE, `chat/${chatRef.id}`);
  }
}

export async function sendEmoteLive(uid: string, emote: EmoteType): Promise<void> {
  try {
    await updateDoc(doc(db, 'players', uid), {
      lastEmote: emote,
      lastEmoteAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function heartbeatChayaPresenceLive(uid: string, username: string): Promise<void> {
  try {
    await setDoc(doc(db, 'chayaPresence', uid), {
      uid,
      username,
      lastSeen: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `chayaPresence/${uid}`);
  }
}

export async function reportChatMessageLive(params: {
  messageId: string;
  reportedUid: string;
  reportedUsername: string;
  messageText: string;
  reporterUid: string;
}): Promise<void> {
  try {
    await addDoc(collection(db, 'reports'), {
      messageId: params.messageId,
      reportedUid: params.reportedUid,
      reportedUsername: params.reportedUsername,
      messageText: params.messageText.slice(0, 140),
      reporterUid: params.reporterUid,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'reports');
  }
}

export async function joinRaceTeamLive(params: {
  raceDateId: string;
  uid: string;
  username: string;
  team: VallamTeam;
}): Promise<void> {
  const { raceDateId, uid, username, team } = params;
  const raceRef = doc(db, 'races', raceDateId);
  const partRef = doc(db, 'races', raceDateId, 'participants', uid);

  try {
    await runTransaction(db, async (tx) => {
      const partSnap = await tx.get(partRef);
      if (partSnap.exists()) return;

      const raceSnap = await tx.get(raceRef);
      if (!raceSnap.exists()) {
        tx.set(raceRef, {
          date: raceDateId,
          status: 'live',
          scores: {
            chundan_red: 0,
            backwater_blue: 0,
            paddy_green: 0,
            coconut_gold: 0,
          },
          participantCount: 1,
          startedAt: serverTimestamp(),
        });
      } else {
        if (raceSnap.data().status !== 'live') {
          throw new Error('Race has already finished.');
        }
        tx.update(raceRef, {
          participantCount: Math.trunc(Number(raceSnap.data().participantCount ?? 0) + 1),
        });
      }

      tx.set(partRef, {
        uid,
        username,
        team,
        taps: 0,
        joinedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `races/${raceDateId}`);
  }
}

export async function paddleTeamLive(raceDateId: string, team: VallamTeam): Promise<void> {
  try {
    await updateDoc(doc(db, 'races', raceDateId), {
      [`scores.${team}`]: increment(1),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `races/${raceDateId}`);
  }
}

export async function resolveRaceLive(raceDateId: string): Promise<void> {
  const raceRef = doc(db, 'races', raceDateId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(raceRef);
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.status !== 'live') return;
      const s = (d.scores || {}) as Record<string, unknown>;
      const winnerTeam = pickWinningTeam({
        chundan_red: Number(s.chundan_red ?? 0),
        backwater_blue: Number(s.backwater_blue ?? 0),
        paddy_green: Number(s.paddy_green ?? 0),
        coconut_gold: Number(s.coconut_gold ?? 0),
      });
      tx.update(raceRef, {
        status: 'finished',
        winnerTeam,
        finishedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `races/${raceDateId}`);
  }
}

export async function claimRaceRewardLive(
  raceDateId: string,
  uid: string
): Promise<{ coinsEarned: number; isWinner: boolean }> {
  const raceRef = doc(db, 'races', raceDateId);
  const partRef = doc(db, 'races', raceDateId, 'participants', uid);
  const playerRef = doc(db, 'players', uid);
  let coinsEarned = 0;
  let isWinner = false;

  try {
    await runTransaction(db, async (tx) => {
      const raceSnap = await tx.get(raceRef);
      const partSnap = await tx.get(partRef);
      const playerSnap = await tx.get(playerRef);
      if (!raceSnap.exists() || !partSnap.exists() || !playerSnap.exists()) return;
      const rData = raceSnap.data();
      if (rData.status !== 'finished') return;

      const pData = playerSnap.data();
      const claimed = Array.isArray(pData.claimedRaceDates)
        ? (pData.claimedRaceDates as string[])
        : [];
      if (claimed.includes(raceDateId)) return;

      isWinner = String(partSnap.data().team) === String(rData.winnerTeam);
      coinsEarned = isWinner ? 100 : 20;

      const patch: Record<string, unknown> = {
        coins: Math.trunc(Number(pData.coins ?? 0) + coinsEarned),
        claimedRaceDates: [...claimed, raceDateId],
        updatedAt: serverTimestamp(),
      };
      if (isWinner) {
        patch.boatBadgeUntil = Math.trunc(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
      tx.update(playerRef, patch);
    });
    return { coinsEarned, isWinner };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function submitSuggestionLive(params: {
  uid: string;
  username: string;
  text: string;
}): Promise<string> {
  const { uid, username, text } = params;
  const trimmed = text.trim().slice(0, 80);
  const matched = matchBuildingType(trimmed);
  const buildingType = matched ? matched.type : 'custom';
  const suggestionRef = doc(collection(db, 'suggestions'));
  const voteRef = doc(db, 'suggestions', suggestionRef.id, 'votes', uid);
  const playerRef = doc(db, 'players', uid);

  try {
    await runTransaction(db, async (tx) => {
      const playerSnap = await tx.get(playerRef);
      if (!playerSnap.exists()) {
        throw new Error('Claim your veedu first before suggesting.');
      }
      const pData = playerSnap.data();
      if (pData.lastSuggestionAt instanceof Timestamp) {
        const elapsed = Date.now() - pData.lastSuggestionAt.toMillis();
        if (elapsed < 60_000) {
          throw new Error('RATE_LIMIT');
        }
      }

      tx.update(playerRef, {
        lastSuggestionAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      tx.set(suggestionRef, {
        text: trimmed,
        buildingType,
        authorUid: uid,
        authorUsername: username,
        votes: 1,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      tx.set(voteRef, {
        voterUid: uid,
        createdAt: serverTimestamp(),
      });
    });

    return suggestionRef.id;
  } catch (err) {
    if (err instanceof Error && (err.message === 'RATE_LIMIT' || err.message.includes('Claim'))) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `suggestions/${suggestionRef.id}`);
  }
}

export async function upvoteSuggestionLive(suggestionId: string, voterUid: string): Promise<void> {
  const suggestionRef = doc(db, 'suggestions', suggestionId);
  const voteRef = doc(db, 'suggestions', suggestionId, 'votes', voterUid);

  try {
    await runTransaction(db, async (tx) => {
      const voteSnap = await tx.get(voteRef);
      if (voteSnap.exists()) {
        throw new Error('ALREADY_VOTED');
      }
      const sugSnap = await tx.get(suggestionRef);
      if (!sugSnap.exists()) {
        throw new Error('Suggestion no longer exists.');
      }
      const sData = sugSnap.data();
      if (sData.status !== 'open') {
        throw new Error('Suggestion already resolved.');
      }

      tx.set(voteRef, {
        voterUid,
        createdAt: serverTimestamp(),
      });

      tx.update(suggestionRef, {
        votes: Math.trunc(Number(sData.votes || 1) + 1),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'ALREADY_VOTED') {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `suggestions/${suggestionId}`);
  }
}

export async function resolveTopSuggestionIfReadyLive(params: {
  uid: string;
  players: PlayerDoc[];
  suggestions: SuggestionDoc[];
  buildings: BuildingDoc[];
  meta: VillageMetaDoc | null;
}): Promise<BuildingDoc | null> {
  const { uid, players, suggestions, buildings, meta } = params;
  const population = Math.max(1, players.length);
  const threshold = Math.max(3, Math.ceil(population * 0.15));
  const now = Date.now();
  const deadlinePassed = meta ? now >= meta.nextResolutionAt : false;

  const eligible = suggestions
    .filter((s) => s.status === 'open' && s.buildingType !== 'custom')
    .sort((a, b) => b.votes - a.votes || a.createdAt - b.createdAt);

  if (eligible.length === 0) return null;
  const top = eligible[0];
  if (!deadlinePassed && top.votes < threshold) {
    return null;
  }

  const plot = getNextBuildingPlot(top.buildingType, players, buildings);
  const buildingRef = doc(collection(db, 'buildings'));
  const sugRef = doc(db, 'suggestions', top.id);
  const metaRef = doc(db, 'village_meta', 'state');

  try {
    await runTransaction(db, async (tx) => {
      const sugSnap = await tx.get(sugRef);
      if (!sugSnap.exists() || sugSnap.data().status !== 'open') {
        return;
      }
      const metaSnap = await tx.get(metaRef);
      const currentNext = metaSnap.exists() ? Number(metaSnap.data().nextResolutionAt || 0) : 0;
      const currentVotes = Number(sugSnap.data().votes || 0);
      if (metaSnap.exists() && Date.now() < currentNext && currentVotes < threshold) {
        return;
      }

      tx.update(sugRef, {
        status: 'built',
        updatedAt: serverTimestamp(),
      });

      tx.set(buildingRef, {
        type: top.buildingType,
        label: top.text.slice(0, 80),
        x: Math.trunc(plot.x),
        y: Math.trunc(plot.y),
        suggestionId: top.id,
        builtByUid: uid,
        builtAt: serverTimestamp(),
      });

      tx.set(metaRef, {
        nextResolutionAt: Math.trunc(Date.now() + TWENTY_FOUR_HOURS_MS),
        lastResolvedBuilding: top.text.slice(0, 80),
        updatedByUid: uid,
        updatedAt: serverTimestamp(),
      });
    });

    return {
      id: buildingRef.id,
      type: top.buildingType,
      label: top.text,
      x: plot.x,
      y: plot.y,
      suggestionId: top.id,
      builtByUid: uid,
      builtAt: Date.now(),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `buildings/${buildingRef.id}`);
  }
}

export async function giveHouseHeartLive(targetUid: string, voterUid: string): Promise<void> {
  const playerRef = doc(db, 'players', targetUid);
  const heartRef = doc(db, 'players', targetUid, 'hearts', voterUid);

  try {
    await runTransaction(db, async (tx) => {
      const heartSnap = await tx.get(heartRef);
      if (heartSnap.exists()) {
        throw new Error('ALREADY_HEARTED');
      }
      const playerSnap = await tx.get(playerRef);
      if (!playerSnap.exists()) {
        throw new Error('House not found.');
      }
      const currentHearts = Number(playerSnap.data().heartsCount ?? 0);

      tx.set(heartRef, {
        voterUid,
        createdAt: serverTimestamp(),
      });

      tx.update(playerRef, {
        heartsCount: Math.trunc(currentHearts + 1),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'ALREADY_HEARTED') {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `players/${targetUid}/hearts/${voterUid}`);
  }
}

export async function waveAtHouseLive(targetUid: string): Promise<void> {
  const playerRef = doc(db, 'players', targetUid);
  try {
    await updateDoc(playerRef, {
      lastWaveAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `players/${targetUid}`);
  }
}

export async function leaveDoorMessageLive(params: {
  targetUid: string;
  authorUid: string;
  authorUsername: string;
  message: string;
}): Promise<void> {
  const doorRef = doc(collection(db, 'doors'));
  try {
    await runTransaction(db, async (tx) => {
      tx.set(doorRef, {
        targetUid: params.targetUid,
        authorUid: params.authorUid,
        authorUsername: params.authorUsername,
        message: params.message.trim().slice(0, 60),
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `doors/${doorRef.id}`);
  }
}

export async function deleteDoorMessageLive(doorId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'doors', doorId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `doors/${doorId}`);
  }
}

export async function checkUserSuggestionVotedLive(suggestionId: string, uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'suggestions', suggestionId, 'votes', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function checkUserHouseHeartedLive(targetUid: string, uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'players', targetUid, 'hearts', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export function subscribeTownGrowthData(params: {
  uid: string;
  weekKey: string;
  monthKey: string;
  yearFestKey: string | null;
  onWardStats: (stats: WardStatDoc[]) => void;
  onElection: (election: ElectionDoc | null) => void;
  onCandidates: (candidates: ElectionCandidateDoc[]) => void;
  onHasVotedMayor: (voted: boolean) => void;
  onUnclaimedOrders: (orders: ShopOrderDoc[]) => void;
  onFestivalProgress: (prog: FestivalProgressDoc | null) => void;
  onNews: (news: NewsItemDoc[]) => void;
}): () => void {
  const {
    uid,
    weekKey,
    monthKey,
    yearFestKey,
    onWardStats,
    onElection,
    onCandidates,
    onHasVotedMayor,
    onUnclaimedOrders,
    onFestivalProgress,
    onNews,
  } = params;
  const unsubs: (() => void)[] = [];

  unsubs.push(
    onSnapshot(
      collection(db, 'ward_stats', weekKey, 'wards'),
      (snap) => {
        const list: WardStatDoc[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            weekKey: String(data.weekKey || weekKey),
            wardId: Number(data.wardId ?? 1),
            tasksCompleted: Number(data.tasksCompleted ?? 0),
            decorCoinsSpent: Number(data.decorCoinsSpent ?? 0),
            updatedAt: toMillis(data.updatedAt),
          };
        });
        onWardStats(list);
      },
      () => onWardStats([])
    )
  );

  unsubs.push(
    onSnapshot(
      doc(db, 'elections', monthKey),
      (snap) => {
        if (!snap.exists()) {
          onElection(null);
          return;
        }
        const d = snap.data();
        onElection({
          month: String(d.month || snap.id),
          status: (d.status as ElectionDoc['status']) || 'open',
          winnerUid: d.winnerUid ? String(d.winnerUid) : undefined,
          winnerUsername: d.winnerUsername ? String(d.winnerUsername) : undefined,
          winnerVotes: d.winnerVotes !== undefined ? Number(d.winnerVotes) : undefined,
          mayorUsedBuild: Boolean(d.mayorUsedBuild),
          startedAt: toMillis(d.startedAt),
          closedAt: d.closedAt ? toMillis(d.closedAt) : undefined,
        });
      },
      () => onElection(null)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'elections', monthKey, 'candidates'),
      (snap) => {
        const list: ElectionCandidateDoc[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: String(data.uid || d.id),
            username: String(data.username || ''),
            manifesto: String(data.manifesto || ''),
            votes: Number(data.votes ?? 0),
            createdAt: toMillis(data.createdAt),
          };
        });
        onCandidates(list);
      },
      () => onCandidates([])
    )
  );

  unsubs.push(
    onSnapshot(
      doc(db, 'elections', monthKey, 'votes', uid),
      (snap) => onHasVotedMayor(snap.exists()),
      () => onHasVotedMayor(false)
    )
  );

  // Single equality filter where('sellerUid', '==', uid) avoids composite index requirements
  unsubs.push(
    onSnapshot(
      query(collection(db, 'shop_orders'), where('sellerUid', '==', uid), limit(50)),
      (snap) => {
        const unclaimed: ShopOrderDoc[] = [];
        for (const d of snap.docs) {
          const data = d.data();
          if (!data.claimed) {
            unclaimed.push({
              id: d.id,
              buyerUid: String(data.buyerUid || ''),
              buyerUsername: String(data.buyerUsername || ''),
              sellerUid: String(data.sellerUid || ''),
              shopType: String(data.shopType || 'bakery') as ShopType,
              amount: Number(data.amount ?? 2),
              dateKey: String(data.dateKey || ''),
              claimed: false,
              createdAt: toMillis(data.createdAt),
            });
          }
        }
        onUnclaimedOrders(unclaimed);
      },
      () => onUnclaimedOrders([])
    )
  );

  if (yearFestKey) {
    unsubs.push(
      onSnapshot(
        doc(db, 'festivals', yearFestKey),
        (snap) => {
          if (!snap.exists()) {
            onFestivalProgress(null);
            return;
          }
          const d = snap.data();
          onFestivalProgress({
            id: snap.id,
            festivalId: String(d.festivalId) as FestivalId,
            count: Number(d.count ?? 0),
            updatedAt: toMillis(d.updatedAt),
          });
        },
        () => onFestivalProgress(null)
      )
    );
  } else {
    onFestivalProgress(null);
  }

  unsubs.push(
    onSnapshot(
      query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(25)),
      (snap) => {
        const list: NewsItemDoc[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            category: (data.category as NewsCategory) || 'building',
            headlineEn: String(data.headlineEn || ''),
            headlineMl: String(data.headlineMl || ''),
            createdAt: toMillis(data.createdAt),
          };
        });
        onNews(list);
      },
      () => onNews([])
    )
  );

  return () => unsubs.forEach((u) => u());
}

export async function incrementWardStatLive(
  weekKey: string,
  wardId: number,
  field: 'tasksCompleted' | 'decorCoinsSpent',
  delta: number
): Promise<void> {
  const ref = doc(db, 'ward_stats', weekKey, 'wards', String(wardId));
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, {
        weekKey,
        wardId: Math.trunc(wardId),
        tasksCompleted: field === 'tasksCompleted' ? Math.trunc(delta) : 0,
        decorCoinsSpent: field === 'decorCoinsSpent' ? Math.trunc(delta) : 0,
        updatedAt: serverTimestamp(),
      });
    } else {
      const d = snap.data();
      tx.update(ref, {
        tasksCompleted: Math.trunc(Number(d.tasksCompleted ?? 0) + (field === 'tasksCompleted' ? delta : 0)),
        decorCoinsSpent: Math.trunc(Number(d.decorCoinsSpent ?? 0) + (field === 'decorCoinsSpent' ? delta : 0)),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

export async function openPlotShopLive(uid: string, shopType: ShopType): Promise<void> {
  const item = PLOT_SHOP_CATALOG.find((c) => c.type === shopType);
  if (!item) throw new Error('Invalid shop type.');
  const playerRef = doc(db, 'players', uid);
  let wardId = 1;
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) throw new Error('Player not found.');
      const d = snap.data();
      if (d.shopType) throw new Error('You already have a shop.');
      const coins = Number(d.coins ?? 0);
      if (coins < item.price) throw new Error('NOT_ENOUGH_COINS');
      wardId = getWardNumber(Number(d.plotX ?? 0), Number(d.plotY ?? 0));
      tx.update(playerRef, {
        coins: Math.trunc(coins - item.price),
        shopType,
        updatedAt: serverTimestamp(),
      });
    });
    await incrementWardStatLive(getCurrentWeekKey(), wardId, 'decorCoinsSpent', item.price).catch(() => {});
  } catch (err) {
    if (err instanceof Error && (err.message === 'NOT_ENOUGH_COINS' || err.message.includes('already'))) {
      throw err;
    }
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function buyFromPlotShopLive(params: {
  buyerUid: string;
  buyerUsername: string;
  sellerUid: string;
  shopType: ShopType;
}): Promise<void> {
  const today = getLocalDateKey();
  const buyerRef = doc(db, 'players', params.buyerUid);
  const sellerRef = doc(db, 'players', params.sellerUid);
  const orderRef = doc(collection(db, 'shop_orders'));

  try {
    await runTransaction(db, async (tx) => {
      const buyerSnap = await tx.get(buyerRef);
      const sellerSnap = await tx.get(sellerRef);
      if (!buyerSnap.exists() || !sellerSnap.exists()) throw new Error('Shop unavailable.');
      const bData = buyerSnap.data();
      const sData = sellerSnap.data();
      if (String(sData.shopType || '') !== params.shopType) throw new Error('Shop unavailable.');
      const sellerIncome =
        String(sData.shopIncomeDate || '') === today ? Number(sData.shopIncomeToday ?? 0) : 0;
      if (sellerIncome >= 50) throw new Error('SHOP_CAP_REACHED');
      const buyerCoins = Number(bData.coins ?? 0);
      if (buyerCoins < 2) throw new Error('NOT_ENOUGH_COINS');

      // Buyer only updates their own player doc and creates a shop_order ledger entry
      tx.update(buyerRef, {
        coins: Math.trunc(buyerCoins - 2),
        updatedAt: serverTimestamp(),
      });
      tx.set(orderRef, {
        buyerUid: params.buyerUid,
        buyerUsername: params.buyerUsername,
        sellerUid: params.sellerUid,
        shopType: params.shopType,
        amount: 2,
        dateKey: today,
        claimed: false,
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === 'NOT_ENOUGH_COINS' || err.message === 'SHOP_CAP_REACHED')
    ) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `shop_orders/${orderRef.id}`);
  }
}

export async function collectShopEarningsLive(
  sellerUid: string,
  unclaimedOrders: ShopOrderDoc[]
): Promise<number> {
  if (unclaimedOrders.length === 0) return 0;
  const today = getLocalDateKey();
  const sellerRef = doc(db, 'players', sellerUid);
  const batch = unclaimedOrders.slice(0, 10);
  let totalCredited = 0;

  try {
    for (const ord of batch) {
      const orderRef = doc(db, 'shop_orders', ord.id);
      await runTransaction(db, async (tx) => {
        const sellerSnap = await tx.get(sellerRef);
        const oSnap = await tx.get(orderRef);
        if (!sellerSnap.exists() || !oSnap.exists()) return;
        const oData = oSnap.data();
        if (oData.claimed || String(oData.sellerUid) !== sellerUid) return;

        const sData = sellerSnap.data();
        const incomeToday =
          String(sData.shopIncomeDate || '') === today ? Number(sData.shopIncomeToday ?? 0) : 0;
        const coins = Number(sData.coins ?? 0);

        tx.update(orderRef, { claimed: true });
        if (incomeToday + 2 <= 50) {
          tx.update(sellerRef, {
            coins: Math.trunc(coins + 2),
            shopIncomeDate: today,
            shopIncomeToday: Math.trunc(incomeToday + 2),
            lastClaimedOrderId: ord.id,
            updatedAt: serverTimestamp(),
          });
          totalCredited += 2;
        }
      });
    }
    return totalCredited;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `players/${sellerUid}`);
  }
}

export async function completeWorkShiftLive(uid: string): Promise<void> {
  const today = getLocalDateKey();
  const playerRef = doc(db, 'players', uid);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) throw new Error('Player not found.');
      const d = snap.data();
      if (d.shopType) throw new Error('HAS_SHOP');
      if (String(d.workShiftDate || '') === today) throw new Error('ALREADY_DONE');
      tx.update(playerRef, {
        coins: Math.trunc(Number(d.coins ?? 0) + 10),
        workShiftDate: today,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof Error && (err.message === 'HAS_SHOP' || err.message === 'ALREADY_DONE')) {
      throw err;
    }
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function registerMayorCandidateLive(params: {
  month: string;
  uid: string;
  username: string;
  manifesto: string;
}): Promise<void> {
  const { month, uid, username, manifesto } = params;
  const elecRef = doc(db, 'elections', month);
  const candRef = doc(db, 'elections', month, 'candidates', uid);
  try {
    await runTransaction(db, async (tx) => {
      const elecSnap = await tx.get(elecRef);
      const candSnap = await tx.get(candRef);
      if (candSnap.exists()) return;
      if (!elecSnap.exists()) {
        tx.set(elecRef, {
          month,
          status: 'open',
          startedAt: serverTimestamp(),
        });
      } else if (elecSnap.data().status !== 'open') {
        throw new Error('Election is already closed.');
      }
      tx.set(candRef, {
        uid,
        username,
        manifesto: manifesto.trim().slice(0, 100),
        votes: 0,
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `elections/${month}/candidates/${uid}`);
  }
}

export async function voteForMayorLive(params: {
  month: string;
  voterUid: string;
  candidateUid: string;
}): Promise<void> {
  const { month, voterUid, candidateUid } = params;
  const elecRef = doc(db, 'elections', month);
  const candRef = doc(db, 'elections', month, 'candidates', candidateUid);
  const voteRef = doc(db, 'elections', month, 'votes', voterUid);

  try {
    await runTransaction(db, async (tx) => {
      const voteSnap = await tx.get(voteRef);
      if (voteSnap.exists()) throw new Error('ALREADY_VOTED');
      const elecSnap = await tx.get(elecRef);
      if (!elecSnap.exists() || elecSnap.data().status !== 'open') {
        throw new Error('Election is closed.');
      }
      const candSnap = await tx.get(candRef);
      if (!candSnap.exists()) throw new Error('Candidate not found.');

      tx.set(voteRef, {
        voterUid,
        candidateUid,
        createdAt: serverTimestamp(),
      });
      tx.update(candRef, {
        votes: Math.trunc(Number(candSnap.data().votes ?? 0) + 1),
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'ALREADY_VOTED') throw err;
    handleFirestoreError(err, OperationType.WRITE, `elections/${month}/votes/${voterUid}`);
  }
}

export async function resolveMayorElectionLive(
  month: string,
  candidates: ElectionCandidateDoc[]
): Promise<ElectionCandidateDoc | null> {
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => b.votes - a.votes || a.createdAt - b.createdAt);
  const winner = sorted[0];
  const elecRef = doc(db, 'elections', month);
  const candRef = doc(db, 'elections', month, 'candidates', winner.uid);

  try {
    let won = false;
    await runTransaction(db, async (tx) => {
      const elecSnap = await tx.get(elecRef);
      if (!elecSnap.exists() || elecSnap.data().status !== 'open') return;
      const candSnap = await tx.get(candRef);
      if (!candSnap.exists()) return;
      const officialVotes = Number(candSnap.data().votes ?? 0);

      tx.update(elecRef, {
        status: 'closed',
        winnerUid: winner.uid,
        winnerUsername: String(candSnap.data().username || winner.username),
        winnerVotes: Math.trunc(officialVotes),
        closedAt: serverTimestamp(),
      });
      won = true;
    });
    if (won) {
      await publishNewsItemLive({
        category: 'mayor',
        headlineEn: `@${winner.username} elected Mayor of Ente Veedu for ${month}!`,
        headlineMl: `@${winner.username} എന്റെ വീടിന്റെ പുതിയ മേയറായി തിരഞ്ഞെടുക്കപ്പെട്ടു!`,
      }).catch(() => {});
      return winner;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `elections/${month}`);
  }
}

export async function claimMayorNameplateLive(uid: string, month: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'players', uid), {
      mayorMonth: month,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function mayorBuildSuggestionLive(params: {
  month: string;
  mayorUid: string;
  suggestion: SuggestionDoc;
  players: PlayerDoc[];
  buildings: BuildingDoc[];
}): Promise<BuildingDoc> {
  const { month, mayorUid, suggestion, players, buildings } = params;
  const elecRef = doc(db, 'elections', month);
  const sugRef = doc(db, 'suggestions', suggestion.id);
  const buildingRef = doc(collection(db, 'buildings'));
  const plot = getNextBuildingPlot(suggestion.buildingType, players, buildings);

  try {
    await runTransaction(db, async (tx) => {
      const elecSnap = await tx.get(elecRef);
      if (!elecSnap.exists()) throw new Error('Election not found.');
      const eData = elecSnap.data();
      if (eData.status !== 'closed' || eData.winnerUid !== mayorUid || eData.mayorUsedBuild) {
        throw new Error('Mayor build unavailable.');
      }
      const sugSnap = await tx.get(sugRef);
      if (!sugSnap.exists() || sugSnap.data().status !== 'open') {
        throw new Error('Suggestion already built.');
      }

      tx.update(elecRef, { mayorUsedBuild: true });
      tx.update(sugRef, { status: 'built', updatedAt: serverTimestamp() });
      tx.set(buildingRef, {
        type: suggestion.buildingType,
        label: suggestion.text.slice(0, 80),
        x: Math.trunc(plot.x),
        y: Math.trunc(plot.y),
        suggestionId: suggestion.id,
        electionMonth: month,
        builtByUid: mayorUid,
        builtAt: serverTimestamp(),
      });
    });

    await publishNewsItemLive({
      category: 'mayor',
      headlineEn: `Mayor commissioned ${suggestion.text}!`,
      headlineMl: `മേയർ ${suggestion.text} നിർമ്മാണം പൂർത്തിയാക്കി!`,
    }).catch(() => {});

    return {
      id: buildingRef.id,
      type: suggestion.buildingType,
      label: suggestion.text,
      x: plot.x,
      y: plot.y,
      suggestionId: suggestion.id,
      electionMonth: month,
      builtByUid: mayorUid,
      builtAt: Date.now(),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `buildings/${buildingRef.id}`);
  }
}

export async function contributeFestivalGoalLive(
  yearFestKey: string,
  festivalId: FestivalId
): Promise<void> {
  const ref = doc(db, 'festivals', yearFestKey);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        tx.set(ref, {
          festivalId,
          count: 1,
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.update(ref, {
          count: Math.trunc(Number(snap.data().count ?? 0) + 1),
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `festivals/${yearFestKey}`);
  }
}

export async function publishNewsItemLive(params: {
  category: NewsCategory;
  headlineEn: string;
  headlineMl: string;
}): Promise<void> {
  try {
    await addDoc(collection(db, 'news'), {
      category: params.category,
      headlineEn: params.headlineEn.slice(0, 120),
      headlineMl: params.headlineMl.slice(0, 120),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'news');
  }
}

// ---------- Functional Town Buildings Live Services ----------

export async function buyMallOutfitLive(uid: string, outfit: MallOutfitOption): Promise<void> {
  const playerRef = doc(db, 'players', uid);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) throw new Error('Player not found.');
      const d = snap.data();
      const unlocked = Array.isArray(d.unlockedItems) ? (d.unlockedItems as string[]) : [];
      const alreadyOwned = unlocked.includes(outfit.id);
      const coins = Number(d.coins ?? 0);
      if (!alreadyOwned && coins < outfit.price) throw new Error('NOT_ENOUGH_COINS');

      if (alreadyOwned) {
        tx.update(playerRef, {
          outfitType: outfit.outfitType,
          outfitColor: outfit.outfitColor,
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.update(playerRef, {
          coins: Math.trunc(coins - outfit.price),
          outfitType: outfit.outfitType,
          outfitColor: outfit.outfitColor,
          unlockedItems: [...unlocked, outfit.id],
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_ENOUGH_COINS') throw err;
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function buyMallAccessoryLive(uid: string, acc: MallAccessoryOption): Promise<void> {
  const playerRef = doc(db, 'players', uid);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) throw new Error('Player not found.');
      const d = snap.data();
      const unlocked = Array.isArray(d.unlockedItems) ? (d.unlockedItems as string[]) : [];
      const alreadyOwned = unlocked.includes(acc.itemId);
      const coins = Number(d.coins ?? 0);
      if (!alreadyOwned && coins < acc.price) throw new Error('NOT_ENOUGH_COINS');

      if (alreadyOwned) {
        const nextAcc: AccessoryId = d.accessory === acc.id ? 'none' : acc.id;
        tx.update(playerRef, {
          accessory: nextAcc,
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.update(playerRef, {
          coins: Math.trunc(coins - acc.price),
          accessory: acc.id,
          unlockedItems: [...unlocked, acc.itemId],
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_ENOUGH_COINS') throw err;
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function buyMallFurnitureLive(uid: string, furn: MallFurnitureOption): Promise<void> {
  const playerRef = doc(db, 'players', uid);
  let wardId = 1;
  let spent = 0;
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) throw new Error('Player not found.');
      const d = snap.data();
      const owned = Array.isArray(d.furniture) ? (d.furniture as FurnitureId[]) : [];
      if (owned.includes(furn.id)) return;
      const coins = Number(d.coins ?? 0);
      if (coins < furn.price) throw new Error('NOT_ENOUGH_COINS');
      const unlocked = Array.isArray(d.unlockedItems) ? (d.unlockedItems as string[]) : [];
      wardId = getWardNumber(Number(d.plotX ?? 0), Number(d.plotY ?? 0));
      spent = furn.price;

      const patch: Record<string, unknown> = {
        coins: Math.trunc(coins - furn.price),
        furniture: [...owned, furn.id],
        updatedAt: serverTimestamp(),
      };
      if (!unlocked.includes(furn.itemId)) {
        patch.unlockedItems = [...unlocked, furn.itemId];
      }
      tx.update(playerRef, patch);
    });
    if (spent > 0) {
      await incrementWardStatLive(getCurrentWeekKey(), wardId, 'decorCoinsSpent', spent).catch(() => {});
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_ENOUGH_COINS') throw err;
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function spendHealthBoostLive(
  uid: string,
  price: number,
  healAmount: number
): Promise<void> {
  const playerRef = doc(db, 'players', uid);
  const cost = Math.max(1, Math.trunc(price));
  const boost = Math.max(1, Math.min(100, Math.trunc(healAmount)));
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) throw new Error('Player not found.');
      const d = snap.data();
      const coins = Number(d.coins ?? 0);
      if (coins < cost) throw new Error('NOT_ENOUGH_COINS');
      const curHealth = d.health !== undefined ? Number(d.health) : 100;
      const nextHealth = Math.min(100, curHealth + boost);
      const patch: Record<string, unknown> = {
        coins: Math.trunc(coins - cost),
        health: Math.trunc(nextHealth),
        updatedAt: serverTimestamp(),
      };
      if (nextHealth >= 100) {
        patch.lastInjuryReason = '';
      }
      tx.update(playerRef, patch);
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_ENOUGH_COINS') throw err;
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function claimSchoolQuizLive(uid: string): Promise<number> {
  const today = getLocalDateKey();
  const playerRef = doc(db, 'players', uid);
  let awarded = 0;
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) throw new Error('Player not found.');
      const d = snap.data();
      if (String(d.quizDate || '') >= today) return;
      awarded = 10;
      tx.update(playerRef, {
        coins: Math.trunc(Number(d.coins ?? 0) + 10),
        quizDate: today,
        updatedAt: serverTimestamp(),
      });
    });
    return awarded;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function applyActivityHealthLive(
  uid: string,
  deltaHealth: number,
  injuryReason?: string
): Promise<void> {
  const playerRef = doc(db, 'players', uid);
  const delta = Math.trunc(deltaHealth);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) return;
      const d = snap.data();
      const cur = d.health !== undefined ? Number(d.health) : 100;
      const next = Math.max(10, Math.min(100, cur + delta));
      const patch: Record<string, unknown> = {
        health: Math.trunc(next),
        updatedAt: serverTimestamp(),
      };
      if (delta < 0) {
        patch.lastInjuryReason = (injuryReason || 'Village tumble').slice(0, 80);
      } else if (next >= 100) {
        patch.lastInjuryReason = '';
      }
      tx.update(playerRef, patch);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function hospitalHealLive(uid: string, usePaidTonic: boolean): Promise<void> {
  if (usePaidTonic) {
    await spendHealthBoostLive(uid, 3, 100);
  } else {
    await applyActivityHealthLive(uid, 25);
  }
}

export async function bankDepositLive(uid: string, amount: number): Promise<void> {
  const amt = Math.trunc(amount);
  if (amt <= 0) return;
  const playerRef = doc(db, 'players', uid);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) throw new Error('Player not found.');
      const d = snap.data();
      const coins = Number(d.coins ?? 0);
      const vault = Number(d.bankBalance ?? 0);
      if (coins < amt) throw new Error('NOT_ENOUGH_COINS');
      tx.update(playerRef, {
        coins: Math.trunc(coins - amt),
        bankBalance: Math.trunc(vault + amt),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_ENOUGH_COINS') throw err;
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function bankWithdrawLive(uid: string, amount: number): Promise<void> {
  const amt = Math.trunc(amount);
  if (amt <= 0) return;
  const playerRef = doc(db, 'players', uid);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) throw new Error('Player not found.');
      const d = snap.data();
      const coins = Number(d.coins ?? 0);
      const vault = Number(d.bankBalance ?? 0);
      if (vault < amt) throw new Error('INSUFFICIENT_VAULT');
      tx.update(playerRef, {
        coins: Math.trunc(coins + amt),
        bankBalance: Math.trunc(vault - amt),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'INSUFFICIENT_VAULT') throw err;
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

export async function bankClaimInterestLive(uid: string): Promise<number> {
  const today = getLocalDateKey();
  const playerRef = doc(db, 'players', uid);
  let interest = 0;
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) throw new Error('Player not found.');
      const d = snap.data();
      const vault = Number(d.bankBalance ?? 0);
      if (vault < 1 || String(d.lastInterestDate || '') >= today) return;
      interest = Math.min(15, Math.max(1, Math.floor(vault / 20)));
      tx.update(playerRef, {
        bankBalance: Math.trunc(vault + interest),
        lastInterestDate: today,
        updatedAt: serverTimestamp(),
      });
    });
    return interest;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `players/${uid}`);
  }
}

function mapPostcardDoc(id: string, data: Record<string, unknown>): PostcardDoc {
  return {
    id,
    senderUid: String(data.senderUid || ''),
    senderUsername: String(data.senderUsername || ''),
    recipientUid: String(data.recipientUid || ''),
    recipientUsername: String(data.recipientUsername || ''),
    stamp: (String(data.stamp || 'houseboat') as PostcardStamp),
    message: String(data.message || ''),
    read: Boolean(data.read),
    createdAt: toMillis(data.createdAt),
  };
}

export function subscribePostcardsLive(
  uid: string,
  onReceived: (cards: PostcardDoc[]) => void,
  onSent: (cards: PostcardDoc[]) => void
): () => void {
  const unsub1 = onSnapshot(
    query(collection(db, 'postcards'), where('recipientUid', '==', uid), limit(30)),
    (snap) => {
      const list = snap.docs
        .map((d) => mapPostcardDoc(d.id, d.data()))
        .sort((a, b) => b.createdAt - a.createdAt);
      onReceived(list);
    },
    () => onReceived([])
  );

  const unsub2 = onSnapshot(
    query(collection(db, 'postcards'), where('senderUid', '==', uid), limit(30)),
    (snap) => {
      const list = snap.docs
        .map((d) => mapPostcardDoc(d.id, d.data()))
        .sort((a, b) => b.createdAt - a.createdAt);
      onSent(list);
    },
    () => onSent([])
  );

  return () => {
    unsub1();
    unsub2();
  };
}

export async function sendPostcardLive(params: {
  senderUid: string;
  senderUsername: string;
  recipientUid: string;
  recipientUsername: string;
  stamp: PostcardStamp;
  message: string;
}): Promise<void> {
  try {
    await addDoc(collection(db, 'postcards'), {
      senderUid: params.senderUid,
      senderUsername: params.senderUsername,
      recipientUid: params.recipientUid,
      recipientUsername: params.recipientUsername,
      stamp: params.stamp,
      message: params.message.trim().slice(0, 120),
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'postcards');
  }
}

export async function markPostcardReadLive(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'postcards', id), { read: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `postcards/${id}`);
  }
}

export function subscribeCinemaLive(
  hourKey: string,
  onSeats: (seats: CinemaSeatDoc[]) => void,
  onChat: (chat: CinemaChatDoc[]) => void
): () => void {
  const unsubSeats = onSnapshot(
    query(collection(db, 'cinema_seats'), limit(60)),
    (snap) => {
      const list: CinemaSeatDoc[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: String(data.uid || d.id),
          username: String(data.username || ''),
          row: Number(data.row ?? 0),
          col: Number(data.col ?? 0),
          updatedAt: toMillis(data.updatedAt),
        };
      });
      onSeats(list);
    },
    () => onSeats([])
  );

  const unsubChat = onSnapshot(
    query(collection(db, 'cinema_chat'), where('hourKey', '==', hourKey), limit(40)),
    (snap) => {
      const list: CinemaChatDoc[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            authorUid: String(data.authorUid || ''),
            authorUsername: String(data.authorUsername || ''),
            text: String(data.text || ''),
            hourKey: String(data.hourKey || hourKey),
            createdAt: toMillis(data.createdAt),
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);
      onChat(list);
    },
    () => onChat([])
  );

  return () => {
    unsubSeats();
    unsubChat();
  };
}

export async function sitCinemaSeatLive(
  uid: string,
  username: string,
  row: number,
  col: number
): Promise<void> {
  try {
    await setDoc(doc(db, 'cinema_seats', uid), {
      uid,
      username,
      row: Math.trunc(row),
      col: Math.trunc(col),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `cinema_seats/${uid}`);
  }
}

export async function leaveCinemaSeatLive(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'cinema_seats', uid));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `cinema_seats/${uid}`);
  }
}

export async function sendCinemaChatLive(
  uid: string,
  username: string,
  text: string,
  hourKey: string
): Promise<void> {
  try {
    await addDoc(collection(db, 'cinema_chat'), {
      authorUid: uid,
      authorUsername: username,
      text: text.trim().slice(0, 120),
      hourKey,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'cinema_chat');
  }
}
