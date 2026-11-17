import React, { useState } from 'react';
import {
  Building2,
  Bus,
  Clock,
  Crown,
  Flame,
  Hammer,
  Landmark,
  Lock,
  MapPin,
  Newspaper,
  Sparkles,
  Trophy,
  Vote,
  X,
} from 'lucide-react';
import { t } from '../i18n/translations';
import {
  BuildingDoc,
  ElectionCandidateDoc,
  ElectionDoc,
  FestivalId,
  Language,
  NewsItemDoc,
  PlayerDoc,
  TownStageId,
  WardStatDoc,
} from '../types/village';
import { FESTIVAL_CONFIGS } from '../utils/festivals';
import { containsProfanity } from '../utils/profanity';
import { getBuildingOpenStatus, getVisibleTownBuildings } from '../utils/townBuildings';
import { TOWN_STAGES, TownStageInfo } from '../utils/townStages';
import { getBusStopForWard, getWardCenterTile, getWardNumber } from '../utils/wards';

export type TownHallSubTab = 'wards' | 'mayor' | 'bus' | 'vaartha' | 'buildings';

interface TownHallSheetProps {
  open: boolean;
  initialSubTab?: TownHallSubTab;
  lang: Language;
  isDemoMode: boolean;
  townStage: TownStageInfo;
  myPlayer: PlayerDoc | null;
  players: PlayerDoc[];
  buildings: BuildingDoc[];
  wardStats: WardStatDoc[];
  election: ElectionDoc | null;
  candidates: ElectionCandidateDoc[];
  hasVotedMayor: boolean;
  news: NewsItemDoc[];
  demoStageOverride: TownStageId | null;
  demoFestivalOverride: FestivalId | null;
  onSetDemoStage?: (stage: TownStageId | null) => void;
  onSetDemoFestival?: (fest: FestivalId | null) => void;
  onRegisterCandidate: (manifesto: string) => Promise<void>;
  onVoteCandidate: (candidateUid: string) => Promise<void>;
  onResolveElection: () => Promise<void>;
  onClaimMayorBadge: () => Promise<void>;
  onOpenMayorBuild: () => void;
  onBoardBus: (wardId: number) => void;
  onFlyToWard: (wardId: number) => void;
  onSelectBuilding: (building: BuildingDoc) => void;
  onRequireJoin: () => void;
  onClose: () => void;
}

