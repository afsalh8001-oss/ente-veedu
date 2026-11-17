import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { FestivalProgressDoc, Language } from '../types/village';
import { FestivalConfig } from '../utils/festivals';

interface FestivalBannerProps {
  festival: FestivalConfig | null;
  progress: FestivalProgressDoc | null;
  lang: Language;
  hasDemoOffset?: boolean;
  onContribute: () => Promise<void>;
}

export function FestivalBanner({
  festival,
  progress,
  lang,
  hasDemoOffset,
  onContribute,
}: FestivalBannerProps) {
  const [busy, setBusy] = useState(false);

  if (!festival) return null;

  const count = progress?.count ?? 0;
  const pct = Math.min(100, Math.round((count / festival.targetCount) * 100));

  const handleAction = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onContribute();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`fixed left-0 right-0 z-20 flex justify-center px-3 pointer-events-none ${
        hasDemoOffset ? 'top-[142px]' : 'top-[104px]'
      }`}
    >
      <div className="pointer-events-auto max-w-md w-full flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-50/95 via-orange-50/95 to-yellow-50/95 border border-amber-300/80 shadow-xs backdrop-blur-md">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[11px] font-bold text-amber-950 truncate">
              {lang === 'ml' ? festival.goalLabelMl : festival.goalLabelEn}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-amber-200/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-600 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono-tabular font-semibold text-amber-900 shrink-0">
              {count}/{festival.targetCount}
            </span>
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={handleAction}
          className="min-h-[32px] px-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors disabled:opacity-60"
        >
          {lang === 'ml' ? festival.actionLabelMl : festival.actionLabelEn}
        </button>
      </div>
    </div>
  );
}
