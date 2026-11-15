import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  List,
  Mic,
  Pause,
  Play,
  Repeat,
  Square,
  Volume2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SELF_CHECK_QUESTIONS, SHADOWING_STEPS } from '../constants/movieConfig';
import type {
  BrowserSpeechRecognition,
  PlaybackSpeed,
  RecordingEntry,
  SelfCheckRating,
  Sentence,
  SentenceProgress,
  StepId,
  WordCheckResult,
} from '../types';
import { evaluateSpokenWords, tokenizeSentenceWithStress } from '../utils/wordMatch';

interface PracticeScreenProps {
  sentences: Sentence[];
  currentIndex: number;
  sentenceProgress: SentenceProgress;
  recording: RecordingEntry | undefined;
  isPlayingVideo: boolean;
  waitingLoop: boolean;
  loop: boolean;
  playbackSpeed: PlaybackSpeed;
  onChangeIndex: (newIndex: number) => void;
  onBackToList: () => void;
  onFinish: () => void;
  onPlaySentence: (options?: { ignoreLoopOnce?: boolean; onSegmentEnd?: () => void }) => void;
  onPauseVideo: () => void;
  onToggleLoop: () => void;
  onChangeSpeed: (speed: PlaybackSpeed) => void;
  onRecordPlayCount: (sentenceId: number) => void;
  onSaveRecording: (sentenceId: number, entry: RecordingEntry, stepId: StepId) => void;
  onSaveSelfCheck: (
    sentenceId: number,
    questionIndex: 0 | 1 | 2,
    rating: SelfCheckRating
  ) => void;
}

const SPEEDS: PlaybackSpeed[] = [0.5, 0.75, 1.0];

const RATING_OPTIONS: Array<{ value: Exclude<SelfCheckRating, null>; emoji: string; label: string }> =
  [
    { value: 'happy', emoji: '😀', label: 'Good' },
    { value: 'okay', emoji: '🙂', label: 'Okay' },
    { value: 'needs_practice', emoji: '😐', label: 'Again' },
  ];