export function TownHallSheet({
  open,
  initialSubTab = 'wards',
  lang,
  isDemoMode,
  townStage,
  myPlayer,
  players,
  buildings,
  wardStats,
  election,
  candidates,
  hasVotedMayor,
  news,
  demoStageOverride,
  demoFestivalOverride,
  onSetDemoStage,
  onSetDemoFestival,
  onRegisterCandidate,
  onVoteCandidate,
  onResolveElection,
  onClaimMayorBadge,
  onOpenMayorBuild,
  onBoardBus,
  onFlyToWard,
  onSelectBuilding,
  onRequireJoin,
  onClose,
}: TownHallSheetProps) {
  const [subTab, setSubTab] = useState<TownHallSubTab>(initialSubTab);
  const [manifesto, setManifesto] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) setSubTab(initialSubTab);
  }, [open, initialSubTab]);

  if (!open) return null;

  const myWard = myPlayer ? getWardNumber(myPlayer.plotX, myPlayer.plotY) : null;
  const activeWardsSet = new Set<number>([1, 2, 3, 4]);
  for (const p of players) {
    activeWardsSet.add(getWardNumber(p.plotX, p.plotY));
  }
  const activeWards = Array.from(activeWardsSet).sort((a, b) => a - b);

  const cleanestWards = [...wardStats]
    .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
    .slice(0, 5);
  const decoratedWards = [...wardStats]
    .sort((a, b) => b.decorCoinsSpent - a.decorCoinsSpent)
    .slice(0, 5);

  const isPanchayatOrAbove = townStage.index >= 1;
  const alreadyCandidate = myPlayer ? candidates.some((c) => c.uid === myPlayer.uid) : false;
  const canStand = Boolean(myPlayer && (myPlayer.streak || 0) >= 7 && !alreadyCandidate);
  const isWinner = Boolean(
    myPlayer && election?.status === 'closed' && election.winnerUid === myPlayer.uid
  );

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!myPlayer) {
      onRequireJoin();
      return;
    }
    const clean = manifesto.trim().slice(0, 100);
    if (clean.length < 5) return;
    if (containsProfanity(clean)) {
      setErrorMsg(t(lang, 'profanityMsg'));
      return;
    }
    setBusy(true);
    try {
      await onRegisterCandidate(clean);
      setManifesto('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to register.');
    } finally {
      setBusy(false);
    }
  };

  const handleVote = async (candidateUid: string) => {
    if (!myPlayer) {
      onRequireJoin();
      return;
    }
    setBusy(true);
    setErrorMsg(null);
    try {
      await onVoteCandidate(candidateUid);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to vote.');
    } finally {
      setBusy(false);
    }
  };

  const categoryIcon = (cat: NewsItemDoc['category']) => {
    switch (cat) {
      case 'stage':
        return <Sparkles className="w-4 h-4 text-emerald-700" />;
      case 'mayor':
        return <Crown className="w-4 h-4 text-amber-600" />;
      case 'race':
        return <Trophy className="w-4 h-4 text-blue-600" />;
      case 'ward':
        return <MapPin className="w-4 h-4 text-teal-700" />;
      default:
        return <Hammer className="w-4 h-4 text-orange-700" />;
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-16 top-16 z-40 flex items-end lg:items-center lg:justify-end lg:pr-6 pointer-events-none">
      <div className="pointer-events-auto w-full lg:w-[440px] bg-white rounded-t-3xl lg:rounded-3xl shadow-xl border border-stone-200 max-h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 shrink-0">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-stone-900 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-800 shrink-0" />
              <span className="truncate">{t(lang, 'townHallTitle')}</span>
            </h2>
            <p className="text-xs text-stone-500">
              {lang === 'ml' ? townStage.ml : townStage.en}
              {myWard ? ` · ${t(lang, 'wardLabel')} ${myWard}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 shrink-0"
            aria-label={t(lang, 'close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Sub-tabs */}
        <div className="grid grid-cols-5 gap-1 px-3 py-2 bg-stone-50 border-b border-stone-100 shrink-0">
          {([
            { id: 'wards', label: t(lang, 'wardsTab') },
            { id: 'buildings', label: t(lang, 'buildingsTab') },
            { id: 'mayor', label: t(lang, 'mayorTab') },
            { id: 'bus', label: t(lang, 'busTab') },
            { id: 'vaartha', label: t(lang, 'vaarthaTab') },
          ] as { id: TownHallSubTab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSubTab(tab.id);
                setErrorMsg(null);
              }}
              className={`min-h-[38px] px-1 rounded-xl text-[11px] font-semibold truncate transition-colors ${
                subTab === tab.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
              {errorMsg}
            </div>
          )}

          {subTab === 'wards' && (
            <div className="space-y-4">
              {myWard && (
                <button
                  type="button"
                  onClick={() => {
                    onFlyToWard(myWard);
                    onClose();
                  }}
                  className="w-full min-h-[44px] px-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center justify-between hover:bg-emerald-100"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>
                      {t(lang, 'wardLabel')} {myWard} ({t(lang, 'myVeedu')})
                    </span>
                  </span>
                  <span className="text-emerald-700">→</span>
                </button>
              )}

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  {t(lang, 'cleanestWard')}
                </h3>
                <div className="space-y-1.5">
                  {cleanestWards.length === 0 ? (
                    <p className="text-xs text-stone-500">No chores logged this week yet.</p>
                  ) : (
                    cleanestWards.map((w, idx) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          onFlyToWard(w.wardId);
                          onClose();
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-emerald-50 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-stone-900">
                          #{idx + 1} · {t(lang, 'wardLabel')} {w.wardId}
                        </span>
                        <span className="font-mono-tabular font-bold text-emerald-800">
                          {w.tasksCompleted} tasks
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  {t(lang, 'mostDecoratedWard')}
                </h3>
                <div className="space-y-1.5">
                  {decoratedWards.length === 0 ? (
                    <p className="text-xs text-stone-500">No decor coins spent this week yet.</p>
                  ) : (
                    decoratedWards.map((w, idx) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          onFlyToWard(w.wardId);
                          onClose();
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-amber-50 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-stone-900">
                          #{idx + 1} · {t(lang, 'wardLabel')} {w.wardId}
                        </span>
                        <span className="font-mono-tabular font-bold text-amber-700">
                          {w.decorCoinsSpent} coins
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <p className="text-[11px] text-stone-500 text-center">{t(lang, 'wardResetNote')}</p>
            </div>
          )}

          {subTab === 'mayor' && (
            <div className="space-y-4">
              {!isPanchayatOrAbove ? (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-stone-900">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>{t(lang, 'mayorTitle')}</span>
                  </div>
                  <p>{t(lang, 'mayorLockedNote')}</p>
                </div>
              ) : (
                <>
                  {election?.status === 'closed' && election.winnerUsername && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                          👑 {t(lang, 'mayorBadge')} · {election.month}
                        </span>
                        <span className="text-xs font-mono-tabular font-bold text-amber-900">
                          {election.winnerVotes || 0} votes
                        </span>
                      </div>
                      <p className="font-display text-base font-bold text-stone-900">
                        @{election.winnerUsername}
                      </p>
                      {isWinner && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {myPlayer?.mayorMonth !== election.month && (
                            <button
                              type="button"
                              onClick={onClaimMayorBadge}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
                            >
                              Claim Gold Nameplate
                            </button>
                          )}
                          {!election.mayorUsedBuild && (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenMayorBuild();
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900"
                            >
                              {t(lang, 'mayorBuildBtn')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {election?.status !== 'closed' && (
                    <>
                      {/* Candidate registration (7-day streak required) */}
                      {myPlayer && !alreadyCandidate && (
                        <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-stone-900">
                              {t(lang, 'mayorRunBtn')}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono-tabular text-orange-700 font-semibold">
                              <Flame className="w-3.5 h-3.5" />
                              {myPlayer.streak || 0}/7d
                            </span>
                          </div>
                          {canStand ? (
                            <form onSubmit={handleRun} className="space-y-2">
                              <input
                                type="text"
                                value={manifesto}
                                onChange={(e) => setManifesto(e.target.value.slice(0, 100))}
                                placeholder={t(lang, 'mayorManifestoPlaceholder')}
                                maxLength={100}
                                className="w-full h-10 px-3 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                              />
                              <button
                                type="submit"
                                disabled={busy || manifesto.trim().length < 5}
                                className="w-full h-10 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 disabled:opacity-50"
                              >
                                {t(lang, 'mayorRunBtn')}
                              </button>
                            </form>
                          ) : (
                            <p className="text-[11px] text-stone-600">{t(lang, 'mayorNeedStreak')}</p>
                          )}
                        </div>
                      )}

                      {/* Candidates list */}
                      <div className="space-y-2">
                        {candidates.length === 0 ? (
                          <p className="text-xs text-stone-500 text-center py-3">
                            No candidates yet — residents with a 7-day streak can stand!
                          </p>
                        ) : (
                          [...candidates]
                            .sort((a, b) => b.votes - a.votes)
                            .map((c) => (
                              <div
                                key={c.uid}
                                className="p-3 rounded-2xl border border-stone-200 bg-white flex items-start justify-between gap-3"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-stone-900 truncate">
                                    @{c.username}
                                  </p>
                                  <p className="text-xs text-stone-600 mt-0.5 break-words">
                                    {c.manifesto}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  disabled={busy || hasVotedMayor}
                                  onClick={() => handleVote(c.uid)}
                                  className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 ${
                                    hasVotedMayor
                                      ? 'bg-stone-100 text-stone-600'
                                      : 'bg-amber-600 text-white hover:bg-amber-700'
                                  }`}
                                >
                                  <Vote className="w-3.5 h-3.5" />
                                  <span className="font-mono-tabular">{c.votes}</span>
                                </button>
                              </div>
                            ))
                        )}
                      </div>

                      {candidates.length > 0 && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={onResolveElection}
                          className="w-full h-10 rounded-xl border border-amber-600 text-amber-900 bg-amber-50 hover:bg-amber-100 text-xs font-semibold"
                        >
                          {t(lang, 'mayorResolveBtn')}
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {subTab === 'bus' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <Bus className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  {isPanchayatOrAbove ? t(lang, 'busRideSub') : t(lang, 'busLockedNote')}
                </span>
              </div>

              {isPanchayatOrAbove && (
                <div className="grid grid-cols-1 gap-2">
                  {activeWards.map((wid) => {
                    const stop = getBusStopForWard(wid);
                    const center = getWardCenterTile(wid);
                    const count = players.filter(
                      (p) => getWardNumber(p.plotX, p.plotY) === wid
                    ).length;
                    return (
                      <button
                        key={wid}
                        type="button"
                        onClick={() => {
                          onBoardBus(wid);
                          onClose();
                        }}
                        className="p-3 rounded-2xl border border-stone-200 bg-white hover:border-red-300 hover:bg-red-50/40 flex items-center justify-between gap-3 text-left transition-colors"
                      >
                        <div>
                          <p className="text-sm font-bold text-stone-900">
                            {t(lang, 'wardLabel')} {wid}
                            {wid === myWard ? ` (${t(lang, 'myVeedu')})` : ''}
                          </p>
                          <p className="text-[11px] text-stone-500 font-mono-tabular">
                            {count} {t(lang, 'residentsLabel')} · Stop ({stop.x || center.x}, {stop.y})
                          </p>
                        </div>
                        <span className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold shrink-0">
                          {t(lang, 'rideToWard')} {wid}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {subTab === 'vaartha' && (
            <div className="space-y-4">
              {/* Ente Veedu Vaartha Gazette */}
              <div className="rounded-2xl border border-stone-300 bg-[#fbf8f1] p-4 space-y-3">
                <div className="border-b-2 border-stone-800 pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-base font-extrabold tracking-tight text-stone-900 flex items-center gap-1.5">
                      <Newspaper className="w-4 h-4 text-stone-800" />
                      <span>{t(lang, 'vaarthaTitle')}</span>
                    </h3>
                    <p className="text-[10px] uppercase tracking-wider text-stone-500">
                      {t(lang, 'vaarthaSub')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {news.length === 0 ? (
                    <p className="text-xs text-stone-500 py-3 text-center">
                      {t(lang, 'vaarthaEmpty')}
                    </p>
                  ) : (
                    news.map((item) => (
                      <div
                        key={item.id}
                        className="pb-2 border-b border-stone-200/80 last:border-b-0 flex items-start gap-2.5"
                      >
                        <div className="mt-0.5 shrink-0">{categoryIcon(item.category)}</div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-900 leading-snug">
                            {lang === 'ml' ? item.headlineMl : item.headlineEn}
                          </p>
                          <p className="text-[10px] text-stone-500 mt-0.5 font-mono-tabular">
                            {new Date(item.createdAt).toLocaleDateString(
                              lang === 'ml' ? 'ml-IN' : 'en-IN',
                              { month: 'short', day: 'numeric' }
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Demo-only Stage & Festival Preview Switchers */}
              {isDemoMode && onSetDemoStage && onSetDemoFestival && (
                <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 space-y-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    {t(lang, 'demoPreviewLabel')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TOWN_STAGES.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onSetDemoStage(demoStageOverride === st.id ? null : st.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          townStage.id === st.id
                            ? 'bg-emerald-800 text-white'
                            : 'bg-white border border-stone-200 text-stone-700'
                        }`}
                      >
                        {lang === 'ml' ? st.ml : st.en}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FESTIVAL_CONFIGS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() =>
                          onSetDemoFestival(demoFestivalOverride === f.id ? null : f.id)
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          demoFestivalOverride === f.id
                            ? 'bg-amber-600 text-white'
                            : 'bg-white border border-stone-200 text-stone-700'
                        }`}
                      >
                        {lang === 'ml' ? f.ml : f.en}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {subTab === 'buildings' && (
            <div className="space-y-2.5">
              {getVisibleTownBuildings(buildings, townStage.index)
                .filter((v) => v.building.type !== 'chaya_kada')
                .map((entry) => {
                  const cfg = entry.config;
                  const openSt = getBuildingOpenStatus(cfg);
                  const stageInf = cfg ? TOWN_STAGES[cfg.unlockStageIndex] : null;
                  const bTitle = cfg ? (lang === 'ml' ? cfg.ml : cfg.en) : entry.building.label;

                  return (
                    <button
                      key={entry.building.id}
                      type="button"
                      onClick={() => {
                        onSelectBuilding(entry.building);
                        onClose();
                      }}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors ${
                        entry.isUnlocked
                          ? 'border-stone-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40'
                          : 'border-stone-200/80 bg-stone-50 opacity-85 hover:opacity-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-stone-900 truncate flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate">{bTitle}</span>
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono-tabular flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{openSt.hoursLabel(lang)}</span>
                          {!entry.isUnlocked && stageInf && (
                            <span className="text-amber-800 font-semibold">
                              · {lang === 'ml' ? stageInf.ml : stageInf.en}
                            </span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 inline-flex items-center gap-1 ${
                          !entry.isUnlocked
                            ? 'bg-stone-200 text-stone-700'
                            : openSt.isOpen
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {!entry.isUnlocked ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>{t(lang, 'lockedStageBadge')}</span>
                          </>
                        ) : openSt.isOpen ? (
                          t(lang, 'openNowBadge')
                        ) : (
                          t(lang, 'closedNowBadge')
                        )}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
