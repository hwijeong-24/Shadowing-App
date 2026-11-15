import { ArrowLeft, ChevronRight, Eye, EyeOff, Flag, PencilLine } from 'lucide-react';
import { useState } from 'react';
import type { ProgressMap, Sentence, SentenceStatus } from '../types';
import { getSentenceProgress } from '../utils/storage';

interface SentenceListScreenProps {
  sentences: Sentence[];
  progress: ProgressMap;
  onSelectSentence: (index: number) => void;
  onBackStart: () => void;
  onOpenEdit: () => void;
  onFinish: () => void;
}

const STATUS_META: Record<
  SentenceStatus,
  { symbol: string; labelEn: string; labelKo: string; textClass: string }
> = {
  new: {
    symbol: '☆',
    labelEn: 'Not started',
    labelKo: '시작 전',
    textClass: 'text-stone-400',
  },
  practiced: {
    symbol: '◐',
    labelEn: 'Practiced',
    labelKo: '연습함',
    textClass: 'text-amber-700',
  },
  done: {
    symbol: '★',
    labelEn: 'Done',
    labelKo: '완료',
    textClass: 'text-red-700',
  },
};

export function SentenceListScreen({
  sentences,
  progress,
  onSelectSentence,
  onBackStart,
  onOpenEdit,
  onFinish,
}: SentenceListScreenProps) {
  const [hideText, setHideText] = useState(false);

  const doneCount = sentences.filter((s) => getSentenceProgress(progress, s.id).status === 'done').length;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackStart}
          className="flex min-h-[48px] items-center gap-1.5 rounded-xl px-3 text-stone-700 hover:bg-stone-100 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex flex-col items-start leading-tight">
            <span className="text-sm font-medium whitespace-nowrap">Start</span>
            <span className="text-[11px] text-stone-500 whitespace-nowrap">처음으로</span>
          </span>
        </button>

        <div className="text-center">
          <h1 className="text-base font-semibold text-stone-900 whitespace-nowrap">
            Sentences ({sentences.length})
          </h1>
          <p className="text-xs text-stone-500 tabular-nums">
            {doneCount} / {sentences.length} done
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenEdit}
          className="flex min-h-[48px] items-center gap-1.5 rounded-xl px-3 text-red-700 hover:bg-red-50 cursor-pointer"
        >
          <PencilLine className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex flex-col items-start leading-tight">
            <span className="text-sm font-medium whitespace-nowrap">Edit</span>
            <span className="text-[11px] text-red-600/80 whitespace-nowrap">문장 편집</span>
          </span>
        </button>
      </div>

      {/* Hide Text Toggle */}
      {sentences.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-stone-600">
            Tap a sentence to practice · 문장을 눌러 연습하세요
          </p>
          <button
            type="button"
            onClick={() => setHideText((prev) => !prev)}
            className={`flex min-h-[48px] shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
              hideText
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            {hideText ? (
              <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="flex flex-col items-start leading-tight">
              <span className="whitespace-nowrap">{hideText ? 'Show Text' : 'Hide Text'}</span>
              <span className="text-[11px] font-normal opacity-80 whitespace-nowrap">
                {hideText ? '문장 보기' : '문장 숨기기'}
              </span>
            </span>
          </button>
        </div>
      )}

      {/* Sentence Cards or Empty State */}
      {sentences.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-6 text-center space-y-4">
          <p className="text-[18px] text-stone-700">
            No sentences yet. Tap Edit Sentences to add some.
          </p>
          <p className="text-sm text-stone-500">
            아직 연습할 문장이 없어요. 문장 편집에서 추가해 보세요.
          </p>
          <button
            type="button"
            onClick={onOpenEdit}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-white hover:bg-red-800 cursor-pointer"
          >
            <PencilLine className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex flex-col items-center leading-tight">
              <span className="text-base font-medium">Edit Sentences</span>
              <span className="text-[11px] text-red-100">문장 편집</span>
            </span>
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {sentences.map((sentence, idx) => {
            const p = getSentenceProgress(progress, sentence.id);
            const statusInfo = STATUS_META[p.status];
            return (
              <li key={sentence.id}>
                <button
                  type="button"
                  onClick={() => onSelectSentence(idx)}
                  className="flex min-h-[72px] w-full items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3.5 text-left transition-colors hover:border-red-300 hover:bg-red-50/30 active:bg-red-50/60 cursor-pointer"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-sm font-semibold text-stone-700 tabular-nums">
                    {idx + 1}
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span className="font-semibold text-stone-700">{sentence.speaker}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {sentence.start.toFixed(1)}s–{sentence.end.toFixed(1)}s
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-medium ${statusInfo.textClass}`}>
                        {statusInfo.symbol} {statusInfo.labelEn}
                      </span>
                    </div>

                    {hideText ? (
                      <p className="text-[17px] italic text-stone-400">
                        Text hidden · 문장 숨겨짐
                      </p>
                    ) : (
                      <p className="text-[18px] font-medium text-stone-900 leading-snug">
                        {sentence.text}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="h-5 w-5 shrink-0 text-stone-400" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Finish Session */}
      {sentences.length > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onFinish}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-700 transition-colors hover:bg-stone-50 cursor-pointer"
          >
            <Flag className="h-4 w-4 text-red-700 shrink-0" aria-hidden="true" />
            <span className="flex flex-col items-center leading-tight">
              <span className="text-base font-medium">Finish Session</span>
              <span className="text-[11px] text-stone-500">학습 결과 보기</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
