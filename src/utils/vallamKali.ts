import { RaceScores, VallamTeam } from '../types/village';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const RACE_DURATION_MS = 10 * 60 * 1000; // 10 minutes: Saturday 20:00 - 20:10 IST

export interface VallamScheduleState {
  isLive: boolean;
  raceDateId: string; // YYYY-MM-DD in IST for current/next Saturday
  countdownMs: number;
  remainingMs: number;
  raceStartUtcMs: number;
  raceEndUtcMs: number;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Returns local calendar date key YYYY-MM-DD (used for midnight reset of daily tasks).
 */
export function getLocalDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function getYesterdayLocalDateKey(date = new Date()): string {
  const prev = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  return getLocalDateKey(prev);
}

/**
 * Computes weekly Vallam Kali schedule: every Saturday 8:00 PM IST for 10 minutes.
 */
export function getVallamSchedule(nowMs = Date.now()): VallamScheduleState {
  const istDate = new Date(nowMs + IST_OFFSET_MS);
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const dayOfMonth = istDate.getUTCDate();
  const weekday = istDate.getUTCDay(); // 0=Sun .. 6=Sat

  // Today's 20:00 IST in UTC ms
  const today20IstAsUtc = Date.UTC(year, month, dayOfMonth, 20, 0, 0, 0) - IST_OFFSET_MS;

  if (weekday === 6) {
    const startMs = today20IstAsUtc;
    const endMs = startMs + RACE_DURATION_MS;
    const dateId = `${year}-${pad2(month + 1)}-${pad2(dayOfMonth)}`;
    if (nowMs >= startMs && nowMs < endMs) {
      return {
        isLive: true,
        raceDateId: dateId,
        countdownMs: 0,
        remainingMs: endMs - nowMs,
        raceStartUtcMs: startMs,
        raceEndUtcMs: endMs,
      };
    }
    if (nowMs < startMs) {
      return {
        isLive: false,
        raceDateId: dateId,
        countdownMs: startMs - nowMs,
        remainingMs: 0,
        raceStartUtcMs: startMs,
        raceEndUtcMs: endMs,
      };
    }
  }

  // Next Saturday
  const daysUntilSat = weekday === 6 ? 7 : (6 - weekday + 7) % 7;
  const nextSatIst = new Date(Date.UTC(year, month, dayOfMonth + daysUntilSat, 20, 0, 0, 0));
  const nextDateId = `${nextSatIst.getUTCFullYear()}-${pad2(nextSatIst.getUTCMonth() + 1)}-${pad2(
    nextSatIst.getUTCDate()
  )}`;
  const startMs = nextSatIst.getTime() - IST_OFFSET_MS;
  const endMs = startMs + RACE_DURATION_MS;

  return {
    isLive: false,
    raceDateId: nextDateId,
    countdownMs: Math.max(0, startMs - nowMs),
    remainingMs: 0,
    raceStartUtcMs: startMs,
    raceEndUtcMs: endMs,
  };
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) {
    return `${days}d ${pad2(hours)}:${pad2(mins)}:${pad2(secs)}`;
  }
  return `${pad2(hours)}:${pad2(mins)}:${pad2(secs)}`;
}

export function pickWinningTeam(scores: RaceScores): VallamTeam {
  const order: VallamTeam[] = ['chundan_red', 'backwater_blue', 'paddy_green', 'coconut_gold'];
  let best = order[0];
  let bestVal = scores[best] ?? 0;
  for (const team of order) {
    const v = scores[team] ?? 0;
    if (v > bestVal) {
      bestVal = v;
      best = team;
    }
  }
  return best;
}
