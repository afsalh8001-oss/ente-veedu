import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  Compass,
  Flame,
  Fuel,
  Landmark,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  Trees,
  Trophy,
  Waves,
} from 'lucide-react';
import { MILESTONE_REGIONS, PostcardStamp } from '../../types/village';
import { containsProfanity } from '../../utils/profanity';
import { getLocalDateKey } from '../../utils/vallamKali';
import { BuildingInteriorProps } from './types';

const STAMPS: { id: PostcardStamp; icon: string; en: string; ml: string }[] = [
  { id: 'houseboat', icon: '🛶', en: 'Kettuvallam', ml: 'കെട്ടുവള്ളം' },
  { id: 'kathakali', icon: '🎭', en: 'Kathakali', ml: 'കഥകളി' },
  { id: 'palm', icon: '🌴', en: 'Coconut Grove', ml: 'തെങ്ങിൻതോപ്പ്' },
  { id: 'lighthouse', icon: '🗼', en: 'Lighthouse', ml: 'വിളക്കുമാടം' },
];

const KERALA_PROVERBS = [
  {
    ml: 'അരക്കൊള്ളാത്തത് അകത്തു വെച്ചാൽ പുറത്തു ചാടും.',
    en: 'What cannot be contained inside eventually reveals itself — honesty always shines.',
    topic: 'Wisdom',
  },
  {
    ml: 'മഴയത്ത് കുട പിടിച്ചാൽ നനയില്ല, നാട്ടുകാരോട് കൂടിയാൽ തളരില്ല.',
    en: 'An umbrella shelters you from monsoon rain; community shelters your heart.',
    topic: 'Community',
  },
  {
    ml: 'കായലിൽ തുഴയുമ്പോൾ ഒരുമയാണ് വള്ളത്തിന്റെ ശക്തി.',
    en: 'On the backwaters, unity of the oars is the true speed of the snake boat.',
    topic: 'Backwaters',
  },
  {
    ml: 'ഓണം വന്നാലും ഉണ്ണി പിറന്നാലും കോരന് കുമ്പിളിൽ തന്നെ കഞ്ഞി — മാറ്റം നമ്മളിൽ തുടങ്ങുന്നു.',
    en: 'True prosperity grows when every ward shares the harvest together.',
    topic: 'Heritage',
  },
];

