import React, { useState } from 'react';
import { Footprints, Hand, Heart, Send, Store, Trash2, X } from 'lucide-react';
import { t } from '../i18n/translations';
import { DoorMessageDoc, Language, PlayerDoc, PLOT_SHOP_CATALOG } from '../types/village';
import { getCurrentMonthKey } from '../utils/festivals';
import { containsProfanity } from '../utils/profanity';
import { getLocalDateKey } from '../utils/vallamKali';
import { getWardNumber } from '../utils/wards';

interface HouseInspectSheetProps {
  player: PlayerDoc | null;
  myUid: string | null;
  hasJoined: boolean;
  lang: Language;
  doors: DoorMessageDoc[];
  hasHearted: boolean;
  onWave: (target: PlayerDoc) => Promise<void>;
  onVisit: (target: PlayerDoc) => void;
  onHeart: (target: PlayerDoc) => Promise<void>;
  onBuyFromShop: (target: PlayerDoc) => Promise<void>;
  onLeaveDoorNote: (target: PlayerDoc, message: string) => Promise<void>;
  onDeleteDoorNote: (doorId: string) => Promise<void>;
  onRequireJoin: () => void;
  onClose: () => void;
}

export function HouseInspectSheet({
  player,
  myUid,
  hasJoined,
  lang,
  doors,
  hasHearted,
  onWave,
  onVisit,
  onHeart,
  onBuyFromShop,
  onLeaveDoorNote,
  onDeleteDoorNote,
  onRequireJoin,
  onClose,
}: HouseInspectSheetProps) {
  const [note, setNote] = useState('');
  const [posting, setPosting] = useState(false);
  const [buyingShop, setBuyingShop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!player) return null;

  const isMe = player.uid === myUid;
  const wardId = getWardNumber(player.plotX, player.plotY);
  const isMayor = Boolean(player.mayorMonth && player.mayorMonth === getCurrentMonthKey());
  const shopItem = player.shopType
    ? PLOT_SHOP_CATALOG.find((s) => s.type === player.shopType) || null
    : null;
  const todayKey = getLocalDateKey();
  const sellerIncome =
    player.shopIncomeDate === todayKey ? player.shopIncomeToday || 0 : 0;
  const capReached = sellerIncome >= 50;

  const houseDoors = doors.filter((d) => d.targetUid === player.uid);
  const joinDate = new Date(player.createdAt).toLocaleDateString(
    lang === 'ml' ? 'ml-IN' : 'en-IN',
    { month: 'short', day: 'numeric', year: 'numeric' }
  );

  const styleKey =
    player.houseStyle === 'nalukettu'
      ? 'styleNalukettu'
      : player.houseStyle === 'modern'
      ? 'styleModern'
      : player.houseStyle === 'tharavad'
      ? 'styleTharavad'
      : 'styleTiled';

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!hasJoined) {
      onRequireJoin();
      return;
    }
    const trimmed = note.trim();
    if (!trimmed) return;
    if (containsProfanity(trimmed)) {
      setError(t(lang, 'profanityMsg'));
      return;
    }
    setPosting(true);
    try {
      await onLeaveDoorNote(player, trimmed.slice(0, 60));
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to post note.');
    } finally {
      setPosting(false);
    }
  };

  const handleShopBuy = async () => {
    if (!hasJoined) {
      onRequireJoin();
      return;
    }
    setError(null);
    setBuyingShop(true);
    try {
      await onBuyFromShop(player);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed.');
    } finally {
      setBuyingShop(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-16 top-16 z-40 flex items-end lg:items-center lg:justify-start lg:pl-6 pointer-events-none">
      <div className="pointer-events-auto w-full lg:w-[390px] bg-white rounded-t-3xl lg:rounded-3xl shadow-xl border border-stone-200 max-h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-display text-lg font-bold text-stone-900 truncate">
                @{player.username}
              </h2>
              {isMayor && (
                <span
                  title={t(lang, 'mayorBadge')}
                  className="px-1.5 py-0.5 rounded-md bg-amber-300 text-amber-950 text-[10px] font-bold shrink-0"
                >
                  👑 {t(lang, 'mayorBadge')}
                </span>
              )}
              {Boolean(player.boatBadgeUntil && player.boatBadgeUntil > Date.now()) && (
                <span title={t(lang, 'vallamGoldBadge')} className="text-sm shrink-0">
                  🛶
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              {t(lang, 'wardLabel')} {wardId} · {t(lang, styleKey)} · {t(lang, 'joinedOn')} {joinDate}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 shrink-0"
            aria-label={t(lang, 'close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                if (!hasJoined) return onRequireJoin();
                onWave(player);
              }}
              className="min-h-[44px] px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-amber-50 hover:border-amber-300 text-xs font-semibold text-stone-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Hand className="w-4 h-4 text-amber-600" />
              <span>{t(lang, 'inspectWave')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!hasJoined) return onRequireJoin();
                onVisit(player);
              }}
              className="min-h-[44px] px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-semibold text-stone-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Footprints className="w-4 h-4 text-emerald-700" />
              <span>{t(lang, 'inspectVisit')}</span>
            </button>

            <button
              type="button"
              disabled={hasHearted || isMe}
              onClick={() => {
                if (!hasJoined) return onRequireJoin();
                if (!hasHearted && !isMe) onHeart(player);
              }}
              className={`min-h-[44px] px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                hasHearted
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'border-stone-200 bg-stone-50 hover:bg-rose-50 hover:border-rose-300 text-stone-800 disabled:opacity-60'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasHearted ? 'fill-rose-600 text-rose-600' : 'text-rose-600'}`} />
              <span className="font-mono-tabular">{player.heartsCount}</span>
            </button>
          </div>

          {/* Plot Shop Visitor Purchase */}
          {shopItem && (
            <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0"
                  style={{ backgroundColor: shopItem.awningColor }}
                >
                  <Store className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900 truncate">
                    {lang === 'ml' ? shopItem.ml : shopItem.en}
                  </p>
                  <p className="text-[11px] text-stone-600 font-mono-tabular">
                    {sellerIncome}/50 coins today
                  </p>
                </div>
              </div>
              {!isMe && (
                <button
                  type="button"
                  disabled={buyingShop || capReached}
                  onClick={handleShopBuy}
                  className="min-h-[38px] px-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-500 text-white text-xs font-semibold shrink-0"
                >
                  {capReached ? 'Full' : t(lang, 'shopBuyBtn')}
                </button>
              )}
            </div>
          )}

          {/* Door Nameplate Messages */}
          <div>
            <h3 className="text-sm font-semibold text-stone-800 mb-2">
              {t(lang, 'doorBoard')}
            </h3>

            <form onSubmit={handleSubmitNote} className="flex gap-2 mb-3">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 60))}
                placeholder={t(lang, 'doorPlaceholder')}
                maxLength={60}
                className="flex-1 h-10 px-3 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <button
                type="submit"
                disabled={posting || !note.trim()}
                className="h-10 px-3.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 disabled:opacity-50 flex items-center gap-1 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t(lang, 'leaveNote')}</span>
              </button>
            </form>

            {error && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5 mb-2">
                {error}
              </p>
            )}

            <div className="space-y-2">
              {houseDoors.length === 0 ? (
                <p className="text-xs text-stone-500 py-2">{t(lang, 'noDoorNotes')}</p>
              ) : (
                houseDoors.map((d) => {
                  const canDelete = myUid === d.authorUid || myUid === d.targetUid;
                  return (
                    <div
                      key={d.id}
                      className="p-3 rounded-xl bg-[#f9f6ee] border border-stone-200 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-stone-800">
                          @{d.authorUsername}
                        </div>
                        <p className="text-xs text-stone-700 mt-0.5 break-words">{d.message}</p>
                      </div>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDeleteDoorNote(d.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg shrink-0"
                          aria-label="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
