import { useMemo, useState } from 'react';
import { Award, BookOpenCheck, CheckCircle2, RotateCcw } from 'lucide-react';
import { getTodaysQuizQuestions } from '../../utils/townBuildings';
import { getLocalDateKey } from '../../utils/vallamKali';
import { BuildingInteriorProps } from './types';

export function SchoolInterior({
  lang,
  myPlayer,
  onRequireJoin,
  onShowToast,
  onClaimSchoolQuiz,
}: BuildingInteriorProps) {
  const today = getLocalDateKey();
  const questions = useMemo(() => getTodaysQuizQuestions(today), [today]);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const alreadyClaimedToday = Boolean(myPlayer && myPlayer.quizDate === today);

  const correctCount = questions.reduce(
    (acc, q, idx) => acc + (answers[idx] === q.correctIdx ? 1 : 0),
    0
  );
  const allAnswered = answers.every((a) => a !== null);
  const allCorrect = correctCount === questions.length;

  const handleSubmit = async () => {
    if (!myPlayer) {
      onRequireJoin();
      return;
    }
    setSubmitted(true);
    if (allCorrect && !alreadyClaimedToday) {
      setBusy(true);
      try {
        const awarded = await onClaimSchoolQuiz();
        if (awarded > 0) {
          onShowToast(
            lang === 'ml'
              ? `കേരള ക്വിസ് വിജയിച്ചു! +${awarded} നാണയങ്ങൾ!`
              : `Full marks! Earned +${awarded} coins!`
          );
        }
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Classic Kerala Classroom Chalkboard */}
      <div className="rounded-2xl bg-[#1f4d3a] border-4 border-[#8b5a2b] p-4 text-emerald-50 shadow-inner space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
            <BookOpenCheck className="w-4 h-4" />
            <span>
              {lang === 'ml' ? 'ഇന്നത്തെ പരീക്ഷ' : 'Today’s Kerala GK & Math Quiz'}
            </span>
          </span>
          <span className="font-mono-tabular bg-emerald-950/60 px-2 py-0.5 rounded-lg text-amber-300 font-bold">
            +10 coins
          </span>
        </div>
        <p className="text-xs text-emerald-100/90">
          {lang === 'ml'
            ? '3 ചോദ്യങ്ങൾക്കും ശരിയായ ഉത്തരം നൽകി ദിവസേന +10 നാണയങ്ങൾ നേടൂ.'
            : 'Answer all 3 chalkboard questions correctly to earn +10 coins once per day.'}
        </p>
      </div>

      {alreadyClaimedToday && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-950 font-semibold">
          <Award className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            {lang === 'ml'
              ? 'ഇന്നത്തെ സ്കൂൾ ക്വിസ് സമ്മാനം (+10 നാണയങ്ങൾ) വാങ്ങി കഴിഞ്ഞു! നാളെ വീണ്ടും വരൂ.'
              : 'You already earned today’s +10 coin school reward! Come back tomorrow for new questions.'}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {questions.map((q, qIdx) => {
          const picked = answers[qIdx];
          const opts = lang === 'ml' ? q.optionsMl : q.optionsEn;
          return (
            <div
              key={qIdx}
              className="p-3.5 rounded-2xl border border-stone-200 bg-white space-y-2.5"
            >
              <p className="text-sm font-bold text-stone-900">
                <span className="font-mono-tabular text-emerald-800 mr-1.5">Q{qIdx + 1}.</span>
                {lang === 'ml' ? q.qMl : q.qEn}
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {opts.map((opt, optIdx) => {
                  const isSelected = picked === optIdx;
                  const showCorrect = submitted && optIdx === q.correctIdx;
                  const showWrong = submitted && isSelected && optIdx !== q.correctIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setAnswers((prev) =>
                          prev.map((val, idx) => (idx === qIdx ? optIdx : val))
                        );
                      }}
                      className={`min-h-[40px] px-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        showCorrect
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                          : showWrong
                            ? 'border-rose-500 bg-rose-50 text-rose-900'
                            : isSelected
                              ? 'border-emerald-800 bg-emerald-800 text-white'
                              : 'border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100'
                      }`}
                    >
                      <span>{opt}</span>
                      {showCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {submitted && !allCorrect && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-950">
          <span>
            {lang === 'ml'
              ? `നിങ്ങൾക്ക് ${correctCount}/3 ശരിയുത്തരം ലഭിച്ചു. വീണ്ടും ശ്രമിക്കൂ!`
              : `You scored ${correctCount}/3. Review and try again for full marks!`}
          </span>
          <button
            type="button"
            onClick={() => {
              setAnswers([null, null, null]);
              setSubmitted(false);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 font-semibold inline-flex items-center gap-1 shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{lang === 'ml' ? 'വീണ്ടും' : 'Retry'}</span>
          </button>
        </div>
      )}

      {!alreadyClaimedToday && (
        <button
          type="button"
          disabled={!allAnswered || busy}
          onClick={handleSubmit}
          className="w-full min-h-[46px] rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold disabled:opacity-50"
        >
          {busy
            ? '...'
            : lang === 'ml'
              ? 'ഉത്തരങ്ങൾ പരിശോധിക്കൂ'
              : 'Check Answers & Claim +10 Coins'}
        </button>
      )}
    </div>
  );
}
