import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BottomDock, ActiveTab } from './components/BottomDock';
import { BuildingEntranceModal } from './components/BuildingEntranceModal';
import { ChayaKadaSheet } from './components/ChayaKadaSheet';
import { CustomizeSheet } from './components/CustomizeSheet';
import { DailySheet } from './components/DailySheet';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FestivalBanner } from './components/FestivalBanner';
import { FirebaseSetupModal } from './components/FirebaseSetupModal';
import { HouseInspectSheet } from './components/HouseInspectSheet';
import { JoinModal } from './components/JoinModal';
import { LeaderboardSearchSheet } from './components/LeaderboardSearchSheet';
import { StageCelebration } from './components/StageCelebration';
import { TopBar } from './components/TopBar';
import { TownHallSheet, TownHallSubTab } from './components/TownHallSheet';
import { TutorialOverlay } from './components/TutorialOverlay';
import { VallamKaliBanner } from './components/VallamKaliBanner';
import { VallamKaliSheet } from './components/VallamKaliSheet';
import { VillageCanvas, VillageCanvasHandle } from './components/VillageCanvas';
import { VotingSheet } from './components/VotingSheet';
import {
  createInitialDemoState,
  demoApplyActivityHealth,
  demoBankClaimInterest,
  demoBankDeposit,
  demoBankWithdraw,
  demoBuyFromPlotShop,
  demoBuyMallAccessory,
  demoBuyMallFurniture,
  demoBuyMallOutfit,
  demoCheckUsername,
  demoClaimDailyTask,
  demoClaimPlot,
  demoClaimRaceReward,
  demoClaimSchoolQuiz,
  demoClaimStreakMilestone,
  demoCompleteWorkShift,
  demoContributeFestival,
  demoCustomizeHouse,
  demoFinishRace,
  demoForceResolveTop,
  demoHeartbeatPresence,
  demoJoinRaceTeam,
  demoLeaveCinemaSeat,
  demoMarkPostcardRead,
  demoMayorBuildSuggestion,
  demoOpenPlotShop,
  demoPaddleTeam,
  demoPublishNews,
  demoPurchaseShopItem,
  demoRegisterMayorCandidate,
  demoResolveMayorElection,
  demoSendChatMessage,
  demoSendCinemaChat,
  demoSendEmote,
  demoSendPostcard,
  demoSitCinemaSeat,
  demoSpendHealthBoost,
  demoStartPracticeRace,
  demoSubmitSuggestion,
  demoToggleOwnedItem,
  demoUpvoteSuggestion,
  demoVoteForMayor,
  DemoState,
  loadSavedDemoPlayer,
} from './demo/demoStore';
import {
  applyActivityHealthLive,
  bankClaimInterestLive,
  bankDepositLive,
  bankWithdrawLive,
  bootstrapAnonymousAuth,
  buyFromPlotShopLive,
  buyMallAccessoryLive,
  buyMallFurnitureLive,
  buyMallOutfitLive,
  checkUserHouseHeartedLive,
  checkUsernameAvailableLive,
  checkUserSuggestionVotedLive,
  claimDailyTaskLive,
  claimMayorNameplateLive,
  claimPlotLive,
  claimRaceRewardLive,
  claimSchoolQuizLive,
  claimStreakMilestoneLive,
  collectShopEarningsLive,
  completeWorkShiftLive,
  contributeFestivalGoalLive,
  deleteDoorMessageLive,
  getStoredIdentity,
  giveHouseHeartLive,
  heartbeatChayaPresenceLive,
  hospitalHealLive,
  joinRaceTeamLive,
  leaveCinemaSeatLive,
  leaveDoorMessageLive,
  loadMutedUids,
  markPostcardReadLive,
  mayorBuildSuggestionLive,
  openPlotShopLive,
  paddleTeamLive,
  publishNewsItemLive,
  purchaseShopItemLive,
  registerMayorCandidateLive,
  reportChatMessageLive,
  resolveMayorElectionLive,
  resolveRaceLive,
  resolveTopSuggestionIfReadyLive,
  saveMutedUids,
  saveStoredIdentity,
  sendChatMessageLive,
  sendCinemaChatLive,
  sendEmoteLive,
  sendPostcardLive,
  sitCinemaSeatLive,
  spendHealthBoostLive,
  submitSuggestionLive,
  subscribeAuthChanges,
  subscribeCinemaLive,
  subscribePostcardsLive,
  subscribeRaceData,
  subscribeTownGrowthData,
  subscribeVillageData,
  updateCustomizationLive,
  upvoteSuggestionLive,
  voteForMayorLive,
  waveAtHouseLive,
} from './firebase/villageService';
import { t } from './i18n/translations';
import {
  BUILDABLE_CATALOG,
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
  HouseStyle,
  Language,
  MILESTONE_REGIONS,
  NewsItemDoc,
  OutfitType,
  PlayerDoc,
  PostcardDoc,
  PostcardStamp,
  RaceDoc,
  RaceParticipantDoc,
  ShopItem,
  ShopOrderDoc,
  ShopType,
  SuggestionDoc,
  TownStageId,
  VALLAM_TEAMS,
  VallamTeam,
  VillageMetaDoc,
  WardStatDoc,
  YardAddition,
} from './types/village';
import { getActiveFestival, getCurrentMonthKey } from './utils/festivals';
import {
  getCurrentHourKey,
  getVisibleTownBuildings,
  MallAccessoryOption,
  MallFurnitureOption,
  MallOutfitOption,
} from './utils/townBuildings';
import { getTownStage, TownStageInfo } from './utils/townStages';
import { getVallamSchedule } from './utils/vallamKali';
import { getBusStopForWard, getCurrentWeekKey, getWardCenterTile } from './utils/wards';

const TUTORIAL_STORAGE_KEY = 'ente_veedu_tutorial_v1';

