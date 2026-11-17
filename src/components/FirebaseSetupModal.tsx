import { useState } from 'react';
import { Check, CheckCircle2, Copy, X } from 'lucide-react';
import { t } from '../i18n/translations';
import { Language } from '../types/village';

interface FirebaseSetupModalProps {
  open: boolean;
  lang: Language;
  isDemoMode: boolean;
  authStatusMsg: string | null;
  onRetryAnonymous: () => Promise<void>;
  onClose: () => void;
}

export function FirebaseSetupModal({
  open,
  lang,
  isDemoMode,
  authStatusMsg,
  onRetryAnonymous,
  onClose,
}: FirebaseSetupModalProps) {
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!open) return null;

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  const handleCopyDomain = async () => {
    try {
      await navigator.clipboard.writeText(currentDomain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    } catch {
      // ignore clipboard restrictions
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-xl border border-stone-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-100">
          <h2 className="font-display text-lg font-bold text-stone-900">
            {t(lang, 'setupTitle')}
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

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#edf3e6] border border-emerald-900/10 flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-stone-700 leading-relaxed">
              <strong className="text-stone-900 block mb-0.5">
                {isDemoMode ? t(lang, 'demoBadge') : t(lang, 'liveBadge')}
              </strong>
              {authStatusMsg || t(lang, 'setupIntro')}
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <p>{t(lang, 'step1')}</p>
            <p>{t(lang, 'step2')}</p>
            <p>{t(lang, 'step3')}</p>
            <div>
              <p>{t(lang, 'step4')}</p>
              <div className="mt-1.5 flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-stone-200">
                <code className="font-mono-tabular text-[11px] text-stone-800 truncate">
                  {currentDomain}
                </code>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1 shrink-0"
                >
                  {copiedDomain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <p>{t(lang, 'step5')}</p>
            <p>{t(lang, 'step6')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onRetryAnonymous}
              className="h-11 px-4 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 transition-colors"
            >
              {t(lang, 'tryAnonBtn')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-xl border border-stone-300 bg-white text-stone-800 text-xs font-semibold hover:bg-stone-50 transition-colors"
            >
              {t(lang, 'stayDemoBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
