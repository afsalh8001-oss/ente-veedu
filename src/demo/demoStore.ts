import {
  AccessoryId,
  BuildingDoc,
  CHAYA_KADA_CENTER,
  ChatMessageDoc,
  ChatReportDoc,
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
  OUTFIT_COLORS,
  OutfitType,
  PlayerDoc,
  PLOT_SHOP_CATALOG,
  PostcardDoc,
  PostcardStamp,
  RaceDoc,
  RaceParticipantDoc,
  ROOF_COLORS,
  ShopItem,
  ShopType,
  SKIN_TONES,
  STREAK_MILESTONES,
  SuggestionDoc,
  TownStageId,
  VallamTeam,
  VillageMetaDoc,
  WALL_COLORS,
  WardStatDoc,
  YardAddition,
} from '../types/village';
import { getCurrentMonthKey } from '../utils/festivals';
import { getNextBuildingPlot, getNextSpiralPlot } from '../utils/spiral';
import {
  getCurrentHourKey,
  MallAccessoryOption,
  MallFurnitureOption,
  MallOutfitOption,
} from '../utils/townBuildings';
import {
  getLocalDateKey,
  getVallamSchedule,
  getYesterdayLocalDateKey,
  pickWinningTeam,
} from '../utils/vallamKali';
import { getCurrentWeekKey, getWardNumber } from '../utils/wards';

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const DEMO_PLAYER_STORAGE_KEY = 'ente_veedu_demo_player';

export interface DemoState {
  players: PlayerDoc[];
  suggestions: SuggestionDoc[];
  buildings: BuildingDoc[];
  doors: DoorMessageDoc[];
  chat: ChatMessageDoc[];
  chayaPresence: ChayaPresenceDoc[];
  reports: ChatReportDoc[];
  activeRace: RaceDoc | null;
  raceParticipants: Map<string, RaceParticipantDoc>;
  raceHistory: RaceDoc[];
  meta: VillageMetaDoc;
  votedSuggestionIds: Set<string>;
  heartedPlayerUids: Set<string>;
  lastSuggestionAtByUid: Map<string, number>;
  // Town Growth System
  wardStats: WardStatDoc[];
  election: ElectionDoc | null;
  electionCandidates: ElectionCandidateDoc[];
  votedMayorMonth: string | null;
  festivalProgress: Map<string, FestivalProgressDoc>;
  news: NewsItemDoc[];
  demoStageOverride: TownStageId | null;
  demoFestivalOverride: FestivalId | null;
  // Functional Town Buildings
  postcards: PostcardDoc[];
  cinemaSeats: CinemaSeatDoc[];
  cinemaChat: CinemaChatDoc[];
}

const DEMO_RESIDENT_SEEDS: { username: string; style: HouseStyle; outfit: OutfitType }[] = [
  { username: 'kuttan_founder', style: 'tharavad', outfit: 'mundu' },
  { username: 'ammu_kochi', style: 'nalukettu', outfit: 'sari' },
  { username: 'unni_thrissur', style: 'tiled', outfit: 'shirt' },
  { username: 'meera_alappuzha', style: 'tiled', outfit: 'sari' },
  { username: 'rahul_munnar', style: 'modern', outfit: 'shirt' },
  { username: 'lakshmi_palakkad', style: 'nalukettu', outfit: 'sari' },
  { username: 'faisal_kozhikode', style: 'modern', outfit: 'mundu' },
  { username: 'mariamma_kottayam', style: 'tiled', outfit: 'sari' },
  { username: 'vishnu_varkala', style: 'tiled', outfit: 'mundu' },
  { username: 'arya_kannur', style: 'modern', outfit: 'sari' },
  { username: 'gopalan_wayanad', style: 'tharavad', outfit: 'mundu' },
  { username: 'sneha_ernakulam', style: 'nalukettu', outfit: 'sari' },
  { username: 'jithin_kollam', style: 'tiled', outfit: 'shirt' },
  { username: 'divya_trivandrum', style: 'modern', outfit: 'sari' },
  { username: 'suresh_guruvayur', style: 'tiled', outfit: 'mundu' },
  { username: 'nasreen_malappuram', style: 'nalukettu', outfit: 'sari' },
  { username: 'arjun_idukki', style: 'tiled', outfit: 'shirt' },
  { username: 'kavya_kasaragod', style: 'modern', outfit: 'sari' },
  { username: 'mathew_pala', style: 'tharavad', outfit: 'shirt' },
  { username: 'devika_kodungallur', style: 'tiled', outfit: 'sari' },
  { username: 'nikhil_angamaly', style: 'modern', outfit: 'shirt' },
  { username: 'radha_ottapalam', style: 'nalukettu', outfit: 'sari' },
  { username: 'bilal_ponnani', style: 'tiled', outfit: 'mundu' },
  { username: 'anjali_cherthala', style: 'tiled', outfit: 'sari' },
  { username: 'praveen_thodupuzha', style: 'modern', outfit: 'shirt' },
  { username: 'revathi_aranmula', style: 'tharavad', outfit: 'sari' },
  { username: 'joseph_kumarakom', style: 'tiled', outfit: 'mundu' },
  { username: 'shilpa_chalakudy', style: 'modern', outfit: 'sari' },
  { username: 'vineeth_thalassery', style: 'tiled', outfit: 'shirt' },
  { username: 'lekha_mavelikkara', style: 'nalukettu', outfit: 'sari' },
];