function VillageExperience() {
  const canvasRef = useRef<VillageCanvasHandle | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<ActiveTab>('explore');
  const [townHallSubTab, setTownHallSubTab] = useState<TownHallSubTab>('wards');
  const [joinOpen, setJoinOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingDoc | null>(null);
  const [isInsideBuilding, setIsInsideBuilding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [celebratingStage, setCelebratingStage] = useState<TownStageInfo | null>(null);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem(TUTORIAL_STORAGE_KEY) !== 'done';
    } catch {
      return false;
    }
  });

  // Auth & Mode state (background Anonymous Auth only; never blocks play)
  const [liveUid, setLiveUid] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [authStatusMsg, setAuthStatusMsg] = useState<string | null>(null);

  // Demo mode state (30 residents + localStorage identity persistence)
  const [demoUid] = useState<string>(() => {
    const saved = loadSavedDemoPlayer();
    if (saved?.uid) return saved.uid;
    const stored = getStoredIdentity();
    return stored.uid || 'demo_visitor';
  });
  const [demoState, setDemoState] = useState<DemoState>(() => createInitialDemoState());

  // Live Firestore state
  const [livePlayers, setLivePlayers] = useState<PlayerDoc[]>([]);
  const [liveSuggestions, setLiveSuggestions] = useState<SuggestionDoc[]>([]);
  const [liveBuildings, setLiveBuildings] = useState<BuildingDoc[]>([]);
  const [liveDoors, setLiveDoors] = useState<DoorMessageDoc[]>([]);
  const [liveChat, setLiveChat] = useState<ChatMessageDoc[]>([]);
  const [livePresence, setLivePresence] = useState<ChayaPresenceDoc[]>([]);
  const [liveMeta, setLiveMeta] = useState<VillageMetaDoc | null>(null);
  const [liveVotedIds, setLiveVotedIds] = useState<Set<string>>(new Set());
  const [liveHeartedUids, setLiveHeartedUids] = useState<Set<string>>(new Set());

  // Town Growth Live Firestore state
  const [liveWardStats, setLiveWardStats] = useState<WardStatDoc[]>([]);
  const [liveElection, setLiveElection] = useState<ElectionDoc | null>(null);
  const [liveCandidates, setLiveCandidates] = useState<ElectionCandidateDoc[]>([]);
  const [liveHasVotedMayor, setLiveHasVotedMayor] = useState<boolean>(false);
  const [liveUnclaimedOrders, setLiveUnclaimedOrders] = useState<ShopOrderDoc[]>([]);
  const [liveFestivalProgress, setLiveFestivalProgress] = useState<FestivalProgressDoc | null>(null);
  const [liveNews, setLiveNews] = useState<NewsItemDoc[]>([]);

  // Lazy Building Interior Live Firestore state (loaded ONLY when player walks inside!)
  const [liveReceivedPostcards, setLiveReceivedPostcards] = useState<PostcardDoc[]>([]);
  const [liveSentPostcards, setLiveSentPostcards] = useState<PostcardDoc[]>([]);
  const [liveCinemaSeats, setLiveCinemaSeats] = useState<CinemaSeatDoc[]>([]);
  const [liveCinemaChat, setLiveCinemaChat] = useState<CinemaChatDoc[]>([]);

  // Vallam Kali schedule & live race state
  const [schedule, setSchedule] = useState(() => getVallamSchedule());
  const [liveRace, setLiveRace] = useState<RaceDoc | null>(null);
  const [liveMyParticipant, setLiveMyParticipant] = useState<RaceParticipantDoc | null>(null);
  const [liveRaceHistory, setLiveRaceHistory] = useState<RaceDoc[]>([]);

  // Local mute list for Chaya Kada
  const [mutedUids, setMutedUids] = useState<string[]>(() => loadMutedUids());

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // 1-second schedule ticker for Vallam Kali Saturday 8 PM IST countdown & window
  useEffect(() => {
    const timer = setInterval(() => {
      setSchedule(getVallamSchedule());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Background Anonymous Auth bootstrap (never shows login screen or error screen)
  useEffect(() => {
    const unsubAuth = subscribeAuthChanges((user) => {
      if (user) {
        setLiveUid(user.uid);
        setIsDemoMode(false);
        setAuthStatusMsg(null);
      } else {
        setLiveUid(null);
      }
    });

    bootstrapAnonymousAuth().then((res) => {
      if (res.user) {
        setLiveUid(res.user.uid);
        setIsDemoMode(false);
      } else {
        setIsDemoMode(true);
        setAuthStatusMsg(res.reason || null);
      }
    });

    return () => unsubAuth();
  }, []);

  // Subscribe to Firestore live village collections
  useEffect(() => {
    if (isDemoMode || !liveUid) return;
    const unsub = subscribeVillageData({
      onPlayers: setLivePlayers,
      onSuggestions: setLiveSuggestions,
      onBuildings: setLiveBuildings,
      onDoors: setLiveDoors,
      onChat: setLiveChat,
      onChayaPresence: setLivePresence,
      onMeta: setLiveMeta,
      onFallbackToDemo: () => {
        setIsDemoMode(true);
        setAuthStatusMsg('Could not reach Firestore — running in local Demo Mode.');
      },
    });
    return () => unsub();
  }, [isDemoMode, liveUid]);

  // Subscribe to current Vallam Kali race & winner history
  useEffect(() => {
    if (isDemoMode || !liveUid) return;
    return subscribeRaceData({
      raceDateId: schedule.raceDateId,
      uid: liveUid,
      onActiveRace: setLiveRace,
      onMyParticipant: setLiveMyParticipant,
      onRaceHistory: setLiveRaceHistory,
    });
  }, [isDemoMode, liveUid, schedule.raceDateId]);

  const activeUid = isDemoMode ? demoUid : liveUid;
  const players = isDemoMode ? demoState.players : livePlayers;
  const suggestions = isDemoMode ? demoState.suggestions : liveSuggestions;
  const buildings = isDemoMode ? demoState.buildings : liveBuildings;
  const doors = isDemoMode ? demoState.doors : liveDoors;
  const chatMessages = isDemoMode ? demoState.chat : liveChat;
  const chayaPresence = isDemoMode ? demoState.chayaPresence : livePresence;
  const meta = isDemoMode ? demoState.meta : liveMeta;
  const votedIds = isDemoMode ? demoState.votedSuggestionIds : liveVotedIds;
  const heartedUids = isDemoMode ? demoState.heartedPlayerUids : liveHeartedUids;
  const activeRace = isDemoMode ? demoState.activeRace : liveRace;
  const myRaceParticipant = isDemoMode
    ? demoState.raceParticipants.get(demoUid) || null
    : liveMyParticipant;
  const raceHistory = isDemoMode ? demoState.raceHistory : liveRaceHistory;

  const weekKey = getCurrentWeekKey();
  const monthKey = getCurrentMonthKey();

  const townStage = useMemo(
    () => getTownStage(players.length, isDemoMode ? demoState.demoStageOverride : null),
    [players.length, isDemoMode, demoState.demoStageOverride]
  );

  const activeFestival = useMemo(
    () => getActiveFestival(new Date(), isDemoMode ? demoState.demoFestivalOverride : null),
    [isDemoMode, demoState.demoFestivalOverride]
  );

  const yearFestKey = activeFestival ? `${new Date().getFullYear()}_${activeFestival.id}` : null;

  // Subscribe to Town Growth collections (Wards, Mayor Election, Plot Shop Orders, Festival, News)
  useEffect(() => {
    if (isDemoMode || !liveUid) return;
    return subscribeTownGrowthData({
      uid: liveUid,
      weekKey,
      monthKey,
      yearFestKey,
      onWardStats: setLiveWardStats,
      onElection: setLiveElection,
      onCandidates: setLiveCandidates,
      onHasVotedMayor: setLiveHasVotedMayor,
      onUnclaimedOrders: setLiveUnclaimedOrders,
      onFestivalProgress: setLiveFestivalProgress,
      onNews: setLiveNews,
    });
  }, [isDemoMode, liveUid, weekKey, monthKey, yearFestKey]);

  const wardStats = isDemoMode ? demoState.wardStats : liveWardStats;
  const election = isDemoMode ? demoState.election : liveElection;
  const candidates = isDemoMode ? demoState.electionCandidates : liveCandidates;
  const hasVotedMayor = isDemoMode ? demoState.votedMayorMonth === monthKey : liveHasVotedMayor;
  const unclaimedOrders = isDemoMode ? [] : liveUnclaimedOrders;
  const festivalProgress = isDemoMode
    ? yearFestKey
      ? demoState.festivalProgress.get(yearFestKey) || null
      : null
    : liveFestivalProgress;
  const news = isDemoMode ? demoState.news : liveNews;

  // Lazy Firestore subscriptions: ONLY active when inside Post Office or Cinema Theatre
  useEffect(() => {
    if (isDemoMode || !liveUid || !isInsideBuilding || selectedBuilding?.type !== 'post_office') {
      return;
    }
    return subscribePostcardsLive(liveUid, setLiveReceivedPostcards, setLiveSentPostcards);
  }, [isDemoMode, liveUid, isInsideBuilding, selectedBuilding?.type]);

  useEffect(() => {
    if (isDemoMode || !liveUid || !isInsideBuilding || selectedBuilding?.type !== 'cinema_theatre') {
      return;
    }
    const hourKey = getCurrentHourKey();
    return subscribeCinemaLive(hourKey, setLiveCinemaSeats, setLiveCinemaChat);
  }, [isDemoMode, liveUid, isInsideBuilding, selectedBuilding?.type]);

  const receivedPostcards = isDemoMode
    ? demoState.postcards.filter((c) => c.recipientUid === demoUid)
    : liveReceivedPostcards;
  const sentPostcards = isDemoMode
    ? demoState.postcards.filter((c) => c.senderUid === demoUid)
    : liveSentPostcards;
  const cinemaSeats = isDemoMode ? demoState.cinemaSeats : liveCinemaSeats;
  const cinemaChat = isDemoMode ? demoState.cinemaChat : liveCinemaChat;

  // Auto-resolve live Vallam Kali race via transaction when 10-min window finishes
  useEffect(() => {
    if (isDemoMode || !liveUid || !liveRace) return;
    if (liveRace.status === 'live' && !schedule.isLive && Date.now() >= schedule.raceEndUtcMs) {
      resolveRaceLive(liveRace.id).catch(() => {});
    }
  }, [isDemoMode, liveUid, liveRace, schedule.isLive, schedule.raceEndUtcMs]);

  const myPlayer = useMemo(() => {
    const byUid = players.find((p) => p.uid === activeUid);
    if (byUid) return byUid;
    const stored = getStoredIdentity();
    if (stored.username && isDemoMode) {
      return players.find((p) => p.username === stored.username) || null;
    }
    return null;
  }, [players, activeUid, isDemoMode]);

  useEffect(() => {
    if (myPlayer) {
      saveStoredIdentity(myPlayer.uid, myPlayer.username);
    }
  }, [myPlayer]);

  // Auto-collect incoming shop orders for the live seller
  const claimingOrdersRef = useRef(false);
  useEffect(() => {
    if (isDemoMode || !liveUid || !myPlayer || liveUnclaimedOrders.length === 0) return;
    if (claimingOrdersRef.current) return;
    claimingOrdersRef.current = true;
    collectShopEarningsLive(liveUid, liveUnclaimedOrders)
      .then((credited) => {
        if (credited > 0) {
          showToast(`${t(lang, 'shopIncomeClaimedToast')} +${credited}`);
        }
      })
      .catch(() => {})
      .finally(() => {
        claimingOrdersRef.current = false;
      });
  }, [isDemoMode, liveUid, myPlayer, liveUnclaimedOrders, lang, showToast]);

  // Stage-up celebration + Vaartha headline when village advances to a new stage
  const prevStageIdxRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevStageIdxRef.current === null) {
      prevStageIdxRef.current = townStage.index;
      return;
    }
    if (townStage.index > prevStageIdxRef.current) {
      setCelebratingStage(townStage);
      const headlineEn = `Ente Veedu has grown into a ${townStage.en}!`;
      const headlineMl = `എന്റെ വീട് ഇപ്പോൾ ഒരു ${townStage.ml} ആയി വളർന്നു!`;
      if (isDemoMode) {
        setDemoState((prev) =>
          demoPublishNews(prev, { category: 'stage', headlineEn, headlineMl })
        );
      } else if (myPlayer) {
        publishNewsItemLive({ category: 'stage', headlineEn, headlineMl }).catch(() => {});
      }
    }
    prevStageIdxRef.current = townStage.index;
  }, [townStage, isDemoMode, myPlayer]);

  // Trigger 5-second speech bubbles above residents on the map whenever new chat messages appear
  const seenChatIdsRef = useRef<Set<string>>(new Set());
  const chatInitRef = useRef(false);
  useEffect(() => {
    if (!chatInitRef.current) {
      chatInitRef.current = true;
      chatMessages.forEach((m) => seenChatIdsRef.current.add(m.id));
      return;
    }
    const now = Date.now();
    for (const m of chatMessages) {
      if (!seenChatIdsRef.current.has(m.id)) {
        seenChatIdsRef.current.add(m.id);
        if (now - m.createdAt < 6500 && !mutedUids.includes(m.authorUid)) {
          canvasRef.current?.showChatBubble(m.authorUid, m.text);
        }
      }
    }
  }, [chatMessages, mutedUids]);

  const selectedPlayer = useMemo(
    () => players.find((p) => p.uid === selectedPlayerUid) || null,
    [players, selectedPlayerUid]
  );

  // Sync user's live vote / heart status for visible items
  useEffect(() => {
    if (isDemoMode || !liveUid) return;
    let cancelled = false;
    (async () => {
      const voted = new Set<string>();
      for (const s of liveSuggestions.slice(0, 15)) {
        if (await checkUserSuggestionVotedLive(s.id, liveUid)) {
          voted.add(s.id);
        }
      }
      if (!cancelled) setLiveVotedIds(voted);
    })();
    return () => {
      cancelled = true;
    };
  }, [isDemoMode, liveUid, liveSuggestions]);

  useEffect(() => {
    if (isDemoMode || !liveUid || !selectedPlayerUid) return;
    let cancelled = false;
    checkUserHouseHeartedLive(selectedPlayerUid, liveUid).then((hearted) => {
      if (!cancelled && hearted) {
        setLiveHeartedUids((prev) => new Set(prev).add(selectedPlayerUid));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isDemoMode, liveUid, selectedPlayerUid]);

  // Scheduled 24-hour resolution check on live client load
  const checkedResolutionRef = useRef(false);
  useEffect(() => {
    if (isDemoMode || !liveUid || !myPlayer || checkedResolutionRef.current) return;
    if (liveMeta && Date.now() >= liveMeta.nextResolutionAt && liveSuggestions.length > 0) {
      checkedResolutionRef.current = true;
      resolveTopSuggestionIfReadyLive({
        uid: liveUid,
        players: livePlayers,
        suggestions: liveSuggestions,
        buildings: liveBuildings,
        meta: liveMeta,
      })
        .then((built) => {
          if (built) {
            const cat = BUILDABLE_CATALOG.find((c) => c.type === built.type);
            showToast(
              cat
                ? lang === 'ml'
                  ? cat.readyToastMl
                  : cat.readyToastEn
                : `${built.label} is ready!`
            );
          }
        })
        .catch(() => {});
    }
  }, [isDemoMode, liveUid, myPlayer, liveMeta, livePlayers, liveSuggestions, liveBuildings, lang, showToast]);

  // Handle ?veedu=username deep link OR return camera to player's saved house on initial load
  const initialCameraHandledRef = useRef(false);
  useEffect(() => {
    if (initialCameraHandledRef.current || players.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const targetName = params.get('veedu')?.toLowerCase().trim();
    if (targetName) {
      const found = players.find((p) => p.username === targetName);
      if (found) {
        initialCameraHandledRef.current = true;
        setTimeout(() => {
          canvasRef.current?.flyTo(found.plotX, found.plotY, 1.45, true);
          setSelectedPlayerUid(found.uid);
        }, 250);
      }
      return;
    }

    if (myPlayer) {
      initialCameraHandledRef.current = true;
      setTimeout(() => {
        canvasRef.current?.flyTo(myPlayer.plotX, myPlayer.plotY, 1.35, true);
      }, 250);
    }
  }, [players, myPlayer]);

  // Toast + Vaartha news when a new community building appears
  const prevBuildingCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevBuildingCountRef.current === null) {
      prevBuildingCountRef.current = buildings.length;
      return;
    }
    if (buildings.length > prevBuildingCountRef.current) {
      const newest = buildings[buildings.length - 1];
      const cat = BUILDABLE_CATALOG.find((c) => c.type === newest.type);
      showToast(
        cat ? (lang === 'ml' ? cat.readyToastMl : cat.readyToastEn) : `${newest.label} is ready!`
      );
      canvasRef.current?.flyTo(newest.x, newest.y, 1.35, true);
      const headlineEn = `New community landmark built: ${cat ? cat.en : newest.label}!`;
      const headlineMl = `പുതിയ പൊതു നിർമ്മാണം പൂർത്തിയായി: ${cat ? cat.ml : newest.label}!`;
      if (isDemoMode) {
        setDemoState((prev) =>
          demoPublishNews(prev, { category: 'building', headlineEn, headlineMl })
        );
      } else if (myPlayer && newest.builtByUid === myPlayer.uid) {
        publishNewsItemLive({ category: 'building', headlineEn, headlineMl }).catch(() => {});
      }
    }
    prevBuildingCountRef.current = buildings.length;
  }, [buildings, lang, showToast, isDemoMode, myPlayer]);

  // Vaartha news when a Vallam Kali race finishes
  const seenRaceNewsRef = useRef<Set<string>>(new Set());
  const raceNewsInitRef = useRef(false);
  useEffect(() => {
    if (!raceNewsInitRef.current) {
      raceNewsInitRef.current = true;
      raceHistory.forEach((r) => seenRaceNewsRef.current.add(r.id));
      return;
    }
    const latest = raceHistory[0];
    if (latest && latest.winnerTeam && !seenRaceNewsRef.current.has(latest.id)) {
      seenRaceNewsRef.current.add(latest.id);
      const team = VALLAM_TEAMS.find((vt) => vt.id === latest.winnerTeam);
      const headlineEn = `${team ? team.en : latest.winnerTeam} won the Vallam Kali boat race!`;
      const headlineMl = `${team ? team.ml : latest.winnerTeam} വള്ളംകളിയിൽ വിജയിച്ചു!`;
      if (isDemoMode) {
        setDemoState((prev) =>
          demoPublishNews(prev, { category: 'race', headlineEn, headlineMl })
        );
      } else if (myPlayer) {
        publishNewsItemLive({ category: 'race', headlineEn, headlineMl }).catch(() => {});
      }
    }
  }, [raceHistory, isDemoMode, myPlayer]);

  const prevPopRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevPopRef.current === null) {
      prevPopRef.current = players.length;
      return;
    }
    const prev = prevPopRef.current;
    const curr = players.length;
    if (curr > prev) {
      const unlocked = MILESTONE_REGIONS.find(
        (m) => prev < m.threshold && curr >= m.threshold
      );
      if (unlocked) {
        showToast(
          `${lang === 'ml' ? unlocked.ml : unlocked.en} — ${t(lang, 'unlocked')}!`
        );
      }
    }
    prevPopRef.current = curr;
  }, [players.length, lang, showToast]);

  const dismissTutorial = () => {
    setShowTutorial(false);
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'done');
    } catch {
      // ignore
    }
  };

  // Handlers
  const handleCheckUsername = useCallback(
    async (username: string) => {
      if (isDemoMode) return demoCheckUsername(demoState, username);
      return checkUsernameAvailableLive(username);
    },
    [isDemoMode, demoState]
  );

  const handleClaimPlot = async (data: {
    username: string;
    skinTone: string;
    outfitType: OutfitType;
    outfitColor: string;
  }) => {
    if (isDemoMode) {
      if (!demoCheckUsername(demoState, data.username)) {
        throw new Error(t(lang, 'usernameTaken'));
      }
      const { nextState, player } = demoClaimPlot(demoState, {
        uid: demoUid,
        ...data,
      });
      setDemoState(nextState);
      canvasRef.current?.flyTo(player.plotX, player.plotY, 1.4, true);
      showToast(`@${player.username} — ${t(lang, 'myVeedu')}!`);
      return;
    }

    if (!liveUid) return;
    const player = await claimPlotLive({
      uid: liveUid,
      ...data,
      existingPlayers: livePlayers,
      existingBuildings: liveBuildings,
    });
    canvasRef.current?.flyTo(player.plotX, player.plotY, 1.4, true);
    showToast(`@${player.username} — ${t(lang, 'myVeedu')}!`);
  };

  const handleSaveCustomize = async (updates: {
    houseStyle: HouseStyle;
    roofColor: string;
    wallColor: string;
    skinTone: string;
    outfitType: OutfitType;
    outfitColor: string;
    additions: YardAddition[];
  }) => {
    if (isDemoMode) {
      setDemoState((prev) => demoCustomizeHouse(prev, demoUid, updates));
      showToast(t(lang, 'savedToast'));
      return;
    }
    if (!liveUid) return;
    await updateCustomizationLive(liveUid, updates);
    showToast(t(lang, 'savedToast'));
  };

  const handleClaimDailyTask = async (taskId: DailyTaskId) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      const res = demoClaimDailyTask(demoState, myPlayer.uid, taskId);
      setDemoState(res.nextState);
      if (res.earned > 0) {
        showToast(`${t(lang, 'taskDoneToast')} +${res.earned} ${t(lang, 'coinsLabel')}`);
      }
      return;
    }
    if (!liveUid) return;
    const res = await claimDailyTaskLive(liveUid, taskId);
    if (res.earned > 0) {
      showToast(`${t(lang, 'taskDoneToast')} +${res.earned} ${t(lang, 'coinsLabel')}`);
    }
  };

  const handleClaimMilestone = async (days: number) => {
    if (!myPlayer) return;
    if (isDemoMode) {
      const res = demoClaimStreakMilestone(demoState, myPlayer.uid, days);
      setDemoState(res.nextState);
      if (res.bonus > 0) {
        showToast(`${t(lang, 'milestoneClaimedToast')} +${res.bonus}`);
      }
      return;
    }
    if (!liveUid) return;
    const bonus = await claimStreakMilestoneLive(liveUid, days);
    if (bonus > 0) {
      showToast(`${t(lang, 'milestoneClaimedToast')} +${bonus}`);
    }
  };

  const handleBuyShopItem = async (item: ShopItem) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      const res = demoPurchaseShopItem(demoState, myPlayer.uid, item);
      if (res.error === 'NOT_ENOUGH_COINS') {
        throw new Error(t(lang, 'notEnoughCoins'));
      }
      setDemoState(res.nextState);
      showToast(t(lang, 'boughtToast'));
      return;
    }
    if (!liveUid) return;
    await purchaseShopItemLive(liveUid, item);
    showToast(t(lang, 'boughtToast'));
  };

  const handleToggleOwnedItem = async (item: ShopItem) => {
    if (!myPlayer) return;
    if (isDemoMode) {
      setDemoState((prev) => demoToggleOwnedItem(prev, myPlayer.uid, item));
      showToast(t(lang, 'savedToast'));
      return;
    }
    if (!liveUid) return;
    let nextAdditions = [...(myPlayer.additions || [])];
    let nextRoof = myPlayer.roofColor;
    if (item.kind === 'addition' && item.additionId) {
      nextAdditions = nextAdditions.includes(item.additionId)
        ? nextAdditions.filter((a) => a !== item.additionId)
        : [...nextAdditions, item.additionId];
    } else if (item.kind === 'roof' && item.roofHex) {
      nextRoof = item.roofHex;
    }
    await updateCustomizationLive(liveUid, {
      houseStyle: myPlayer.houseStyle,
      roofColor: nextRoof,
      wallColor: myPlayer.wallColor,
      skinTone: myPlayer.skinTone,
      outfitType: myPlayer.outfitType,
      outfitColor: myPlayer.outfitColor,
      additions: nextAdditions,
    });
    showToast(t(lang, 'savedToast'));
  };

  // Plot Shop & Daily Work Shift handlers
  const handleOpenPlotShop = async (shopType: ShopType) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      const res = demoOpenPlotShop(demoState, myPlayer.uid, shopType);
      if (res.error === 'NOT_ENOUGH_COINS') throw new Error(t(lang, 'notEnoughCoins'));
      setDemoState(res.nextState);
      showToast(t(lang, 'shopOpenedToast'));
      return;
    }
    if (!liveUid) return;
    await openPlotShopLive(liveUid, shopType);
    showToast(t(lang, 'shopOpenedToast'));
  };

  const handleBuyFromPlotShop = async (target: PlayerDoc) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (!target.shopType) return;
    if (isDemoMode) {
      const res = demoBuyFromPlotShop(demoState, myPlayer.uid, target.uid);
      if (res.error === 'NOT_ENOUGH_COINS') throw new Error(t(lang, 'notEnoughCoins'));
      if (res.error === 'SHOP_CAP_REACHED') throw new Error(t(lang, 'shopCapReached'));
      setDemoState(res.nextState);
      showToast(t(lang, 'shopBoughtToast'));
      return;
    }
    if (!liveUid) return;
    await buyFromPlotShopLive({
      buyerUid: liveUid,
      buyerUsername: myPlayer.username,
      sellerUid: target.uid,
      shopType: target.shopType,
    });
    showToast(t(lang, 'shopBoughtToast'));
  };

  const handleCollectShopEarnings = async () => {
    if (isDemoMode || !liveUid || liveUnclaimedOrders.length === 0) return;
    const credited = await collectShopEarningsLive(liveUid, liveUnclaimedOrders);
    if (credited > 0) {
      showToast(`${t(lang, 'shopIncomeClaimedToast')} +${credited}`);
    }
  };

  const handleCompleteWorkShift = useCallback(async () => {
    if (!myPlayer) return;
    if (isDemoMode) {
      setDemoState((prev) => demoCompleteWorkShift(prev, myPlayer.uid).nextState);
      showToast(t(lang, 'workShiftDone'));
      return;
    }
    if (!liveUid) return;
    await completeWorkShiftLive(liveUid);
    showToast(t(lang, 'workShiftDone'));
  }, [myPlayer, isDemoMode, liveUid, lang, showToast]);

  // Mayor Election handlers
  const handleRegisterMayorCandidate = async (manifesto: string) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      const res = demoRegisterMayorCandidate(demoState, myPlayer.uid, myPlayer.username, manifesto);
      if (res.error === 'NEED_STREAK') throw new Error(t(lang, 'mayorNeedStreak'));
      setDemoState(res.nextState);
      return;
    }
    if (!liveUid) return;
    await registerMayorCandidateLive({
      month: monthKey,
      uid: liveUid,
      username: myPlayer.username,
      manifesto,
    });
  };

  const handleVoteMayor = async (candidateUid: string) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      setDemoState((prev) => demoVoteForMayor(prev, candidateUid));
      return;
    }
    if (!liveUid) return;
    await voteForMayorLive({
      month: monthKey,
      voterUid: liveUid,
      candidateUid,
    });
  };

  const handleResolveElection = async () => {
    if (isDemoMode) {
      setDemoState((prev) => demoResolveMayorElection(prev));
      return;
    }
    await resolveMayorElectionLive(monthKey, candidates);
  };

  const handleClaimMayorBadge = async () => {
    if (!myPlayer || isDemoMode || !liveUid) return;
    await claimMayorNameplateLive(liveUid, monthKey);
    showToast(`👑 ${t(lang, 'mayorBadge')}!`);
  };

  const handleMayorBuildSuggestion = async (suggestion: SuggestionDoc) => {
    if (!myPlayer) return;
    if (isDemoMode) {
      const res = demoMayorBuildSuggestion(demoState, myPlayer.uid, suggestion);
      setDemoState(res.nextState);
      return;
    }
    if (!liveUid) return;
    await mayorBuildSuggestionLive({
      month: monthKey,
      mayorUid: liveUid,
      suggestion,
      players: livePlayers,
      buildings: liveBuildings,
    });
  };

  // Bus Ride between wards
  const handleBoardBus = (wardId: number) => {
    const startTile = myPlayer
      ? { x: myPlayer.plotX, y: myPlayer.plotY }
      : getBusStopForWard(1);
    const targetStop = getBusStopForWard(wardId);
    canvasRef.current?.startBusRide(startTile.x, startTile.y, targetStop.x, targetStop.y);
    showToast(`${t(lang, 'busRidingToast')} ${wardId}`);
  };

  // Festival mini-goal contribution
  const handleContributeFestival = async () => {
    if (!activeFestival || !yearFestKey) return;
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      setDemoState((prev) => demoContributeFestival(prev, yearFestKey, activeFestival.id));
      showToast(t(lang, 'festivalContributeToast'));
      return;
    }
    await contributeFestivalGoalLive(yearFestKey, activeFestival.id);
    showToast(t(lang, 'festivalContributeToast'));
  };

  const handleSendChat = async (text: string) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      const res = demoSendChatMessage(demoState, {
        uid: myPlayer.uid,
        username: myPlayer.username,
        text,
      });
      if (res.error === 'COOLDOWN') {
        throw new Error('COOLDOWN');
      }
      setDemoState(res.nextState);
      return;
    }
    if (!liveUid) return;
    await sendChatMessageLive({ uid: liveUid, username: myPlayer.username, text });
  };

  const handleSendEmote = async (emote: EmoteType) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      setDemoState((prev) => demoSendEmote(prev, myPlayer.uid, emote));
      return;
    }
    if (!liveUid) return;
    await sendEmoteLive(liveUid, emote);
  };

  const handleReportMessage = async (msg: ChatMessageDoc) => {
    if (!myPlayer) return;
    if (isDemoMode) {
      showToast(t(lang, 'reportedToast'));
      return;
    }
    if (!liveUid) return;
    await reportChatMessageLive({
      messageId: msg.id,
      reportedUid: msg.authorUid,
      reportedUsername: msg.authorUsername,
      messageText: msg.text,
      reporterUid: liveUid,
    });
    showToast(t(lang, 'reportedToast'));
  };

  const handleToggleMute = (uid: string) => {
    setMutedUids((prev) => {
      const next = prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid];
      saveMutedUids(next);
      return next;
    });
  };

  const handleChayaHeartbeat = useCallback(() => {
    if (!myPlayer) return;
    if (isDemoMode) {
      setDemoState((prev) => demoHeartbeatPresence(prev, myPlayer.uid, myPlayer.username));
      return;
    }
    if (!liveUid) return;
    heartbeatChayaPresenceLive(liveUid, myPlayer.username).catch(() => {});
  }, [isDemoMode, liveUid, myPlayer]);

  const handleJoinRaceTeam = async (team: VallamTeam) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      setDemoState((prev) => demoJoinRaceTeam(prev, myPlayer.uid, myPlayer.username, team));
      return;
    }
    if (!liveUid) return;
    await joinRaceTeamLive({
      raceDateId: schedule.raceDateId,
      uid: liveUid,
      username: myPlayer.username,
      team,
    });
  };

  const handlePaddle = async (team: VallamTeam) => {
    if (!myPlayer) return;
    if (isDemoMode) {
      setDemoState((prev) => demoPaddleTeam(prev, myPlayer.uid, team));
      return;
    }
    await paddleTeamLive(schedule.raceDateId, team);
  };

  const handleClaimRaceReward = async () => {
    if (!myPlayer) return;
    if (isDemoMode) {
      const res = demoClaimRaceReward(demoState, myPlayer.uid);
      setDemoState(res.nextState);
      if (res.coinsEarned > 0) {
        showToast(
          res.isWinner ? t(lang, 'vallamWinnerReward') : t(lang, 'vallamParticipantReward')
        );
      }
      return;
    }
    if (!liveUid || !activeRace) return;
    const res = await claimRaceRewardLive(activeRace.id, liveUid);
    if (res.coinsEarned > 0) {
      showToast(
        res.isWinner ? t(lang, 'vallamWinnerReward') : t(lang, 'vallamParticipantReward')
      );
    }
  };

  const handleSubmitSuggestion = async (text: string) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      const res = demoSubmitSuggestion(demoState, {
        uid: demoUid,
        username: myPlayer.username,
        text,
      });
      if (res.error === 'RATE_LIMIT') {
        throw new Error('RATE_LIMIT');
      }
      setDemoState(res.nextState);
      return;
    }
    if (!liveUid) return;
    await submitSuggestionLive({ uid: liveUid, username: myPlayer.username, text });
  };

  const handleUpvoteSuggestion = async (suggestionId: string) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      const { nextState } = demoUpvoteSuggestion(demoState, suggestionId, demoUid);
      setDemoState(nextState);
      return;
    }
    if (!liveUid) return;
    await upvoteSuggestionLive(suggestionId, liveUid);
    setLiveVotedIds((prev) => new Set(prev).add(suggestionId));
    await resolveTopSuggestionIfReadyLive({
      uid: liveUid,
      players: livePlayers,
      suggestions: liveSuggestions,
      buildings: liveBuildings,
      meta: liveMeta,
    });
  };

  const handleResolveDemoNow = async () => {
    if (!isDemoMode) return;
    const { nextState } = demoForceResolveTop(demoState, demoUid);
    setDemoState(nextState);
  };

  const handleWave = async (target: PlayerDoc) => {
    if (isDemoMode) {
      setDemoState((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.uid === target.uid ? { ...p, lastWaveAt: Date.now() } : p
        ),
      }));
      showToast(`${t(lang, 'wavedToast')} @${target.username}`);
      return;
    }
    await waveAtHouseLive(target.uid);
    showToast(`${t(lang, 'wavedToast')} @${target.username}`);
  };

  const handleVisit = (target: PlayerDoc) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    canvasRef.current?.triggerVisit(myPlayer.uid, target.plotX, target.plotY);
    canvasRef.current?.flyTo(target.plotX, target.plotY, 1.45, true);
    showToast(`${t(lang, 'visitingToast')} @${target.username}`);
  };

  const handleHeart = async (target: PlayerDoc) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      if (demoState.heartedPlayerUids.has(target.uid)) return;
      const nextSet = new Set(demoState.heartedPlayerUids);
      nextSet.add(target.uid);
      setDemoState((prev) => ({
        ...prev,
        heartedPlayerUids: nextSet,
        players: prev.players.map((p) =>
          p.uid === target.uid ? { ...p, heartsCount: p.heartsCount + 1 } : p
        ),
      }));
      showToast(`${t(lang, 'heartedToast')} @${target.username}`);
      return;
    }
    if (!liveUid) return;
    await giveHouseHeartLive(target.uid, liveUid);
    setLiveHeartedUids((prev) => new Set(prev).add(target.uid));
    showToast(`${t(lang, 'heartedToast')} @${target.username}`);
  };

  const handleLeaveDoorNote = async (target: PlayerDoc, message: string) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      const newNote: DoorMessageDoc = {
        id: `door_${Date.now()}`,
        targetUid: target.uid,
        authorUid: myPlayer.uid,
        authorUsername: myPlayer.username,
        message,
        createdAt: Date.now(),
      };
      setDemoState((prev) => ({
        ...prev,
        doors: [newNote, ...prev.doors],
      }));
      return;
    }
    if (!liveUid) return;
    await leaveDoorMessageLive({
      targetUid: target.uid,
      authorUid: liveUid,
      authorUsername: myPlayer.username,
      message,
    });
  };

  const handleDeleteDoorNote = async (doorId: string) => {
    if (isDemoMode) {
      setDemoState((prev) => ({
        ...prev,
        doors: prev.doors.filter((d) => d.id !== doorId),
      }));
      return;
    }
    await deleteDoorMessageLive(doorId);
  };

  const handleShareMyVeedu = async () => {
    if (!myPlayer) return;
    const url = `${window.location.origin}${window.location.pathname}?veedu=${encodeURIComponent(
      myPlayer.username
    )}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(t(lang, 'linkCopied'));
    } catch {
      showToast(url);
    }
  };

  const handleRetryAnonymous = async () => {
    const res = await bootstrapAnonymousAuth();
    if (res.user) {
      setLiveUid(res.user.uid);
      setIsDemoMode(false);
      setSetupOpen(false);
      showToast(t(lang, 'liveBadge'));
    } else {
      setAuthStatusMsg(res.reason || 'Anonymous Auth not enabled or domain not authorized yet.');
    }
  };

  const isMayorCanBuild = Boolean(
    myPlayer &&
      election?.status === 'closed' &&
      election.winnerUid === myPlayer.uid &&
      !election.mayorUsedBuild
  );

  // ---------- Functional Town Building Interior Handlers ----------
  const handleBuyMallOutfit = async (outfit: MallOutfitOption) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      const res = demoBuyMallOutfit(demoState, myPlayer.uid, outfit);
      if (res.error === 'NOT_ENOUGH_COINS') throw new Error(t(lang, 'notEnoughCoins'));
      setDemoState(res.nextState);
      return;
    }
    if (!liveUid) return;
    await buyMallOutfitLive(liveUid, outfit);
  };

  const handleBuyMallAccessory = async (acc: MallAccessoryOption) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      const res = demoBuyMallAccessory(demoState, myPlayer.uid, acc);
      if (res.error === 'NOT_ENOUGH_COINS') throw new Error(t(lang, 'notEnoughCoins'));
      setDemoState(res.nextState);
      return;
    }
    if (!liveUid) return;
    await buyMallAccessoryLive(liveUid, acc);
  };

  const handleBuyMallFurniture = async (furn: MallFurnitureOption) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      const res = demoBuyMallFurniture(demoState, myPlayer.uid, furn);
      if (res.error === 'NOT_ENOUGH_COINS') throw new Error(t(lang, 'notEnoughCoins'));
      setDemoState(res.nextState);
      return;
    }
    if (!liveUid) return;
    await buyMallFurnitureLive(liveUid, furn);
  };

  const handleSpendHealthBoost = async (
    price: number,
    healAmount: number,
    toastEn: string,
    toastMl: string
  ) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      const res = demoSpendHealthBoost(demoState, myPlayer.uid, price, healAmount);
      if (res.error === 'NOT_ENOUGH_COINS') throw new Error(t(lang, 'notEnoughCoins'));
      setDemoState(res.nextState);
      showToast(lang === 'ml' ? toastMl : toastEn);
      return;
    }
    if (!liveUid) return;
    await spendHealthBoostLive(liveUid, price, healAmount);
    showToast(lang === 'ml' ? toastMl : toastEn);
  };

  const handleClaimSchoolQuiz = async (): Promise<number> => {
    if (!myPlayer) {
      setJoinOpen(true);
      return 0;
    }
    if (isDemoMode) {
      const res = demoClaimSchoolQuiz(demoState, myPlayer.uid);
      setDemoState(res.nextState);
      return res.awarded;
    }
    if (!liveUid) return 0;
    return claimSchoolQuizLive(liveUid);
  };

  const handleHospitalHeal = async (usePaidTonic: boolean) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      if (usePaidTonic) {
        const res = demoSpendHealthBoost(demoState, myPlayer.uid, 3, 100);
        if (res.error === 'NOT_ENOUGH_COINS') throw new Error(t(lang, 'notEnoughCoins'));
        setDemoState(res.nextState);
      } else {
        setDemoState((prev) => demoApplyActivityHealth(prev, myPlayer.uid, 25));
      }
      return;
    }
    if (!liveUid) return;
    await hospitalHealLive(liveUid, usePaidTonic);
  };

  const handleApplyActivityHealth = async (deltaHealth: number, injuryReason?: string) => {
    if (!myPlayer) return;
    if (isDemoMode) {
      setDemoState((prev) => demoApplyActivityHealth(prev, myPlayer.uid, deltaHealth, injuryReason));
      return;
    }
    if (!liveUid) return;
    await applyActivityHealthLive(liveUid, deltaHealth, injuryReason);
  };

  const handleBankDeposit = async (amount: number) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      const res = demoBankDeposit(demoState, myPlayer.uid, amount);
      if (res.error === 'NOT_ENOUGH_COINS') throw new Error(t(lang, 'notEnoughCoins'));
      setDemoState(res.nextState);
      return;
    }
    if (!liveUid) return;
    await bankDepositLive(liveUid, amount);
  };

  const handleBankWithdraw = async (amount: number) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      const res = demoBankWithdraw(demoState, myPlayer.uid, amount);
      if (res.error === 'INSUFFICIENT_VAULT') throw new Error('Not enough coins in bank vault.');
      setDemoState(res.nextState);
      return;
    }
    if (!liveUid) return;
    await bankWithdrawLive(liveUid, amount);
  };

  const handleBankClaimInterest = async (): Promise<number> => {
    if (!myPlayer) return 0;
    if (isDemoMode) {
      const res = demoBankClaimInterest(demoState, myPlayer.uid);
      setDemoState(res.nextState);
      return res.interest;
    }
    if (!liveUid) return 0;
    return bankClaimInterestLive(liveUid);
  };

  const handleSendPostcard = async (params: {
    recipientUid: string;
    recipientUsername: string;
    stamp: PostcardStamp;
    message: string;
  }) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      setDemoState((prev) =>
        demoSendPostcard(prev, {
          senderUid: myPlayer.uid,
          senderUsername: myPlayer.username,
          ...params,
        })
      );
      return;
    }
    if (!liveUid) return;
    await sendPostcardLive({
      senderUid: liveUid,
      senderUsername: myPlayer.username,
      ...params,
    });
  };

  const handleMarkPostcardRead = async (id: string) => {
    if (isDemoMode) {
      setDemoState((prev) => demoMarkPostcardRead(prev, id));
      return;
    }
    await markPostcardReadLive(id);
  };

  const handleSitCinemaSeat = async (row: number, col: number) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      setDemoState((prev) => demoSitCinemaSeat(prev, myPlayer.uid, myPlayer.username, row, col));
      return;
    }
    if (!liveUid) return;
    await sitCinemaSeatLive(liveUid, myPlayer.username, row, col);
  };

  const handleLeaveCinemaSeat = async () => {
    if (!myPlayer) return;
    if (isDemoMode) {
      setDemoState((prev) => demoLeaveCinemaSeat(prev, myPlayer.uid));
      return;
    }
    if (!liveUid) return;
    await leaveCinemaSeatLive(liveUid);
  };

  const handleSendCinemaChat = async (text: string) => {
    if (!myPlayer) {
      setJoinOpen(true);
      return;
    }
    if (isDemoMode) {
      setDemoState((prev) => demoSendCinemaChat(prev, myPlayer.uid, myPlayer.username, text));
      return;
    }
    if (!liveUid) return;
    await sendCinemaChatLive(liveUid, myPlayer.username, text, getCurrentHourKey());
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none">
      {/* Full-bleed Isometric Kerala World Canvas */}
      <VillageCanvas
        ref={canvasRef}
        players={players}
        buildings={buildings}
        activeRace={activeRace}
        myUid={activeUid}
        selectedPlayerUid={selectedPlayerUid}
        lang={lang}
        townStageIndex={townStage.index}
        activeFestival={activeFestival?.id || null}
        onSelectPlayer={(p) => {
          setSelectedBuilding(null);
          setSelectedPlayerUid(p.uid);
          canvasRef.current?.flyTo(p.plotX, p.plotY, undefined, true);
        }}
        onSelectBuilding={(b) => {
          setSelectedPlayerUid(null);
          setActiveTab('explore');
          setSelectedBuilding(b);
          canvasRef.current?.flyTo(b.x, b.y, 1.35, true);
        }}
        onOpenChayaKada={() => {
          setSelectedPlayerUid(null);
          setSelectedBuilding(null);
          setActiveTab('chaya');
        }}
        onOpenVallamKali={() => {
          setSelectedPlayerUid(null);
          setSelectedBuilding(null);
          setActiveTab('vallam');
          canvasRef.current?.flyTo(0, 6.5, 1.1, false);
        }}
        onOpenBusStop={() => {
          setSelectedPlayerUid(null);
          setSelectedBuilding(null);
          setTownHallSubTab('bus');
          setActiveTab('town');
        }}
      />

      {/* Compact Top Bar */}
      <TopBar
        population={players.length}
        townStage={townStage}
        coins={myPlayer ? myPlayer.coins || 0 : null}
        health={myPlayer ? (myPlayer.health ?? 100) : null}
        lang={lang}
        isDemoMode={isDemoMode}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ml' : 'en'))}
        onOpenSearch={() => setActiveTab((prev) => (prev === 'directory' ? 'explore' : 'directory'))}
        onOpenDaily={() => setActiveTab((prev) => (prev === 'daily' ? 'explore' : 'daily'))}
        onOpenTownHall={() => {
          setTownHallSubTab('wards');
          setActiveTab((prev) => (prev === 'town' ? 'explore' : 'town'));
        }}
        onOpenHospital={() => {
          const hosp = getVisibleTownBuildings(buildings, townStage.index).find(
            (v) => v.building.type === 'hospital'
          );
          if (hosp) {
            setSelectedPlayerUid(null);
            setActiveTab('explore');
            setSelectedBuilding(hosp.building);
            canvasRef.current?.flyTo(hosp.building.x, hosp.building.y, 1.35, true);
          }
        }}
        onOpenSetup={() => setSetupOpen(true)}
      />

      {/* Demo mode banner (only shown when Firebase isn't active) */}
      {isDemoMode && (
        <div className="fixed top-16 left-0 right-0 z-20 flex justify-center px-3 pointer-events-none">
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className="pointer-events-auto px-3.5 py-1 rounded-xl bg-amber-50/95 hover:bg-amber-100 border border-amber-300/80 text-amber-950 text-xs font-medium shadow-xs backdrop-blur-xs transition-colors"
          >
            {t(lang, 'demoBanner')}
          </button>
        </div>
      )}

      {/* Weekly Vallam Kali Countdown / Live Banner */}
      <VallamKaliBanner
        lang={lang}
        schedule={schedule}
        activeRace={activeRace}
        hasDemoOffset={isDemoMode}
        onOpen={() => {
          setSelectedPlayerUid(null);
          setActiveTab((prev) => (prev === 'vallam' ? 'explore' : 'vallam'));
          canvasRef.current?.flyTo(0, 6.5, 1.05, false);
        }}
      />

      {/* Active Festival Mini-Goal Banner */}
      <FestivalBanner
        festival={activeFestival}
        progress={festivalProgress}
        lang={lang}
        hasDemoOffset={isDemoMode}
        onContribute={handleContributeFestival}
      />

      {/* Stage-Up Celebration (Confetti + Bell + Banner) */}
      <StageCelebration
        stage={celebratingStage}
        lang={lang}
        onDismiss={() => setCelebratingStage(null)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-44 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900/92 text-white text-xs font-medium shadow-lg backdrop-blur-xs max-w-[90vw] text-center">
          {toast}
        </div>
      )}

      {/* One-Time Friendly Tutorial */}
      <TutorialOverlay
        open={showTutorial && activeTab === 'explore' && !selectedPlayer && !joinOpen}
        lang={lang}
        onJumpChaya={() => {
          dismissTutorial();
          setActiveTab('chaya');
        }}
        onJumpDaily={() => {
          dismissTutorial();
          setActiveTab('daily');
        }}
        onDismiss={dismissTutorial}
      />

      {/* House Inspect Sheet */}
      <HouseInspectSheet
        player={selectedPlayer}
        myUid={activeUid}
        hasJoined={Boolean(myPlayer)}
        lang={lang}
        doors={doors}
        hasHearted={selectedPlayer ? heartedUids.has(selectedPlayer.uid) : false}
        onWave={handleWave}
        onVisit={handleVisit}
        onHeart={handleHeart}
        onBuyFromShop={handleBuyFromPlotShop}
        onLeaveDoorNote={handleLeaveDoorNote}
        onDeleteDoorNote={handleDeleteDoorNote}
        onRequireJoin={() => {
          setSelectedPlayerUid(null);
          setJoinOpen(true);
        }}
        onClose={() => setSelectedPlayerUid(null)}
      />

      {/* Chaya Kada Live Tea Shop Chat Sheet */}
      <ChayaKadaSheet
        open={activeTab === 'chaya'}
        player={myPlayer}
        lang={lang}
        messages={chatMessages}
        presence={chayaPresence}
        mutedUids={mutedUids}
        onSendMessage={handleSendChat}
        onSendEmote={handleSendEmote}
        onReportMessage={handleReportMessage}
        onToggleMute={handleToggleMute}
        onHeartbeat={handleChayaHeartbeat}
        onRequireJoin={() => setJoinOpen(true)}
        onClose={() => setActiveTab('explore')}
      />

      {/* Daily Chores, Work Shift, Shops & Decorate Shop Sheet */}
      <DailySheet
        open={activeTab === 'daily'}
        player={myPlayer}
        lang={lang}
        unclaimedOrders={unclaimedOrders}
        onClaimTask={handleClaimDailyTask}
        onClaimMilestone={handleClaimMilestone}
        onBuyItem={handleBuyShopItem}
        onToggleOwnedItem={handleToggleOwnedItem}
        onOpenPlotShop={handleOpenPlotShop}
        onCollectShopEarnings={handleCollectShopEarnings}
        onCompleteWorkShift={handleCompleteWorkShift}
        onRequireJoin={() => setJoinOpen(true)}
        onClose={() => setActiveTab('explore')}
      />

      {/* Building Entrance & Lazy-Loaded Functional Interior */}
      <BuildingEntranceModal
        building={selectedBuilding}
        lang={lang}
        isDemoMode={isDemoMode}
        townStageIndex={townStage.index}
        myPlayer={myPlayer}
        players={players}
        receivedPostcards={receivedPostcards}
        sentPostcards={sentPostcards}
        cinemaSeats={cinemaSeats}
        cinemaChat={cinemaChat}
        onWalkResidentTo={(x, y) => {
          if (myPlayer) {
            canvasRef.current?.triggerVisit(myPlayer.uid, x, y);
          }
          canvasRef.current?.flyTo(x, y, 1.35, true);
        }}
        onInsideChange={setIsInsideBuilding}
        onRequireJoin={() => {
          setSelectedBuilding(null);
          setJoinOpen(true);
        }}
        onFlyToLocation={(x, y, z) => canvasRef.current?.flyTo(x, y, z ?? 1.3, true)}
        onShowToast={showToast}
        onBuyMallOutfit={handleBuyMallOutfit}
        onBuyMallAccessory={handleBuyMallAccessory}
        onBuyMallFurniture={handleBuyMallFurniture}
        onSpendHealthBoost={handleSpendHealthBoost}
        onClaimSchoolQuiz={handleClaimSchoolQuiz}
        onHospitalHeal={handleHospitalHeal}
        onApplyActivityHealth={handleApplyActivityHealth}
        onBankDeposit={handleBankDeposit}
        onBankWithdraw={handleBankWithdraw}
        onBankClaimInterest={handleBankClaimInterest}
        onSendPostcard={handleSendPostcard}
        onMarkPostcardRead={handleMarkPostcardRead}
        onSitCinemaSeat={handleSitCinemaSeat}
        onLeaveCinemaSeat={handleLeaveCinemaSeat}
        onSendCinemaChat={handleSendCinemaChat}
        onRefuelBus={() => handleBoardBus(1)}
        onClose={() => {
          setSelectedBuilding(null);
          setIsInsideBuilding(false);
        }}
      />

      {/* Town Hall: Wards, Buildings Directory, Mayor Election, KSRTC Bus & Ente Veedu Vaartha */}
      <TownHallSheet
        open={activeTab === 'town'}
        initialSubTab={townHallSubTab}
        lang={lang}
        isDemoMode={isDemoMode}
        townStage={townStage}
        myPlayer={myPlayer}
        players={players}
        buildings={buildings}
        wardStats={wardStats}
        election={election}
        candidates={candidates}
        hasVotedMayor={hasVotedMayor}
        news={news}
        demoStageOverride={demoState.demoStageOverride}
        demoFestivalOverride={demoState.demoFestivalOverride}
        onSetDemoStage={
          isDemoMode
            ? (stage: TownStageId | null) =>
                setDemoState((prev) => ({ ...prev, demoStageOverride: stage }))
            : undefined
        }
        onSetDemoFestival={
          isDemoMode
            ? (fest: FestivalId | null) =>
                setDemoState((prev) => ({ ...prev, demoFestivalOverride: fest }))
            : undefined
        }
        onRegisterCandidate={handleRegisterMayorCandidate}
        onVoteCandidate={handleVoteMayor}
        onResolveElection={handleResolveElection}
        onClaimMayorBadge={handleClaimMayorBadge}
        onOpenMayorBuild={() => setActiveTab('vote')}
        onBoardBus={handleBoardBus}
        onFlyToWard={(wardId) => {
          const center = getWardCenterTile(wardId);
          canvasRef.current?.flyTo(center.x, center.y, 1.15, true);
        }}
        onSelectBuilding={(b) => {
          setSelectedPlayerUid(null);
          setActiveTab('explore');
          setSelectedBuilding(b);
          canvasRef.current?.flyTo(b.x, b.y, 1.35, true);
        }}
        onRequireJoin={() => setJoinOpen(true)}
        onClose={() => setActiveTab('explore')}
      />

      {/* Vallam Kali Boat Race Sheet */}
      <VallamKaliSheet
        open={activeTab === 'vallam'}
        player={myPlayer}
        lang={lang}
        isDemoMode={isDemoMode}
        schedule={schedule}
        activeRace={activeRace}
        myParticipant={myRaceParticipant}
        raceHistory={raceHistory}
        onJoinTeam={handleJoinRaceTeam}
        onPaddle={handlePaddle}
        onClaimReward={handleClaimRaceReward}
        onStartDemoPractice={
          isDemoMode ? () => setDemoState((prev) => demoStartPracticeRace(prev)) : undefined
        }
        onFinishDemoPractice={
          isDemoMode ? () => setDemoState((prev) => demoFinishRace(prev)) : undefined
        }
        onRequireJoin={() => setJoinOpen(true)}
        onClose={() => setActiveTab('explore')}
      />

      {/* Customize Veedu Sheet */}
      <CustomizeSheet
        open={activeTab === 'customize'}
        player={myPlayer}
        lang={lang}
        onSave={handleSaveCustomize}
        onOpenShop={() => setActiveTab('daily')}
        onClose={() => setActiveTab('explore')}
      />

      {/* Community Voting & Milestones Sheet */}
      <VotingSheet
        open={activeTab === 'vote'}
        lang={lang}
        population={players.length}
        hasJoined={Boolean(myPlayer)}
        isMayorCanBuild={isMayorCanBuild}
        suggestions={suggestions}
        votedIds={votedIds}
        meta={meta}
        onSubmitSuggestion={handleSubmitSuggestion}
        onUpvote={handleUpvoteSuggestion}
        onMayorBuildNow={handleMayorBuildSuggestion}
        onResolveTopNow={isDemoMode ? handleResolveDemoNow : undefined}
        onFlyToLandmark={(x, y) => canvasRef.current?.flyTo(x, y, 1.25, true)}
        onRequireJoin={() => setJoinOpen(true)}
        onClose={() => setActiveTab('explore')}
      />

      {/* Search & Most-Loved Houses Sheet */}
      <LeaderboardSearchSheet
        open={activeTab === 'directory'}
        lang={lang}
        players={players}
        myPlayer={myPlayer}
        onFlyToPlayer={(p) => {
          canvasRef.current?.flyTo(p.plotX, p.plotY, 1.45, true);
          setSelectedPlayerUid(p.uid);
        }}
        onShareMyVeedu={handleShareMyVeedu}
        onClose={() => setActiveTab('explore')}
      />

      {/* Ergonomic Thumb-Zone Bottom Dock */}
      <BottomDock
        hasJoined={Boolean(myPlayer)}
        activeTab={activeTab}
        lang={lang}
        onCenterMyVeedu={() => {
          if (myPlayer) {
            canvasRef.current?.flyTo(myPlayer.plotX, myPlayer.plotY, 1.4, true);
          }
        }}
        onOpenJoin={() => setJoinOpen(true)}
        onSelectTab={(tab) => {
          setSelectedPlayerUid(null);
          setActiveTab(tab);
        }}
      />

      {/* Join & Claim Plot Modal */}
      <JoinModal
        open={joinOpen}
        lang={lang}
        onCheckUsername={handleCheckUsername}
        onClaimPlot={handleClaimPlot}
        onClose={() => setJoinOpen(false)}
      />

      {/* Firebase Setup & Live Connection Modal */}
      <FirebaseSetupModal
        open={setupOpen}
        lang={lang}
        isDemoMode={isDemoMode}
        authStatusMsg={authStatusMsg}
        onRetryAnonymous={handleRetryAnonymous}
        onClose={() => setSetupOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <VillageExperience />
    </ErrorBoundary>
  );
}