export function PracticeScreen({
  sentences,
  currentIndex,
  sentenceProgress,
  recording,
  isPlayingVideo,
  waitingLoop,
  loop,
  playbackSpeed,
  onChangeIndex,
  onBackToList,
  onFinish,
  onPlaySentence,
  onPauseVideo,
  onToggleLoop,
  onChangeSpeed,
  onRecordPlayCount,
  onSaveRecording,
  onSaveSelfCheck,
}: PracticeScreenProps) {
  const sentence = sentences[currentIndex];

  const [activeStep, setActiveStep] = useState<StepId>(1);
  const [hideText, setHideText] = useState<boolean>(true);
  const [hideMeaning, setHideMeaning] = useState<boolean>(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [micDeniedMsg, setMicDeniedMsg] = useState<string | null>(null);
  const [isPlayingMyVoice, setIsPlayingMyVoice] = useState(false);

  // Speech recognition (Check My Words)
  const SpeechRecognitionCtor = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return window.SpeechRecognition || window.webkitSpeechRecognition;
  }, []);
  const [isListeningWords, setIsListeningWords] = useState(false);
  const [wordCheckResult, setWordCheckResult] = useState<WordCheckResult | null>(null);
  const [wordCheckMessage, setWordCheckMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const stopDelayTimerRef = useRef<number | null>(null);
  const safetyStopTimerRef = useRef<number | null>(null);
  const myVoiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const recordingSentenceIdRef = useRef<number | null>(null);
  const recordingStepRef = useRef<StepId>(1);

  const stopAllAudioAndRecording = useCallback(() => {
    if (stopDelayTimerRef.current !== null) {
      window.clearTimeout(stopDelayTimerRef.current);
      stopDelayTimerRef.current = null;
    }
    if (safetyStopTimerRef.current !== null) {
      window.clearTimeout(safetyStopTimerRef.current);
      safetyStopTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    }
    if (myVoiceAudioRef.current) {
      myVoiceAudioRef.current.pause();
      myVoiceAudioRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setIsPlayingMyVoice(false);
    setIsListeningWords(false);
  }, []);

  // Reset per-sentence transient UI when switching sentences
  useEffect(() => {
    onPauseVideo();
    stopAllAudioAndRecording();
    setWordCheckResult(null);
    setWordCheckMessage(null);
  }, [currentIndex, onPauseVideo, stopAllAudioAndRecording]);

  // Clean up mic stream on unmount
  useEffect(() => {
    return () => {
      stopAllAudioAndRecording();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [stopAllAudioAndRecording]);

  if (!sentence) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-[18px] text-stone-700">
          No sentences yet. Tap Edit Sentences to add some.
        </p>
        <button
          type="button"
          onClick={onBackToList}
          className="min-h-[48px] rounded-xl bg-red-700 px-5 py-2.5 text-white cursor-pointer"
        >
          Back to List / 목록으로
        </button>
      </div>
    );
  }

  const currentStepInfo = SHADOWING_STEPS.find((s) => s.id === activeStep) ?? SHADOWING_STEPS[0];
  const tokens = tokenizeSentenceWithStress(sentence.text, sentence.stress);

  const handleSelectStep = (stepId: StepId) => {
    setActiveStep(stepId);
    const stepMeta = SHADOWING_STEPS.find((s) => s.id === stepId);
    if (stepMeta) {
      setHideText(stepMeta.hideTextByDefault);
    }
  };

  const handleTogglePlay = () => {
    if (isPlayingVideo || waitingLoop) {
      onPauseVideo();
    } else {
      onRecordPlayCount(sentence.id);
      onPlaySentence();
    }
  };

  const stopRecordingCleanly = () => {
    if (stopDelayTimerRef.current !== null) {
      window.clearTimeout(stopDelayTimerRef.current);
      stopDelayTimerRef.current = null;
    }
    if (safetyStopTimerRef.current !== null) {
      window.clearTimeout(safetyStopTimerRef.current);
      safetyStopTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
    }
  };

  const handleStartRecord = async () => {
    if (isRecording) {
      stopRecordingCleanly();
      onPauseVideo();
      return;
    }

    if (myVoiceAudioRef.current) {
      myVoiceAudioRef.current.pause();
      setIsPlayingMyVoice(false);
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicDeniedMsg('Mic is off. You can still listen and shadow out loud.');
      return;
    }

    try {
      let stream = mediaStreamRef.current;
      if (!stream || stream.getTracks().some((t) => t.readyState === 'ended')) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      }
      setMicDeniedMsg(null);

      // Pick compatible mimeType for Chrome & iOS Safari
      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
      let chosenMimeType = '';
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        for (const t of preferredTypes) {
          if (MediaRecorder.isTypeSupported(t)) {
            chosenMimeType = t;
            break;
          }
        }
      }

      const recorder = chosenMimeType
        ? new MediaRecorder(stream, { mimeType: chosenMimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recordingSentenceIdRef.current = sentence.id;
      recordingStepRef.current = activeStep;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setIsRecording(false);
        const blobType = recorder.mimeType || chosenMimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        if (blob.size > 0 && recordingSentenceIdRef.current !== null) {
          const url = URL.createObjectURL(blob);
          onSaveRecording(
            recordingSentenceIdRef.current,
            { url, mimeType: blobType },
            recordingStepRef.current
          );
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      onRecordPlayCount(sentence.id);

      // Play the sentence once (Loop ignored while recording), stop recording 1s after end
      onPlaySentence({
        ignoreLoopOnce: true,
        onSegmentEnd: () => {
          stopDelayTimerRef.current = window.setTimeout(() => {
            stopRecordingCleanly();
          }, 1000);
        },
      });

      // Safety fallback stop in case YouTube stalls
      const maxDurationMs = Math.max(
        4000,
        ((sentence.end - sentence.start) / playbackSpeed) * 1000 + 4500
      );
      safetyStopTimerRef.current = window.setTimeout(() => {
        stopRecordingCleanly();
      }, maxDurationMs);
    } catch {
      setMicDeniedMsg('Mic is off. You can still listen and shadow out loud.');
      setIsRecording(false);
    }
  };

  const handlePlayMyVoice = () => {
    if (!recording) return;
    if (isPlayingMyVoice && myVoiceAudioRef.current) {
      myVoiceAudioRef.current.pause();
      myVoiceAudioRef.current = null;
      setIsPlayingMyVoice(false);
      return;
    }

    onPauseVideo();
    const audio = new Audio(recording.url);
    myVoiceAudioRef.current = audio;
    setIsPlayingMyVoice(true);

    audio.onended = () => {
      setIsPlayingMyVoice(false);
      myVoiceAudioRef.current = null;
    };
    audio.onerror = () => {
      setIsPlayingMyVoice(false);
      myVoiceAudioRef.current = null;
    };
    audio.play().catch(() => {
      setIsPlayingMyVoice(false);
      myVoiceAudioRef.current = null;
    });
  };

  const handlePlayOriginal = () => {
    if (myVoiceAudioRef.current) {
      myVoiceAudioRef.current.pause();
      myVoiceAudioRef.current = null;
      setIsPlayingMyVoice(false);
    }
    onRecordPlayCount(sentence.id);
    onPlaySentence({ ignoreLoopOnce: true });
  };

  const handleCheckWords = () => {
    if (!SpeechRecognitionCtor) return;

    if (isListeningWords && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      setIsListeningWords(false);
      return;
    }

    onPauseVideo();
    setWordCheckMessage(null);

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognitionRef.current = recognition;
      setIsListeningWords(true);

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? '';
        if (transcript.trim()) {
          const evaluated = evaluateSpokenWords(sentence.text, transcript);
          setWordCheckResult(evaluated);
          setWordCheckMessage(null);
        } else {
          setWordCheckMessage('Didn’t catch any words. Try speaking a bit closer! / 소리가 작게 들렸어요. 다시 한 번 말해보세요.');
        }
      };

      recognition.onerror = (event) => {
        setIsListeningWords(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicDeniedMsg('Mic is off. You can still listen and shadow out loud.');
        } else if (event.error === 'no-speech') {
          setWordCheckMessage('No speech heard—tap Check My Words to try again! / 음성이 들리지 않았어요. 다시 눌러 말해보세요.');
        }
      };

      recognition.onend = () => {
        setIsListeningWords(false);
        recognitionRef.current = null;
      };

      recognition.start();
    } catch {
      setIsListeningWords(false);
      setWordCheckMessage('Could not start speech check on this browser. / 이 브라우저에서는 단어 확인을 시작할 수 없어요.');
    }
  };

  const isLastSentence = currentIndex === sentences.length - 1;
  const showSelfCheck =
    sentenceProgress.recordings > 0 || sentenceProgress.selfCheck.some((r) => r !== null);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 pb-8">
      {/* Top Row: Back to List & Sentence Counter */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToList}
          className="flex min-h-[48px] items-center gap-1.5 rounded-xl px-3 text-stone-700 hover:bg-stone-100 cursor-pointer"
        >
          <List className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex flex-col items-start leading-tight">
            <span className="text-sm font-medium whitespace-nowrap">List</span>
            <span className="text-[11px] text-stone-500 whitespace-nowrap">목록</span>
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChangeIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
            aria-label="Previous sentence"
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <span className="px-2.5 text-sm font-semibold text-stone-800 tabular-nums whitespace-nowrap">
            Sentence {currentIndex + 1} / {sentences.length}
          </span>

          <button
            type="button"
            onClick={() => onChangeIndex(currentIndex + 1)}
            disabled={isLastSentence}
            aria-label="Next sentence"
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 4-Step Guide Tabs */}
      <section className="rounded-xl border border-stone-200 bg-white p-3 space-y-2.5">
        <div className="grid grid-cols-4 gap-1.5" role="tablist" aria-label="Shadowing steps">
          {SHADOWING_STEPS.map((step) => {
            const active = activeStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleSelectStep(step.id)}
                className={`flex min-h-[50px] flex-col items-center justify-center rounded-lg px-1 py-1.5 text-center transition-colors cursor-pointer ${
                  active
                    ? 'bg-red-700 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
                }`}
              >
                <span className="text-[11px] font-semibold leading-tight whitespace-nowrap">
                  {step.shortTitle}
                </span>
                <span className="text-[11px] leading-tight mt-0.5 truncate max-w-full">
                  {step.labelEn}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-1 text-center space-y-0.5">
          <p className="text-sm font-medium text-stone-800">{currentStepInfo.instructionEn}</p>
          <p className="text-xs text-stone-500">{currentStepInfo.instructionKo}</p>
        </div>
      </section>

      {/* Main Sentence Card */}
      <section className="rounded-xl border border-stone-200 bg-white p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <span className="font-semibold text-stone-900">{sentence.speaker}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-xs tabular-nums">
              {sentence.start.toFixed(1)}s–{sentence.end.toFixed(1)}s
            </span>
          </div>

          <button
            type="button"
            onClick={() => setHideText((prev) => !prev)}
            className={`flex min-h-[48px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              hideText
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {hideText ? (
              <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="flex flex-col items-start leading-tight">
              <span className="whitespace-nowrap">{hideText ? 'Show Text' : 'Hide Text'}</span>
              <span className="text-[10px] font-normal opacity-80 whitespace-nowrap">
                {hideText ? '문장 보기' : '문장 숨기기'}
              </span>
            </span>
          </button>
        </div>

        {/* English Sentence (>= 22px) */}
        <div className="min-h-[76px] flex items-center">
          {hideText ? (
            <p className="text-[18px] italic text-stone-400 leading-relaxed">
              Text is hidden. Listen closely and shadow!
              <span className="block text-sm not-italic mt-1">
                문장이 가려져 있어요. 소리에 집중해 보세요!
              </span>
            </p>
          ) : (
            <p className="text-[24px] font-medium text-stone-900 leading-snug">
              {tokens.map((tok, idx) => (
                <span key={`${tok.raw}-${idx}`}>
                  {idx > 0 ? ' ' : ''}
                  <span className={tok.isStress ? 'font-bold text-red-700' : 'font-normal'}>
                    {tok.raw}
                  </span>
                </span>
              ))}
            </p>
          )}
        </div>

        {/* Korean Meaning (small, gray, toggleable) */}
        <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
          {hideMeaning ? (
            <p className="text-sm text-stone-400 italic">Meaning hidden · 뜻 숨겨짐</p>
          ) : (
            <p className="text-[15px] text-stone-500 leading-snug">{sentence.korean}</p>
          )}
          <button
            type="button"
            onClick={() => setHideMeaning((prev) => !prev)}
            className="min-h-[48px] shrink-0 px-2.5 text-xs font-medium text-stone-500 hover:text-stone-800 whitespace-nowrap cursor-pointer"
          >
            {hideMeaning ? 'Show 뜻' : 'Hide 뜻'}
          </button>
        </div>
      </section>

      {/* Playback Control Row: Play, Loop, Speed */}
      <section className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-white transition-colors hover:bg-red-800 active:bg-red-900 cursor-pointer"
          >
            {isPlayingVideo || waitingLoop ? (
              <Pause className="h-5 w-5 shrink-0" aria-hidden="true" />
            ) : (
              <Play className="h-5 w-5 shrink-0" aria-hidden="true" />
            )}
            <span className="flex flex-col items-start leading-tight">
              <span className="text-base font-semibold whitespace-nowrap">
                {isPlayingVideo || waitingLoop ? 'Pause' : 'Play'}
              </span>
              <span className="text-[11px] font-normal text-red-100 whitespace-nowrap">
                {isPlayingVideo || waitingLoop ? '일시정지' : '재생'}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleLoop}
            aria-pressed={loop}
            className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl border px-4 py-2 transition-colors cursor-pointer ${
              loop
                ? 'border-red-300 bg-red-50 text-red-800'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Repeat className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-base font-semibold whitespace-nowrap">
                {loop ? 'Loop On' : 'Loop Off'}
              </span>
              <span className="text-[11px] font-normal opacity-80 whitespace-nowrap">
                {loop ? '반복 켜짐 (1.5초)' : '반복 꺼짐'}
              </span>
            </span>
          </button>
        </div>

        {/* Speed Segmented Row */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-500 w-16 shrink-0">
            Speed
            <span className="block text-[10px] text-stone-400">배속</span>
          </span>
          <div className="grid flex-1 grid-cols-3 gap-1.5">
            {SPEEDS.map((spd) => {
              const active = playbackSpeed === spd;
              return (
                <button
                  key={spd}
                  type="button"
                  onClick={() => onChangeSpeed(spd)}
                  className={`min-h-[48px] rounded-xl border text-sm font-semibold tabular-nums transition-colors cursor-pointer ${
                    active
                      ? 'border-red-700 bg-red-700 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {spd === 1 ? '1.0×' : `${spd}×`}
                </button>
              );
            })}
          </div>
        </div>

        {waitingLoop && (
          <p className="text-center text-xs font-medium text-red-700">
            Your turn! Repeating in 1.5s... / 지금 따라 말해보세요! (1.5초 후 반복)
          </p>
        )}
      </section>

      {/* Record Area */}
      <section className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-3">
        <button
          type="button"
          onClick={handleStartRecord}
          className={`flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 font-semibold transition-colors cursor-pointer ${
            isRecording
              ? 'bg-stone-900 text-white hover:bg-stone-800'
              : 'border-2 border-red-700 bg-white text-red-700 hover:bg-red-50'
          }`}
        >
          {isRecording ? (
            <Square className="h-5 w-5 fill-current shrink-0" aria-hidden="true" />
          ) : (
            <Mic className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          <span className="flex flex-col items-start leading-tight">
            <span className="text-base font-semibold">
              {isRecording ? 'Recording... Tap to Stop' : 'Record'}
            </span>
            <span className="text-[11px] font-normal opacity-80">
              {isRecording ? '녹음 중... 끝난 뒤 1초 후 자동 종료' : '영상과 동시에 녹음하기'}
            </span>
          </span>
        </button>

        {micDeniedMsg && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">
            <p className="font-medium">{micDeniedMsg}</p>
            <p className="text-xs text-amber-800 mt-0.5">
              마이크가 꺼져 있어요. 소리 내어 따라 말하며 계속 연습할 수 있어요.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handlePlayMyVoice}
            disabled={!recording}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-800 transition-colors hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPlayingMyVoice ? (
              <Pause className="h-4 w-4 text-red-700 shrink-0" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4 text-red-700 shrink-0" aria-hidden="true" />
            )}
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold whitespace-nowrap">
                {isPlayingMyVoice ? 'Stop Voice' : 'My Voice'}
              </span>
              <span className="text-[11px] text-stone-500 whitespace-nowrap">내 목소리</span>
            </span>
          </button>

          <button
            type="button"
            onClick={handlePlayOriginal}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-800 transition-colors hover:bg-stone-100 cursor-pointer"
          >
            <Play className="h-4 w-4 text-stone-700 shrink-0" aria-hidden="true" />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold whitespace-nowrap">Original</span>
              <span className="text-[11px] text-stone-500 whitespace-nowrap">원어민 듣기</span>
            </span>
          </button>
        </div>
      </section>

      {/* Optional Word Check (hidden if SpeechRecognition unsupported) */}
      {SpeechRecognitionCtor && (
        <section className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-3">
          <button
            type="button"
            onClick={handleCheckWords}
            className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 transition-colors cursor-pointer ${
              isListeningWords
                ? 'border-red-700 bg-red-50 text-red-800'
                : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50'
            }`}
          >
            <Mic className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex flex-col items-center leading-tight">
              <span className="text-sm font-semibold">
                {isListeningWords ? 'Listening... Speak Now (Tap to Stop)' : 'Check My Words'}
              </span>
              <span className="text-[11px] text-stone-500">
                {isListeningWords ? '듣고 있어요... 영어로 문장을 말해보세요' : '단어 발음 확인하기 (선택)'}
              </span>
            </span>
          </button>

          {wordCheckMessage && (
            <p className="text-xs text-stone-600 text-center">{wordCheckMessage}</p>
          )}

          {wordCheckResult && (
            <div className="space-y-2 border-t border-stone-100 pt-3">
              <p className="text-sm font-semibold text-stone-800 tabular-nums">
                You said {wordCheckResult.matchedCount} of {wordCheckResult.totalCount} words.
              </p>
              <p className="text-[19px] leading-relaxed">
                {wordCheckResult.tokens.map((tok, idx) => (
                  <span key={`${tok.word}-${idx}`}>
                    {idx > 0 ? ' ' : ''}
                    <span
                      className={
                        tok.matched
                          ? 'font-semibold text-emerald-700'
                          : 'text-stone-400 underline decoration-stone-400 underline-offset-4'
                      }
                    >
                      {tok.word}
                    </span>
                  </span>
                ))}
              </p>
              <p className="text-xs text-stone-500">
                Heard: &ldquo;{wordCheckResult.transcript}&rdquo;
              </p>
            </div>
          )}
        </section>
      )}

      {/* Self-check (shown after recording) */}
      {showSelfCheck && (
        <section className="rounded-xl border border-stone-200 bg-white p-4 space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-stone-900">
              Self-Check · 스스로 점검하기
            </h2>
            <p className="text-xs text-stone-500">
              Check how it felt—no scores, just your own reflection.
            </p>
          </div>

          <div className="space-y-4">
            {SELF_CHECK_QUESTIONS.map((q) => {
              const selected = sentenceProgress.selfCheck[q.id];
              return (
                <div key={q.id} className="space-y-2 border-t border-stone-100 pt-3 first:border-t-0 first:pt-0">
                  <div>
                    <p className="text-[16px] font-medium text-stone-900">{q.en}</p>
                    <p className="text-xs text-stone-500">{q.ko}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {RATING_OPTIONS.map((opt) => {
                      const active = selected === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => onSaveSelfCheck(sentence.id, q.id, opt.value)}
                          aria-pressed={active}
                          className={`flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                            active
                              ? 'border-red-700 bg-red-50 text-red-800'
                              : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <span className="text-lg" aria-hidden="true">
                            {opt.emoji}
                          </span>
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Next / Finish CTA */}
      <button
        type="button"
        onClick={() => {
          if (isLastSentence) {
            onFinish();
          } else {
            onChangeIndex(currentIndex + 1);
          }
        }}
        className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-white transition-colors hover:bg-stone-800 cursor-pointer"
      >
        <span className="flex flex-col items-center leading-tight">
          <span className="text-base font-semibold">
            {isLastSentence ? 'Finish Practice' : 'Next Sentence'}
          </span>
          <span className="text-[11px] font-normal text-stone-300">
            {isLastSentence ? '마무리 화면으로' : '다음 문장'}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
      </button>
    </div>
  );
}
