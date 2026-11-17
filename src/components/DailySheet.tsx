import { useEffect, useState } from 'react';
import {
  Briefcase,
  Check,
  Coins,
  Flame,
  Gift,
  Loader2,
  Lock,
  ShoppingBag,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import { t } from '../i18n/translations';
import {
  DAILY_TASKS,
  DailyTaskId,
  DECORATE_SHOP_ITEMS,
  Language,
  PlayerDoc,
  PLOT_SHOP_CATALOG,
  ShopItem,
  ShopOrderDoc,
  ShopType,
  STREAK_MILESTONES,
} from '../types/village';
import { getLocalDateKey } from '../utils/vallamKali';

interface DailySheetProps {
  open: boolean;
  player: PlayerDoc | null;
  lang: Language;
  unclaimedOrders: ShopOrderDoc[];
  onClaimTask: (taskId: DailyTaskId) => Promise<void>;
  onClaimMilestone: (days: number) => Promise<void>;
  onBuyItem: (item: ShopItem) => Promise<void>;
  onToggleOwnedItem: (item: ShopItem) => Promise<void>;
  onOpenPlotShop: (shopType: ShopType) => Promise<void>;
  onCollectShopEarnings: () => Promise<void>;
  onCompleteWorkShift: () => Promise<void>;
  onRequireJoin: () => void;
  onClose: () => void;
}

export function DailySheet({
  open,
  player,
  lang,
  unclaimedOrders,
  onClaimTask,
  onClaimMilestone,
  onBuyItem,
  onToggleOwnedItem,
  onOpenPlotShop,
  onCollectShopEarnings,
  onCompleteWorkShift,
  onRequireJoin,
  onClose,
}: DailySheetProps) {
  const [subTab, setSubTab] = useState<'tasks' | 'shop'>('tasks');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shiftSecsLeft, setShiftSecsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (shiftSecsLeft === null || shiftSecsLeft <= 0) return;
    const timer = setTimeout(() => {
      setShiftSecsLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [shiftSecsLeft]);

  useEffect(() => {
    if (shiftSecsLeft === 0) {
      setShiftSecsLeft(null);
      onCompleteWorkShift().catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : 'Work shift failed.');
      });
    }
  }, [shiftSecsLeft, onCompleteWorkShift]);

  if (!open) return null;

  const todayKey = getLocalDateKey();
  const completedToday: DailyTaskId[] =
    player && player.dailyCoinsDate === todayKey && Array.isArray(player.dailyTasks)
      ? player.dailyTasks
      : [];
  const allFourDone = completedToday.length >= 4;
  const streak = player?.streak || 0;
  const coins = player?.coins || 0;
  const claimedMilestones = player?.claimedMilestones || [];
  const unlockedItems = player?.unlockedItems || [];
  const workShiftDone = Boolean(player && player.workShiftDate === todayKey);
  const myShopCatalog = player?.shopType
    ? PLOT_SHOP_CATALOG.find((s) => s.type === player.shopType) || null
    : null;
  const shopIncomeToday =
    player && player.shopIncomeDate === todayKey ? player.shopIncomeToday || 0 : 0;

  const handleTask = async (taskId: DailyTaskId) => {
    if (!player) {
      onRequireJoin();
      return;
    }
    if (completedToday.includes(taskId) || busyId) return;
    setErrorMsg(null);
    setBusyId(taskId);
    try {
      await onClaimTask(taskId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMilestone = async (days: number) => {
    if (!player || busyId) return;
    setErrorMsg(null);
    setBusyId(`ms_${days}`);
    try {
      await onClaimMilestone(days);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleShopClick = async (item: ShopItem, isOwned: boolean) => {
    if (!player) {
      onRequireJoin();
      return;
    }
    if (busyId) return;
    setErrorMsg(null);
    setBusyId(item.id);
    try {
      if (isOwned) {
        await onToggleOwnedItem(item);
      } else {
        if (coins < item.price) {
          setErrorMsg(t(lang, 'notEnoughCoins'));
          return;
        }
        await onBuyItem(item);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Purchase failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenMyShop = async (shopType: ShopType, price: number) => {
    if (!player) {
      onRequireJoin();
      return;
    }
    if (busyId) return;
    if (coins < price) {
      setErrorMsg(t(lang, 'notEnoughCoins'));
      return;
    }
    setErrorMsg(null);
    setBusyId(`open_${shopType}`);
    try {
      await onOpenPlotShop(shopType);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to open shop.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-16 top-16 z-40 flex items-end lg:items-center lg:justify-end lg:pr-6 pointer-events-none">
      <div className="pointer-events-auto w-full lg:w-[420px] bg-white rounded-t-3xl lg:rounded-3xl shadow-xl border border-stone-200 max-h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 shrink-0">
          <div>
            <h2 className="font-display text-lg font-bold text-stone-900">
              {t(lang, 'dailyTitle')}
            </h2>
            <p className="text-xs text-stone-500">{t(lang, 'dailyChecklistSub')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm font-bold text-amber-700 font-mono-tabular">
              <Coins className="w-4 h-4 text-amber-500" />
              <span>{coins}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
              aria-label={t(lang, 'close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-tab Switcher */}
        <div className="grid grid-cols-2 gap-2 px-5 py-2.5 bg-stone-50 border-b border-stone-100 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSubTab('tasks');
              setErrorMsg(null);
            }}
            className={`min-h-[40px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              subTab === 'tasks'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-stone-700 border border-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t(lang, 'dailyTasksTab')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSubTab('shop');
              setErrorMsg(null);
            }}
            className={`min-h-[40px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              subTab === 'shop'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-stone-700 border border-stone-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t(lang, 'decorateShopTab')}</span>
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
              {errorMsg}
            </div>
          )}

          {subTab === 'tasks' ? (
            <>
              {/* Streak Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-900/80">
                      {t(lang, 'streakLabel')}
                    </p>
                    <p className="font-display text-lg font-bold text-stone-900 font-mono-tabular">
                      {streak} {streak === 1 ? 'day' : 'days'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-emerald-800 font-mono-tabular">
                    {completedToday.length} / 4
                  </p>
                  <p className="text-[11px] text-stone-600">
                    {allFourDone ? '+10 bonus!' : '+5 each'}
                  </p>
                </div>
              </div>

              {/* 4 Daily Chores */}
              <div className="space-y-2">
                {DAILY_TASKS.map((task) => {
                  const done = completedToday.includes(task.id);
                  const isBusy = busyId === task.id;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      disabled={done || Boolean(busyId)}
                      onClick={() => handleTask(task.id)}
                      className={`w-full min-h-[52px] px-3.5 py-2.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                        done
                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                          : 'bg-white border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/30 active:scale-[0.99]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {lang === 'ml' ? task.ml : task.en}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {lang === 'ml' ? task.hintMl : task.hintEn}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                        ) : done ? (
                          <span className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold font-mono-tabular">
                            +{task.coins}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* All-4 Completion Bonus Info */}
              <div
                className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  allFourDone
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {allFourDone ? t(lang, 'allFourBonusDone') : t(lang, 'allFourBonusPending')}
                </span>
              </div>

              {/* 30-second Daily Work Shift (for residents without a shop) */}
              {!myShopCatalog && (
                <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/80 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{t(lang, 'workShiftTitle')}</span>
                      </p>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        {workShiftDone ? t(lang, 'workShiftAlreadyDone') : t(lang, 'workShiftSub')}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-[11px] font-bold font-mono-tabular shrink-0">
                      +10
                    </span>
                  </div>

                  {!workShiftDone && (
                    shiftSecsLeft !== null ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                          <span>{t(lang, 'workShiftRunning')}</span>
                          <span className="font-mono-tabular">{shiftSecsLeft}s</span>
                        </div>
                        <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-700 transition-all duration-300"
                            style={{ width: `${Math.round(((30 - shiftSecsLeft) / 30) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (!player) {
                            onRequireJoin();
                            return;
                          }
                          setShiftSecsLeft(30);
                        }}
                        className="w-full h-10 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition-colors"
                      >
                        {t(lang, 'workShiftStart')}
                      </button>
                    )
                  )}
                </div>
              )}

              {/* Collect Shop Earnings if player owns a shop */}
              {myShopCatalog && (
                <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-amber-700" />
                      <span>
                        {t(lang, 'shopActiveLabel')}:{' '}
                        {lang === 'ml' ? myShopCatalog.ml : myShopCatalog.en}
                      </span>
                    </span>
                    <span className="text-[11px] font-mono-tabular font-bold text-amber-900">
                      {shopIncomeToday}/50 today
                    </span>
                  </div>
                  {unclaimedOrders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onCollectShopEarnings()}
                      className="w-full h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                    >
                      {t(lang, 'shopClaimIncomeBtn')} (+{unclaimedOrders.length * 2})
                    </button>
                  )}
                </div>
              )}

              {/* Streak Milestones (3, 7, 14, 30 days) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  {t(lang, 'streakMilestones')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {STREAK_MILESTONES.map((ms) => {
                    const reached = streak >= ms.days;
                    const claimed = claimedMilestones.includes(ms.days);
                    return (
                      <div
                        key={ms.days}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                          claimed
                            ? 'bg-emerald-50 border-emerald-200'
                            : reached
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-stone-900 font-mono-tabular">
                            {ms.days}d
                          </p>
                          <p className="text-[11px] text-amber-800 font-semibold font-mono-tabular">
                            +{ms.bonus} coins
                          </p>
                        </div>
                        {claimed ? (
                          <span className="text-[11px] font-semibold text-emerald-700">
                            {t(lang, 'claimedLabel')}
                          </span>
                        ) : reached ? (
                          <button
                            type="button"
                            disabled={Boolean(busyId)}
                            onClick={() => handleMilestone(ms.days)}
                            className="min-h-[36px] px-2.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
                          >
                            {t(lang, 'claimBonus')}
                          </button>
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-stone-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Decor & Plot Shops */
            <div className="space-y-5">
              {/* Open ONE shop on plot */}
              <div className="space-y-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    {t(lang, 'openShopHeading')}
                  </h3>
                  <p className="text-[11px] text-stone-500">{t(lang, 'openShopSub')}</p>
                </div>

                {myShopCatalog ? (
                  <div className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">
                      {lang === 'ml' ? myShopCatalog.ml : myShopCatalog.en}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">
                      {t(lang, 'ownedEquipped')}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {PLOT_SHOP_CATALOG.map((shop) => {
                      const canAfford = coins >= shop.price;
                      return (
                        <div
                          key={shop.type}
                          className="p-3 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                              style={{ backgroundColor: shop.awningColor }}
                            >
                              <Store className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-stone-900 truncate">
                                {lang === 'ml' ? shop.ml : shop.en}
                              </p>
                              <p className="text-[11px] text-stone-500 font-mono-tabular">
                                {shop.price} {t(lang, 'coinsLabel')}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={Boolean(busyId)}
                            onClick={() => handleOpenMyShop(shop.type, shop.price)}
                            className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold shrink-0 ${
                              canAfford
                                ? 'bg-amber-600 text-white hover:bg-amber-700'
                                : 'bg-stone-100 text-stone-400'
                            }`}
                          >
                            {busyId === `open_${shop.type}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              `${t(lang, 'buyBtn')} · ${shop.price}`
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Yard & Roof Decor */}
              <div className="space-y-2">
                <p className="text-xs text-stone-500">{t(lang, 'shopSub')}</p>
                <div className="grid grid-cols-1 gap-2">
                  {DECORATE_SHOP_ITEMS.map((item) => {
                    const alreadyInHouse =
                      (item.kind === 'addition' &&
                        item.additionId &&
                        player?.additions?.includes(item.additionId)) ||
                      (item.kind === 'roof' && item.roofHex && player?.roofColor === item.roofHex);
                    const isOwned =
                      unlockedItems.includes(item.id) ||
                      (item.kind === 'addition' && Boolean(alreadyInHouse));
                    const canAfford = coins >= item.price;

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.kind === 'roof' && item.roofHex ? (
                            <span
                              className="w-8 h-8 rounded-xl border border-stone-300 shrink-0"
                              style={{ backgroundColor: item.roofHex }}
                            />
                          ) : (
                            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                              <Sparkles className="w-4 h-4" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-900 truncate">
                              {lang === 'ml' ? item.ml : item.en}
                            </p>
                            <p className="text-[11px] text-stone-500 font-mono-tabular">
                              {isOwned ? t(lang, 'unlocked') : `${item.price} ${t(lang, 'coinsLabel')}`}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => handleShopClick(item, isOwned)}
                          className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                            isOwned
                              ? alreadyInHouse
                                ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                                : 'bg-stone-900 text-white hover:bg-stone-800'
                              : canAfford
                              ? 'bg-amber-600 text-white hover:bg-amber-700'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          {busyId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isOwned ? (
                            alreadyInHouse ? (
                              item.kind === 'roof' ? t(lang, 'ownedEquipped') : t(lang, 'ownedRemove')
                            ) : (
                              t(lang, 'ownedEquip')
                            )
                          ) : (
                            `${t(lang, 'buyBtn')} · ${item.price}`
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
