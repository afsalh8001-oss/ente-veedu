import React, { useEffect, useState } from 'react';
import { Check, Loader2, Lock, X } from 'lucide-react';
import { t } from '../i18n/translations';
import {
  DECORATE_SHOP_ITEMS,
  FREE_YARD_ADDITIONS,
  HouseStyle,
  Language,
  OUTFIT_COLORS,
  OutfitType,
  PlayerDoc,
  ROOF_COLORS,
  SKIN_TONES,
  WALL_COLORS,
  YardAddition,
} from '../types/village';
import { isOnamSeason } from '../utils/profanity';

interface CustomizeSheetProps {
  open: boolean;
  player: PlayerDoc | null;
  lang: Language;
  onSave: (updates: {
    houseStyle: HouseStyle;
    roofColor: string;
    wallColor: string;
    skinTone: string;
    outfitType: OutfitType;
    outfitColor: string;
    additions: YardAddition[];
  }) => Promise<void>;
  onOpenShop: () => void;
  onClose: () => void;
}

const STYLE_OPTIONS: { id: HouseStyle; key: 'styleTiled' | 'styleNalukettu' | 'styleModern' | 'styleTharavad' }[] = [
  { id: 'tiled', key: 'styleTiled' },
  { id: 'nalukettu', key: 'styleNalukettu' },
  { id: 'modern', key: 'styleModern' },
  { id: 'tharavad', key: 'styleTharavad' },
];

const ADDITION_OPTIONS: {
  id: YardAddition;
  key:
    | 'addCoconutTree'
    | 'addVegGarden'
    | 'addCowShed'
    | 'addSwing'
    | 'addRangoli'
    | 'addPookalam'
    | 'addNilavilakku'
    | 'addTulsiThara'
    | 'addBananaGrove'
    | 'addRooster'
    | 'addGoat'
    | 'addSmallBoat';
}[] = [
  { id: 'coconutTree', key: 'addCoconutTree' },
  { id: 'cowShed', key: 'addCowShed' },
  { id: 'rangoli', key: 'addRangoli' },
  { id: 'vegGarden', key: 'addVegGarden' },
  { id: 'swing', key: 'addSwing' },
  { id: 'pookalam', key: 'addPookalam' },
  { id: 'nilavilakku', key: 'addNilavilakku' },
  { id: 'tulsiThara', key: 'addTulsiThara' },
  { id: 'bananaGrove', key: 'addBananaGrove' },
  { id: 'rooster', key: 'addRooster' },
  { id: 'goat', key: 'addGoat' },
  { id: 'smallBoat', key: 'addSmallBoat' },
];

