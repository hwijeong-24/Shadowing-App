import { Award, Home, List, RotateCcw } from 'lucide-react';
import type { ProgressMap, Sentence } from '../types';
import { getSentenceProgress } from '../utils/storage';
import { CreditLine } from './CreditLine';

interface FinishScreenProps {
  sentences: Sentence[];
  progress: ProgressMap;
  onPracticeSentence: (index: number) => void;
  onBackToList: () => void;
  onBackToStart: () => void;
}

export function FinishScreen({
  sentences,
  progress,
  onPracticeSentence,
  onBackToList,
  onBackToStart,
}: FinishScreenProps) {
  const doneCount = sentences.filter(
    (s) => getSentenceProgress(progress, s.id).status === 'done'
  ).length;
  const practicedCount = sentences.filter(
    (s) => getSentenceProgress(progress, s.id).status !== 'new'
  ).length;

  const totalRecordings = sentences.reduce(
    (sum, s) => sum + getSentenceProgress(progress, s.id).recordings,
    0
  );

  const needsPracticeItems = sentences
    .map((sentence, index) => ({ sentence, index, prog: getSentenceProgress(progress, sentence.id) }))
    .filter(({ prog }) => prog.selfCheck.some((rating) => rating === 'needs_practice'));

  return (
    <div className="flex flex-col gap-6 px-5 py-7">
      {/* Celebratory Header */}
      <section className="rounded-xl border border-stone-200 bg-white p-6 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
          <Award className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold text-stone-900 leading-tight">Great job!</h1>
          <p className="text-sm text-stone-500">정말 수고했어요!</p>
        </div>
        <p className="text-[18px] text-stone-700 leading-relaxed">
          Every time you speak out loud, your listening and rhythm get stronger.
        </p>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5">
            <p className="text-2xl font-bold text-red-700 tabular-nums">
              {doneCount} / {sentences.length}
            </p>
            <p className="text-xs font-medium text-stone-700 mt-0.5">
              Completed (★) · 완료 문장
            </p>
            {practicedCount > doneCount && (
              <p className="text-[11px] text-stone-500 mt-0.5 tabular-nums">
                +{practicedCount - doneCount} practiced (◐)
              </p>
            )}
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5">
            <p className="text-2xl font-bold text-stone-900 tabular-nums">{totalRecordings}</p>
            <p className="text-xs font-medium text-stone-700 mt-0.5">
              Total Recordings · 총 녹음
            </p>
          </div>
        </div>
      </section>

      {/* Sentences marked 😐 */}
      <section className="space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-[19px] font-semibold text-stone-900">
            Sentences to practice again (😐)
          </h2>
          <p className="text-xs text-stone-500">
            조금 더 연습하고 싶다고 표시한 문장이에요.
          </p>
        </div>

        {needsPracticeItems.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-5 text-center space-y-1">
            <p className="text-[18px] font-medium text-stone-800">
              No sentences marked 😐—you are doing great!
            </p>
            <p className="text-sm text-stone-500">
              다시 연습이 필요한 문장으로 표시한 항목이 없어요. 훌륭해요!
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {needsPracticeItems.map(({ sentence, index }) => (
              <li
                key={sentence.id}
                className="rounded-xl border border-stone-200 bg-white p-4 space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span className="font-semibold text-stone-700">
                      #{index + 1} · {sentence.speaker}
                    </span>
                  </div>
                  <p className="text-[18px] font-medium text-stone-900 leading-snug">
                    {sentence.text}
                  </p>
                  <p className="text-sm text-stone-500">{sentence.korean}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onPracticeSentence(index)}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-white transition-colors hover:bg-red-800 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="flex flex-col items-center leading-tight">
                    <span className="text-base font-medium">Practice again</span>
                    <span className="text-[11px] text-red-100">다시 연습하기</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Navigation Buttons */}
      <div className="flex flex-col gap-3 pt-1">
        <button
          type="button"
          onClick={onBackToList}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-white transition-colors hover:bg-stone-800 cursor-pointer"
        >
          <List className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex flex-col items-center leading-tight">
            <span className="text-base font-medium">Sentence List</span>
            <span className="text-[11px] text-stone-300">문장 목록으로</span>
          </span>
        </button>

        <button
          type="button"
          onClick={onBackToStart}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-700 transition-colors hover:bg-stone-50 cursor-pointer"
        >
          <Home className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex flex-col items-center leading-tight">
            <span className="text-base font-medium">Back to Start</span>
            <span className="text-[11px] text-stone-500">처음 화면으로</span>
          </span>
        </button>
      </div>

      {/* Bottom one-line credit */}
      <footer className="border-t border-stone-200 pt-4 text-center">
        <CreditLine />
      </footer>
    </div>
  );
}
