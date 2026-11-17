import React, { Suspense, useEffect, useState } from 'react';
import { Clock, DoorOpen, Hammer, Lock, Sparkles, X } from 'lucide-react';
import { t } from '../i18n/translations';
import {
  BuildingDoc,
  CinemaChatDoc,
  CinemaSeatDoc,
  Language,
  PlayerDoc,
  PostcardDoc,
  PostcardStamp,
} from '../types/village';
import {
  getBuildingOpenStatus,
  getTownBuildingConfig,
  MallAccessoryOption,
  MallFurnitureOption,
  MallOutfitOption,
} from '../utils/townBuildings';
import { TOWN_STAGES } from '../utils/townStages';

const LazyBuildingInteriorRouter = React.lazy(
  () => import('./interiors/BuildingInteriorRouter')
);

interface BuildingEntranceModalProps {
  building: BuildingDoc | null;
  lang: Language;
  isDemoMode: boolean;
  townStageIndex: number;
  myPlayer: PlayerDoc | null;
  players: PlayerDoc[];
  receivedPostcards: PostcardDoc[];
  sentPostcards: PostcardDoc[];
  cinemaSeats: CinemaSeatDoc[];
  cinemaChat: CinemaChatDoc[];
  onWalkResidentTo: (x: number, y: number) => void;
  onInsideChange: (isInside: boolean) => void;
  onRequireJoin: () => void;
  onFlyToLocation: (x: number, y: number, zoom?: number) => void;
  onShowToast: (msg: string) => void;
  onBuyMallOutfit: (outfit: MallOutfitOption) => Promise<void>;
  onBuyMallAccessory: (acc: MallAccessoryOption) => Promise<void>;
  onBuyMallFurniture: (furn: MallFurnitureOption) => Promise<void>;
  onSpendHealthBoost: (
    price: number,
    healAmount: number,
    toastEn: string,
    toastMl: string
  ) => Promise<void>;
  onClaimSchoolQuiz: () => Promise<number>;
  onHospitalHeal: (usePaidTonic: boolean) => Promise<void>;
  onApplyActivityHealth: (deltaHealth: number, injuryReason?: string) => Promise<void>;
  onBankDeposit: (amount: number) => Promise<void>;
  onBankWithdraw: (amount: number) => Promise<void>;
  onBankClaimInterest: () => Promise<number>;
  onSendPostcard: (params: {
    recipientUid: string;
    recipientUsername: string;
    stamp: PostcardStamp;
    message: string;
  }) => Promise<void>;
  onMarkPostcardRead: (id: string) => Promise<void>;
  onSitCinemaSeat: (row: number, col: number) => Promise<void>;
  onLeaveCinemaSeat: () => Promise<void>;
  onSendCinemaChat: (text: string) => Promise<void>;
  onRefuelBus?: () => void;
  onClose: () => void;
}

