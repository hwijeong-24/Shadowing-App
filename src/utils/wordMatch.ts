import type { WordCheckResult, WordCheckToken } from '../types';

export function normalizeWord(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export interface SentenceToken {
  raw: string;
  isStress: boolean;
}

export function tokenizeSentenceWithStress(text: string, stressWords: string[]): SentenceToken[] {
  const stressSet = new Set(stressWords.map((w) => normalizeWord(w)).filter(Boolean));
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => ({
      raw,
      isStress: stressSet.has(normalizeWord(raw)),
    }));
}

/**
 * Aligns spoken words against target sentence words using Longest Common Subsequence (LCS)
 * after lowercasing and removing punctuation, so each target word is fairly marked matched or missed.
 */
export function evaluateSpokenWords(targetText: string, transcript: string): WordCheckResult {
  const targetRawWords = targetText.trim().split(/\s+/).filter(Boolean);
  const targetNorm = targetRawWords.map(normalizeWord);
  const spokenNorm = transcript
    .trim()
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);

  const m = targetNorm.length;
  const n = spokenNorm.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (targetNorm[i - 1] !== '' && targetNorm[i - 1] === spokenNorm[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const matchedFlags = new Array<boolean>(m).fill(false);
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (targetNorm[i - 1] !== '' && targetNorm[i - 1] === spokenNorm[j - 1]) {
      matchedFlags[i - 1] = true;
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }

  const tokens: WordCheckToken[] = targetRawWords.map((word, idx) => ({
    word,
    matched: matchedFlags[idx],
  }));

  const matchedCount = tokens.filter((t) => t.matched).length;

  return {
    tokens,
    matchedCount,
    totalCount: tokens.length,
    transcript,
  };
}
