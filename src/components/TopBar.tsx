import { Cloud, Coins, Globe, HeartPulse, Landmark, Search } from 'lucide-react';
import { t } from '../i18n/translations';
import { Language } from '../types/village';
import { getStageProgressPct, TownStageInfo } from '../utils/townStages';

interface TopBarProps {
  population: number;
  townStage: TownStageInfo;
  coins: number | null;
  health?: number | null;
  lang: Language;
  isDemoMode: boolean;
  onToggleLang: () => void;
  onOpenSearch: () => void;
  onOpenDaily: () => void;
  onOpenTownHall: () => void;
  onOpenHospital?: () => void;
  onOpenSetup: () => void;
}

export function TopBar({
  population,
  townStage,
  coins,
  health,
  lang,
  isDemoMode,
  onToggleLang,
  onOpenSearch,
  onOpenDaily,
  onOpenTownHall,
  onOpenHospital,
  onOpenSetup,
}: TopBarProps) {
  const stageLabel = lang === 'ml' ? townStage.ml : townStage.en;
  const pct = getStageProgressPct(population, townStage);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pt-safe pointer-events-none">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-2.5">
        <div className="pointer-events-auto flex items-center justify-between gap-2 h-13 px-3 bg-white/88 backdrop-blur-md border border-stone-200/80 rounded-2xl shadow-sm">
          {/* Brand + live resident count + Town Stage progress */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-display text-sm sm:text-base font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0">
                  {t(lang, 'brand')}
                </span>
                <span className="text-stone-300 hidden sm:inline" aria-hidden="true">·</span>
                <span className="font-mono-tabular text-[11px] sm:text-xs font-medium text-emerald-900 whitespace-nowrap truncate">
                  {population.toLocaleString()} / 100,000
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 whitespace-nowrap">
                  {stageLabel}
                </span>
                <div className="w-16 sm:w-24 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-700 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {townStage.nextThreshold && (
                  <span className="hidden sm:inline text-[10px] font-mono-tabular text-stone-500">
                    → {townStage.nextThreshold.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Functional controls */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {health !== null && health !== undefined && health < 100 && onOpenHospital && (
              <button
                type="button"
                onClick={onOpenHospital}
                className="min-h-[40px] px-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-[0.98] transition-all flex items-center gap-1 whitespace-nowrap shrink-0"
                title={t(lang, 'healthLabel')}
              >
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span className="font-mono-tabular">{health}</span>
              </button>
            )}
            {coins !== null && (
              <button
                type="button"
                onClick={onOpenDaily}
                className="min-h-[40px] px-2 rounded-xl text-xs font-bold text-amber-800 hover:bg-amber-50 active:scale-[0.98] transition-all flex items-center gap-1 whitespace-nowrap shrink-0"
                title={t(lang, 'coinsLabel')}
              >
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="font-mono-tabular">{coins}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenTownHall}
              className="min-h-[40px] px-2 rounded-xl text-xs font-semibold text-emerald-900 hover:bg-emerald-50 active:scale-[0.98] transition-all flex items-center gap-1 whitespace-nowrap shrink-0"
              title={t(lang, 'townHallTitle')}
            >
              <Landmark className="w-4 h-4 text-emerald-700" />
              <span className="hidden md:inline">{t(lang, 'townTab')}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSearch}
              className="min-h-[40px] px-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-100 active:scale-[0.98] transition-all flex items-center gap-1 whitespace-nowrap shrink-0"
              aria-label={t(lang, 'searchBtn')}
            >
              <Search className="w-4 h-4 text-stone-600" />
              <span className="hidden sm:inline">{t(lang, 'searchBtn')}</span>
            </button>

            <button
              type="button"
              onClick={onToggleLang}
              className="min-h-[40px] px-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 active:scale-[0.98] transition-all flex items-center gap-1 whitespace-nowrap shrink-0"
              aria-label="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden xs:inline sm:inline">{lang === 'en' ? 'മലയാളം' : 'EN'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSetup}
              className="min-h-[40px] px-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-100 active:scale-[0.98] transition-all flex items-center gap-1 whitespace-nowrap shrink-0"
              title={t(lang, 'setupGuide')}
            >
              <Cloud className={`w-4 h-4 ${isDemoMode ? 'text-amber-600' : 'text-emerald-700'}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
