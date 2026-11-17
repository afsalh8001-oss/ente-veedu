import { Clock, Coins, HeartPulse, Landmark, LogOut } from 'lucide-react';
import { t } from '../../i18n/translations';
import { getBuildingOpenStatus } from '../../utils/townBuildings';
import { CinemaInterior } from './CinemaInterior';
import { CivicBuildingsInterior } from './CivicBuildingsInterior';
import { HospitalInterior } from './HospitalInterior';
import { MallInterior } from './MallInterior';
import { SchoolInterior } from './SchoolInterior';
import { BuildingInteriorProps } from './types';

export default function BuildingInteriorRouter(props: BuildingInteriorProps) {
  const { building, config, lang, myPlayer, onExit } = props;
  const openStatus = getBuildingOpenStatus(config);
  const title = config ? (lang === 'ml' ? config.ml : config.en) : building.label;

  const renderInterior = () => {
    switch (building.type) {
      case 'mall':
        return <MallInterior {...props} />;
      case 'cinema_theatre':
        return <CinemaInterior {...props} />;
      case 'school':
        return <SchoolInterior {...props} />;
      case 'hospital':
        return <HospitalInterior {...props} />;
      default:
        return <CivicBuildingsInterior {...props} />;
    }
  };

  return (
    <div className="flex flex-col max-h-full overflow-hidden">
      {/* Top Interior HUD */}
      <div className="px-5 py-3.5 border-b border-stone-100 bg-gradient-to-r from-emerald-50/70 to-amber-50/50 flex items-center justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <h2 className="font-display text-base sm:text-lg font-bold text-stone-900 truncate">
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-stone-600">
            <span className="inline-flex items-center gap-1 font-mono-tabular">
              <Clock className="w-3 h-3 text-emerald-700" />
              {openStatus.hoursLabel(lang)}
            </span>
            {myPlayer && (
              <>
                <span className="text-stone-300">·</span>
                <span className="inline-flex items-center gap-1 font-mono-tabular font-bold text-amber-800">
                  <Coins className="w-3 h-3 text-amber-500" />
                  {myPlayer.coins || 0}
                </span>
                {(myPlayer.bankBalance || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 font-mono-tabular font-semibold text-emerald-800">
                    <Landmark className="w-3 h-3" />
                    {myPlayer.bankBalance}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 font-mono-tabular font-bold text-rose-700">
                  <HeartPulse className="w-3 h-3" />
                  {myPlayer.health ?? 100}
                </span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="min-h-[40px] px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t(lang, 'exitBuilding')}</span>
        </button>
      </div>

      {/* Scrollable Interior Body */}
      <div className="p-5 overflow-y-auto">{renderInterior()}</div>
    </div>
  );
}
