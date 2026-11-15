import { DEFAULT_SENTENCES } from '../constants/movieConfig';
import type { ProgressMap, Sentence, SentenceProgress } from '../types';

const SENTENCES_KEY = 'scene_shadow_stuart_sentences_v1';
const PROGRESS_KEY = 'scene_shadow_stuart_progress_v1';

let memorySentences: Sentence[] | null = null;
let memoryProgress: ProgressMap | null = null;

export function createEmptyProgress(id: number): SentenceProgress {
  return {
    id,
    plays: 0,
    recordings: 0,
    selfCheck: [null, null, null],
    status: 'new',
  };
}

function isValidSentenceArray(value: unknown): value is Sentence[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'number' &&
      typeof item.speaker === 'string' &&
      typeof item.text === 'string' &&
      typeof item.korean === 'string' &&
      Array.isArray(item.stress) &&
      typeof item.start === 'number' &&
      typeof item.end === 'number'
  );
}

export function loadSentences(): Sentence[] {
  try {
    const raw = window.localStorage.getItem(SENTENCES_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidSentenceArray(parsed)) {
        memorySentences = parsed;
        return parsed;
      }
    }
  } catch {
    // Fallback to memory if localStorage is blocked or unavailable
  }

  if (memorySentences !== null) {
    return memorySentences;
  }

  memorySentences = DEFAULT_SENTENCES.map((s) => ({ ...s, stress: [...s.stress] }));
  return memorySentences;
}

export function saveSentences(sentences: Sentence[]): void {
  memorySentences = sentences;
  try {
    window.localStorage.setItem(SENTENCES_KEY, JSON.stringify(sentences));
  } catch {
    // Keep in memory safely when storage fails
  }
}

export function loadProgress(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        memoryProgress = parsed as ProgressMap;
        return memoryProgress;
      }
    }
  } catch {
    // Fallback to memory
  }

  if (memoryProgress !== null) {
    return memoryProgress;
  }

  memoryProgress = {};
  return memoryProgress;
}

export function saveProgress(progress: ProgressMap): void {
  memoryProgress = progress;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Keep in memory safely
  }
}

export function getSentenceProgress(progress: ProgressMap, sentenceId: number): SentenceProgress {
  return progress[sentenceId] ?? createEmptyProgress(sentenceId);
}
