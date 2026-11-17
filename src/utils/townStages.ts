import { Language, TownStageId } from '../types/village';

export interface TownStageInfo {
  id: TownStageId;
  index: number;
  minPop: number;
  nextThreshold: number | null;
  en: string;
  ml: string;
}

export const TOWN_STAGES: TownStageInfo[] = [
  { id: 'gramam', index: 0, minPop: 0, nextThreshold: 100, en: 'Gramam', ml: 'ഗ്രാമം' },
  { id: 'panchayat', index: 1, minPop: 100, nextThreshold: 500, en: 'Panchayat', ml: 'പഞ്ചായത്ത്' },
  { id: 'town', index: 2, minPop: 500, nextThreshold: 3000, en: 'Pattanam', ml: 'പട്ടണം' },
  { id: 'municipality', index: 3, minPop: 3000, nextThreshold: 20000, en: 'Municipality', ml: 'മുനിസിപ്പാലിറ്റി' },
  { id: 'city', index: 4, minPop: 20000, nextThreshold: null, en: 'Nagaram City', ml: 'നഗരം' },
];

export function getTownStage(population: number, overrideStage?: TownStageId | null): TownStageInfo {
  if (overrideStage) {
    const found = TOWN_STAGES.find((s) => s.id === overrideStage);
    if (found) return found;
  }
  for (let i = TOWN_STAGES.length - 1; i >= 0; i--) {
    if (population >= TOWN_STAGES[i].minPop) {
      return TOWN_STAGES[i];
    }
  }
  return TOWN_STAGES[0];
}

export function getStageProgressPct(population: number, stage: TownStageInfo): number {
  if (!stage.nextThreshold) return 100;
  const span = stage.nextThreshold - stage.minPop;
  const current = Math.max(0, population - stage.minPop);
  return Math.min(100, Math.max(3, Math.round((current / span) * 100)));
}

export function getStageCelebrationTitle(stage: TownStageInfo, lang: Language): string {
  return lang === 'ml'
    ? `എന്റെ വീട് ഇപ്പോൾ ഒരു ${stage.ml} ആയി!`
    : `Ente Veedu is now a ${stage.en}!`;
}

/**
 * Synthesizes a short festive temple/panchayat bell chime using Web Audio API (no external audio assets).
 */
export function playStageBellChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.7);
    });
  } catch {
    // ignore audio autoplay restriction
  }
}