export function CivicBuildingsInterior({
  building,
  lang,
  myPlayer,
  players,
  receivedPostcards,
  sentPostcards,
  onRequireJoin,
  onExit,
  onFlyToLocation,
  onShowToast,
  onSpendHealthBoost,
  onApplyActivityHealth,
  onBankDeposit,
  onBankWithdraw,
  onBankClaimInterest,
  onSendPostcard,
  onMarkPostcardRead,
  onRefuelBus,
}: BuildingInteriorProps) {
  const today = getLocalDateKey();
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Bank state
  const [bankAmount, setBankAmount] = useState('5');

  // Post Office state
  const [postTab, setPostTab] = useState<'inbox' | 'send' | 'sent'>('inbox');
  const [recipientUid, setRecipientUid] = useState<string>('');
  const [stamp, setStamp] = useState<PostcardStamp>('houseboat');
  const [postcardMsg, setPostcardMsg] = useState('');

  // Library index
  const [proverbIdx, setProverbIdx] = useState(0);

  // Spiritual / Ritual feedback
  const [ritualDone, setRitualDone] = useState(false);

  // Stadium mini-games
  const [goalsScored, setGoalsScored] = useState(0);
  const [penaltyMsg, setPenaltyMsg] = useState<string | null>(null);
  const [climbStep, setClimbStep] = useState(0);
  const [climbMsg, setClimbMsg] = useState<string | null>(null);

  // Lighthouse climb
  const [lighthouseTop, setLighthouseTop] = useState(false);

  // Beach shells
  const [shells, setShells] = useState(0);
  const beachCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (building.type !== 'beach') return;
    const canvas = beachCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const render = (t: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const sec = t * 0.001;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#bae6fd');
      g.addColorStop(0.45, '#0284c7');
      g.addColorStop(0.72, '#38bdf8');
      g.addColorStop(1, '#f3d5a5');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const y = h * (0.58 + i * 0.08) + Math.sin(sec * 2 + i) * 4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 18) {
          ctx.lineTo(x, y + Math.sin(x * 0.04 + sec * 3 + i) * 3);
        }
        ctx.stroke();
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [building.type]);

  const guard = (): boolean => {
    if (!myPlayer) {
      onRequireJoin();
      return false;
    }
    return true;
  };

  // ---------- 1. CO-OP BANK ----------
  if (building.type === 'bank') {
    const pocket = myPlayer?.coins ?? 0;
    const vault = myPlayer?.bankBalance ?? 0;
    const canInterest = Boolean(myPlayer && vault >= 1 && myPlayer.lastInterestDate !== today);
    const estInterest = vault >= 1 ? Math.min(15, Math.max(1, Math.floor(vault / 20))) : 0;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50">
            <p className="text-[11px] font-semibold text-stone-500">
              {lang === 'ml' ? 'കൈവശമുള്ളത്' : 'Pocket Coins'}
            </p>
            <p className="font-mono-tabular text-xl font-extrabold text-amber-800 mt-0.5">
              {pocket}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50">
            <p className="text-[11px] font-semibold text-emerald-800">
              {lang === 'ml' ? 'ബാങ്ക് നിക്ഷേപം' : 'Vault Savings'}
            </p>
            <p className="font-mono-tabular text-xl font-extrabold text-emerald-950 mt-0.5">
              {vault}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-stone-200 bg-white space-y-3">
          <label className="block text-xs font-bold text-stone-700">
            {lang === 'ml' ? 'തുക (നാണയങ്ങൾ)' : 'Transaction Amount'}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={10000}
              value={bankAmount}
              onChange={(e) => setBankAmount(e.target.value)}
              className="w-24 h-10 px-3 rounded-xl border border-stone-300 font-mono-tabular text-sm bg-white text-stone-900"
            />
            {[5, 10, 25].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setBankAmount(String(preset))}
                className="px-3 h-10 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 font-mono-tabular text-xs font-semibold text-stone-700"
              >
                {preset}
              </button>
            ))}
          </div>

          {errMsg && (
            <p className="text-xs text-rose-700 font-medium">{errMsg}</p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!guard()) return;
                const amt = Math.floor(Number(bankAmount));
                if (amt <= 0) return;
                setErrMsg(null);
                setBusy(true);
                try {
                  await onBankDeposit(amt);
                  onShowToast(
                    lang === 'ml' ? `${amt} നാണയം നിക്ഷേപിച്ചു!` : `Deposited ${amt} coins to vault!`
                  );
                } catch (err) {
                  setErrMsg(err instanceof Error ? err.message : 'Unable to deposit.');
                } finally {
                  setBusy(false);
                }
              }}
              className="min-h-[42px] rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>{lang === 'ml' ? 'നിക്ഷേപിക്കൂ' : 'Deposit'}</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!guard()) return;
                const amt = Math.floor(Number(bankAmount));
                if (amt <= 0) return;
                setErrMsg(null);
                setBusy(true);
                try {
                  await onBankWithdraw(amt);
                  onShowToast(
                    lang === 'ml' ? `${amt} നാണയം പിൻവലിച്ചു!` : `Withdrew ${amt} coins!`
                  );
                } catch (err) {
                  setErrMsg(err instanceof Error ? err.message : 'Unable to withdraw.');
                } finally {
                  setBusy(false);
                }
              }}
              className="min-h-[42px] rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-900 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              <span>{lang === 'ml' ? 'പിൻവലിക്കൂ' : 'Withdraw'}</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          disabled={busy || !canInterest}
          onClick={async () => {
            if (!guard()) return;
            setBusy(true);
            try {
              const earned = await onBankClaimInterest();
              if (earned > 0) {
                onShowToast(
                  lang === 'ml'
                    ? `ഇന്നത്തെ 5% പലിശ ലഭിച്ചു: +${earned} നാണയം!`
                    : `Daily 5% bank interest credited: +${earned} coins!`
                );
              }
            } finally {
              setBusy(false);
            }
          }}
          className="w-full min-h-[46px] rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2"
        >
          <Landmark className="w-4 h-4" />
          <span>
            {myPlayer?.lastInterestDate === today
              ? lang === 'ml'
                ? 'ഇന്നത്തെ പലിശ ലഭിച്ചു'
                : 'Today’s 5% Interest Already Claimed'
              : lang === 'ml'
                ? `5% ദിവസ പലിശ വാങ്ങൂ (+${estInterest} നാണയം)`
                : `Claim Daily 5% Vault Interest (+${estInterest} coins)`}
          </span>
        </button>
      </div>
    );
  }

  // ---------- 2. POST OFFICE ----------
  if (building.type === 'post_office') {
    const neighbours = players.filter((p) => p.uid !== myPlayer?.uid);
    const chosenRecipient =
      neighbours.find((p) => p.uid === recipientUid) || neighbours[0] || null;
    const unreadCount = receivedPostcards.filter((c) => !c.read).length;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-1.5 bg-stone-100 p-1 rounded-2xl">
          {([
            {
              id: 'inbox' as const,
              en: `Inbox (${unreadCount})`,
              ml: `ലഭിച്ചവ (${unreadCount})`,
            },
            { id: 'send' as const, en: 'Write Card', ml: 'അയക്കൂ' },
            { id: 'sent' as const, en: `Sent (${sentPostcards.length})`, ml: 'അയച്ചവ' },
          ]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPostTab(tab.id)}
              className={`min-h-[38px] rounded-xl text-xs font-semibold transition-colors ${
                postTab === tab.id ? 'bg-rose-700 text-white shadow-xs' : 'text-stone-700'
              }`}
            >
              {lang === 'ml' ? tab.ml : tab.en}
            </button>
          ))}
        </div>

        {postTab === 'inbox' && (
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {receivedPostcards.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-6">
                {lang === 'ml'
                  ? 'ഇതുവരെ പോസ്റ്റ്കാർഡുകൾ ഒന്നും ലഭിച്ചിട്ടില്ല.'
                  : 'Your postbox is empty! Ask a neighbour to write or send the first card.'}
              </p>
            ) : (
              receivedPostcards.map((card) => {
                const st = STAMPS.find((s) => s.id === card.stamp) || STAMPS[0];
                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      if (!card.read) onMarkPostcardRead(card.id);
                    }}
                    className={`p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                      card.read
                        ? 'border-stone-200 bg-[#fbf8f1]'
                        : 'border-rose-300 bg-rose-50/70 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-stone-900">
                        {lang === 'ml' ? 'അയച്ചത്:' : 'From'} @{card.senderUsername}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-white border border-stone-200">
                        {st.icon} {lang === 'ml' ? st.ml : st.en}
                      </span>
                    </div>
                    <p className="text-xs text-stone-800 leading-relaxed">{card.message}</p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {postTab === 'send' && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!guard() || !chosenRecipient) return;
              const clean = postcardMsg.trim().slice(0, 120);
              if (clean.length < 2) return;
              if (containsProfanity(clean)) {
                setErrMsg(lang === 'ml' ? 'ദയവായി മാന്യമായ ഭാഷ ഉപയോഗിക്കുക.' : 'Please keep postcards kind.');
                return;
              }
              setBusy(true);
              setErrMsg(null);
              try {
                await onSendPostcard({
                  recipientUid: chosenRecipient.uid,
                  recipientUsername: chosenRecipient.username,
                  stamp,
                  message: clean,
                });
                setPostcardMsg('');
                setPostTab('sent');
                onShowToast(
                  lang === 'ml'
                    ? `@${chosenRecipient.username}-ന് പോസ്റ്റ്കാർഡ് അയച്ചു!`
                    : `Postcard mailed to @${chosenRecipient.username}!`
                );
              } finally {
                setBusy(false);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {lang === 'ml' ? 'ആർക്ക് അയക്കണം?' : 'Recipient Neighbour'}
              </label>
              <select
                value={chosenRecipient?.uid || ''}
                onChange={(e) => setRecipientUid(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-900"
              >
                {neighbours.map((n) => (
                  <option key={n.uid} value={n.uid}>
                    @{n.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {lang === 'ml' ? 'കേരള സ്റ്റാമ്പ് തിരഞ്ഞെടുക്കൂ' : 'Choose Kerala Stamp'}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {STAMPS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStamp(s.id)}
                    className={`p-2 rounded-xl border text-center text-[11px] font-semibold ${
                      stamp === s.id
                        ? 'border-rose-700 bg-rose-50 text-rose-950'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    <div className="text-lg">{s.icon}</div>
                    <div className="truncate">{lang === 'ml' ? s.ml : s.en}</div>
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={postcardMsg}
              onChange={(e) => setPostcardMsg(e.target.value.slice(0, 120))}
              maxLength={120}
              rows={3}
              placeholder={
                lang === 'ml'
                  ? 'പ്രിയ അയൽക്കാരന് ഒരു സന്ദേശം എഴുതൂ (120 അക്ഷരം)...'
                  : 'Write a warm Kerala postcard note (max 120 chars)...'
              }
              className="w-full p-3 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-600"
            />
            {errMsg && <p className="text-xs text-rose-700">{errMsg}</p>}
            <button
              type="submit"
              disabled={busy || !chosenRecipient || postcardMsg.trim().length < 2}
              className="w-full min-h-[44px] rounded-2xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{lang === 'ml' ? 'പോസ്റ്റ്കാർഡ് അയക്കൂ (സൗജന്യം)' : 'Mail Postcard (Free)'}</span>
            </button>
          </form>
        )}

        {postTab === 'sent' && (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {sentPostcards.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-6">
                {lang === 'ml' ? 'ഇതുവരെ കാർഡുകളൊന്നും അയച്ചിട്ടില്ല.' : 'No sent postcards yet.'}
              </p>
            ) : (
              sentPostcards.map((card) => (
                <div
                  key={card.id}
                  className="p-3 rounded-2xl border border-stone-200 bg-white text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-rose-600" />@{card.recipientUsername}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {card.read ? 'Read' : 'Delivered'}
                    </span>
                  </div>
                  <p className="text-stone-700">{card.message}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------- 3. STADIUM (Mini-Games + Injury Risk) ----------
  if (building.type === 'stadium') {
    return (
      <div className="space-y-4">
        {/* Mini-Game 1: Penalty Kick */}
        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>{lang === 'ml' ? 'പെനാൽറ്റി ഷൂട്ടൗട്ട്' : 'Kerala Penalty Shootout'}</span>
            </span>
            <span className="font-mono-tabular text-xs font-bold text-emerald-900">
              {goalsScored} Goals
            </span>
          </div>
          <p className="text-xs text-stone-700">
            {lang === 'ml'
              ? 'ഗോൾകീപ്പറെ മറികടക്കാൻ ഒരു ദിശ തിരഞ്ഞെടുക്കൂ!'
              : 'Pick a corner to beat the village goalkeeper!'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(['Left', 'Center', 'Right'] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => {
                  const keeper = (['Left', 'Center', 'Right'] as const)[
                    Math.floor(Math.random() * 3)
                  ];
                  if (dir !== keeper) {
                    setGoalsScored((g) => g + 1);
                    setPenaltyMsg(
                      lang === 'ml'
                        ? `ഗോൾ!! കീപ്പർ ${keeper} ഭാഗത്തേക്ക് ചാടി!`
                        : `GOOOAL! Keeper dived ${keeper}!`
                    );
                  } else {
                    setPenaltyMsg(
                      lang === 'ml'
                        ? `കീപ്പർ ${keeper} ഭാഗത്ത് പന്ത് തടഞ്ഞു!`
                        : `Saved! Keeper guessed ${keeper}.`
                    );
                  }
                }}
                className="min-h-[40px] rounded-xl bg-white border border-emerald-300 hover:bg-emerald-800 hover:text-white text-xs font-bold text-emerald-950 transition-colors"
              >
                {dir}
              </button>
            ))}
          </div>
          {penaltyMsg && <p className="text-xs font-semibold text-emerald-950">{penaltyMsg}</p>}
        </div>

        {/* Mini-Game 2: Coconut Tree Climb (with slip hazard) */}
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              🌴 {lang === 'ml' ? 'തെങ്ങ് കയറ്റ മത്സരം' : 'Coconut Tree Climb Challenge'}
            </span>
            <span className="font-mono-tabular text-xs font-bold text-amber-900">
              {climbStep}/5m
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-white border border-amber-200 overflow-hidden">
            <div
              className="h-full bg-amber-600 transition-all duration-300"
              style={{ width: `${(climbStep / 5) * 100}%` }}
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!guard()) return;
              // At step >= 2, 28% chance of slipping off the trunk!
              const slipped = climbStep >= 2 && Math.random() < 0.28;
              if (slipped) {
                setClimbStep(0);
                setClimbMsg(
                  lang === 'ml'
                    ? 'തെന്നി വീണു! (-25 HP) ആശുപത്രിയിൽ ചികിത്സ തേടാം.'
                    : 'Slipped off the coconut trunk! (-25 HP) Visit the Hospital!'
                );
                await onApplyActivityHealth(-25, 'Slipped climbing stadium coconut palm');
                onShowToast(
                  lang === 'ml' ? 'തെങ്ങിൽ നിന്ന് വീണു! -25 HP' : 'Ouch! Fell from palm (-25 HP)'
                );
              } else if (climbStep + 1 >= 5) {
                setClimbStep(0);
                setClimbMsg(
                  lang === 'ml'
                    ? 'മുകളിൽ എത്തി! സ്റ്റേഡിയം ആർപ്പുവിളിക്കുന്നു!'
                    : 'Reached the top fronds! Stadium cheers!'
                );
              } else {
                setClimbStep((s) => s + 1);
                setClimbMsg(null);
              }
            }}
            className="w-full min-h-[42px] rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold"
          >
            {lang === 'ml' ? 'മുകളിലേക്ക് കയറൂ' : 'Climb Higher!'}
          </button>
          {climbMsg && <p className="text-xs font-semibold text-amber-950">{climbMsg}</p>}
        </div>
      </div>
    );
  }

  // ---------- 4. FOOD & REGIONAL STALLS (Bakery, Market, Fish Stall, Petrol Bunk) ----------
  if (
    building.type === 'bakery' ||
    building.type === 'market' ||
    building.type === 'fish_stall' ||
    building.type === 'petrol_pump'
  ) {
    const items =
      building.type === 'bakery'
        ? [
            { id: 'halwa', price: 3, heal: 15, en: 'Kozhikode Black Halwa', ml: 'കോഴിക്കോടൻ ഹൽവ' },
            { id: 'puffs', price: 4, heal: 22, en: 'Warm Masala Puffs & Chips', ml: 'മസാല പഫ്സ്' },
          ]
        : building.type === 'fish_stall'
          ? [
              { id: 'karimeen', price: 5, heal: 28, en: 'Karimeen Pollichathu', ml: 'കരിമീൻ പൊള്ളിച്ചത്' },
              { id: 'sardine', price: 3, heal: 16, en: 'Crispy Malabar Mathi Fry', ml: 'മത്തി വറുത്തത്' },
            ]
          : building.type === 'petrol_pump'
            ? [
                { id: 'chai', price: 2, heal: 12, en: 'Highway Ginger Chai', ml: 'ഇഞ്ചി ചായ' },
              ]
            : [
                { id: 'nendran', price: 3, heal: 16, en: 'Fresh Nendran Plantain', ml: 'നേന്ത്രപ്പഴം' },
                { id: 'tender', price: 4, heal: 22, en: 'Chilled Karikku Coconut', ml: 'ഇളനീർ' },
              ];

    return (
      <div className="space-y-3">
        {building.type === 'petrol_pump' && (
          <div className="p-3.5 rounded-2xl border border-red-200 bg-red-50/60 flex items-center justify-between gap-3">
            <div className="text-xs text-stone-800">
              <p className="font-bold text-red-900">
                {lang === 'ml' ? 'KSRTC ഡീസൽ പമ്പ്' : 'KSRTC Diesel & Air Pump'}
              </p>
              <p className="text-stone-600">
                {lang === 'ml' ? 'ബസ് യാത്രയ്ക്ക് ഇന്ധനം നിറയ്ക്കൂ' : 'Top up the village KSRTC bus tank.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onRefuelBus?.();
                onShowToast(
                  lang === 'ml' ? 'KSRTC ബസ്സിൽ ഡീസൽ നിറച്ചു!' : 'KSRTC bus refueled!'
                );
              }}
              className="min-h-[40px] px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 inline-flex items-center gap-1.5"
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>{lang === 'ml' ? 'നിറയ്ക്കൂ' : 'Refuel'}</span>
            </button>
          </div>
        )}

        <div className="space-y-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="p-3 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-stone-900 truncate">
                  {lang === 'ml' ? it.ml : it.en}
                </p>
                <p className="text-[11px] font-mono-tabular font-semibold text-emerald-700">
                  +{it.heal} HP
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (!guard()) return;
                  setErrMsg(null);
                  setBusy(true);
                  try {
                    await onSpendHealthBoost(it.price, it.heal, `Enjoyed ${it.en}!`, `${it.ml} വാങ്ങി!`);
                  } catch (err) {
                    setErrMsg(err instanceof Error ? err.message : 'Unable to buy.');
                  } finally {
                    setBusy(false);
                  }
                }}
                className="min-h-[40px] px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold font-mono-tabular shrink-0"
              >
                {it.price} coins
              </button>
            </div>
          ))}
        </div>
        {errMsg && <p className="text-xs text-rose-700 font-medium">{errMsg}</p>}
      </div>
    );
  }

  // ---------- 5. POLICE STATION ----------
  if (building.type === 'police_station') {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 space-y-2">
          <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-indigo-700" />
            <span>{lang === 'ml' ? 'ജനമൈത്രി സുരക്ഷാ ഡെസ്ക്' : 'Janamaithri Village Watch'}</span>
          </div>
          <p className="text-xs text-stone-700 leading-relaxed">
            {lang === 'ml'
              ? 'ഗ്രാമത്തിലെ എല്ലാ വാർഡുകളിലും സുരക്ഷിതത്വം ഉറപ്പാക്കുന്നു. രാത്രികാല റോന്തുചുറ്റൽ സജീവമാണ്.'
              : 'All village wards and canal jetties are calm and patrolled. Need a safe ride back to your veedu?'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!guard() || !myPlayer) return;
            onFlyToLocation(myPlayer.plotX, myPlayer.plotY, 1.45);
            onExit();
            onShowToast(
              lang === 'ml'
                ? 'സുരക്ഷിതമായി വീട്ടിലെത്തി!'
                : `Escorted safely back to @${myPlayer.username}’s veedu!`
            );
          }}
          className="w-full min-h-[44px] rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold"
        >
          {lang === 'ml' ? 'സുരക്ഷിതമായി എന്റെ വീട്ടിലേക്ക് പോകാം' : 'Safe Patrol Escort to My Veedu'}
        </button>
      </div>
    );
  }

  // ---------- 6. LIBRARY ----------
  if (building.type === 'library') {
    const item = KERALA_PROVERBS[proverbIdx % KERALA_PROVERBS.length];
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-2xl border border-amber-200 bg-[#fbf8f1] space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>{lang === 'ml' ? 'വായനശാല പഴഞ്ചൊല്ലുകൾ' : 'Vayanasala Reading Room'}</span>
            </span>
            <span className="font-mono-tabular">
              {proverbIdx + 1}/{KERALA_PROVERBS.length}
            </span>
          </div>
          <p className="text-sm font-bold text-stone-900 leading-relaxed">{item.ml}</p>
          <p className="text-xs text-stone-700 leading-relaxed">{item.en}</p>
        </div>
        <button
          type="button"
          onClick={() => setProverbIdx((i) => (i + 1) % KERALA_PROVERBS.length)}
          className="w-full min-h-[42px] rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold"
        >
          {lang === 'ml' ? 'അടുത്ത പുസ്തകം വായിക്കൂ' : 'Turn to Next Kerala Scroll'}
        </button>
      </div>
    );
  }

  // ---------- 7. TEMPLE / CHURCH / MOSQUE ----------
  if (building.type === 'temple' || building.type === 'church' || building.type === 'mosque') {
    const label =
      building.type === 'temple'
        ? lang === 'ml'
          ? 'നിലവിളക്ക് കൊളുത്തി പ്രാർത്ഥിക്കൂ'
          : 'Light Brass Lamp & Chime Temple Bell'
        : building.type === 'church'
          ? lang === 'ml'
            ? 'മെഴുകുതിരി തെളിയിച്ച് മണി മുഴക്കൂ'
            : 'Light Prayer Candle & Chime Belfry'
          : lang === 'ml'
            ? 'പ്രാർത്ഥനാ മുറ്റത്ത് സമാധാനം തേടൂ'
            : 'Pause at Courtyard Fountain & Donate Water';

    return (
      <div className="space-y-3">
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 text-xs text-stone-800 leading-relaxed">
          {ritualDone
            ? lang === 'ml'
              ? 'മനസ്സിന് ശാന്തിയും ഉന്മേഷവും ലഭിച്ചു (+5 HP).'
              : 'A serene calm fills the courtyard (+5 HP restored).'
            : lang === 'ml'
              ? 'ശാന്തമായ ഈ അന്തരീക്ഷത്തിൽ അല്പസമയം പ്രാർത്ഥിക്കാം.'
              : 'Step into the quiet courtyard to reflect and restore +5 HP peace of mind.'}
        </div>
        <button
          type="button"
          disabled={ritualDone}
          onClick={async () => {
            setRitualDone(true);
            if (myPlayer) {
              await onApplyActivityHealth(5);
            }
            onShowToast(
              lang === 'ml' ? 'ശാന്തിയും സമാധാനവും (+5 HP)!' : 'Peaceful blessing (+5 HP)!'
            );
          }}
          className="w-full min-h-[44px] rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2"
        >
          <Flame className="w-4 h-4" />
          <span>{ritualDone ? (lang === 'ml' ? 'പൂർത്തിയായി' : 'Complete') : label}</span>
        </button>
      </div>
    );
  }

  // ---------- 8. PARK ----------
  if (building.type === 'park') {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 text-xs text-stone-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
            <Trees className="w-4 h-4 text-emerald-700" />
            <span>{lang === 'ml' ? 'പൂന്തോട്ടത്തിലെ തണൽ ബെഞ്ച്' : 'Banyan Shade & Lotus Bench'}</span>
          </div>
          <p>
            {lang === 'ml'
              ? 'തണുത്ത കാറ്റേറ്റ് അല്പം വിശ്രമിച്ചാൽ +15 HP ആരോഗ്യം തിരികെ ലഭിക്കും.'
              : 'Sit under the banyan canopy beside the lotus fountain to recover +15 HP.'}
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (!guard()) return;
            await onApplyActivityHealth(15);
            onShowToast(lang === 'ml' ? 'വിശ്രമം ലഭിച്ചു (+15 HP)!' : 'Refreshed by park breeze (+15 HP)!');
          }}
          className="w-full min-h-[44px] rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold"
        >
          {lang === 'ml' ? 'പാർക്കിൽ വിശ്രമിക്കൂ (+15 HP)' : 'Rest on Park Bench (+15 HP)'}
        </button>
      </div>
    );
  }

  // ---------- 9. BEACH ----------
  if (building.type === 'beach') {
    return (
      <div className="space-y-3">
        <canvas
          ref={beachCanvasRef}
          width={360}
          height={120}
          className="w-full h-28 rounded-2xl border border-sky-200 block"
        />
        <div className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 bg-white">
          <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <Waves className="w-4 h-4 text-sky-600" />
            <span>
              {lang === 'ml' ? 'ശേഖരിച്ച കക്കകൾ:' : 'Seashells Found:'}{' '}
              <span className="font-mono-tabular">{shells}</span>
            </span>
          </span>
          <button
            type="button"
            onClick={async () => {
              setShells((s) => s + 1);
              if (myPlayer && (myPlayer.health ?? 100) < 100) {
                await onApplyActivityHealth(3);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
          >
            {lang === 'ml' ? 'കക്ക ശേഖരിക്കൂ' : 'Collect Shell'}
          </button>
        </div>
      </div>
    );
  }

  // ---------- 10. LIGHTHOUSE ----------
  if (building.type === 'lighthouse') {
    return (
      <div className="space-y-3">
        {!lighthouseTop ? (
          <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-3">
            <p className="text-xs text-stone-700">
              {lang === 'ml'
                ? 'വിളക്കുമാടത്തിലെ 140 പടികൾ കയറി മുകളിൽ ദൂരദർശിനിയിലൂടെ നാട് കാണൂ!'
                : 'Climb the 140 spiral steps to reach the coastal telescope deck (watch your footing!).'}
            </p>
            <button
              type="button"
              onClick={async () => {
                if (myPlayer && Math.random() < 0.25) {
                  await onApplyActivityHealth(-15, 'Twisted ankle on lighthouse spiral stairs');
                  onShowToast(
                    lang === 'ml' ? 'പടിയിൽ തട്ടി വീണു (-15 HP)!' : 'Stumbled on spiral stairs (-15 HP)!'
                  );
                }
                setLighthouseTop(true);
              }}
              className="w-full min-h-[44px] rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
            >
              {lang === 'ml' ? 'മുകളിലേക്ക് കയറൂ' : 'Climb to Telescope Deck'}
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-700" />
              <span>
                {lang === 'ml'
                  ? 'ദൂരദർശിനി കാഴ്ച — ഏത് സ്ഥലം കാണണം?'
                  : 'Coastal Telescope — Jump to Landmark:'}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MILESTONE_REGIONS.slice(0, 4).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onFlyToLocation(m.x, m.y, 1.25);
                    onExit();
                  }}
                  className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-emerald-50 text-left text-xs font-semibold text-stone-800"
                >
                  {lang === 'ml' ? m.ml : m.en}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- 11. OTHER CIVIC / SCENIC LANDMARKS ----------
  return (
    <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-2.5 text-xs text-stone-700">
      <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
        <Sparkles className="w-4 h-4 text-emerald-700" />
        <span>{building.label}</span>
      </div>
      <p>
        {lang === 'ml'
          ? 'ഗ്രാമവാസികൾക്ക് ഒത്തുചേരാനും വിശ്രമിക്കാനുമുള്ള പൊതു ഇടമാണിത്. ഇവിടെ വിശ്രമിച്ചാൽ +5 HP ലഭിക്കും.'
          : 'A beloved Ente Veedu community landmark. Pausing here restores +5 HP.'}
      </p>
      {myPlayer && (
        <button
          type="button"
          onClick={async () => {
            await onApplyActivityHealth(5);
            onShowToast(lang === 'ml' ? '+5 HP ഉന്മേഷം ലഭിച്ചു!' : 'Refreshed at landmark (+5 HP)!');
          }}
          className="w-full min-h-[42px] rounded-xl bg-emerald-800 text-white font-semibold"
        >
          {lang === 'ml' ? 'വിശ്രമിക്കൂ (+5 HP)' : 'Take a Scenic Breather (+5 HP)'}
        </button>
      )}
    </div>
  );
}