export function loadSavedDemoPlayer(): PlayerDoc | null {
  try {
    const raw = localStorage.getItem(DEMO_PLAYER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayerDoc;
    if (parsed && typeof parsed.username === 'string' && typeof parsed.plotX === 'number') {
      return {
        ...parsed,
        coins: Number(parsed.coins ?? 0),
        health: Number(parsed.health ?? 100),
        bankBalance: Number(parsed.bankBalance ?? 0),
        furniture: Array.isArray(parsed.furniture) ? parsed.furniture : [],
        streak: Number(parsed.streak ?? 0),
        dailyTasks: Array.isArray(parsed.dailyTasks) ? parsed.dailyTasks : [],
        claimedMilestones: Array.isArray(parsed.claimedMilestones) ? parsed.claimedMilestones : [],
        unlockedItems: Array.isArray(parsed.unlockedItems) ? parsed.unlockedItems : [],
        claimedRaceDates: Array.isArray(parsed.claimedRaceDates) ? parsed.claimedRaceDates : [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveDemoPlayer(player: PlayerDoc): void {
  try {
    localStorage.setItem(DEMO_PLAYER_STORAGE_KEY, JSON.stringify(player));
    localStorage.setItem('ente_veedu_uid', player.uid);
    localStorage.setItem('ente_veedu_username', player.username);
  } catch {
    // ignore storage errors
  }
}

export function createInitialDemoState(): DemoState {
  const buildings: BuildingDoc[] = [
    {
      id: 'b_chaya_centre',
      type: 'chaya_kada',
      label: 'Kuttan Chettan Chaya Kada',
      x: CHAYA_KADA_CENTER.x,
      y: CHAYA_KADA_CENTER.y,
      builtByUid: 'demo_0',
      builtAt: now - 7 * DAY,
    },
    {
      id: 'b_jetty_1',
      type: 'ferry_jetty',
      label: 'Kadavu Ferry Jetty',
      x: 1,
      y: 5,
      builtByUid: 'demo_1',
      builtAt: now - 3 * DAY,
    },
  ];

  const players: PlayerDoc[] = [];
  const additionPool: YardAddition[] = [
    'coconutTree',
    'vegGarden',
    'cowShed',
    'swing',
    'rangoli',
    'pookalam',
  ];

  DEMO_RESIDENT_SEEDS.forEach((seed, idx) => {
    const plot = getNextSpiralPlot(players, buildings);
    const additions: YardAddition[] = ['coconutTree'];
    if (idx % 2 === 0) additions.push(additionPool[(idx + 1) % additionPool.length]);
    if (idx % 3 === 0) additions.push(additionPool[(idx + 3) % additionPool.length]);
    if (idx === 0) additions.push('nilavilakku', 'tulsiThara');
    if (idx === 3) additions.push('smallBoat');

    const shopChoices: ShopType[] = ['bakery', 'flower_shop', 'tailor', 'fish_stall', 'chaya_kada'];
    players.push({
      uid: `demo_${idx}`,
      username: seed.username,
      plotX: plot.x,
      plotY: plot.y,
      houseStyle: seed.style,
      roofColor: ROOF_COLORS[idx % ROOF_COLORS.length].hex,
      wallColor: WALL_COLORS[idx % WALL_COLORS.length].hex,
      skinTone: SKIN_TONES[idx % SKIN_TONES.length],
      outfitType: seed.outfit,
      outfitColor: OUTFIT_COLORS[idx % OUTFIT_COLORS.length].hex,
      additions,
      heartsCount: Math.max(1, 16 - (idx % 12)),
      coins: 20 + idx * 3,
      health: 100,
      bankBalance: 10 + idx * 2,
      accessory: idx === 0 ? 'umbrella' : idx === 1 ? 'garland' : idx === 4 ? 'sunglasses' : undefined,
      furniture: idx === 0 ? ['brass_uruli'] : undefined,
      streak: idx % 9,
      shopType: idx === 1 ? 'bakery' : idx === 4 ? 'flower_shop' : idx === 7 ? shopChoices[idx % 5] : undefined,
      boatBadgeUntil: idx === 3 ? now + 5 * DAY : undefined,
      createdAt: now - (30 - idx) * DAY,
      updatedAt: now - DAY,
    });
  });

  // Restore returning demo player if already claimed
  const savedMine = loadSavedDemoPlayer();
  if (savedMine && !players.some((p) => p.username === savedMine.username)) {
    const collision = players.some(
      (p) => p.plotX === savedMine.plotX && p.plotY === savedMine.plotY
    );
    if (collision) {
      const next = getNextSpiralPlot(players, buildings);
      savedMine.plotX = next.x;
      savedMine.plotY = next.y;
    }
    players.push(savedMine);
  }

  const suggestions: SuggestionDoc[] = [
    {
      id: 'sug_library',
      text: 'Build a Vayanasala Library under the banyan tree',
      buildingType: 'library',
      authorUid: 'demo_1',
      authorUsername: 'ammu_kochi',
      votes: 4,
      status: 'open',
      createdAt: now - 5 * 3600 * 1000,
      updatedAt: now - 3600 * 1000,
    },
    {
      id: 'sug_temple',
      text: 'Village Temple with lotus kulam pond',
      buildingType: 'temple',
      authorUid: 'demo_5',
      authorUsername: 'lakshmi_palakkad',
      votes: 3,
      status: 'open',
      createdAt: now - 4 * 3600 * 1000,
      updatedAt: now - 3600 * 1000,
    },
    {
      id: 'sug_bus',
      text: 'KSRTC Bus Stand near main crossroads',
      buildingType: 'bus_stand',
      authorUid: 'demo_6',
      authorUsername: 'faisal_kozhikode',
      votes: 2,
      status: 'open',
      createdAt: now - 2 * 3600 * 1000,
      updatedAt: now - 2 * 3600 * 1000,
    },
  ];

  const doors: DoorMessageDoc[] = [
    {
      id: 'door_1',
      targetUid: 'demo_0',
      authorUid: 'demo_1',
      authorUsername: 'ammu_kochi',
      message: 'Namaskaram Kuttan chetta! Great chaya today.',
      createdAt: now - 12 * 3600 * 1000,
    },
    {
      id: 'door_2',
      targetUid: 'demo_1',
      authorUid: 'demo_5',
      authorUsername: 'lakshmi_palakkad',
      message: 'Love your pookalam and garden!',
      createdAt: now - 6 * 3600 * 1000,
    },
  ];

  const chat: ChatMessageDoc[] = [
    {
      id: 'chat_1',
      authorUid: 'demo_0',
      authorUsername: 'kuttan_founder',
      text: 'Namaskaram! Fresh samovar chaya and pazham pori ready.',
      createdAt: now - 18 * 60 * 1000,
    },
    {
      id: 'chat_2',
      authorUid: 'demo_1',
      authorUsername: 'ammu_kochi',
      text: 'Chaya kudikkaam? Loving the evening breeze by the canal.',
      createdAt: now - 8 * 60 * 1000,
    },
    {
      id: 'chat_3',
      authorUid: 'demo_3',
      authorUsername: 'meera_alappuzha',
      text: 'See everyone Saturday 8 PM IST for Vallam Kali!',
      createdAt: now - 3 * 60 * 1000,
    },
  ];

  const chayaPresence: ChayaPresenceDoc[] = [
    { uid: 'demo_0', username: 'kuttan_founder', lastSeen: now },
    { uid: 'demo_1', username: 'ammu_kochi', lastSeen: now },
    { uid: 'demo_3', username: 'meera_alappuzha', lastSeen: now },
  ];

  const raceHistory: RaceDoc[] = [
    {
      id: '2026-11-14',
      date: '2026-11-14',
      status: 'finished',
      scores: { chundan_red: 412, backwater_blue: 468, paddy_green: 390, coconut_gold: 355 },
      winnerTeam: 'backwater_blue',
      participantCount: 19,
      startedAt: now - 3 * DAY,
      finishedAt: now - 3 * DAY + 600_000,
    },
    {
      id: '2026-11-07',
      date: '2026-11-07',
      status: 'finished',
      scores: { chundan_red: 505, backwater_blue: 430, paddy_green: 472, coconut_gold: 401 },
      winnerTeam: 'chundan_red',
      participantCount: 16,
      startedAt: now - 10 * DAY,
      finishedAt: now - 10 * DAY + 600_000,
    },
  ];

  const schedule = getVallamSchedule(now);
  const activeRace: RaceDoc | null = schedule.isLive
    ? {
        id: schedule.raceDateId,
        date: schedule.raceDateId,
        status: 'live',
        scores: { chundan_red: 24, backwater_blue: 27, paddy_green: 21, coconut_gold: 19 },
        participantCount: 8,
        startedAt: schedule.raceStartUtcMs,
      }
    : null;

  const weekKey = getCurrentWeekKey();
  const monthKey = getCurrentMonthKey();

  const wardStats: WardStatDoc[] = [
    { id: `${weekKey}_1`, weekKey, wardId: 1, tasksCompleted: 28, decorCoinsSpent: 120, updatedAt: now },
    { id: `${weekKey}_2`, weekKey, wardId: 2, tasksCompleted: 19, decorCoinsSpent: 85, updatedAt: now },
    { id: `${weekKey}_3`, weekKey, wardId: 3, tasksCompleted: 14, decorCoinsSpent: 65, updatedAt: now },
  ];

  const election: ElectionDoc = {
    month: monthKey,
    status: 'open',
    startedAt: now - 4 * DAY,
  };

  const electionCandidates: ElectionCandidateDoc[] = [
    {
      uid: 'demo_7',
      username: 'mariamma_kottayam',
      manifesto: 'Solar lamps for every lane and a lively Vayanasala library!',
      votes: 9,
      createdAt: now - 3 * DAY,
    },
    {
      uid: 'demo_16',
      username: 'arjun_idukki',
      manifesto: 'Clean backwater canals, weekly Vallam Kali, and spice stalls.',
      votes: 7,
      createdAt: now - 2 * DAY,
    },
  ];

  const news: NewsItemDoc[] = [
    {
      id: 'news_1',
      category: 'building',
      headlineEn: 'Kadavu Ferry Jetty opened by village residents!',
      headlineMl: 'കടവ് ബോട്ട് ജെട്ടി നാട്ടുകാർക്കായി തുറന്നു!',
      createdAt: now - 3 * DAY,
    },
    {
      id: 'news_2',
      category: 'race',
      headlineEn: 'Backwater Blue won Saturday’s Vallam Kali boat sprint!',
      headlineMl: 'ശനിയാഴ്ചത്തെ വള്ളംകളിയിൽ കായൽ നീല ടീം വിജയിച്ചു!',
      createdAt: now - 2 * DAY,
    },
    {
      id: 'news_3',
      category: 'ward',
      headlineEn: 'Ward 1 leads Cleanest & Most Decorated Ward rankings this week.',
      headlineMl: 'ഈ ആഴ്ച ഏറ്റവും വൃത്തിയുള്ള വാർഡായി വാർഡ് 1 മുന്നിൽ.',
      createdAt: now - 12 * 3600 * 1000,
    },
  ];

  const hourKey = getCurrentHourKey();
  const cinemaSeats: CinemaSeatDoc[] = [
    { uid: 'demo_1', username: 'ammu_kochi', row: 1, col: 2, updatedAt: now - 60_000 },
    { uid: 'demo_2', username: 'unni_thrissur', row: 1, col: 3, updatedAt: now - 45_000 },
    { uid: 'demo_6', username: 'faisal_kozhikode', row: 2, col: 4, updatedAt: now - 30_000 },
  ];
  const cinemaChat: CinemaChatDoc[] = [
    {
      id: 'cchat_1',
      authorUid: 'demo_1',
      authorUsername: 'ammu_kochi',
      text: 'This backwater film soundtrack is so soothing!',
      hourKey,
      createdAt: now - 90_000,
    },
    {
      id: 'cchat_2',
      authorUid: 'demo_2',
      authorUsername: 'unni_thrissur',
      text: 'Brought banana chips from the Mall Food Court 🍌',
      hourKey,
      createdAt: now - 40_000,
    },
  ];

  const savedUid = savedMine?.uid || 'demo_visitor';
  const savedName = savedMine?.username || 'neighbour';
  const postcards: PostcardDoc[] = [
    {
      id: 'pc_welcome',
      senderUid: 'demo_0',
      senderUsername: 'kuttan_founder',
      recipientUid: savedUid,
      recipientUsername: savedName,
      stamp: 'houseboat',
      message: 'Welcome to Ente Veedu! Stop by Chaya Kada anytime.',
      read: false,
      createdAt: now - 3600 * 1000,
    },
  ];

  return {
    players,
    suggestions,
    buildings,
    doors,
    chat,
    chayaPresence,
    reports: [],
    activeRace,
    raceParticipants: new Map(),
    raceHistory,
    meta: {
      nextResolutionAt: now + DAY,
      lastResolvedBuilding: 'Kadavu Ferry Jetty',
      updatedByUid: 'demo_0',
      updatedAt: now,
    },
    votedSuggestionIds: new Set<string>(),
    heartedPlayerUids: new Set<string>(),
    lastSuggestionAtByUid: new Map<string, number>(),
    wardStats,
    election,
    electionCandidates,
    votedMayorMonth: null,
    festivalProgress: new Map(),
    news,
    demoStageOverride: null,
    demoFestivalOverride: null,
    postcards,
    cinemaSeats,
    cinemaChat,
  };
}

export function demoCheckUsername(state: DemoState, username: string): boolean {
  return !state.players.some((p) => p.username === username);
}

export function demoClaimPlot(
  state: DemoState,
  params: {
    uid: string;
    username: string;
    skinTone: string;
    outfitType: OutfitType;
    outfitColor: string;
  }
): { nextState: DemoState; player: PlayerDoc } {
  const plot = getNextSpiralPlot(state.players, state.buildings);
  const player: PlayerDoc = {
    uid: params.uid,
    username: params.username,
    plotX: plot.x,
    plotY: plot.y,
    houseStyle: 'tiled',
    roofColor: '#b85038',
    wallColor: '#f6f2e9',
    skinTone: params.skinTone,
    outfitType: params.outfitType,
    outfitColor: params.outfitColor,
    additions: ['coconutTree'],
    heartsCount: 0,
    coins: 20,
    health: 100,
    bankBalance: 0,
    furniture: [],
    streak: 0,
    dailyTasks: [],
    claimedMilestones: [],
    unlockedItems: [],
    claimedRaceDates: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  saveDemoPlayer(player);

  return {
    player,
    nextState: {
      ...state,
      players: [...state.players, player],
    },
  };
}

export function demoCustomizeHouse(
  state: DemoState,
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
): DemoState {
  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const updated = { ...p, ...updates, updatedAt: Date.now() };
    saveDemoPlayer(updated);
    return updated;
  });

  return {
    ...state,
    players: nextPlayers,
  };
}

export function demoClaimDailyTask(
  state: DemoState,
  uid: string,
  taskId: DailyTaskId
): { nextState: DemoState; earned: number; completedAll: boolean } {
  const today = getLocalDateKey();
  const yesterday = getYesterdayLocalDateKey();
  let earned = 0;
  let completedAll = false;

  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const prevTasks = p.dailyCoinsDate === today && Array.isArray(p.dailyTasks) ? p.dailyTasks : [];
    if (prevTasks.includes(taskId)) return p;

    const nextTasks = [...prevTasks, taskId];
    completedAll = nextTasks.length === 4;
    earned = completedAll ? 15 : 5;
    const prevEarnedToday = p.dailyCoinsDate === today ? Number(p.dailyCoinsEarned ?? 0) : 0;

    let nextStreak = p.streak || 0;
    if (p.lastClaimDate !== today) {
      nextStreak = p.lastClaimDate === yesterday ? nextStreak + 1 : 1;
    }

    const updated: PlayerDoc = {
      ...p,
      coins: (p.coins || 0) + earned,
      streak: nextStreak,
      lastClaimDate: today,
      dailyTasks: nextTasks,
      dailyCoinsDate: today,
      dailyCoinsEarned: prevEarnedToday + earned,
      wateredDate: taskId === 'waterTree' ? today : p.wateredDate,
      fedCowDate: taskId === 'feedCow' ? today : p.fedCowDate,
      sweptDate: taskId === 'sweepYard' ? today : p.sweptDate,
      litLampDate: taskId === 'lightLamp' ? today : p.litLampDate,
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });

  const actor = nextPlayers.find((p) => p.uid === uid);
  let nextState: DemoState = { ...state, players: nextPlayers };
  if (actor && earned > 0) {
    nextState = demoIncrementWardStat(nextState, getWardNumber(actor.plotX, actor.plotY), 'tasksCompleted', 1);
  }

  return {
    earned,
    completedAll,
    nextState,
  };
}

export function demoClaimStreakMilestone(
  state: DemoState,
  uid: string,
  days: number
): { nextState: DemoState; bonus: number } {
  const milestone = STREAK_MILESTONES.find((m) => m.days === days);
  if (!milestone) return { nextState: state, bonus: 0 };
  let bonus = 0;

  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const claimed = Array.isArray(p.claimedMilestones) ? p.claimedMilestones : [];
    if ((p.streak || 0) < days || claimed.includes(days)) return p;
    bonus = milestone.bonus;
    const updated: PlayerDoc = {
      ...p,
      coins: (p.coins || 0) + milestone.bonus,
      claimedMilestones: [...claimed, days],
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });

  return { bonus, nextState: { ...state, players: nextPlayers } };
}

export function demoPurchaseShopItem(
  state: DemoState,
  uid: string,
  item: ShopItem
): { nextState: DemoState; error?: string } {
  const player = state.players.find((p) => p.uid === uid);
  if (!player) return { nextState: state, error: 'NO_PLAYER' };
  const unlocked = Array.isArray(player.unlockedItems) ? player.unlockedItems : [];
  if (unlocked.includes(item.id)) return { nextState: state };
  if ((player.coins || 0) < item.price) return { nextState: state, error: 'NOT_ENOUGH_COINS' };

  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const nextAdditions =
      item.kind === 'addition' && item.additionId && !p.additions.includes(item.additionId)
        ? [...p.additions, item.additionId]
        : p.additions;
    const nextRoof = item.kind === 'roof' && item.roofHex ? item.roofHex : p.roofColor;
    const updated: PlayerDoc = {
      ...p,
      coins: (p.coins || 0) - item.price,
      unlockedItems: [...unlocked, item.id],
      additions: nextAdditions,
      roofColor: nextRoof,
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });

  const actor = nextPlayers.find((p) => p.uid === uid);
  let nextState: DemoState = { ...state, players: nextPlayers };
  if (actor) {
    nextState = demoIncrementWardStat(nextState, getWardNumber(actor.plotX, actor.plotY), 'decorCoinsSpent', item.price);
  }
  return { nextState };
}

export function demoToggleOwnedItem(
  state: DemoState,
  uid: string,
  item: ShopItem
): DemoState {
  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    let nextAdditions = [...p.additions];
    let nextRoof = p.roofColor;
    if (item.kind === 'addition' && item.additionId) {
      nextAdditions = nextAdditions.includes(item.additionId)
        ? nextAdditions.filter((a) => a !== item.additionId)
        : [...nextAdditions, item.additionId];
    } else if (item.kind === 'roof' && item.roofHex) {
      nextRoof = item.roofHex;
    }
    const updated: PlayerDoc = {
      ...p,
      additions: nextAdditions,
      roofColor: nextRoof,
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });
  return { ...state, players: nextPlayers };
}

export function demoSendChatMessage(
  state: DemoState,
  params: { uid: string; username: string; text: string }
): { nextState: DemoState; error?: string } {
  const player = state.players.find((p) => p.uid === params.uid);
  const ts = Date.now();
  if (player?.lastChatAt && ts - player.lastChatAt < 2000) {
    return { nextState: state, error: 'COOLDOWN' };
  }
  const msg: ChatMessageDoc = {
    id: `chat_${ts}_${Math.random().toString(36).slice(2, 6)}`,
    authorUid: params.uid,
    authorUsername: params.username,
    text: params.text.trim().slice(0, 140),
    createdAt: ts,
  };
  const nextPlayers = state.players.map((p) =>
    p.uid === params.uid ? { ...p, lastChatAt: ts } : p
  );
  return {
    nextState: {
      ...state,
      players: nextPlayers,
      chat: [msg, ...state.chat].slice(0, 50),
    },
  };
}

export function demoSendEmote(state: DemoState, uid: string, emote: EmoteType): DemoState {
  const ts = Date.now();
  return {
    ...state,
    players: state.players.map((p) =>
      p.uid === uid ? { ...p, lastEmote: emote, lastEmoteAt: ts } : p
    ),
  };
}

export function demoHeartbeatPresence(state: DemoState, uid: string, username: string): DemoState {
  const ts = Date.now();
  const filtered = state.chayaPresence.filter((c) => c.uid !== uid && ts - c.lastSeen < 120_000);
  return {
    ...state,
    chayaPresence: [{ uid, username, lastSeen: ts }, ...filtered],
  };
}

export function demoStartPracticeRace(state: DemoState): DemoState {
  const dateId = `${getLocalDateKey()}-practice`;
  return {
    ...state,
    activeRace: {
      id: dateId,
      date: dateId,
      status: 'live',
      scores: { chundan_red: 4, backwater_blue: 5, paddy_green: 3, coconut_gold: 4 },
      participantCount: 5,
      startedAt: Date.now(),
    },
    raceParticipants: new Map(),
  };
}

export function demoJoinRaceTeam(
  state: DemoState,
  uid: string,
  username: string,
  team: VallamTeam
): DemoState {
  if (!state.activeRace || state.activeRace.status !== 'live') return state;
  if (state.raceParticipants.has(uid)) return state;
  const nextMap = new Map(state.raceParticipants);
  nextMap.set(uid, { uid, username, team, taps: 0, joinedAt: Date.now() });
  return {
    ...state,
    activeRace: {
      ...state.activeRace,
      participantCount: state.activeRace.participantCount + 1,
    },
    raceParticipants: nextMap,
  };
}

export function demoPaddleTeam(state: DemoState, uid: string, team: VallamTeam): DemoState {
  if (!state.activeRace || state.activeRace.status !== 'live') return state;
  const nextScores = {
    ...state.activeRace.scores,
    [team]: (state.activeRace.scores[team] || 0) + 1,
  };
  // Gentle bot paddling for demo excitement
  const botTeams: VallamTeam[] = ['chundan_red', 'backwater_blue', 'paddy_green', 'coconut_gold'];
  const randomBot = botTeams[Math.floor(Math.random() * botTeams.length)];
  if (randomBot !== team && Math.random() < 0.75) {
    nextScores[randomBot] = (nextScores[randomBot] || 0) + 1;
  }
  const nextMap = new Map(state.raceParticipants);
  const part = nextMap.get(uid);
  if (part) nextMap.set(uid, { ...part, taps: part.taps + 1 });
  return {
    ...state,
    activeRace: { ...state.activeRace, scores: nextScores },
    raceParticipants: nextMap,
  };
}

export function demoFinishRace(state: DemoState): DemoState {
  if (!state.activeRace || state.activeRace.status === 'finished') return state;
  const winnerTeam = pickWinningTeam(state.activeRace.scores);
  const finished: RaceDoc = {
    ...state.activeRace,
    status: 'finished',
    winnerTeam,
    finishedAt: Date.now(),
  };
  return {
    ...state,
    activeRace: finished,
    raceHistory: [finished, ...state.raceHistory.filter((r) => r.id !== finished.id)].slice(0, 5),
  };
}

export function demoClaimRaceReward(
  state: DemoState,
  uid: string
): { nextState: DemoState; coinsEarned: number; isWinner: boolean } {
  const race = state.activeRace;
  const part = state.raceParticipants.get(uid);
  if (!race || race.status !== 'finished' || !part) {
    return { nextState: state, coinsEarned: 0, isWinner: false };
  }
  const player = state.players.find((p) => p.uid === uid);
  if (!player || player.claimedRaceDates?.includes(race.id)) {
    return { nextState: state, coinsEarned: 0, isWinner: false };
  }
  const isWinner = part.team === race.winnerTeam;
  const coinsEarned = isWinner ? 100 : 20;
  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const updated: PlayerDoc = {
      ...p,
      coins: (p.coins || 0) + coinsEarned,
      claimedRaceDates: [...(p.claimedRaceDates || []), race.id],
      boatBadgeUntil: isWinner ? Date.now() + 7 * DAY : p.boatBadgeUntil,
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });
  return {
    coinsEarned,
    isWinner,
    nextState: { ...state, players: nextPlayers },
  };
}

