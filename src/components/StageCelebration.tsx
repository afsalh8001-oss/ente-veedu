import { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Language } from '../types/village';
import { getStageCelebrationTitle, playStageBellChime, TownStageInfo } from '../utils/townStages';

interface StageCelebrationProps {
  stage: TownStageInfo | null;
  lang: Language;
  onDismiss: () => void;
}

const CONFETTI_COLORS = ['#059669', '#f59e0b', '#e11d48', '#2563eb', '#facc15', '#10b981'];

export function StageCelebration({ stage, lang, onDismiss }: StageCelebrationProps) {
  useEffect(() => {
    if (!stage) return;
    playStageBellChime();
    const timer = setTimeout(onDismiss, 6500);
    return () => clearTimeout(timer);
  }, [stage, onDismiss]);

  if (!stage) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-20 px-4 overflow-hidden">
      {/* Lightweight procedural confetti shower */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {Array.from({ length: 28 }).map((_, idx) => {
          const left = `${(idx * 3.7) % 100}%`;
          const delay = `${(idx % 7) * 0.12}s`;
          const duration = `${2.2 + (idx % 4) * 0.45}s`;
          const color = CONFETTI_COLORS[idx % CONFETTI_COLORS.length];
          return (
            <span
              key={idx}
              style={{
                left,
                backgroundColor: color,
                animation: `bounce ${duration} ease-in ${delay} infinite`,
              }}
              className="absolute top-2 w-2.5 h-2.5 rounded-xs opacity-85 shadow-xs"
            />
          );
        })}
      </div>

      <div className="pointer-events-auto relative max-w-md w-full bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-700 text-white rounded-2xl shadow-2xl border border-amber-300/60 px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm sm:text-base font-bold leading-snug">
              {getStageCelebrationTitle(stage, lang)}
            </p>
            <p className="text-[11px] text-amber-100/90 mt-0.5">
              {lang === 'ml'
                ? 'പുതിയ റോഡുകളും സൗകര്യങ്ങളും ഭൂപടത്തിൽ തുറന്നു!'
                : 'New roads & town upgrades unlocked on the map!'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 rounded-lg hover:bg-white/15 shrink-0"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
