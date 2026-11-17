import { Ship } from 'lucide-react';
import { t } from '../i18n/translations';
import { Language, RaceDoc } from '../types/village';
import { formatCountdown, VallamScheduleState } from '../utils/vallamKali';

interface VallamKaliBannerProps {
  lang: Language;
  schedule: VallamScheduleState;
  activeRace: RaceDoc | null;
  hasDemoOffset?: boolean;
  onOpen: () => void;
}

export function VallamKaliBanner({
  lang,
  schedule,
  activeRace,
  hasDemoOffset,
  onOpen,
}: VallamKaliBannerProps) {
  const isLive = schedule.isLive || activeRace?.status === 'live';

  return (
    <div
      className={`fixed left-0 right-0 z-20 flex justify-center px-3 pointer-events-none ${
        hasDemoOffset ? 'top-[102px]' : 'top-16'
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className={`pointer-events-auto min-h-[36px] px-3.5 py-1 rounded-xl border text-xs font-semibold shadow-xs backdrop-blur-xs flex items-center gap-2 transition-all active:scale-[0.98] ${
          isLive
            ? 'bg-emerald-800 text-white border-emerald-700 animate-pulse'
            : 'bg-white/92 hover:bg-amber-50 text-stone-800 border-stone-200/90'
        }`}
      >
        <Ship className={`w-3.5 h-3.5 shrink-0 ${isLive ? 'text-amber-300' : 'text-sky-700'}`} />
        <span className="truncate">
          {isLive
            ? `${t(lang, 'vallamLive')} · ${formatCountdown(schedule.remainingMs)}`
            : `${t(lang, 'vallamNextIn')} ${formatCountdown(schedule.countdownMs)}`}
        </span>
        <span
          className={`text-[11px] font-bold whitespace-nowrap ${
            isLive ? 'text-amber-300' : 'text-emerald-700'
          }`}
        >
          {t(lang, 'vallamTapHint')}
        </span>
      </button>
    </div>
  );
}
