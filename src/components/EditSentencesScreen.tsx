import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  Download,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { useState } from 'react';
import { DEFAULT_SENTENCES, MOVIE_CONFIG } from '../constants/movieConfig';
import type { Sentence } from '../types';

interface EditSentencesScreenProps {
  sentences: Sentence[];
  onSaveSentences: (next: Sentence[]) => void;
  onGetCurrentVideoTime: () => number;
  onTestSegment: (start: number, end: number) => void;
  onBack: () => void;
}

interface FormState {
  editingId: number | null;
  speaker: string;
  text: string;
  korean: string;
  stressInput: string;
  startInput: string;
  endInput: string;
}

function emptyForm(): FormState {
  return {
    editingId: null,
    speaker: '',
    text: '',
    korean: '',
    stressInput: '',
    startInput: String(MOVIE_CONFIG.rangeStart),
    endInput: String(MOVIE_CONFIG.rangeStart + 2),
  };
}

export function EditSentencesScreen({
  sentences,
  onSaveSentences,
  onGetCurrentVideoTime,
  onTestSegment,
  onBack,
}: EditSentencesScreenProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Export / Import state
  const [copiedJson, setCopiedJson] = useState(false);
  const [showExportBox, setShowExportBox] = useState(false);
  const [showImportBox, setShowImportBox] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const parsedStart = Number.parseFloat(form.startInput);
  const parsedEnd = Number.parseFloat(form.endInput);
  const wordCount = form.text.trim() ? form.text.trim().split(/\s+/).length : 0;
  const durationSeconds =
    !Number.isNaN(parsedStart) && !Number.isNaN(parsedEnd) ? parsedEnd - parsedStart : 0;

  const gentleWarning =
    (durationSeconds > 4 ? `Segment is ${durationSeconds.toFixed(1)}s (longer than 4s). ` : '') +
    (wordCount > 12 ? `Sentence has ${wordCount} words (more than 12).` : '');

  const handleSetStartNow = () => {
    const t = Math.round(onGetCurrentVideoTime() * 10) / 10;
    const clamped = Math.min(MOVIE_CONFIG.rangeEnd, Math.max(MOVIE_CONFIG.rangeStart, t));
    setForm((prev) => ({ ...prev, startInput: clamped.toFixed(1) }));
  };

  const handleSetEndNow = () => {
    const t = Math.round(onGetCurrentVideoTime() * 10) / 10;
    const clamped = Math.min(MOVIE_CONFIG.rangeEnd, Math.max(MOVIE_CONFIG.rangeStart, t));
    setForm((prev) => ({ ...prev, endInput: clamped.toFixed(1) }));
  };

  const handleTest = () => {
    setFormError(null);
    if (Number.isNaN(parsedStart) || Number.isNaN(parsedEnd)) {
      setFormError('Enter valid numbers for start and end times.');
      return;
    }
    if (
      parsedStart < MOVIE_CONFIG.rangeStart ||
      parsedEnd > MOVIE_CONFIG.rangeEnd ||
      parsedEnd <= parsedStart
    ) {
      setFormError(
        `Times must be between ${MOVIE_CONFIG.rangeStart}s and ${MOVIE_CONFIG.rangeEnd}s, with end > start.`
      );
      return;
    }
    onTestSegment(parsedStart, parsedEnd);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const speaker = form.speaker.trim();
    const text = form.text.trim();
    const korean = form.korean.trim();
    const stress = form.stressInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!speaker) {
      setFormError('Please enter a speaker name. / 화자 이름을 입력해 주세요.');
      return;
    }
    if (!text) {
      setFormError('Please enter the English sentence. / 영어 문장을 입력해 주세요.');
      return;
    }
    if (Number.isNaN(parsedStart) || Number.isNaN(parsedEnd)) {
      setFormError('Please enter valid start and end numbers. / 시작·종료 시간을 숫자로 입력해 주세요.');
      return;
    }
    if (parsedStart < MOVIE_CONFIG.rangeStart || parsedEnd > MOVIE_CONFIG.rangeEnd) {
      setFormError(
        `Start and end must be between ${MOVIE_CONFIG.rangeStart} and ${MOVIE_CONFIG.rangeEnd} seconds.`
      );
      return;
    }
    if (parsedEnd <= parsedStart) {
      setFormError('End time must be greater than start time. / 종료 시간은 시작 시간보다 커야 합니다.');
      return;
    }

    const roundedStart = Math.round(parsedStart * 10) / 10;
    const roundedEnd = Math.round(parsedEnd * 10) / 10;

    if (form.editingId !== null) {
      const updated = sentences.map((s) =>
        s.id === form.editingId
          ? { ...s, speaker, text, korean, stress, start: roundedStart, end: roundedEnd }
          : s
      );
      onSaveSentences(updated);
      setForm(emptyForm());
      setFormSuccess('Sentence updated! / 문장이 수정되었어요.');
    } else {
      const nextId = sentences.reduce((max, s) => Math.max(max, s.id), 0) + 1;
      const created: Sentence = {
        id: nextId,
        speaker,
        text,
        korean,
        stress,
        start: roundedStart,
        end: roundedEnd,
      };
      onSaveSentences([...sentences, created]);
      setForm(emptyForm());
      setFormSuccess('Sentence added! / 새 문장이 추가되었어요.');
    }
  };

  const handleEditClick = (sentence: Sentence) => {
    setFormError(null);
    setFormSuccess(null);
    setForm({
      editingId: sentence.id,
      speaker: sentence.speaker,
      text: sentence.text,
      korean: sentence.korean,
      stressInput: sentence.stress.join(', '),
      startInput: sentence.start.toFixed(1),
      endInput: sentence.end.toFixed(1),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sentences.length) return;
    const next = [...sentences];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onSaveSentences(next);
  };

  const handleDelete = (id: number) => {
    onSaveSentences(sentences.filter((s) => s.id !== id));
    setConfirmDeleteId(null);
    if (form.editingId === id) {
      setForm(emptyForm());
    }
  };

  const handleExport = async () => {
    const json = JSON.stringify(sentences, null, 2);
    setShowExportBox(true);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(json);
        setCopiedJson(true);
        window.setTimeout(() => setCopiedJson(false), 2500);
      }
    } catch {
      setCopiedJson(false);
    }
  };

  const handleImport = () => {
    setImportFeedback(null);
    try {
      const parsed: unknown = JSON.parse(importText);
      if (!Array.isArray(parsed)) {
        setImportFeedback('JSON must be an array of sentence objects. / JSON 배열 형식이어야 합니다.');
        return;
      }

      const validated: Sentence[] = [];
      for (let i = 0; i < parsed.length; i += 1) {
        const item = parsed[i] as Record<string, unknown>;
        if (
          typeof item !== 'object' ||
          item === null ||
          typeof item.speaker !== 'string' ||
          typeof item.text !== 'string' ||
          typeof item.start !== 'number' ||
          typeof item.end !== 'number'
        ) {
          setImportFeedback(`Item #${i + 1} is missing speaker, text, start, or end.`);
          return;
        }
        if (
          item.start < MOVIE_CONFIG.rangeStart ||
          item.end > MOVIE_CONFIG.rangeEnd ||
          item.end <= item.start
        ) {
          setImportFeedback(
            `Item #${i + 1} times must be inside ${MOVIE_CONFIG.rangeStart}–${MOVIE_CONFIG.rangeEnd}s.`
          );
          return;
        }
        validated.push({
          id: typeof item.id === 'number' ? item.id : i + 1,
          speaker: item.speaker,
          text: item.text,
          korean: typeof item.korean === 'string' ? item.korean : '',
          stress: Array.isArray(item.stress)
            ? item.stress.filter((w): w is string => typeof w === 'string')
            : [],
          start: Math.round(item.start * 10) / 10,
          end: Math.round(item.end * 10) / 10,
        });
      }

      onSaveSentences(validated);
      setImportText('');
      setShowImportBox(false);
      setFormSuccess(`Imported ${validated.length} sentences! / ${validated.length}개 문장을 가져왔어요.`);
    } catch {
      setImportFeedback('Invalid JSON format. Please check and try again. / 올바른 JSON 형식이 아니에요.');
    }
  };

  return (
    <div className="flex flex-col gap-5 px-4 py-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[48px] items-center gap-1.5 rounded-xl px-3 text-stone-700 hover:bg-stone-100 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex flex-col items-start leading-tight">
            <span className="text-sm font-medium whitespace-nowrap">Back</span>
            <span className="text-[11px] text-stone-500 whitespace-nowrap">돌아가기</span>
          </span>
        </button>

        <div className="text-right">
          <h1 className="text-base font-semibold text-stone-900">Edit Sentences</h1>
          <p className="text-xs text-stone-500">
            문장 편집 · Range {MOVIE_CONFIG.rangeStart}s–{MOVIE_CONFIG.rangeEnd}s
          </p>
        </div>
      </div>

      {/* Add / Edit Form */}
      <form
        onSubmit={handleSubmitForm}
        className="rounded-xl border border-stone-200 bg-white p-4 space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900">
            {form.editingId !== null ? 'Edit Sentence / 문장 수정' : 'Add Sentence / 문장 추가'}
          </h2>
          {form.editingId !== null && (
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm());
                setFormError(null);
              }}
              className="min-h-[44px] px-2.5 text-xs font-medium text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              Cancel Edit / 취소
            </button>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-speaker" className="block text-sm font-medium text-stone-700">
            Speaker / 화자
          </label>
          <input
            id="edit-speaker"
            type="text"
            value={form.speaker}
            onChange={(e) => setForm((p) => ({ ...p, speaker: e.target.value }))}
            placeholder="e.g., Stuart"
            className="min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-base text-stone-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-text" className="block text-sm font-medium text-stone-700">
            English Sentence / 영어 문장
          </label>
          <input
            id="edit-text"
            type="text"
            value={form.text}
            onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
            placeholder="e.g., Sure, it is roomy."
            className="min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-base text-stone-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-korean" className="block text-sm font-medium text-stone-700">
            Korean Meaning / 한국어 뜻
          </label>
          <input
            id="edit-korean"
            type="text"
            value={form.korean}
            onChange={(e) => setForm((p) => ({ ...p, korean: e.target.value }))}
            placeholder="e.g., 물론이죠. 공간이 넓네요."
            className="min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-base text-stone-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-stress" className="block text-sm font-medium text-stone-700">
            Stress Words (comma-separated) / 강세 단어
          </label>
          <input
            id="edit-stress"
            type="text"
            value={form.stressInput}
            onChange={(e) => setForm((p) => ({ ...p, stressInput: e.target.value }))}
            placeholder="e.g., sure, roomy"
            className="min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-base text-stone-900"
          />
        </div>

        {/* Time Pickers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="edit-start" className="block text-sm font-medium text-stone-700">
              Start (s) / 시작
            </label>
            <input
              id="edit-start"
              type="number"
              step="0.1"
              min={MOVIE_CONFIG.rangeStart}
              max={MOVIE_CONFIG.rangeEnd}
              value={form.startInput}
              onChange={(e) => setForm((p) => ({ ...p, startInput: e.target.value }))}
              className="min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3 font-mono text-base text-stone-900 tabular-nums"
            />
            <button
              type="button"
              onClick={handleSetStartNow}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100 cursor-pointer"
            >
              <span className="flex flex-col items-center leading-tight">
                <span>Set Start = now</span>
                <span className="text-[10px] text-stone-500">현재 시간으로 시작 설정</span>
              </span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-end" className="block text-sm font-medium text-stone-700">
              End (s) / 종료
            </label>
            <input
              id="edit-end"
              type="number"
              step="0.1"
              min={MOVIE_CONFIG.rangeStart}
              max={MOVIE_CONFIG.rangeEnd}
              value={form.endInput}
              onChange={(e) => setForm((p) => ({ ...p, endInput: e.target.value }))}
              className="min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3 font-mono text-base text-stone-900 tabular-nums"
            />
            <button
              type="button"
              onClick={handleSetEndNow}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100 cursor-pointer"
            >
              <span className="flex flex-col items-center leading-tight">
                <span>Set End = now</span>
                <span className="text-[10px] text-stone-500">현재 시간으로 종료 설정</span>
              </span>
            </button>
          </div>
        </div>

        {/* Gentle Warning (> 4s or > 12 words) */}
        {gentleWarning && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Gentle tip: {gentleWarning} Short lines (≤ 4s, ≤ 12 words) are easiest to shadow.
          </p>
        )}

        {formError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError}
          </p>
        )}

        {formSuccess && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {formSuccess}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleTest}
            className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 hover:bg-stone-50 cursor-pointer"
          >
            <Play className="h-4 w-4 text-red-700 shrink-0" aria-hidden="true" />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold">Test</span>
              <span className="text-[10px] text-stone-500">구간 미리듣기</span>
            </span>
          </button>

          <button
            type="submit"
            className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl bg-red-700 px-3 py-2 text-white hover:bg-red-800 cursor-pointer"
          >
            {form.editingId !== null ? (
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold">
                {form.editingId !== null ? 'Save Changes' : 'Add Sentence'}
              </span>
              <span className="text-[10px] text-red-100">
                {form.editingId !== null ? '수정 저장' : '문장 추가'}
              </span>
            </span>
          </button>
        </div>
      </form>

      {/* Current List */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-stone-900">
          Current List ({sentences.length}) · 현재 문장 목록
        </h2>

        {sentences.length === 0 ? (
          <p className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500 text-center">
            No sentences yet. Add one above or import JSON below.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {sentences.map((s, index) => (
              <li
                key={s.id}
                className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs text-stone-500">
                      <span className="font-semibold text-stone-800">#{index + 1} · {s.speaker}</span>
                      {' · '}
                      <span className="font-mono tabular-nums">
                        {s.start.toFixed(1)}s–{s.end.toFixed(1)}s
                      </span>
                    </p>
                    <p className="text-[17px] font-medium text-stone-900 leading-snug">{s.text}</p>
                    {s.korean && <p className="text-xs text-stone-500">{s.korean}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === sentences.length - 1}
                    aria-label="Move down"
                    className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEditClick(s)}
                    className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Edit / 수정</span>
                  </button>

                  {confirmDeleteId === s.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className="min-h-[48px] rounded-xl bg-red-700 px-3 text-xs font-semibold text-white hover:bg-red-800 cursor-pointer"
                      >
                        Confirm / 삭제
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="min-h-[48px] rounded-xl border border-stone-200 px-2.5 text-xs text-stone-600 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(s.id)}
                      aria-label={`Delete sentence ${index + 1}`}
                      className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-stone-200 bg-white text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Export / Import JSON & Reset */}
      <section className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
        <h2 className="text-base font-semibold text-stone-900">
          Export &amp; Import JSON · 내보내기 / 가져오기
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-800 hover:bg-stone-100 cursor-pointer"
          >
            {copiedJson ? (
              <Copy className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4 text-red-700 shrink-0" aria-hidden="true" />
            )}
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold">
                {copiedJson ? 'Copied!' : 'Export JSON'}
              </span>
              <span className="text-[10px] text-stone-500">
                {copiedJson ? '클립보드 복사됨' : 'JSON 복사'}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowImportBox((p) => !p);
              setImportFeedback(null);
            }}
            className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-800 hover:bg-stone-100 cursor-pointer"
          >
            <Upload className="h-4 w-4 text-red-700 shrink-0" aria-hidden="true" />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold">Import JSON</span>
              <span className="text-[10px] text-stone-500">JSON 붙여넣기</span>
            </span>
          </button>
        </div>

        {showExportBox && (
          <div className="space-y-1.5">
            <label htmlFor="export-json" className="block text-xs font-medium text-stone-600">
              Sentence List JSON (select &amp; copy if needed):
            </label>
            <textarea
              id="export-json"
              readOnly
              rows={5}
              value={JSON.stringify(sentences, null, 2)}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 font-mono text-xs text-stone-800"
            />
          </div>
        )}

        {showImportBox && (
          <div className="space-y-2 border-t border-stone-100 pt-3">
            <label htmlFor="import-json" className="block text-xs font-medium text-stone-700">
              Paste JSON array below / 아래에 JSON 배열을 붙여넣으세요:
            </label>
            <textarea
              id="import-json"
              rows={5}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='[{"id": 1, "speaker": "Mom", "text": "...", "korean": "...", "stress": ["..."], "start": 100.4, "end": 102.9}]'
              className="w-full rounded-xl border border-stone-300 bg-white p-2.5 font-mono text-xs text-stone-900"
            />
            {importFeedback && <p className="text-xs text-red-700">{importFeedback}</p>}
            <button
              type="button"
              onClick={handleImport}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 cursor-pointer"
            >
              Load Imported Sentences / 불러오기 적용
            </button>
          </div>
        )}

        <div className="border-t border-stone-100 pt-3">
          {confirmReset ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-stone-700">
                Restore default 9 sentences? / 기본 9문장으로 복원할까요?
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onSaveSentences(
                      DEFAULT_SENTENCES.map((s) => ({ ...s, stress: [...s.stress] }))
                    );
                    setConfirmReset(false);
                    setFormSuccess('Restored default sentences! / 기본 문장으로 복원했어요.');
                  }}
                  className="min-h-[48px] rounded-xl bg-red-700 px-3 text-xs font-semibold text-white cursor-pointer"
                >
                  Restore
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-[48px] rounded-xl border border-stone-200 px-3 text-xs text-stone-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Restore Default Sentences / 기본 문장 복원</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
