import { useState } from 'react';
import { Heart, MapPin, Search, Share2, X } from 'lucide-react';
import { t } from '../i18n/translations';
import { Language, PlayerDoc } from '../types/village';

interface LeaderboardSearchSheetProps {
  open: boolean;
  lang: Language;
  players: PlayerDoc[];
  myPlayer: PlayerDoc | null;
  onFlyToPlayer: (player: PlayerDoc) => void;
  onShareMyVeedu: () => void;
  onClose: () => void;
}

export function LeaderboardSearchSheet({
  open,
  lang,
  players,
  myPlayer,
  onFlyToPlayer,
  onShareMyVeedu,
  onClose,
}: LeaderboardSearchSheetProps) {
  const [queryText, setQueryText] = useState('');

  if (!open) return null;

  const cleanQ = queryText.toLowerCase().replace(/^@/, '').trim();
  const filtered = cleanQ
    ? players.filter((p) => p.username.includes(cleanQ)).slice(0, 12)
    : [];

  const topHouses = [...players]
    .sort((a, b) => b.heartsCount - a.heartsCount || a.createdAt - b.createdAt)
    .slice(0, 10);

  return (
    <div className="fixed inset-x-0 bottom-16 top-16 z-40 flex items-end lg:items-center lg:justify-end lg:pr-6 pointer-events-none">
      <div className="pointer-events-auto w-full lg:w-[400px] bg-white rounded-t-3xl lg:rounded-3xl shadow-xl border border-stone-200 max-h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 shrink-0">
          <h2 className="font-display text-lg font-bold text-stone-900">
            {t(lang, 'searchTitle')}
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

        <div className="p-5 overflow-y-auto space-y-5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={t(lang, 'searchPlaceholder')}
              className="w-full h-11 pl-10 pr-3 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {myPlayer && (
            <button
              type="button"
              onClick={onShareMyVeedu}
              className="w-full h-11 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{t(lang, 'shareMyVeedu')} (@{myPlayer.username})</span>
            </button>
          )}

          {/* Search matches */}
          {cleanQ && (
            <div className="space-y-1.5">
              {filtered.length === 0 ? (
                <p className="text-xs text-stone-500 py-2">No matching @username found.</p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.uid}
                    type="button"
                    onClick={() => {
                      onFlyToPlayer(p);
                      onClose();
                    }}
                    className="w-full min-h-[48px] px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-emerald-50 flex items-center justify-between text-left transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="text-sm font-semibold text-stone-900 truncate">
                        @{p.username}
                      </span>
                    </div>
                    <span className="text-xs font-mono-tabular text-stone-500">
                      ({p.plotX}, {p.plotY})
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Most-Loved Houses Leaderboard */}
          <div>
            <h3 className="text-sm font-semibold text-stone-800 mb-2.5">
              {t(lang, 'leaderboardTitle')}
            </h3>
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
              {topHouses.map((p, idx) => (
                <button
                  key={p.uid}
                  type="button"
                  onClick={() => {
                    onFlyToPlayer(p);
                    onClose();
                  }}
                  className="w-full min-h-[50px] px-4 py-2.5 bg-white hover:bg-stone-50 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono-tabular text-xs font-bold text-stone-400 w-5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-semibold text-stone-900 truncate">
                      @{p.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-600 shrink-0">
                    <Heart className="w-3.5 h-3.5 fill-rose-600" />
                    <span className="font-mono-tabular text-xs font-semibold text-stone-800">
                      {p.heartsCount}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
