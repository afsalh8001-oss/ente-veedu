import React, { useEffect, useRef, useState } from 'react';
import { Clapperboard, Film, MessageCircle, Send, Users } from 'lucide-react';
import { containsProfanity } from '../../utils/profanity';
import { BuildingInteriorProps } from './types';

const SHOWS = [
  {
    en: 'Alappuzha Sunrise Voyage',
    ml: 'ആലപ്പുഴ പ്രഭാത യാത്ര',
    palette: ['#0f2942', '#e07a5f', '#f4a261'],
  },
  {
    en: 'Thrissur Pooram Fireworks',
    ml: 'തൃശ്ശൂർ പൂരം വെടിക്കെട്ട്',
    palette: ['#1a1026', '#d97706', '#facc15'],
  },
  {
    en: 'Munnar Monsoon Express',
    ml: 'മൂന്നാർ മഴക്കാല എക്സ്പ്രസ്',
    palette: ['#163a2a', '#4f775d', '#bae6fd'],
  },
  {
    en: 'Kathakali Lamp Recital',
    ml: 'കഥകളി ദീപ സന്ധ്യ',
    palette: ['#2b0909', '#b91c1c', '#fbbf24'],
  },
];

export function CinemaInterior({
  lang,
  myPlayer,
  cinemaSeats,
  cinemaChat,
  onRequireJoin,
  onShowToast,
  onSitCinemaSeat,
  onLeaveCinemaSeat,
  onSendCinemaChat,
}: BuildingInteriorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [chatText, setChatText] = useState('');
  const [busy, setBusy] = useState(false);

  const now = new Date();
  const showIdx = now.getHours() % SHOWS.length;
  const activeShow = SHOWS[showIdx];
  const minsToNext = 60 - now.getMinutes();

  const mySeat = myPlayer ? cinemaSeats.find((s) => s.uid === myPlayer.uid) : null;

  // Procedural hourly screening canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const draw = (t: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const sec = t * 0.001;
      const pal = activeShow.palette;

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, pal[0]);
      grad.addColorStop(0.65, pal[1]);
      grad.addColorStop(1, pal[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      if (showIdx === 0) {
        // Backwater Sunrise + Kettuvallam
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.arc(w * 0.72, h * 0.42 + Math.sin(sec * 0.4) * 3, 24, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0e4c64';
        ctx.fillRect(0, h * 0.62, w, h * 0.38);

        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          const rx = ((sec * 24 + i * 70) % (w + 60)) - 30;
          const ry = h * 0.7 + (i % 3) * 14;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx + 28, ry);
          ctx.stroke();
        }

        const boatX = ((sec * 26) % (w + 110)) - 55;
        const boatY = h * 0.66 + Math.sin(sec * 2) * 2;
        ctx.fillStyle = '#4a2c16';
        ctx.beginPath();
        ctx.moveTo(boatX - 30, boatY);
        ctx.lineTo(boatX + 34, boatY);
        ctx.lineTo(boatX + 24, boatY + 12);
        ctx.lineTo(boatX - 22, boatY + 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#d9b377';
        ctx.beginPath();
        ctx.ellipse(boatX + 2, boatY - 3, 18, 10, 0, Math.PI, 0);
        ctx.fill();
      } else if (showIdx === 1) {
        // Pooram Fireworks & Lamps
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, h * 0.72, w, h * 0.28);
        for (let i = 0; i < 3; i++) {
          const phase = (sec * 0.7 + i * 0.33) % 1;
          const fx = w * (0.22 + i * 0.28);
          const fy = h * 0.32 + (i % 2) * 14;
          const r = phase * 38;
          ctx.strokeStyle = i === 1 ? '#fde047' : i === 0 ? '#fb7185' : '#38bdf8';
          ctx.globalAlpha = Math.max(0, 1 - phase);
          for (let a = 0; a < 10; a++) {
            const ang = (a / 10) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(fx + Math.cos(ang) * r * 0.3, fy + Math.sin(ang) * r * 0.3);
            ctx.lineTo(fx + Math.cos(ang) * r, fy + Math.sin(ang) * r);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        // Parasols silhouette
        const cols = ['#dc2626', '#f59e0b', '#10b981', '#2563eb'];
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = cols[i];
          ctx.beginPath();
          ctx.arc(w * (0.2 + i * 0.2), h * 0.68, 16, Math.PI, 0);
          ctx.fill();
        }
      } else if (showIdx === 2) {
        // Munnar Hills & Red KSRTC Bus
        ctx.fillStyle = '#1e4d37';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.72);
        ctx.quadraticCurveTo(w * 0.3, h * 0.3, w * 0.6, h * 0.7);
        ctx.quadraticCurveTo(w * 0.85, h * 0.4, w, h * 0.65);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();

        ctx.fillStyle = '#374151';
        ctx.fillRect(0, h * 0.74, w, 18);
        const busX = ((sec * 55) % (w + 90)) - 45;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(busX, h * 0.62, 46, 22);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(busX + 34, h * 0.66, 10, 8);
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.arc(busX + 10, h * 0.85, 5, 0, Math.PI * 2);
        ctx.arc(busX + 36, h * 0.85, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Kathakali golden stage & nilavilakku glow
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(0, h * 0.74, w, h * 0.26);
        const pulse = 1 + Math.sin(sec * 3) * 0.12;
        ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.45, 50 * pulse, 0, Math.PI * 2);
        ctx.fill();
        // Stylised crown
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.46, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.49, 13, 0, Math.PI * 2);
        ctx.fill();
      }

      // Red velvet curtains on both edges
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(0, 0, 14, h);
      ctx.fillRect(w - 14, 0, 14, h);

      // Subtle projector flicker beam overlay
      ctx.fillStyle = `rgba(255, 251, 235, ${0.03 + Math.sin(sec * 18) * 0.015})`;
      ctx.fillRect(14, 0, w - 28, h);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [showIdx, activeShow]);

  const handleSeatClick = async (row: number, col: number) => {
    if (!myPlayer) {
      onRequireJoin();
      return;
    }
    const occupier = cinemaSeats.find((s) => s.row === row && s.col === col);
    if (occupier && occupier.uid === myPlayer.uid) {
      await onLeaveCinemaSeat();
      return;
    }
    if (occupier) {
      onShowToast(`@${occupier.username} is seated here.`);
      return;
    }
    await onSitCinemaSeat(row, col);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPlayer) {
      onRequireJoin();
      return;
    }
    const clean = chatText.trim().slice(0, 120);
    if (!clean) return;
    if (containsProfanity(clean)) {
      onShowToast(lang === 'ml' ? 'ദയവായി മാന്യമായ ഭാഷ ഉപയോഗിക്കുക.' : 'Please keep theatre chat friendly.');
      return;
    }
    setBusy(true);
    try {
      await onSendCinemaChat(clean);
      setChatText('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Screen + Show Info */}
      <div className="rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 shadow-md">
        <div className="px-3.5 py-2 bg-stone-900 flex items-center justify-between gap-2 text-xs text-amber-100">
          <span className="font-bold flex items-center gap-1.5 truncate">
            <Clapperboard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{lang === 'ml' ? activeShow.ml : activeShow.en}</span>
          </span>
          <span className="font-mono-tabular text-[11px] text-amber-300/90 shrink-0 flex items-center gap-1">
            <Film className="w-3 h-3" />
            {lang === 'ml' ? `അടുത്തത് ${minsToNext}മി` : `Next in ${minsToNext}m`}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          width={360}
          height={150}
          className="w-full h-36 sm:h-44 block"
        />
      </div>

      {/* Interactive 4x6 Theatre Seating */}
      <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-stone-800 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              {lang === 'ml'
                ? `സീറ്റുകൾ തിരഞ്ഞെടുക്കൂ (${cinemaSeats.length} കാഴ്ചക്കാർ)`
                : `Pick a Theatre Seat (${cinemaSeats.length} watching)`}
            </span>
          </span>
          {mySeat && (
            <button
              type="button"
              onClick={() => onLeaveCinemaSeat()}
              className="text-[11px] font-semibold text-rose-700 hover:underline"
            >
              {lang === 'ml' ? 'എഴുന്നേൽക്കൂ' : 'Stand up'}
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="grid grid-cols-6 gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((col) => {
                const occ = cinemaSeats.find((s) => s.row === row && s.col === col);
                const isMine = Boolean(myPlayer && occ?.uid === myPlayer.uid);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => handleSeatClick(row, col)}
                    title={occ ? `@${occ.username}` : `Row ${row + 1} Seat ${col + 1}`}
                    className={`h-9 rounded-lg text-[10px] font-bold transition-colors truncate px-1 ${
                      isMine
                        ? 'bg-emerald-700 text-white ring-2 ring-amber-400'
                        : occ
                          ? 'bg-amber-100 border border-amber-300 text-amber-950'
                          : 'bg-rose-800/85 hover:bg-rose-700 text-rose-100'
                    }`}
                  >
                    {occ ? `@${occ.username.slice(0, 4)}` : `${row + 1}${String.fromCharCode(65 + col)}`}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Live Theatre Chat */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'ml' ? 'തിയേറ്റർ ചാറ്റ്' : 'Audience Live Chat'}</span>
          </span>
          <div className="flex gap-1">
            {['🍿', '👏', '😂'].map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => {
                  if (!myPlayer) {
                    onRequireJoin();
                    return;
                  }
                  onSendCinemaChat(`${em} ${lang === 'ml' ? 'കൊള്ളാം!' : 'Great scene!'}`);
                }}
                className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs"
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-32 overflow-y-auto rounded-xl border border-stone-200 bg-white p-2.5 space-y-1.5">
          {cinemaChat.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-2">
              {lang === 'ml' ? 'ആദ്യ സന്ദേശം അയക്കൂ!' : 'Grab a seat & say hi to fellow viewers!'}
            </p>
          ) : (
            cinemaChat.map((m) => (
              <div key={m.id} className="text-xs text-stone-800">
                <span className="font-bold text-emerald-800 mr-1.5">@{m.authorUsername}</span>
                <span>{m.text}</span>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={chatText}
            onChange={(e) => setChatText(e.target.value.slice(0, 120))}
            maxLength={120}
            placeholder={lang === 'ml' ? 'സിനിമയെക്കുറിച്ച് പറയൂ...' : 'Whisper to theatre neighbours...'}
            className="flex-1 h-10 px-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
          <button
            type="submit"
            disabled={busy || !chatText.trim()}
            className="h-10 px-3.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