export function demoSubmitSuggestion(
  state: DemoState,
  params: { uid: string; username: string; text: string }
): { nextState: DemoState; error?: string } {
  const last = state.lastSuggestionAtByUid.get(params.uid) || 0;
  if (Date.now() - last < 60_000) {
    return { nextState: state, error: 'RATE_LIMIT' };
  }
  const trimmed = params.text.trim().slice(0, 80);
  const matched = matchBuildingType(trimmed);
  const newSug: SuggestionDoc = {
    id: `sug_${Date.now()}`,
    text: trimmed,
    buildingType: matched ? matched.type : 'custom',
    authorUid: params.uid,
    authorUsername: params.username,
    votes: 1,
    status: 'open',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const nextVoted = new Set(state.votedSuggestionIds);
  nextVoted.add(newSug.id);
  const nextMap = new Map(state.lastSuggestionAtByUid);
  nextMap.set(params.uid, Date.now());

  return {
    nextState: {
      ...state,
      suggestions: [newSug, ...state.suggestions],
      votedSuggestionIds: nextVoted,
      lastSuggestionAtByUid: nextMap,
    },
  };
}

export function demoUpvoteSuggestion(
  state: DemoState,
  suggestionId: string,
  uid: string
): { nextState: DemoState; builtBuilding: BuildingDoc | null } {
  if (state.votedSuggestionIds.has(suggestionId)) {
    return { nextState: state, builtBuilding: null };
  }
  const nextVoted = new Set(state.votedSuggestionIds);
  nextVoted.add(suggestionId);

  let updatedSuggestions = state.suggestions.map((s) =>
    s.id === suggestionId ? { ...s, votes: s.votes + 1, updatedAt: Date.now() } : s
  );

  const threshold = Math.max(3, Math.ceil(state.players.length * 0.15));
  const target = updatedSuggestions.find((s) => s.id === suggestionId);
  let builtBuilding: BuildingDoc | null = null;
  let nextBuildings = state.buildings;
  let nextMeta = state.meta;

  if (target && target.status === 'open' && target.buildingType !== 'custom' && target.votes >= threshold) {
    const plot = getNextBuildingPlot(target.buildingType, state.players, state.buildings);
    builtBuilding = {
      id: `b_${Date.now()}`,
      type: target.buildingType,
      label: target.text,
      x: plot.x,
      y: plot.y,
      suggestionId: target.id,
      builtByUid: uid,
      builtAt: Date.now(),
    };
    nextBuildings = [...state.buildings, builtBuilding];
    updatedSuggestions = updatedSuggestions.map((s) =>
      s.id === target.id ? { ...s, status: 'built', updatedAt: Date.now() } : s
    );
    nextMeta = {
      nextResolutionAt: Date.now() + DAY,
      lastResolvedBuilding: target.text,
      updatedByUid: uid,
      updatedAt: Date.now(),
    };
  }

  return {
    builtBuilding,
    nextState: {
      ...state,
      suggestions: updatedSuggestions,
      buildings: nextBuildings,
      meta: nextMeta,
      votedSuggestionIds: nextVoted,
    },
  };
}

export function demoForceResolveTop(state: DemoState, uid: string): { nextState: DemoState; builtBuilding: BuildingDoc | null } {
  const open = state.suggestions
    .filter((s) => s.status === 'open' && s.buildingType !== 'custom')
    .sort((a, b) => b.votes - a.votes);
  if (open.length === 0) return { nextState: state, builtBuilding: null };
  const top = open[0];
  const plot = getNextBuildingPlot(top.buildingType, state.players, state.buildings);
  const builtBuilding: BuildingDoc = {
    id: `b_${Date.now()}`,
    type: top.buildingType,
    label: top.text,
    x: plot.x,
    y: plot.y,
    suggestionId: top.id,
    builtByUid: uid,
    builtAt: Date.now(),
  };
  return {
    builtBuilding,
    nextState: {
      ...state,
      buildings: [...state.buildings, builtBuilding],
      suggestions: state.suggestions.map((s) =>
        s.id === top.id ? { ...s, status: 'built', updatedAt: Date.now() } : s
      ),
      meta: {
        nextResolutionAt: Date.now() + DAY,
        lastResolvedBuilding: top.text,
        updatedByUid: uid,
        updatedAt: Date.now(),
      },
    },
  };
}

export function demoIncrementWardStat(
  state: DemoState,
  wardId: number,
  field: 'tasksCompleted' | 'decorCoinsSpent',
  delta: number
): DemoState {
  const weekKey = getCurrentWeekKey();
  const id = `${weekKey}_${wardId}`;
  const exists = state.wardStats.some((w) => w.id === id);
  const nextWards = exists
    ? state.wardStats.map((w) =>
        w.id === id ? { ...w, [field]: w[field] + delta, updatedAt: Date.now() } : w
      )
    : [
        ...state.wardStats,
        {
          id,
          weekKey,
          wardId,
          tasksCompleted: field === 'tasksCompleted' ? delta : 0,
          decorCoinsSpent: field === 'decorCoinsSpent' ? delta : 0,
          updatedAt: Date.now(),
        },
      ];
  return { ...state, wardStats: nextWards };
}

export function demoPublishNews(
  state: DemoState,
  item: { category: NewsCategory; headlineEn: string; headlineMl: string }
): DemoState {
  const newsDoc: NewsItemDoc = {
    id: `news_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    category: item.category,
    headlineEn: item.headlineEn.slice(0, 120),
    headlineMl: item.headlineMl.slice(0, 120),
    createdAt: Date.now(),
  };
  return {
    ...state,
    news: [newsDoc, ...state.news].slice(0, 25),
  };
}

export function demoOpenPlotShop(
  state: DemoState,
  uid: string,
  shopType: ShopType
): { nextState: DemoState; error?: string } {
  const catalogItem = PLOT_SHOP_CATALOG.find((c) => c.type === shopType);
  const player = state.players.find((p) => p.uid === uid);
  if (!catalogItem || !player) return { nextState: state, error: 'NO_PLAYER' };
  if (player.shopType) return { nextState: state, error: 'ALREADY_HAS_SHOP' };
  if ((player.coins || 0) < catalogItem.price) return { nextState: state, error: 'NOT_ENOUGH_COINS' };

  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const updated: PlayerDoc = {
      ...p,
      coins: (p.coins || 0) - catalogItem.price,
      shopType,
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });

  let nextState: DemoState = { ...state, players: nextPlayers };
  nextState = demoIncrementWardStat(
    nextState,
    getWardNumber(player.plotX, player.plotY),
    'decorCoinsSpent',
    catalogItem.price
  );
  return { nextState };
}

export function demoBuyFromPlotShop(
  state: DemoState,
  buyerUid: string,
  sellerUid: string
): { nextState: DemoState; error?: string } {
  const today = getLocalDateKey();
  const buyer = state.players.find((p) => p.uid === buyerUid);
  const seller = state.players.find((p) => p.uid === sellerUid);
  if (!buyer || !seller || !seller.shopType) return { nextState: state, error: 'INVALID_SHOP' };
  if (buyer.uid === seller.uid) return { nextState: state, error: 'OWN_SHOP' };
  if ((buyer.coins || 0) < 2) return { nextState: state, error: 'NOT_ENOUGH_COINS' };
  const sellerIncome = seller.shopIncomeDate === today ? seller.shopIncomeToday || 0 : 0;
  if (sellerIncome >= 50) return { nextState: state, error: 'SHOP_CAP_REACHED' };

  const nextPlayers = state.players.map((p) => {
    if (p.uid === buyerUid) {
      const updated = { ...p, coins: (p.coins || 0) - 2, updatedAt: Date.now() };
      saveDemoPlayer(updated);
      return updated;
    }
    if (p.uid === sellerUid) {
      const updated = {
        ...p,
        coins: (p.coins || 0) + 2,
        shopIncomeDate: today,
        shopIncomeToday: sellerIncome + 2,
        updatedAt: Date.now(),
      };
      if (p.uid === buyerUid) saveDemoPlayer(updated);
      return updated;
    }
    return p;
  });
  return { nextState: { ...state, players: nextPlayers } };
}

export function demoCompleteWorkShift(
  state: DemoState,
  uid: string
): { nextState: DemoState; error?: string } {
  const today = getLocalDateKey();
  const player = state.players.find((p) => p.uid === uid);
  if (!player) return { nextState: state, error: 'NO_PLAYER' };
  if (player.shopType) return { nextState: state, error: 'HAS_SHOP' };
  if (player.workShiftDate === today) return { nextState: state, error: 'ALREADY_DONE' };

  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const updated: PlayerDoc = {
      ...p,
      coins: (p.coins || 0) + 10,
      workShiftDate: today,
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });
  return { nextState: { ...state, players: nextPlayers } };
}

export function demoRegisterMayorCandidate(
  state: DemoState,
  uid: string,
  username: string,
  manifesto: string
): { nextState: DemoState; error?: string } {
  const player = state.players.find((p) => p.uid === uid);
  if (!player || (player.streak || 0) < 7) return { nextState: state, error: 'NEED_STREAK' };
  if (state.electionCandidates.some((c) => c.uid === uid)) return { nextState: state };
  const candidate: ElectionCandidateDoc = {
    uid,
    username,
    manifesto: manifesto.trim().slice(0, 100),
    votes: 0,
    createdAt: Date.now(),
  };
  return {
    nextState: {
      ...state,
      election: state.election || { month: getCurrentMonthKey(), status: 'open', startedAt: Date.now() },
      electionCandidates: [...state.electionCandidates, candidate],
    },
  };
}

export function demoVoteForMayor(
  state: DemoState,
  candidateUid: string
): DemoState {
  const month = getCurrentMonthKey();
  if (state.votedMayorMonth === month || state.election?.status === 'closed') return state;
  return {
    ...state,
    votedMayorMonth: month,
    electionCandidates: state.electionCandidates.map((c) =>
      c.uid === candidateUid ? { ...c, votes: c.votes + 1 } : c
    ),
  };
}

export function demoResolveMayorElection(state: DemoState): DemoState {
  if (!state.election || state.election.status === 'closed' || state.electionCandidates.length === 0) {
    return state;
  }
  const sorted = [...state.electionCandidates].sort((a, b) => b.votes - a.votes || a.createdAt - b.createdAt);
  const winner = sorted[0];
  const monthKey = state.election.month;

  const nextPlayers = state.players.map((p) => {
    if (p.uid !== winner.uid) return p;
    const updated = { ...p, mayorMonth: monthKey, updatedAt: Date.now() };
    saveDemoPlayer(updated);
    return updated;
  });

  let nextState: DemoState = {
    ...state,
    players: nextPlayers,
    election: {
      ...state.election,
      status: 'closed',
      winnerUid: winner.uid,
      winnerUsername: winner.username,
      winnerVotes: winner.votes,
      closedAt: Date.now(),
    },
  };
  nextState = demoPublishNews(nextState, {
    category: 'mayor',
    headlineEn: `@${winner.username} elected Mayor of Ente Veedu for ${monthKey}!`,
    headlineMl: `@${winner.username} എന്റെ വീടിന്റെ പുതിയ മേയറായി തിരഞ്ഞെടുക്കപ്പെട്ടു!`,
  });
  return nextState;
}

export function demoMayorBuildSuggestion(
  state: DemoState,
  mayorUid: string,
  suggestion: SuggestionDoc
): { nextState: DemoState; builtBuilding: BuildingDoc | null } {
  if (
    !state.election ||
    state.election.status !== 'closed' ||
    state.election.winnerUid !== mayorUid ||
    state.election.mayorUsedBuild ||
    suggestion.buildingType === 'custom'
  ) {
    return { nextState: state, builtBuilding: null };
  }
  const plot = getNextBuildingPlot(suggestion.buildingType, state.players, state.buildings);
  const builtBuilding: BuildingDoc = {
    id: `b_${Date.now()}`,
    type: suggestion.buildingType,
    label: suggestion.text,
    x: plot.x,
    y: plot.y,
    suggestionId: suggestion.id,
    electionMonth: state.election.month,
    builtByUid: mayorUid,
    builtAt: Date.now(),
  };

  let nextState: DemoState = {
    ...state,
    buildings: [...state.buildings, builtBuilding],
    suggestions: state.suggestions.map((s) =>
      s.id === suggestion.id ? { ...s, status: 'built', updatedAt: Date.now() } : s
    ),
    election: { ...state.election, mayorUsedBuild: true },
  };
  nextState = demoPublishNews(nextState, {
    category: 'mayor',
    headlineEn: `Mayor commissioned ${suggestion.text}!`,
    headlineMl: `മേയർ ${suggestion.text} നിർമ്മാണം പൂർത്തിയാക്കി!`,
  });
  return { nextState, builtBuilding };
}

export function demoContributeFestival(
  state: DemoState,
  yearFestKey: string,
  festivalId: FestivalId
): DemoState {
  const nextMap = new Map(state.festivalProgress);
  const curr = nextMap.get(yearFestKey);
  nextMap.set(yearFestKey, {
    id: yearFestKey,
    festivalId,
    count: (curr?.count || 42) + 1,
    updatedAt: Date.now(),
  });
  return { ...state, festivalProgress: nextMap };
}

// ---------- Functional Town Buildings Demo Actions ----------

export function demoBuyMallOutfit(
  state: DemoState,
  uid: string,
  outfit: MallOutfitOption
): { nextState: DemoState; error?: string } {
  const player = state.players.find((p) => p.uid === uid);
  if (!player) return { nextState: state, error: 'NO_PLAYER' };
  const unlocked = player.unlockedItems || [];
  const alreadyOwned = unlocked.includes(outfit.id);
  if (!alreadyOwned && (player.coins || 0) < outfit.price) {
    return { nextState: state, error: 'NOT_ENOUGH_COINS' };
  }
  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const updated: PlayerDoc = {
      ...p,
      coins: alreadyOwned ? p.coins : (p.coins || 0) - outfit.price,
      outfitType: outfit.outfitType,
      outfitColor: outfit.outfitColor,
      unlockedItems: alreadyOwned ? unlocked : [...unlocked, outfit.id],
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });
  return { nextState: { ...state, players: nextPlayers } };
}

export function demoBuyMallAccessory(
  state: DemoState,
  uid: string,
  acc: MallAccessoryOption
): { nextState: DemoState; error?: string } {
  const player = state.players.find((p) => p.uid === uid);
  if (!player) return { nextState: state, error: 'NO_PLAYER' };
  const unlocked = player.unlockedItems || [];
  const alreadyOwned = unlocked.includes(acc.itemId);
  if (!alreadyOwned && (player.coins || 0) < acc.price) {
    return { nextState: state, error: 'NOT_ENOUGH_COINS' };
  }
  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const nextAcc: AccessoryId = p.accessory === acc.id && alreadyOwned ? 'none' : acc.id;
    const updated: PlayerDoc = {
      ...p,
      coins: alreadyOwned ? p.coins : (p.coins || 0) - acc.price,
      accessory: nextAcc,
      unlockedItems: alreadyOwned ? unlocked : [...unlocked, acc.itemId],
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });
  return { nextState: { ...state, players: nextPlayers } };
}

export function demoBuyMallFurniture(
  state: DemoState,
  uid: string,
  furn: MallFurnitureOption
): { nextState: DemoState; error?: string } {
  const player = state.players.find((p) => p.uid === uid);
  if (!player) return { nextState: state, error: 'NO_PLAYER' };
  const owned = player.furniture || [];
  if (owned.includes(furn.id)) return { nextState: state };
  if ((player.coins || 0) < furn.price) return { nextState: state, error: 'NOT_ENOUGH_COINS' };
  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const updated: PlayerDoc = {
      ...p,
      coins: (p.coins || 0) - furn.price,
      furniture: [...owned, furn.id],
      unlockedItems: [...(p.unlockedItems || []), furn.itemId],
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });
  let nextState: DemoState = { ...state, players: nextPlayers };
  nextState = demoIncrementWardStat(
    nextState,
    getWardNumber(player.plotX, player.plotY),
    'decorCoinsSpent',
    furn.price
  );
  return { nextState };
}

export function demoSpendHealthBoost(
  state: DemoState,
  uid: string,
  price: number,
  healAmount: number
): { nextState: DemoState; error?: string } {
  const player = state.players.find((p) => p.uid === uid);
  if (!player) return { nextState: state, error: 'NO_PLAYER' };
  if ((player.coins || 0) < price) return { nextState: state, error: 'NOT_ENOUGH_COINS' };
  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const curHealth = Number(p.health ?? 100);
    const nextHealth = Math.min(100, curHealth + healAmount);
    const updated: PlayerDoc = {
      ...p,
      coins: (p.coins || 0) - price,
      health: nextHealth,
      lastInjuryReason: nextHealth >= 100 ? '' : p.lastInjuryReason,
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });
  return { nextState: { ...state, players: nextPlayers } };
}

export function demoClaimSchoolQuiz(
  state: DemoState,
  uid: string
): { nextState: DemoState; awarded: number } {
  const today = getLocalDateKey();
  const player = state.players.find((p) => p.uid === uid);
  if (!player || player.quizDate === today) return { nextState: state, awarded: 0 };
  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const updated: PlayerDoc = {
      ...p,
      coins: (p.coins || 0) + 10,
      quizDate: today,
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });
  return { nextState: { ...state, players: nextPlayers }, awarded: 10 };
}

export function demoApplyActivityHealth(
  state: DemoState,
  uid: string,
  deltaHealth: number,
  injuryReason?: string
): DemoState {
  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const cur = Number(p.health ?? 100);
    const next = Math.max(10, Math.min(100, cur + deltaHealth));
    const updated: PlayerDoc = {
      ...p,
      health: next,
      lastInjuryReason: deltaHealth < 0 ? (injuryReason || 'Village tumble') : next >= 100 ? '' : p.lastInjuryReason,
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });
  return { ...state, players: nextPlayers };
}

export function demoBankDeposit(
  state: DemoState,
  uid: string,
  amount: number
): { nextState: DemoState; error?: string } {
  const amt = Math.floor(amount);
  if (amt <= 0) return { nextState: state };
  const player = state.players.find((p) => p.uid === uid);
  if (!player || (player.coins || 0) < amt) return { nextState: state, error: 'NOT_ENOUGH_COINS' };
  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const updated: PlayerDoc = {
      ...p,
      coins: (p.coins || 0) - amt,
      bankBalance: (p.bankBalance || 0) + amt,
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });
  return { nextState: { ...state, players: nextPlayers } };
}

export function demoBankWithdraw(
  state: DemoState,
  uid: string,
  amount: number
): { nextState: DemoState; error?: string } {
  const amt = Math.floor(amount);
  if (amt <= 0) return { nextState: state };
  const player = state.players.find((p) => p.uid === uid);
  if (!player || (player.bankBalance || 0) < amt) return { nextState: state, error: 'INSUFFICIENT_VAULT' };
  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const updated: PlayerDoc = {
      ...p,
      coins: (p.coins || 0) + amt,
      bankBalance: (p.bankBalance || 0) - amt,
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });
  return { nextState: { ...state, players: nextPlayers } };
}

export function demoBankClaimInterest(
  state: DemoState,
  uid: string
): { nextState: DemoState; interest: number } {
  const today = getLocalDateKey();
  const player = state.players.find((p) => p.uid === uid);
  const vault = player?.bankBalance || 0;
  if (!player || vault < 1 || player.lastInterestDate === today) {
    return { nextState: state, interest: 0 };
  }
  const interest = Math.min(15, Math.max(1, Math.floor(vault / 20)));
  const nextPlayers = state.players.map((p) => {
    if (p.uid !== uid) return p;
    const updated: PlayerDoc = {
      ...p,
      bankBalance: vault + interest,
      lastInterestDate: today,
      updatedAt: Date.now(),
    };
    saveDemoPlayer(updated);
    return updated;
  });
  return { nextState: { ...state, players: nextPlayers }, interest };
}

export function demoSendPostcard(
  state: DemoState,
  params: {
    senderUid: string;
    senderUsername: string;
    recipientUid: string;
    recipientUsername: string;
    stamp: PostcardStamp;
    message: string;
  }
): DemoState {
  const card: PostcardDoc = {
    id: `pc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    senderUid: params.senderUid,
    senderUsername: params.senderUsername,
    recipientUid: params.recipientUid,
    recipientUsername: params.recipientUsername,
    stamp: params.stamp,
    message: params.message.trim().slice(0, 120),
    read: false,
    createdAt: Date.now(),
  };
  return { ...state, postcards: [card, ...state.postcards] };
}

export function demoMarkPostcardRead(state: DemoState, id: string): DemoState {
  return {
    ...state,
    postcards: state.postcards.map((c) => (c.id === id ? { ...c, read: true } : c)),
  };
}

export function demoSitCinemaSeat(
  state: DemoState,
  uid: string,
  username: string,
  row: number,
  col: number
): DemoState {
  const filtered = state.cinemaSeats.filter((s) => s.uid !== uid);
  return {
    ...state,
    cinemaSeats: [...filtered, { uid, username, row, col, updatedAt: Date.now() }],
  };
}

export function demoLeaveCinemaSeat(state: DemoState, uid: string): DemoState {
  return {
    ...state,
    cinemaSeats: state.cinemaSeats.filter((s) => s.uid !== uid),
  };
}

export function demoSendCinemaChat(
  state: DemoState,
  uid: string,
  username: string,
  text: string
): DemoState {
  const msg: CinemaChatDoc = {
    id: `cchat_${Date.now()}`,
    authorUid: uid,
    authorUsername: username,
    text: text.trim().slice(0, 120),
    hourKey: getCurrentHourKey(),
    createdAt: Date.now(),
  };
  return {
    ...state,
    cinemaChat: [msg, ...state.cinemaChat].slice(0, 40),
  };
}