export function BuildingEntranceModal({
  building,
  lang,
  isDemoMode,
  townStageIndex,
  myPlayer,
  players,
  receivedPostcards,
  sentPostcards,
  cinemaSeats,
  cinemaChat,
  onWalkResidentTo,
  onInsideChange,
  onRequireJoin,
  onFlyToLocation,
  onShowToast,
  onBuyMallOutfit,
  onBuyMallAccessory,
  onBuyMallFurniture,
  onSpendHealthBoost,
  onClaimSchoolQuiz,
  onHospitalHeal,
  onApplyActivityHealth,
  onBankDeposit,
  onBankWithdraw,
  onBankClaimInterest,
  onSendPostcard,
  onMarkPostcardRead,
  onSitCinemaSeat,
  onLeaveCinemaSeat,
  onSendCinemaChat,
  onRefuelBus,
  onClose,
}: BuildingEntranceModalProps) {
  const [phase, setPhase] = useState<'outside' | 'loading' | 'inside'>('outside');

  useEffect(() => {
    setPhase('outside');
    onInsideChange(false);
  }, [building?.id, onInsideChange]);

  useEffect(() => {
    return () => onInsideChange(false);
  }, [onInsideChange]);

  if (!building) return null;

  const config = getTownBuildingConfig(building.type);
  const isConstructedLandmark = !building.id.startsWith('town_');
  const isUnlocked =
    isConstructedLandmark || !config || townStageIndex >= config.unlockStageIndex;
  const openStatus = getBuildingOpenStatus(config);
  const underConstruction =
    building.builtAt > 0 && Date.now() - building.builtAt < 16_000;

  const unlockStageInfo = config
    ? TOWN_STAGES[config.unlockStageIndex] || TOWN_STAGES[1]
    : null;

  const handleWalkIn = () => {
    onWalkResidentTo(building.x, building.y);
    setPhase('loading');
    setTimeout(() => {
      setPhase('inside');
      onInsideChange(true);
    }, 800);
  };

  const handleClose = () => {
    setPhase('outside');
    onInsideChange(false);
    onClose();
  };

  const title = config ? (lang === 'ml' ? config.ml : config.en) : building.label;
  const desc = config
    ? lang === 'ml'
      ? config.descMl
      : config.descEn
    : building.label;

  return (
    <div className="fixed inset-x-0 bottom-16 top-16 z-40 flex items-end sm:items-center sm:justify-center p-0 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 max-h-full flex flex-col overflow-hidden">
        {phase === 'outside' && (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold text-stone-900 truncate">
                  {title}
                </h2>
                <div className="flex items-center gap-2 mt-0.5 text-xs">
                  <span className="inline-flex items-center gap-1 text-stone-600 font-mono-tabular">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>
                      {t(lang, 'openingHoursLabel')}: {openStatus.hoursLabel(lang)}
                    </span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 shrink-0"
                aria-label={t(lang, 'close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Status Line */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                {!isUnlocked ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100 text-stone-700 border border-stone-200">
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {t(lang, 'lockedStageBadge')} · {t(lang, 'unlocksAtStage')}:{' '}
                      {unlockStageInfo
                        ? lang === 'ml'
                          ? unlockStageInfo.ml
                          : unlockStageInfo.en
                        : ''}
                    </span>
                  </span>
                ) : openStatus.isOpen ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <DoorOpen className="w-3.5 h-3.5" />
                    <span>{t(lang, 'openNowBadge')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t(lang, 'closedNowBadge')}</span>
                  </span>
                )}

                {underConstruction && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 text-amber-950 border border-amber-300">
                    <Hammer className="w-3.5 h-3.5" />
                    <span>{t(lang, 'constructingLabel')}</span>
                  </span>
                )}
              </div>

              <p className="text-sm text-stone-700 leading-relaxed">{desc}</p>

              {!isUnlocked ? (
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
                  {lang === 'ml'
                    ? `ഈ കെട്ടിടം തുറക്കാൻ ഗ്രാമം ${unlockStageInfo?.ml || ''} ഘട്ടത്തിൽ എത്തണം (അല്ലെങ്കിൽ മേയർ/വോട്ടിംഗ് വഴി നിർമ്മിക്കാം).`
                    : `Unlocks automatically when Ente Veedu reaches the ${unlockStageInfo?.en || ''} stage — or neighbours can vote & build it earlier!`}
                </div>
              ) : underConstruction ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                  {lang === 'ml'
                    ? 'തൊഴിലാളികൾ അവസാന മിനുക്കുപണികൾ ചെയ്യുകയാണ് — നിമിഷങ്ങൾക്കകം തുറക്കും!'
                    : 'Bamboo scaffolding is up — carpenters are finishing the roof right now!'}
                </div>
              ) : openStatus.isOpen ? (
                <button
                  type="button"
                  onClick={handleWalkIn}
                  className="w-full min-h-[48px] rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <DoorOpen className="w-4 h-4" />
                  <span>{t(lang, 'walkInsideBtn')}</span>
                </button>
              ) : (
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    {lang === 'ml'
                      ? `ഇപ്പോൾ അടച്ചിരിക്കുന്നു. തുറക്കുന്ന സമയം: ${openStatus.hoursLabel('ml')}`
                      : `Currently closed after hours. Please return during ${openStatus.hoursLabel('en')}.`}
                  </div>
                  {isDemoMode && (
                    <button
                      type="button"
                      onClick={handleWalkIn}
                      className="w-full min-h-[44px] rounded-2xl border border-amber-600 bg-white hover:bg-amber-50 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{t(lang, 'afterHoursDemoBtn')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {phase === 'loading' && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center animate-pulse">
              <DoorOpen className="w-7 h-7 text-emerald-800" />
            </div>
            <div className="space-y-1">
              <p className="font-display text-base font-bold text-stone-900">{title}</p>
              <p className="text-xs font-medium text-emerald-800">
                {t(lang, 'walkingInMsg')} {t(lang, 'loadingInteriorMsg')}
              </p>
            </div>
            <div className="w-48 h-1.5 rounded-full bg-stone-200 overflow-hidden">
              <div className="h-full bg-emerald-700 animate-[pulse_0.8s_ease-in-out_infinite] w-2/3 rounded-full" />
            </div>
          </div>
        )}

        {phase === 'inside' && (
          <Suspense
            fallback={
              <div className="p-10 text-center text-xs text-stone-600">
                {t(lang, 'loadingInteriorMsg')}
              </div>
            }
          >
            <LazyBuildingInteriorRouter
              building={building}
              config={config}
              lang={lang}
              isDemoMode={isDemoMode}
              myPlayer={myPlayer}
              players={players}
              receivedPostcards={receivedPostcards}
              sentPostcards={sentPostcards}
              cinemaSeats={cinemaSeats}
              cinemaChat={cinemaChat}
              onRequireJoin={onRequireJoin}
              onExit={handleClose}
              onFlyToLocation={onFlyToLocation}
              onShowToast={onShowToast}
              onBuyMallOutfit={onBuyMallOutfit}
              onBuyMallAccessory={onBuyMallAccessory}
              onBuyMallFurniture={onBuyMallFurniture}
              onSpendHealthBoost={onSpendHealthBoost}
              onClaimSchoolQuiz={onClaimSchoolQuiz}
              onHospitalHeal={onHospitalHeal}
              onApplyActivityHealth={onApplyActivityHealth}
              onBankDeposit={onBankDeposit}
              onBankWithdraw={onBankWithdraw}
              onBankClaimInterest={onBankClaimInterest}
              onSendPostcard={onSendPostcard}
              onMarkPostcardRead={onMarkPostcardRead}
              onSitCinemaSeat={onSitCinemaSeat}
              onLeaveCinemaSeat={onLeaveCinemaSeat}
              onSendCinemaChat={onSendCinemaChat}
              onRefuelBus={onRefuelBus}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