export function CustomizeSheet({
  open,
  player,
  lang,
  onSave,
  onOpenShop,
  onClose,
}: CustomizeSheetProps) {
  const [houseStyle, setHouseStyle] = useState<HouseStyle>('tiled');
  const [roofColor, setRoofColor] = useState(ROOF_COLORS[0].hex);
  const [wallColor, setWallColor] = useState(WALL_COLORS[0].hex);
  const [skinTone, setSkinTone] = useState(SKIN_TONES[2]);
  const [outfitType, setOutfitType] = useState<OutfitType>('mundu');
  const [outfitColor, setOutfitColor] = useState(OUTFIT_COLORS[0].hex);
  const [additions, setAdditions] = useState<YardAddition[]>(['coconutTree']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (player && open) {
      setHouseStyle(player.houseStyle);
      setRoofColor(player.roofColor);
      setWallColor(player.wallColor);
      setSkinTone(player.skinTone);
      setOutfitType(player.outfitType);
      setOutfitColor(player.outfitColor);
      setAdditions(player.additions || []);
    }
  }, [player, open]);

  if (!open || !player) return null;

  const unlockedSet = new Set(player.unlockedItems || []);

  const isAdditionUnlocked = (id: YardAddition) => {
    if (FREE_YARD_ADDITIONS.includes(id)) return true;
    if (player.additions?.includes(id)) return true;
    const shopItem = DECORATE_SHOP_ITEMS.find((it) => it.kind === 'addition' && it.additionId === id);
    return shopItem ? unlockedSet.has(shopItem.id) : true;
  };

  const shopRoofs = DECORATE_SHOP_ITEMS.filter(
    (it) => it.kind === 'roof' && it.roofHex && (unlockedSet.has(it.id) || player.roofColor === it.roofHex)
  );
  const availableRoofs = [
    ...ROOF_COLORS,
    ...shopRoofs.map((sr) => ({
      id: sr.id,
      labelEn: sr.en,
      labelMl: sr.ml,
      hex: sr.roofHex!,
    })),
  ];

  const toggleAddition = (id: YardAddition) => {
    if (!isAdditionUnlocked(id)) {
      onOpenShop();
      return;
    }
    setAdditions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        houseStyle,
        roofColor,
        wallColor,
        skinTone,
        outfitType,
        outfitColor,
        additions,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-16 top-16 z-40 flex items-end lg:items-center lg:justify-end lg:pr-6 pointer-events-none">
      <div className="pointer-events-auto w-full lg:w-[400px] bg-white rounded-t-3xl lg:rounded-3xl shadow-xl border border-stone-200 max-h-full overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs flex items-center justify-between px-5 py-3.5 border-b border-stone-100 z-10">
          <h2 className="font-display text-lg font-bold text-stone-900">
            {t(lang, 'customizeTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
            aria-label={t(lang, 'close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <span className="block text-sm font-semibold text-stone-800 mb-2">
              {t(lang, 'houseStyle')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setHouseStyle(opt.id)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl border text-left text-xs font-semibold transition-colors ${
                    houseStyle === opt.id
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {t(lang, opt.key)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-semibold text-stone-800 mb-2">
              {t(lang, 'roofColor')}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {availableRoofs.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setRoofColor(c.hex)}
                  className={`h-10 px-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${
                    roofColor === c.hex
                      ? 'border-emerald-800 bg-emerald-50 text-emerald-950'
                      : 'border-stone-200 text-stone-700'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-stone-300"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{lang === 'ml' ? c.labelMl : c.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-semibold text-stone-800 mb-2">
              {t(lang, 'wallColor')}
            </span>
            <div className="flex items-center gap-2.5">
              {WALL_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setWallColor(c.hex)}
                  className={`w-10 h-10 rounded-full border-2 transition-transform ${
                    wallColor === c.hex ? 'border-emerald-800 scale-110' : 'border-stone-300'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={lang === 'ml' ? c.labelMl : c.labelEn}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-stone-800">
                {t(lang, 'yardAdditions')}
              </span>
              {isOnamSeason() ? (
                <span className="text-xs text-amber-700 font-medium">{t(lang, 'onamTip')}</span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenShop}
                  className="text-[11px] font-semibold text-amber-700 hover:underline"
                >
                  {t(lang, 'unlockInShopHint')}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ADDITION_OPTIONS.map((item) => {
                const unlocked = isAdditionUnlocked(item.id);
                const active = additions.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleAddition(item.id)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 transition-colors ${
                      !unlocked
                        ? 'bg-stone-50 border-stone-200 text-stone-400'
                        : active
                        ? 'bg-emerald-50 border-emerald-700 text-emerald-950'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="truncate">{t(lang, item.key)}</span>
                    {!unlocked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    ) : (
                      active && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-sm font-semibold text-stone-800 mb-2">
              {t(lang, 'outfitStyle')}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['mundu', 'sari', 'shirt'] as OutfitType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOutfitType(type)}
                  className={`h-10 rounded-xl text-xs font-semibold border ${
                    outfitType === type
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-700 border-stone-200'
                  }`}
                >
                  {t(lang, type)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 rounded-xl bg-emerald-800 text-white text-sm font-semibold hover:bg-emerald-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{t(lang, 'saveChanges')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
