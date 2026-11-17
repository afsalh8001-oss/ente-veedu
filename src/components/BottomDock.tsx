import { CalendarCheck, Coffee, Hammer, Home, Paintbrush, Plus } from 'lucide-react';
import { t } from '../i18n/translations';
import { Language } from '../types/village';

export type ActiveTab =
  | 'explore'
  | 'chaya'
  | 'daily'
  | 'customize'
  | 'vote'
  | 'directory'
  | 'vallam'
  | 'town';

interface BottomDockProps {
  hasJoined: boolean;
  activeTab: ActiveTab;
  lang: Language;
  onCenterMyVeedu: () => void;
  onOpenJoin: () => void;
  onSelectTab: (tab: ActiveTab) => void;
}

export function BottomDock({
  hasJoined,
  activeTab,
  lang,
  onCenterMyVeedu,
  onOpenJoin,
  onSelectTab,
}: BottomDockProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 pb-safe pointer-events-none">
      <div className="mx-auto max-w-xl lg:max-w-2xl px-2.5 pb-2.5 flex flex-col gap-2">
        {!hasJoined && (
          <div className="pointer-events-auto flex justify-center">
            <button
              type="button"
              onClick={onOpenJoin}
              className="h-12 px-6 rounded-2xl bg-emerald-800 text-white text-sm font-semibold shadow-lg shadow-emerald-950/20 hover:bg-emerald-900 active:scale-[0.98] transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t(lang, 'joinVillage')}</span>
            </button>
          </div>
        )}

        <div className="pointer-events-auto grid grid-cols-5 items-center h-14 px-1 bg-white/92 backdrop-blur-md border border-stone-200/80 rounded-2xl shadow-md">
          <button
            type="button"
            onClick={() => {
              onSelectTab('explore');
              if (hasJoined) onCenterMyVeedu();
            }}
            className={`min-h-[44px] px-1 rounded-xl flex flex-col items-center justify-center transition-colors ${
              activeTab === 'explore'
                ? 'text-emerald-800 font-semibold bg-emerald-50/80'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] sm:text-[11px] leading-tight mt-0.5 whitespace-nowrap truncate max-w-full">
              {hasJoined ? t(lang, 'myVeedu') : t(lang, 'explore')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab(activeTab === 'chaya' ? 'explore' : 'chaya')}
            className={`min-h-[44px] px-1 rounded-xl flex flex-col items-center justify-center transition-colors ${
              activeTab === 'chaya'
                ? 'text-amber-800 font-semibold bg-amber-50/90'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Coffee className="w-5 h-5" />
            <span className="text-[10px] sm:text-[11px] leading-tight mt-0.5 whitespace-nowrap truncate max-w-full">
              {t(lang, 'chayaTab')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab(activeTab === 'daily' ? 'explore' : 'daily')}
            className={`min-h-[44px] px-1 rounded-xl flex flex-col items-center justify-center transition-colors ${
              activeTab === 'daily'
                ? 'text-emerald-800 font-semibold bg-emerald-50/80'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CalendarCheck className="w-5 h-5" />
            <span className="text-[10px] sm:text-[11px] leading-tight mt-0.5 whitespace-nowrap truncate max-w-full">
              {t(lang, 'dailyTab')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!hasJoined) {
                onOpenJoin();
                return;
              }
              onSelectTab(activeTab === 'customize' ? 'explore' : 'customize');
            }}
            className={`min-h-[44px] px-1 rounded-xl flex flex-col items-center justify-center transition-colors ${
              activeTab === 'customize'
                ? 'text-emerald-800 font-semibold bg-emerald-50/80'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Paintbrush className="w-5 h-5" />
            <span className="text-[10px] sm:text-[11px] leading-tight mt-0.5 whitespace-nowrap truncate max-w-full">
              {t(lang, 'customize')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab(activeTab === 'vote' ? 'explore' : 'vote')}
            className={`min-h-[44px] px-1 rounded-xl flex flex-col items-center justify-center transition-colors ${
              activeTab === 'vote'
                ? 'text-emerald-800 font-semibold bg-emerald-50/80'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Hammer className="w-5 h-5" />
            <span className="text-[10px] sm:text-[11px] leading-tight mt-0.5 whitespace-nowrap truncate max-w-full">
              {t(lang, 'buildVote')}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
