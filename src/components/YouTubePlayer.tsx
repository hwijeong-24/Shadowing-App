import { ExternalLink } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { MOVIE_CONFIG } from '../constants/movieConfig';
import type { PlaybackSpeed, YTPlayerInstance } from '../types';
import { CreditLine } from './CreditLine';

export interface PlaySegmentOptions {
  start: number;
  end: number;
  ignoreLoopOnce?: boolean;
  onSegmentEnd?: () => void;
}

export interface YouTubePlayerHandle {
  playSegment: (options: PlaySegmentOptions) => void;
  pause: () => void;
  setRate: (rate: PlaybackSpeed) => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
}

interface YouTubePlayerProps {
  loop: boolean;
  playbackSpeed: PlaybackSpeed;
  onPlayingChange?: (playing: boolean) => void;
  onWaitingLoopChange?: (waiting: boolean) => void;
  onEmbedError?: (failed: boolean) => void;
}

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeIframeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise<void>((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousReady) previousReady();
      resolve();
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }
  });

  return apiLoadPromise;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  function YouTubePlayer(
    { loop, playbackSpeed, onPlayingChange, onWaitingLoopChange, onEmbedError },
    ref
  ) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<YTPlayerInstance | null>(null);
    const isReadyRef = useRef(false);

    const [embedFailed, setEmbedFailed] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);

    const loopRef = useRef(loop);
    loopRef.current = loop;

    const speedRef = useRef(playbackSpeed);
    speedRef.current = playbackSpeed;

    const onPlayingChangeRef = useRef(onPlayingChange);
    onPlayingChangeRef.current = onPlayingChange;

    const onWaitingLoopChangeRef = useRef(onWaitingLoopChange);
    onWaitingLoopChangeRef.current = onWaitingLoopChange;

    const onEmbedErrorRef = useRef(onEmbedError);
    onEmbedErrorRef.current = onEmbedError;

    const pollIntervalRef = useRef<number | null>(null);
    const loopTimeoutRef = useRef<number | null>(null);
    const fallbackTimeoutRef = useRef<number | null>(null);
    const activePlaybackIdRef = useRef(0);

    const clearTimers = useCallback(() => {
      if (pollIntervalRef.current !== null) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (loopTimeoutRef.current !== null) {
        window.clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
      if (fallbackTimeoutRef.current !== null) {
        window.clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
      onWaitingLoopChangeRef.current?.(false);
    }, []);

    useEffect(() => {
      if (!loop && loopTimeoutRef.current !== null) {
        window.clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
        onWaitingLoopChangeRef.current?.(false);
      }
    }, [loop]);

    useEffect(() => {
      let cancelled = false;

      loadYouTubeIframeAPI().then(() => {
        if (cancelled || !mountRef.current || !window.YT?.Player) return;

        // Create inner div that YT.Player will replace with the iframe
        const playerDiv = document.createElement('div');
        playerDiv.className = 'w-full h-full';
        mountRef.current.innerHTML = '';
        mountRef.current.appendChild(playerDiv);

        const playerVars: Record<string, string | number> = {
          start: MOVIE_CONFIG.rangeStart,
          end: MOVIE_CONFIG.rangeEnd,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          controls: 1,
          cc_load_policy: 0,
        };
        if (typeof window !== 'undefined' && window.location.origin.startsWith('http')) {
          playerVars.origin = window.location.origin;
        }

        const instance = new window.YT.Player(playerDiv, {
          videoId: MOVIE_CONFIG.videoId,
          width: '100%',
          height: '100%',
          playerVars,
          events: {
            onReady: (event) => {
              if (cancelled) return;
              isReadyRef.current = true;
              setPlayerReady(true);
              try {
                event.target.setPlaybackRate(speedRef.current);
              } catch {
                // Ignore if rate isn't immediately accepted
              }
            },
            onStateChange: (event) => {
              if (cancelled) return;
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (event.data === 1) {
                onPlayingChangeRef.current?.(true);
              } else if (event.data === 2 || event.data === 0) {
                onPlayingChangeRef.current?.(false);
              }
            },
            onError: (event) => {
              if (cancelled) return;
              // 101, 150 (and 153) indicate embedding is restricted
              if (event.data === 101 || event.data === 150 || event.data === 153) {
                clearTimers();
                setEmbedFailed(true);
                onPlayingChangeRef.current?.(false);
                onEmbedErrorRef.current?.(true);
              }
            },
          },
        });

        playerRef.current = instance;
      });

      return () => {
        cancelled = true;
        clearTimers();
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {
            // Ignore cleanup errors
          }
          playerRef.current = null;
        }
        isReadyRef.current = false;
      };
    }, [clearTimers]);

    const playSegment = useCallback(
      (options: PlaySegmentOptions) => {
        const { start, end, ignoreLoopOnce = false, onSegmentEnd } = options;
        clearTimers();
        const playbackId = ++activePlaybackIdRef.current;

        const scheduleLoopIfNeeded = () => {
          if (ignoreLoopOnce || !loopRef.current) return;
          onWaitingLoopChangeRef.current?.(true);
          loopTimeoutRef.current = window.setTimeout(() => {
            if (activePlaybackIdRef.current !== playbackId) return;
            onWaitingLoopChangeRef.current?.(false);
            if (!ignoreLoopOnce && loopRef.current) {
              playSegment(options);
            }
          }, 1500);
        };

        if (embedFailed || !playerRef.current || !isReadyRef.current) {
          // Graceful fallback timing so recording & self-check still work seamlessly
          const durationMs = Math.max(400, ((end - start) / speedRef.current) * 1000);
          onPlayingChangeRef.current?.(true);
          fallbackTimeoutRef.current = window.setTimeout(() => {
            if (activePlaybackIdRef.current !== playbackId) return;
            onPlayingChangeRef.current?.(false);
            onSegmentEnd?.();
            scheduleLoopIfNeeded();
          }, durationMs);
          return;
        }

        const player = playerRef.current;
        try {
          player.setPlaybackRate(speedRef.current);
          player.seekTo(start, true);
          player.playVideo();
        } catch {
          // Fallback if YouTube call fails transiently
        }
        onPlayingChangeRef.current?.(true);

        const startedAt = Date.now();
        let seekSettled = false;

        pollIntervalRef.current = window.setInterval(() => {
          if (activePlaybackIdRef.current !== playbackId) {
            if (pollIntervalRef.current !== null) {
              window.clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            return;
          }

          let current = start;
          let state = -1;
          try {
            current = player.getCurrentTime();
            state = player.getPlayerState();
          } catch {
            return;
          }

          if (!seekSettled) {
            if (current <= end - 0.08 || Date.now() - startedAt > 450) {
              seekSettled = true;
            } else {
              return;
            }
          }

          // If user paused manually (state === 2) and hasn't reached end, stop polling
          if (state === 2 && current < end - 0.1 && Date.now() - startedAt > 600) {
            clearTimers();
            onPlayingChangeRef.current?.(false);
            return;
          }

          if (current >= end || state === 0) {
            if (pollIntervalRef.current !== null) {
              window.clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            try {
              player.pauseVideo();
            } catch {
              // Ignore
            }
            onPlayingChangeRef.current?.(false);
            onSegmentEnd?.();
            scheduleLoopIfNeeded();
          }
        }, 100);
      },
      [clearTimers, embedFailed]
    );

    const pause = useCallback(() => {
      activePlaybackIdRef.current += 1;
      clearTimers();
      onPlayingChangeRef.current?.(false);
      if (playerRef.current && isReadyRef.current) {
        try {
          playerRef.current.pauseVideo();
        } catch {
          // Ignore
        }
      }
    }, [clearTimers]);

    const setRate = useCallback((rate: PlaybackSpeed) => {
      speedRef.current = rate;
      if (playerRef.current && isReadyRef.current) {
        try {
          playerRef.current.setPlaybackRate(rate);
        } catch {
          // Ignore
        }
      }
    }, []);

    const getCurrentTime = useCallback((): number => {
      if (playerRef.current && isReadyRef.current) {
        try {
          return playerRef.current.getCurrentTime();
        } catch {
          return MOVIE_CONFIG.rangeStart;
        }
      }
      return MOVIE_CONFIG.rangeStart;
    }, []);

    const seekTo = useCallback((seconds: number) => {
      if (playerRef.current && isReadyRef.current) {
        try {
          playerRef.current.seekTo(seconds, true);
        } catch {
          // Ignore
        }
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        playSegment,
        pause,
        setRate,
        getCurrentTime,
        seekTo,
      }),
      [playSegment, pause, setRate, getCurrentTime, seekTo]
    );

    const fallbackWatchUrl = `${MOVIE_CONFIG.youtubeUrl}&t=${MOVIE_CONFIG.rangeStart}s`;

    return (
      <div className="w-full">
        <div className="relative w-full aspect-video bg-stone-900 overflow-hidden">
          {!embedFailed ? (
            <>
              <div ref={mountRef} className="w-full h-full" />
              {!playerReady && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-stone-900 text-stone-300 text-sm">
                  Loading clip... / 영상 불러오는 중...
                </div>
              )}
            </>
          ) : (
            <a
              href={fallbackWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full w-full flex-col items-center justify-center gap-3 bg-stone-900 px-6 text-center text-white transition-colors hover:bg-stone-800"
            >
              <ExternalLink className="h-8 w-8 text-red-400" aria-hidden="true" />
              <span className="text-base font-medium leading-snug">
                This video can&apos;t play inside the app. Tap to open it on YouTube.
              </span>
              <span className="text-xs text-stone-300">
                유튜브에서 열기 (새 탭)
              </span>
            </a>
          )}
        </div>
        <div className="bg-white px-4 py-2 border-b border-stone-200">
          <CreditLine />
        </div>
      </div>
    );
  }
);
