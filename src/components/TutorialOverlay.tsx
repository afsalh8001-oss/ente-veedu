import { Coffee, Ship, Sparkles, X } from 'lucide-react';
import { t } from '../i18n/translations';
import { Language } from '../types/village';

interface TutorialOverlayProps {
  open: boolean;
  lang: Language;
  onJumpChaya: () => void;
  onJumpDaily: () => void;
  onDismiss: () => void;
}

export function TutorialOverlay({
  open,
  lang,
  onJumpChaya,
  onJumpDaily,
  onDismiss,
}: TutorialOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-30 flex justify-center px-3 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-white/96 backdrop-blur-md border border-emerald-200 rounded-3xl shadow-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-stone-900">
              {t(lang, 'tutTitle')}
            </h3>
            <p className="text-xs text-stone-500">{t(lang, 'tutSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100"
            aria-label={t(lang, 'close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-xs text-stone-700">
          <button
            type="button"
            onClick={onJumpChaya}
            className="w-full p-2.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200/70 flex items-center gap-2.5 text-left transition-colors"
          >
            <Coffee className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{t(lang, 'tutPoint1')}</span>
          </button>

          <button
            type="button"
            onClick={onJumpDaily}
            className="w-full p-2.5 rounded-xl bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/70 flex items-center gap-2.5 text-left transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{t(lang, 'tutPoint2')}</span>
          </button>

          <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200/70 flex items-center gap-2.5">
            <Ship className="w-4 h-4 text-sky-700 shrink-0" />
            <span>{t(lang, 'tutPoint3')}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full h-10 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900"
        >
          {t(lang, 'tutGotIt')}
        </button>
      </div>
    </div>
  );
}
