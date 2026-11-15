import { useCallback, useEffect, useRef, useState } from 'react';
import { EditSentencesScreen } from './components/EditSentencesScreen';
import { FinishScreen } from './components/FinishScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { SentenceListScreen } from './components/SentenceListScreen';
import { StartScreen } from './components/StartScreen';
import { YouTubePlayer, type YouTubePlayerHandle } from './components/YouTubePlayer';
import { MOVIE_CONFIG } from './constants/movieConfig';
import type {
  PlaybackSpeed,
  ProgressMap,
  RecordingEntry,
  Screen,
  SelfCheckRating,
  Sentence,
  StepId,
} from './types';
import {
  getSentenceProgress,
  loadProgress,
  loadSentences,
  saveProgress,
  saveSentences,
} from './utils/storage';

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [previousScreenBeforeEdit, setPreviousScreenBeforeEdit] = useState<'start' | 'list'>(
    'start'
  );
  const [sentences, setSentences] = useState<Sentence[]>(() => loadSentences());
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // In-memory recordings: latest recording per sentence
  const [recordings, setRecordings] = useState<Record<number, RecordingEntry>>({});
  const recordingsRef = useRef(recordings);
  recordingsRef.current = recordings;

  // Player state
  const playerRef = useRef<YouTubePlayerHandle | null>(null);
  const [loop, setLoop] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1.0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [waitingLoop, setWaitingLoop] = useState<boolean>(false);

  // Revoke any object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(recordingsRef.current).forEach((entry) => {
        URL.revokeObjectURL(entry.url);
      });
    };
  }, []);

  const showVideoShell = screen === 'list' || screen === 'practice' || screen === 'edit';

  const navigateTo = useCallback((nextScreen: Screen) => {
    if (nextScreen === 'start' || nextScreen === 'finish') {
      playerRef.current?.pause();
    }
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const handleSaveSentences = useCallback(
    (next: Sentence[]) => {
      setSentences(next);
      saveSentences(next);
      if (currentIndex >= next.length) {
        setCurrentIndex(Math.max(0, next.length - 1));
      }
    },
    [currentIndex]
  );

  const handleChangeSpeed = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
    playerRef.current?.setRate(speed);
  }, []);

  const handleToggleLoop = useCallback(() => {
    setLoop((prev) => !prev);
  }, []);

  const handlePauseVideo = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  const handlePlayCurrentSentence = useCallback(
    (options?: { ignoreLoopOnce?: boolean; onSegmentEnd?: () => void }) => {
      const sentence = sentences[currentIndex];
      if (!sentence) return;
      playerRef.current?.playSegment({
        start: sentence.start,
        end: sentence.end,
        ignoreLoopOnce: options?.ignoreLoopOnce,
        onSegmentEnd: options?.onSegmentEnd,
      });
    },
    [sentences, currentIndex]
  );

  const handleRecordPlayCount = useCallback((sentenceId: number) => {
    setProgress((prev) => {
      const current = getSentenceProgress(prev, sentenceId);
      const next: ProgressMap = {
        ...prev,
        [sentenceId]: {
          ...current,
          plays: current.plays + 1,
        },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const handleSaveRecording = useCallback(
    (sentenceId: number, entry: RecordingEntry, stepId: StepId) => {
      setRecordings((prev) => {
        const old = prev[sentenceId];
        if (old && old.url !== entry.url) {
          URL.revokeObjectURL(old.url);
        }
        return { ...prev, [sentenceId]: entry };
      });

      setProgress((prev) => {
        const current = getSentenceProgress(prev, sentenceId);
        const nextStatus =
          current.status === 'done' || stepId === 4 ? 'done' : 'practiced';
        const next: ProgressMap = {
          ...prev,
          [sentenceId]: {
            ...current,
            recordings: current.recordings + 1,
            status: nextStatus,
          },
        };
        saveProgress(next);
        return next;
      });
    },
    []
  );

  const handleSaveSelfCheck = useCallback(
    (sentenceId: number, questionIndex: 0 | 1 | 2, rating: SelfCheckRating) => {
      setProgress((prev) => {
        const current = getSentenceProgress(prev, sentenceId);
        const updatedChecks: [SelfCheckRating, SelfCheckRating, SelfCheckRating] = [
          ...current.selfCheck,
        ];
        updatedChecks[questionIndex] = rating;
        const next: ProgressMap = {
          ...prev,
          [sentenceId]: {
            ...current,
            selfCheck: updatedChecks,
          },
        };
        saveProgress(next);
        return next;
      });
    },
    []
  );

  const handleSelectSentence = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      navigateTo('practice');
    },
    [navigateTo]
  );

  const handleTestSegment = useCallback((start: number, end: number) => {
    playerRef.current?.playSegment({
      start,
      end,
      ignoreLoopOnce: true,
    });
  }, []);

  const handleGetCurrentVideoTime = useCallback(() => {
    return playerRef.current?.getCurrentTime() ?? MOVIE_CONFIG.rangeStart;
  }, []);

  const doneCount = sentences.filter(
    (s) => getSentenceProgress(progress, s.id).status === 'done'
  ).length;

  const activeSentence = sentences[currentIndex];
  const activeProgress = activeSentence
    ? getSentenceProgress(progress, activeSentence.id)
    : undefined;

  return (
    <div className="min-h-screen bg-stone-100 flex justify-center">
      <main className="w-full max-w-[480px] min-h-screen bg-white border-x border-stone-200 flex flex-col">
        {showVideoShell && (
          <div className="w-full">
            <YouTubePlayer
              ref={playerRef}
              loop={screen === 'practice' ? loop : false}
              playbackSpeed={playbackSpeed}
              onPlayingChange={setIsPlayingVideo}
              onWaitingLoopChange={setWaitingLoop}
            />
          </div>
        )}

        <div className="flex-1">
          {screen === 'start' && (
            <StartScreen
              sentenceCount={sentences.length}
              doneCount={doneCount}
              onStartPractice={() => navigateTo('list')}
              onOpenEdit={() => {
                setPreviousScreenBeforeEdit('start');
                navigateTo('edit');
              }}
            />
          )}

          {screen === 'list' && (
            <SentenceListScreen
              sentences={sentences}
              progress={progress}
              onSelectSentence={handleSelectSentence}
              onBackStart={() => navigateTo('start')}
              onOpenEdit={() => {
                setPreviousScreenBeforeEdit('list');
                navigateTo('edit');
              }}
              onFinish={() => navigateTo('finish')}
            />
          )}

          {screen === 'practice' &&
            (activeSentence && activeProgress ? (
              <PracticeScreen
                sentences={sentences}
                currentIndex={currentIndex}
                sentenceProgress={activeProgress}
                recording={recordings[activeSentence.id]}
                isPlayingVideo={isPlayingVideo}
                waitingLoop={waitingLoop}
                loop={loop}
                playbackSpeed={playbackSpeed}
                onChangeIndex={setCurrentIndex}
                onBackToList={() => {
                  playerRef.current?.pause();
                  navigateTo('list');
                }}
                onFinish={() => {
                  playerRef.current?.pause();
                  navigateTo('finish');
                }}
                onPlaySentence={handlePlayCurrentSentence}
                onPauseVideo={handlePauseVideo}
                onToggleLoop={handleToggleLoop}
                onChangeSpeed={handleChangeSpeed}
                onRecordPlayCount={handleRecordPlayCount}
                onSaveRecording={handleSaveRecording}
                onSaveSelfCheck={handleSaveSelfCheck}
              />
            ) : (
              <SentenceListScreen
                sentences={sentences}
                progress={progress}
                onSelectSentence={handleSelectSentence}
                onBackStart={() => navigateTo('start')}
                onOpenEdit={() => {
                  setPreviousScreenBeforeEdit('list');
                  navigateTo('edit');
                }}
                onFinish={() => navigateTo('finish')}
              />
            ))}

          {screen === 'edit' && (
            <EditSentencesScreen
              sentences={sentences}
              onSaveSentences={handleSaveSentences}
              onGetCurrentVideoTime={handleGetCurrentVideoTime}
              onTestSegment={handleTestSegment}
              onBack={() => {
                playerRef.current?.pause();
                navigateTo(previousScreenBeforeEdit);
              }}
            />
          )}

          {screen === 'finish' && (
            <FinishScreen
              sentences={sentences}
              progress={progress}
              onPracticeSentence={(index) => {
                setCurrentIndex(index);
                navigateTo('practice');
              }}
              onBackToList={() => navigateTo('list')}
              onBackToStart={() => navigateTo('start')}
            />
          )}
        </div>
      </main>
    </div>
  );
}
