import { useState } from 'react';
import { HeartPulse, ShieldAlert, Sparkles, Stethoscope } from 'lucide-react';
import { BuildingInteriorProps } from './types';

export function HospitalInterior({
  lang,
  myPlayer,
  onRequireJoin,
  onShowToast,
  onHospitalHeal,
}: BuildingInteriorProps) {
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const health = myPlayer?.health ?? 100;
  const barColor =
    health >= 75 ? 'bg-emerald-600' : health >= 40 ? 'bg-amber-500' : 'bg-rose-600';

  const handleHeal = async (paid: boolean) => {
    if (!myPlayer) {
      onRequireJoin();
      return;
    }
    setErrMsg(null);
    setBusy(true);
    try {
      await onHospitalHeal(paid);
      onShowToast(
        paid
          ? lang === 'ml'
            ? 'കഷായം കുടിച്ചു! ആരോഗ്യം 100% ആയി.'
            : 'Ayurvedic tonic worked! Restored to 100 HP!'
          : lang === 'ml'
            ? 'വിശ്രമത്തിന് ശേഷം ആരോഗ്യം കൂടി (+25 HP).'
            : 'Rested with Nurse Arun (+25 HP)!'
      );
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Unable to heal.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Live Health Meter Card */}
      <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <span>{lang === 'ml' ? 'ആരോഗ്യ നില' : 'Resident Health Meter'}</span>
          </span>
          <span className="font-mono-tabular text-base font-extrabold text-stone-900">
            {health} / 100 HP
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden border border-stone-200">
          <div
            className={`h-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.max(0, Math.min(100, health))}%` }}
          />
        </div>
        {myPlayer?.lastInjuryReason && health < 100 && (
          <div className="flex items-center gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'ml' ? 'പരിക്ക്: ' : 'Recent mishap: '}
              {myPlayer.lastInjuryReason}
            </span>
          </div>
        )}
      </div>

      {/* Doctor & Nurse NPCs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl border border-teal-200 bg-teal-50/60 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white border border-teal-300 flex items-center justify-center text-teal-800 shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">
                {lang === 'ml' ? 'ഡോ. മീര നായർ' : 'Dr. Meera Nair'}
              </p>
              <p className="text-[11px] text-teal-800 font-medium">
                {lang === 'ml' ? 'ചീഫ് മെഡിക്കൽ ഓഫീസർ' : 'Chief Physician'}
              </p>
            </div>
          </div>
          <p className="text-xs text-stone-700 leading-relaxed">
            {health >= 100
              ? lang === 'ml'
                ? '"നിങ്ങൾ പൂർണ്ണ ആരോഗ്യവാനാണ്! തെങ്ങിൽ കയറുമ്പോൾ ശ്രദ്ധിക്കണം."'
                : '"You are in top shape! Take care on the stadium coconut climb and lighthouse stairs."'
              : lang === 'ml'
                ? '"വിശ്രമിക്കൂ അല്ലെങ്കിൽ പ്രത്യേക ആയുർവേദ കഷായം കുടിക്കൂ!"'
                : '"Let us patch you up! Try Nurse Arun’s free bed rest or my 3-coin Ayurvedic tonic for instant 100 HP."'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white border border-stone-300 flex items-center justify-center text-emerald-800 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">
                {lang === 'ml' ? 'നഴ്‌സ് അരുൺ' : 'Nurse Arun'}
              </p>
              <p className="text-[11px] text-stone-600 font-medium">
                {lang === 'ml' ? 'വാർഡ് നഴ്‌സ്' : 'Emergency Care NPC'}
              </p>
            </div>
          </div>
          <p className="text-xs text-stone-700 leading-relaxed">
            {lang === 'ml'
              ? '"ചെറിയ പരിക്കുകൾക്ക് ഇവിടെ സൗജന്യ പ്രഥമശുശ്രൂഷ ലഭ്യമാണ്."'
              : '"Our ward beds are always free for village residents needing quick recovery."'}
          </p>
        </div>
      </div>

      {errMsg && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900">
          {errMsg}
        </div>
      )}

      {/* Healing Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={busy || health >= 100}
          onClick={() => handleHeal(false)}
          className="min-h-[46px] px-4 rounded-2xl border border-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-bold disabled:opacity-50 transition-colors"
        >
          {health >= 100
            ? lang === 'ml'
              ? 'ആരോഗ്യം പൂർണ്ണം (100 HP)'
              : 'Already Full Health'
            : lang === 'ml'
              ? 'സൗജന്യ വിശ്രമം (+25 HP)'
              : 'Nurse Arun Free Rest (+25 HP)'}
        </button>

        <button
          type="button"
          disabled={busy || health >= 100}
          onClick={() => handleHeal(true)}
          className="min-h-[46px] px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold disabled:opacity-50 transition-colors"
        >
          {lang === 'ml'
            ? 'ആയുർവേദ കഷായം (100 HP · 3 നാണയം)'
            : 'Dr. Meera Tonic (100 HP · 3 coins)'}
        </button>
      </div>
    </div>
  );
}
