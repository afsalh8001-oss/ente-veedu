import React, { useState } from 'react';
import { Check, Crown, Hammer, Heart, Lock, Sparkles, X } from 'lucide-react';
import { t } from '../i18n/translations';
import {
  BUILDABLE_CATALOG,
  Language,
  matchBuildingType,
  MILESTONE_REGIONS,
  SuggestionDoc,
  VillageMetaDoc,
} from '../types/village';
import { containsProfanity } from '../utils/profanity';

interface VotingSheetProps {
  open: boolean;
  lang: Language;
  population: number;
  hasJoined: boolean;
  isMayorCanBuild?: boolean;
  suggestions: SuggestionDoc[];
  votedIds: Set<string>;
  meta: VillageMetaDoc | null;
  onSubmitSuggestion: (text: string) => Promise<void>;
  onUpvote: (suggestionId: string) => Promise<void>;
  onMayorBuildNow?: (suggestion: SuggestionDoc) => Promise<void>;
  onResolveTopNow?: () => Promise<void>;
  onFlyToLandmark: (x: number, y: number) => void;
  onRequireJoin: () => void;
  onClose: () => void;
}

export function VotingSheet({
  open,
  lang,
  population,
  hasJoined,
  isMayorCanBuild,
  suggestions,
  votedIds,
  meta,
  onSubmitSuggestion,
  onUpvote,
  onMayorBuildNow,
  onResolveTopNow,
  onFlyToLandmark,
  onRequireJoin,
  onClose,
}: VotingSheetProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'votes' | 'milestones'>('votes');

  if (!open) return null;

  const threshold = Math.max(3, Math.ceil(Math.max(1, population) * 0.15));
  const openSuggestions = suggestions
    .filter((s) => s.status === 'open')
    .sort((a, b) => b.votes - a.votes || a.createdAt - b.createdAt);

  const msLeft = meta ? Math.max(0, meta.nextResolutionAt - Date.now()) : 24 * 3600 * 1000;
  const hrs = Math.floor(msLeft / 3600000);
  const mins = Math.floor((msLeft % 3600000) / 60000);

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!hasJoined) {
      onRequireJoin();
      return;
    }
    const trimmed = text.trim();
    if (trimmed.length < 2) return;
    if (containsProfanity(trimmed)) {
      setError(t(lang, 'profanityMsg'));
      return;
    }
    setSubmitting(true);
    try {
      await onSubmitSuggestion(trimmed);
      setText('');
    } catch (err) {
      if (err instanceof Error && err.message === 'RATE_LIMIT') {
        setError(t(lang, 'rateLimitMsg'));
      } else {
        setError(err instanceof Error ? err.message : 'Unable to post suggestion.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const matchedPreview = text.trim().length > 1 ? matchBuildingType(text) : null;

  return (
    <div className="fixed inset-x-0 bottom-16 top-16 z-40 flex items-end lg:items-center lg:justify-end lg:pr-6 pointer-events-none">
      <div className="pointer-events-auto w-full lg:w-[440px] bg-white rounded-t-3xl lg:rounded-3xl shadow-xl border border-stone-200 max-h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 shrink-0">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-stone-900 truncate">
              {viewMode === 'votes' ? t(lang, 'votingTitle') : t(lang, 'milestonesTitle')}
            </h2>
            <p className="text-xs text-stone-500 font-mono-tabular">
              {t(lang, 'thresholdLabel')}: {threshold} {t(lang, 'voteCount')} · {t(lang, 'nextCycle')} {hrs}h {mins}m
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

        {/* Segmented toggle */}
        <div className="px-5 pt-3 shrink-0">
          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('votes')}
              className={`h-9 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'votes'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t(lang, 'buildVote')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('milestones')}
              className={`h-9 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'milestones'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t(lang, 'milestonesTitle')}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {viewMode === 'votes' ? (
            <>
              <form onSubmit={handleSuggest} className="space-y-2.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 80))}
                    placeholder={t(lang, 'suggestPlaceholder')}
                    maxLength={80}
                    className="flex-1 h-11 px-3.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  <button
                    type="submit"
                    disabled={submitting || text.trim().length < 2}
                    className="h-11 px-4 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    {t(lang, 'suggestBtn')}
                  </button>
                </div>

                {text.trim().length > 2 && !matchedPreview && (
                  <p className="text-[11px] text-amber-700">{t(lang, 'invalidBuildingHint')}</p>
                )}
                {matchedPreview && (
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <Hammer className="w-3 h-3" />
                    <span>
                      {lang === 'ml' ? matchedPreview.ml : matchedPreview.en}
                    </span>
                  </p>
                )}

                {error && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                {/* Quick pick buildable chips */}
                <div>
                  <div className="text-[11px] font-medium text-stone-500 mb-1.5">
                    {t(lang, 'quickIdeas')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {BUILDABLE_CATALOG.slice(0, 9).map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setText(lang === 'ml' ? item.ml : item.en)}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 text-[11px] font-medium text-stone-700 transition-colors"
                      >
                        {lang === 'ml' ? item.ml : item.en}
                      </button>
                    ))}
                  </div>
                </div>
              </form>

              {/* Suggestions List */}
              <div className="space-y-2.5">
                {openSuggestions.length === 0 ? (
                  <p className="text-sm text-stone-500 py-4 text-center">
                    {t(lang, 'emptySuggestions')}
                  </p>
                ) : (
                  openSuggestions.map((s) => {
                    const voted = votedIds.has(s.id);
                    const pct = Math.min(100, Math.round((s.votes / threshold) * 100));
                    return (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-stone-900 break-words">
                              {s.text}
                            </div>
                            <div className="text-xs text-stone-500 mt-0.5">
                              @{s.authorUsername}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!hasJoined) {
                                onRequireJoin();
                                return;
                              }
                              if (!voted) onUpvote(s.id);
                            }}
                            disabled={voted}
                            className={`min-h-[40px] px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
                              voted
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-white border-stone-200 text-stone-800 hover:border-rose-300 hover:text-rose-700'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${voted ? 'fill-rose-600 text-rose-600' : ''}`} />
                            <span className="font-mono-tabular">{s.votes}</span>
                          </button>
                        </div>

                        {/* Threshold progress bar */}
                        <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-700 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {isMayorCanBuild && onMayorBuildNow && s.buildingType !== 'custom' && (
                          <button
                            type="button"
                            onClick={() => onMayorBuildNow(s)}
                            className="w-full h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-amber-950 text-[11px] font-bold flex items-center justify-center gap-1"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            <span>{t(lang, 'mayorBuildBtn')}</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {onResolveTopNow && openSuggestions.some((s) => s.buildingType !== 'custom') && (
                <button
                  type="button"
                  onClick={onResolveTopNow}
                  className="w-full h-10 rounded-xl border border-emerald-700 text-emerald-900 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t(lang, 'resolveNowBtn')}</span>
                </button>
              )}
            </>
          ) : (
            <div className="space-y-2.5">
              {MILESTONE_REGIONS.map((m) => {
                const unlocked = population >= m.threshold;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onFlyToLandmark(m.x, m.y);
                      onClose();
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-colors flex items-center justify-between gap-3 ${
                      unlocked
                        ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                        : 'border-stone-200 bg-stone-50/70 hover:bg-stone-100'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-stone-900">
                        {lang === 'ml' ? m.ml : m.en}
                      </div>
                      <div className="text-xs text-stone-600 mt-0.5">
                        {lang === 'ml' ? m.descMl : m.descEn}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {unlocked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
                          <Check className="w-3.5 h-3.5" />
                          <span>{t(lang, 'unlocked')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-mono-tabular text-stone-600">
                          <Lock className="w-3.5 h-3.5" />
                          <span>{population}/{m.threshold}</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
