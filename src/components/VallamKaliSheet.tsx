import { useRef, useState } from 'react';
import { Award, Check, Loader2, Play, Ship, Trophy, X } from 'lucide-react';
import { t } from '../i18n/translations';
import {
  Language,
  PlayerDoc,
  RaceDoc,
  RaceParticipantDoc,
  VALLAM_TEAMS,
  VallamTeam,
} from '../types/village';
import { formatCountdown, VallamScheduleState } from '../utils/vallamKali';

interface VallamKaliSheetProps {
  open: boolean;
  player: PlayerDoc | null;
  lang: Language;
  isDemoMode: boolean;
  schedule: VallamScheduleState;
  activeRace: RaceDoc | null;
  myParticipant: RaceParticipantDoc | null;
  raceHistory: RaceDoc[];
  onJoinTeam: (team: VallamTeam) => Promise<void>;
  onPaddle: (team: VallamTeam) => Promise<void>;
  onClaimReward: () => Promise<void>;
  onStartDemoPractice?: () => void;
  onFinishDemoPractice?: () => void;
  onRequireJoin: () => void;
  onClose: () => void;
}

export function VallamKaliSheet({
  open,
  player,
  lang,
  isDemoMode,
  schedule,
  activeRace,
  myParticipant,
  raceHistory,
  onJoinTeam,
  onPaddle,
  onClaimReward,
  onStartDemoPractice,
  onFinishDemoPractice,
  onRequireJoin,
  onClose,
}: VallamKaliSheetProps) {
  const [joiningTeam, setJoiningTeam] = useState<VallamTeam | null>(null);
  const [claiming, setClaiming] = useState(false);
  const lastTapRef = useRef<number>(0);

  if (!open) return null;

  const isLive = activeRace ? activeRace.status === 'live' : schedule.isLive;
  const isFinished = activeRace?.status === 'finished';
  const scores = activeRace?.scores || {
    chundan_red: 0,
    backwater_blue: 0,
    paddy_green: 0,
    coconut_gold: 0,
  };
  const maxScore = Math.max(
    10,
    scores.chundan_red,
    scores.backwater_blue,
    scores.paddy_green,
    scores.coconut_gold
  );

  const alreadyClaimed =
    Boolean(activeRace && player?.claimedRaceDates?.includes(activeRace.id));
  const canClaimReward = Boolean(isFinished && myParticipant && player && !alreadyClaimed);

  const handleJoin = async (team: VallamTeam) => {
    if (!player) {
      onRequireJoin();
      return;
    }
    setJoiningTeam(team);
    try {
      await onJoinTeam(team);
    } finally {
      setJoiningTeam(null);
    }
  };

  const handlePaddleClick = () => {
    if (!myParticipant || !isLive) return;
    const now = Date.now();
    // Enforce max 5 taps/sec (200ms min interval)
    if (now - lastTapRef.current < 200) return;
    lastTapRef.current = now;
    void onPaddle(myParticipant.team);
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await onClaimReward();
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-16 top-16 z-40 flex items-end lg:items-center lg:justify-end lg:pr-6 pointer-events-none">
      <div className="pointer-events-auto w-full lg:w-[420px] bg-white rounded-t-3xl lg:rounded-3xl shadow-xl border border-stone-200 max-h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 bg-sky-50/70 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-700 text-white flex items-center justify-center shrink-0">
              <Ship className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-stone-900 truncate">
                {t(lang, 'vallamTitle')}
              </h2>
              <p className="text-xs text-stone-600 truncate">{t(lang, 'vallamSub')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
            aria-label={t(lang, 'close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Status & Countdown */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-stone-500">
                {isLive ? t(lang, 'vallamEndsIn') : t(lang, 'vallamNextIn')}
              </p>
              <p className="font-display text-lg font-bold text-stone-900 font-mono-tabular">
                {isLive
                  ? schedule.isLive
                    ? formatCountdown(schedule.remainingMs)
                    : 'LIVE'
                  : formatCountdown(schedule.countdownMs)}
              </p>
            </div>
            {isDemoMode && !isLive && onStartDemoPractice && (
              <button
                type="button"
                onClick={onStartDemoPractice}
                className="min-h-[40px] px-3 rounded-xl bg-sky-700 text-white text-xs font-semibold hover:bg-sky-800 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{t(lang, 'vallamPracticeBtn')}</span>
              </button>
            )}
            {isDemoMode && isLive && onFinishDemoPractice && (
              <button
                type="button"
                onClick={onFinishDemoPractice}
                className="min-h-[40px] px-3 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
              >
                {t(lang, 'vallamFinishPracticeBtn')}
              </button>
            )}
          </div>

          {/* Live Standings */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              {t(lang, 'vallamScores')}
            </h3>
            <div className="space-y-2">
              {VALLAM_TEAMS.map((team) => {
                const score = scores[team.id] || 0;
                const pct = Math.min(100, Math.round((score / maxScore) * 100));
                const isWinner = isFinished && activeRace?.winnerTeam === team.id;
                const isMine = myParticipant?.team === team.id;
                return (
                  <div
                    key={team.id}
                    className={`p-2.5 rounded-xl border ${
                      isMine ? 'border-stone-900 bg-stone-50' : 'border-stone-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="flex items-center gap-1.5 text-stone-900">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span>{lang === 'ml' ? team.ml : team.en}</span>
                        {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                      </span>
                      <span className="font-mono-tabular text-stone-700">{score}</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{ width: `${pct}%`, backgroundColor: team.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Join Team or Paddle Action */}
          {isLive && !myParticipant && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                {t(lang, 'vallamJoinTeam')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {VALLAM_TEAMS.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    disabled={Boolean(joiningTeam)}
                    onClick={() => void handleJoin(team.id)}
                    className="min-h-[48px] px-3 py-2 rounded-xl border border-stone-200 hover:border-stone-400 text-left flex items-center gap-2 transition-colors"
                    style={{ backgroundColor: team.accent }}
                  >
                    {joiningTeam === team.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-stone-700" />
                    ) : (
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: team.color }}
                      />
                    )}
                    <span className="text-xs font-bold text-stone-900 truncate">
                      {lang === 'ml' ? team.ml : team.en}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLive && myParticipant && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handlePaddleClick}
                className="w-full h-16 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-[0.96] text-white font-display text-xl font-bold shadow-lg transition-transform flex items-center justify-center gap-2"
              >
                <Ship className="w-6 h-6 text-amber-300" />
                <span>{t(lang, 'vallamPaddleBtn')}</span>
              </button>
              <p className="text-[11px] text-center text-stone-500">{t(lang, 'vallamTapsSec')}</p>
            </div>
          )}

          {/* Claim Reward */}
          {canClaimReward && (
            <button
              type="button"
              disabled={claiming}
              onClick={() => void handleClaim()}
              className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md"
            >
              {claiming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Award className="w-5 h-5" />
              )}
              <span>{t(lang, 'vallamClaimReward')}</span>
            </button>
          )}

          {alreadyClaimed && isFinished && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>{t(lang, 'claimedLabel')}!</span>
            </div>
          )}

          {/* Last 5 Winners History */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              {t(lang, 'vallamHistory')}
            </h3>
            {raceHistory.length === 0 ? (
              <p className="text-xs text-stone-400">{t(lang, 'vallamNoHistory')}</p>
            ) : (
              <div className="space-y-1.5">
                {raceHistory.slice(0, 5).map((r) => {
                  const winTeam = VALLAM_TEAMS.find((tm) => tm.id === r.winnerTeam);
                  return (
                    <div
                      key={r.id}
                      className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono-tabular text-stone-600">{r.date}</span>
                      <span className="font-bold text-stone-900 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: winTeam?.color || '#d97706' }}
                        />
                        <span>
                          {winTeam ? (lang === 'ml' ? winTeam.ml : winTeam.en) : r.winnerTeam}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
