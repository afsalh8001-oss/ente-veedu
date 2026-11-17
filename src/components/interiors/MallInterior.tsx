import { useState } from 'react';
import { Armchair, Check, Shirt, Sparkles, Utensils } from 'lucide-react';
import {
  MALL_ACCESSORIES,
  MALL_CLOTHES,
  MALL_FOOD_ITEMS,
  MALL_FURNITURE,
} from '../../utils/townBuildings';
import { BuildingInteriorProps } from './types';

type MallFloor = 1 | 2 | 3;

export function MallInterior({
  lang,
  myPlayer,
  onRequireJoin,
  onShowToast,
  onBuyMallOutfit,
  onBuyMallAccessory,
  onBuyMallFurniture,
  onSpendHealthBoost,
}: BuildingInteriorProps) {
  const [floor, setFloor] = useState<MallFloor>(1);
  const [ridingEscalator, setRidingEscalator] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const unlocked = myPlayer?.unlockedItems || [];
  const ownedFurniture = myPlayer?.furniture || [];

  const switchFloor = (nextFloor: MallFloor) => {
    if (nextFloor === floor) return;
    setErrMsg(null);
    setRidingEscalator(true);
    setTimeout(() => {
      setFloor(nextFloor);
      setRidingEscalator(false);
    }, 320);
  };

  const guardPlayer = (): boolean => {
    if (!myPlayer) {
      onRequireJoin();
      return false;
    }
    return true;
  };

  const runAction = async (id: string, fn: () => Promise<void>) => {
    if (!guardPlayer()) return;
    setErrMsg(null);
    setBusyId(id);
    try {
      await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to complete purchase.';
      setErrMsg(msg);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Interactive Escalator Floor Switcher */}
      <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-amber-50/50 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
            {lang === 'ml' ? 'മാൾ എസ്കലേറ്റർ' : 'Mall Escalator'}
          </span>
          <span className="text-[11px] font-mono-tabular font-semibold text-emerald-800">
            {ridingEscalator
              ? lang === 'ml'
                ? 'നില മാറുന്നു...'
                : 'Gliding floors...'
              : `F${floor} / F3`}
          </span>
        </div>

        {/* Procedural diagonal escalator track */}
        <div className="relative h-8 rounded-xl bg-stone-200/70 overflow-hidden flex items-center px-3">
          <div
            className="h-1.5 w-full rounded-full bg-stone-300 relative"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, #a8a29e 0px, #a8a29e 8px, transparent 8px, transparent 16px)',
            }}
          />
          <div
            className="absolute top-1.5 w-5 h-5 rounded-full bg-emerald-700 border-2 border-white shadow-sm transition-all duration-300"
            style={{
              left: floor === 1 ? '12%' : floor === 2 ? '48%' : '84%',
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {([
            {
              f: 1 as MallFloor,
              icon: <Shirt className="w-3.5 h-3.5" />,
              en: '1F Clothes',
              ml: '1F വസ്ത്രം',
            },
            {
              f: 2 as MallFloor,
              icon: <Armchair className="w-3.5 h-3.5" />,
              en: '2F Gear & Home',
              ml: '2F ഫർണിച്ചർ',
            },
            {
              f: 3 as MallFloor,
              icon: <Utensils className="w-3.5 h-3.5" />,
              en: '3F Food Court',
              ml: '3F ഫുഡ് കോർട്ട്',
            },
          ]).map((tab) => (
            <button
              key={tab.f}
              type="button"
              onClick={() => switchFloor(tab.f)}
              className={`min-h-[42px] px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                floor === tab.f
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {tab.icon}
              <span className="truncate">{lang === 'ml' ? tab.ml : tab.en}</span>
            </button>
          ))}
        </div>
      </div>

      {errMsg && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900">
          {errMsg}
        </div>
      )}

      {/* 1F: Clothes & Tailors */}
      {floor === 1 && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            {lang === 'ml' ? 'വസ്ത്രശാല' : 'Vasthralayam Boutique'}
          </h3>
          <div className="space-y-2">
            {MALL_CLOTHES.map((c) => {
              const owned = unlocked.includes(c.id);
              const wearing =
                myPlayer?.outfitType === c.outfitType && myPlayer?.outfitColor === c.outfitColor;
              return (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-7 h-7 rounded-xl border border-stone-300 shrink-0"
                      style={{ backgroundColor: c.outfitColor }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-900 truncate">
                        {lang === 'ml' ? c.ml : c.en}
                      </p>
                      <p className="text-[11px] text-stone-500 capitalize">{c.outfitType}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === c.id || wearing}
                    onClick={() =>
                      runAction(c.id, async () => {
                        await onBuyMallOutfit(c);
                        onShowToast(
                          lang === 'ml' ? `${c.ml} ധരിച്ചു!` : `Equipped ${c.en}!`
                        );
                      })
                    }
                    className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      wearing
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : owned
                          ? 'bg-stone-800 text-white hover:bg-stone-900'
                          : 'bg-amber-600 text-white hover:bg-amber-700'
                    }`}
                  >
                    {wearing ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {lang === 'ml' ? 'ധരിച്ചു' : 'Wearing'}
                      </span>
                    ) : owned ? (
                      lang === 'ml' ? (
                        'ധരിക്കൂ'
                      ) : (
                        'Wear Free'
                      )
                    ) : (
                      <span className="font-mono-tabular">{c.price} coins</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2F: Avatar Accessories & House Furniture */}
      {floor === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === 'ml' ? 'ആക്സസറികൾ' : 'Avatar Accessories'}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MALL_ACCESSORIES.map((acc) => {
                const owned = unlocked.includes(acc.itemId);
                const equipped = myPlayer?.accessory === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    disabled={busyId === acc.itemId}
                    onClick={() =>
                      runAction(acc.itemId, async () => {
                        await onBuyMallAccessory(acc);
                        onShowToast(
                          lang === 'ml' ? `${acc.ml} പുതുക്കി!` : `${acc.en} updated!`
                        );
                      })
                    }
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-colors ${
                      equipped
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{acc.icon}</span>
                      <span className="text-xs font-bold text-stone-900 truncate">
                        {lang === 'ml' ? acc.ml : acc.en}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono-tabular font-bold text-amber-800 shrink-0">
                      {equipped
                        ? lang === 'ml'
                          ? 'ഇട്ടിട്ടുണ്ട്'
                          : 'On'
                        : owned
                          ? lang === 'ml'
                            ? 'ഇടൂ'
                            : 'Equip'
                          : `${acc.price}c`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Armchair className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'ml' ? 'വീട്ടു ഫർണിച്ചറുകൾ' : 'Home & Veranda Furniture'}</span>
            </h3>
            <div className="space-y-2">
              {MALL_FURNITURE.map((f) => {
                const owned = ownedFurniture.includes(f.id);
                return (
                  <div
                    key={f.id}
                    className="p-3 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-900 truncate">
                        {lang === 'ml' ? f.ml : f.en}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">
                        {lang === 'ml' ? f.descMl : f.descEn}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={owned || busyId === f.itemId}
                      onClick={() =>
                        runAction(f.itemId, async () => {
                          await onBuyMallFurniture(f);
                          onShowToast(
                            lang === 'ml'
                              ? `${f.ml} വീട്ടിലെ മുറ്റത്ത് വെച്ചു!`
                              : `${f.en} placed in your veedu!`
                          );
                        })
                      }
                      className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold shrink-0 ${
                        owned
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-emerald-800 text-white hover:bg-emerald-900'
                      }`}
                    >
                      {owned
                        ? lang === 'ml'
                          ? 'സ്വന്തം'
                          : 'Owned'
                        : `${f.price} coins`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3F: Food Court */}
      {floor === 3 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {lang === 'ml' ? 'ഫുഡ് കോർട്ട് (ആരോഗ്യം കൂട്ടൂ)' : 'Food Court (Restores Health)'}
            </h3>
            <span className="text-xs font-mono-tabular font-bold text-rose-700">
              HP {myPlayer?.health ?? 100}/100
            </span>
          </div>

          <div className="space-y-2">
            {MALL_FOOD_ITEMS.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-stone-900 truncate">
                      {lang === 'ml' ? item.ml : item.en}
                    </p>
                    <p className="text-[11px] font-mono-tabular text-emerald-700 font-semibold">
                      +{item.heal} HP
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() =>
                    runAction(item.id, () =>
                      onSpendHealthBoost(
                        item.price,
                        item.heal,
                        `Enjoyed ${item.en}! +${item.heal} HP`,
                        `${item.ml} കഴിച്ചു! +${item.heal} HP`
                      )
                    )
                  }
                  className="min-h-[40px] px-3.5 rounded-xl bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold font-mono-tabular shrink-0"
                >
                  {item.price} coins
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
