import React, { useEffect, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { t } from '../i18n/translations';
import {
  Language,
  OUTFIT_COLORS,
  OutfitType,
  SKIN_TONES,
} from '../types/village';
import {
  containsProfanity,
  isValidUsernameFormat,
  sanitizeUsername,
} from '../utils/profanity';

interface JoinModalProps {
  open: boolean;
  lang: Language;
  onCheckUsername: (username: string) => Promise<boolean>;
  onClaimPlot: (data: {
    username: string;
    skinTone: string;
    outfitType: OutfitType;
    outfitColor: string;
  }) => Promise<void>;
  onClose: () => void;
}

export function JoinModal({
  open,
  lang,
  onCheckUsername,
  onClaimPlot,
  onClose,
}: JoinModalProps) {
  const [username, setUsername] = useState('');
  const [skinTone, setSkinTone] = useState(SKIN_TONES[2]);
  const [outfitType, setOutfitType] = useState<OutfitType>('mundu');
  const [outfitColor, setOutfitColor] = useState(OUTFIT_COLORS[0].hex);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (!isValidUsernameFormat(username)) {
      setAvailable(null);
      return;
    }
    if (containsProfanity(username)) {
      setAvailable(false);
      return;
    }

    let cancelled = false;
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const ok = await onCheckUsername(username);
        if (!cancelled) {
          setAvailable(ok);
        }
      } catch {
        if (!cancelled) setAvailable(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, open, onCheckUsername]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidUsernameFormat(username)) {
      setError(t(lang, 'usernameInvalid'));
      return;
    }
    if (containsProfanity(username)) {
      setError(t(lang, 'profanityMsg'));
      return;
    }
    if (available === false) {
      setError(t(lang, 'usernameTaken'));
      return;
    }
    setSubmitting(true);
    try {
      await onClaimPlot({ username, skinTone, outfitType, outfitColor });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to claim plot.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl border border-stone-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-100">
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900">
              {t(lang, 'joinTitle')}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">{t(lang, 'joinSubtitle')}</p>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Live miniature resident preview */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#edf3e6] border border-emerald-900/10">
            <div className="w-14 h-14 rounded-xl bg-white/80 flex items-center justify-center shrink-0">
              <svg width="36" height="44" viewBox="0 0 36 44" aria-hidden="true">
                <ellipse cx="18" cy="40" rx="8" ry="3" fill="rgba(0,0,0,0.14)" />
                {outfitType === 'shirt' ? (
                  <>
                    <rect x="13" y="29" width="4" height="10" rx="1" fill="#334155" />
                    <rect x="19" y="29" width="4" height="10" rx="1" fill="#334155" />
                    <rect x="12" y="19" width="12" height="11" rx="2" fill={outfitColor} />
                  </>
                ) : (
                  <>
                    <rect x="12" y="20" width="12" height="19" rx="2" fill={outfitColor} />
                    <rect x="12" y="35" width="12" height="2" fill="#d4a338" />
                  </>
                )}
                <circle cx="18" cy="13" r="5.5" fill={skinTone} />
                <path d="M12.5 13 A5.5 5.5 0 0 1 23.5 13 Z" fill="#1f1a17" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-stone-900 truncate">
                @{username || 'your_name'}
              </div>
              <div className="text-xs text-stone-600 mt-0.5">
                {t(lang, outfitType)} · {t(lang, 'styleTiled')}
              </div>
            </div>
          </div>

          {/* Handle */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1.5">
              {t(lang, 'usernameLabel')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-semibold text-sm">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                placeholder="kuttan_99"
                maxLength={20}
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full h-11 pl-8 pr-10 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking && <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />}
                {!checking && available === true && (
                  <Check className="w-4 h-4 text-emerald-700" />
                )}
              </div>
            </div>
            <div className="mt-1.5 text-xs flex items-center justify-between">
              <span
                className={
                  available === false
                    ? 'text-red-600 font-medium'
                    : available === true
                    ? 'text-emerald-700 font-medium'
                    : 'text-stone-500'
                }
              >
                {checking
                  ? t(lang, 'usernameChecking')
                  : available === true
                  ? t(lang, 'usernameAvailable')
                  : available === false
                  ? t(lang, 'usernameTaken')
                  : t(lang, 'usernameHint')}
              </span>
            </div>
          </div>

          {/* Skin Tone */}
          <div>
            <span className="block text-sm font-semibold text-stone-800 mb-2">
              {t(lang, 'skinTone')}
            </span>
            <div className="flex items-center gap-3">
              {SKIN_TONES.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setSkinTone(tone)}
                  className={`w-10 h-10 rounded-full border-2 transition-transform ${
                    skinTone === tone
                      ? 'border-emerald-800 scale-110'
                      : 'border-stone-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: tone }}
                  aria-label={`Skin tone ${tone}`}
                />
              ))}
            </div>
          </div>

          {/* Outfit Type */}
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
                  className={`h-11 rounded-xl text-sm font-medium border transition-colors ${
                    outfitType === type
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {t(lang, type)}
                </button>
              ))}
            </div>
          </div>

          {/* Outfit Colour */}
          <div>
            <span className="block text-sm font-semibold text-stone-800 mb-2">
              {t(lang, 'outfitColor')}
            </span>
            <div className="flex flex-wrap gap-2.5">
              {OUTFIT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setOutfitColor(c.hex)}
                  className={`h-10 px-3 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                    outfitColor === c.hex
                      ? 'border-emerald-800 bg-emerald-50 text-emerald-950'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-stone-300 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{lang === 'ml' ? c.labelMl : c.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !isValidUsernameFormat(username) || available === false}
            className="w-full h-12 rounded-xl bg-emerald-800 text-white text-sm font-semibold hover:bg-emerald-900 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{submitting ? t(lang, 'claiming') : t(lang, 'claimPlotBtn')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
