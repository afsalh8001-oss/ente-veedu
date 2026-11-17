import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Coffee, Flag, Loader2, Send, Users, Volume2, VolumeX, X } from 'lucide-react';
import { t } from '../i18n/translations';
import {
  CHAYA_EMOTES,
  CHAYA_QUICK_REPLIES,
  ChatMessageDoc,
  ChayaPresenceDoc,
  EmoteType,
  Language,
  PlayerDoc,
} from '../types/village';
import { containsProfanity } from '../utils/profanity';

interface ChayaKadaSheetProps {
  open: boolean;
  player: PlayerDoc | null;
  lang: Language;
  messages: ChatMessageDoc[];
  presence: ChayaPresenceDoc[];
  mutedUids: string[];
  onSendMessage: (text: string) => Promise<void>;
  onSendEmote: (emote: EmoteType) => Promise<void>;
  onReportMessage: (msg: ChatMessageDoc) => Promise<void>;
  onToggleMute: (uid: string) => void;
  onHeartbeat: () => void;
  onRequireJoin: () => void;
  onClose: () => void;
}

function formatTimeShort(ms: number): string {
  try {
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function ChayaKadaSheet({
  open,
  player,
  lang,
  messages,
  presence,
  mutedUids,
  onSendMessage,
  onSendEmote,
  onReportMessage,
  onToggleMute,
  onHeartbeat,
  onRequireJoin,
  onClose,
}: ChayaKadaSheetProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [nowTick, setNowTick] = useState(Date.now());
  const lastSentLocalRef = useRef<number>(0);

  // Heartbeat every 20s while Chaya Kada panel is open + refresh 45s presence window
  useEffect(() => {
    if (!open) return;
    onHeartbeat();
    const hbTimer = setInterval(onHeartbeat, 20_000);
    const tickTimer = setInterval(() => setNowTick(Date.now()), 5_000);
    return () => {
      clearInterval(hbTimer);
      clearInterval(tickTimer);
    };
  }, [open, onHeartbeat]);

  const activeNeighboursCount = useMemo(() => {
    const cutoff = nowTick - 45_000;
    const active = presence.filter((p) => p.lastSeen >= cutoff);
    return Math.max(player ? 1 : 0, active.length);
  }, [presence, nowTick, player]);

  const mutedSet = useMemo(() => new Set(mutedUids), [mutedUids]);
  const visibleMessages = useMemo(
    () => messages.filter((m) => !mutedSet.has(m.authorUid)),
    [messages, mutedSet]
  );

  if (!open) return null;

  const submitText = async (raw: string) => {
    if (!player) {
      onRequireJoin();
      return;
    }
    const clean = raw.trim().slice(0, 140);
    if (!clean) return;
    if (containsProfanity(clean)) {
      setErrorMsg(t(lang, 'profanityMsg'));
      return;
    }
    if (Date.now() - lastSentLocalRef.current < 2000) {
      setErrorMsg(t(lang, 'chatCooldown'));
      return;
    }
    setErrorMsg(null);
    setSending(true);
    try {
      await onSendMessage(clean);
      lastSentLocalRef.current = Date.now();
      setText('');
    } catch (err) {
      if (err instanceof Error && err.message === 'COOLDOWN') {
        setErrorMsg(t(lang, 'chatCooldown'));
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to send.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitText(text);
  };

  const handleEmote = async (emote: EmoteType) => {
    if (!player) {
      onRequireJoin();
      return;
    }
    await onSendEmote(emote);
  };

  const handleReport = async (msg: ChatMessageDoc) => {
    if (!player || reportedIds.has(msg.id)) return;
    setReportedIds((prev) => new Set(prev).add(msg.id));
    await onReportMessage(msg);
  };

  return (
    <div className="fixed inset-x-0 bottom-16 top-16 z-40 flex items-end lg:items-center lg:justify-end lg:pr-6 pointer-events-none">
      <div className="pointer-events-auto w-full lg:w-[420px] bg-white rounded-t-3xl lg:rounded-3xl shadow-xl border border-stone-200 max-h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 bg-amber-50/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-stone-900 truncate">
                {t(lang, 'chayaHeader')}
              </h2>
              <p className="text-xs text-amber-900/80 flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5" />
                <span className="font-mono-tabular">{activeNeighboursCount}</span>
                <span>{t(lang, 'neighboursHere')}</span>
              </p>
            </div>
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

        {/* Emotes & Quick Replies */}
        <div className="px-4 py-2.5 border-b border-stone-100 space-y-2 bg-stone-50/70 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              {t(lang, 'quickEmotes')}
            </span>
            <div className="flex items-center gap-1.5">
              {CHAYA_EMOTES.map((em) => (
                <button
                  key={em.id}
                  type="button"
                  onClick={() => void handleEmote(em.id)}
                  className="min-h-[38px] min-w-[42px] px-2 rounded-xl bg-white border border-stone-200 hover:border-amber-400 active:scale-95 transition-all text-base flex items-center justify-center"
                  title={lang === 'ml' ? em.ml : em.en}
                >
                  {em.icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {CHAYA_QUICK_REPLIES.map((qr, idx) => {
              const label = lang === 'ml' ? qr.ml : qr.en;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={sending}
                  onClick={() => void submitText(label)}
                  className="min-h-[34px] px-2.5 rounded-xl bg-amber-100/80 hover:bg-amber-200 text-amber-950 text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-[180px]">
          {mutedUids.length > 0 && (
            <div className="text-[11px] text-stone-500 flex items-center justify-between px-2 py-1 rounded-lg bg-stone-100">
              <span>
                {t(lang, 'mutedNotice')} ({mutedUids.length})
              </span>
              <button
                type="button"
                onClick={() => mutedUids.forEach(onToggleMute)}
                className="text-emerald-700 font-semibold hover:underline"
              >
                {t(lang, 'unmuteUser')}
              </button>
            </div>
          )}

          {visibleMessages.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-8">{t(lang, 'emptyChat')}</p>
          ) : (
            visibleMessages.map((msg) => {
              const isMine = player?.uid === msg.authorUid;
              const isReported = reportedIds.has(msg.id);
              return (
                <div
                  key={msg.id}
                  className={`p-3 rounded-2xl border ${
                    isMine
                      ? 'bg-emerald-50/70 border-emerald-200/80'
                      : 'bg-stone-50 border-stone-200/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-stone-900">
                      @{msg.authorUsername}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-stone-400 font-mono-tabular">
                        {formatTimeShort(msg.createdAt)}
                      </span>
                      {!isMine && (
                        <>
                          <button
                            type="button"
                            onClick={() => onToggleMute(msg.authorUid)}
                            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-white"
                            title={mutedSet.has(msg.authorUid) ? t(lang, 'unmuteUser') : t(lang, 'muteUser')}
                          >
                            {mutedSet.has(msg.authorUid) ? (
                              <Volume2 className="w-3.5 h-3.5" />
                            ) : (
                              <VolumeX className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={isReported}
                            onClick={() => void handleReport(msg)}
                            className={`p-1 rounded-lg ${
                              isReported
                                ? 'text-rose-600'
                                : 'text-stone-400 hover:text-rose-600 hover:bg-white'
                            }`}
                            title={t(lang, 'reportMsg')}
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-stone-800 break-words">{msg.text}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Composer */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-stone-100 bg-white shrink-0 space-y-2">
          {errorMsg && <p className="text-xs text-rose-600 font-medium px-1">{errorMsg}</p>}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              maxLength={140}
              onChange={(e) => setText(e.target.value)}
              placeholder={t(lang, 'chatPlaceholder')}
              className="flex-1 h-11 px-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="h-11 px-4 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{t(lang, 'sendChat')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
