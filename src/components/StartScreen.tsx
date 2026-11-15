import { ArrowRight, ExternalLink, PencilLine } from 'lucide-react';
import { EDUCATIONAL_NOTICE, formatTimeMSS, MOVIE_CONFIG } from '../constants/movieConfig';

interface StartScreenProps {
  sentenceCount: number;
  doneCount: number;
  onStartPractice: () => void;
  onOpenEdit: () => void;
}

export function StartScreen({
  sentenceCount,
  doneCount,
  onStartPractice,
  onOpenEdit,
}: StartScreenProps) {
  const sourceRows: Array<{ label: string; value: string; href?: string }> = [
    {
      label: 'Movie / 영화',
      value: `${MOVIE_CONFIG.movieTitleEn} (${MOVIE_CONFIG.movieTitleKo})`,
    },
    { label: 'Year / 개봉', value: String(MOVIE_CONFIG.releaseYear) },
    { label: 'Director / 감독', value: MOVIE_CONFIG.director },
    { label: 'Screenplay / 각본', value: MOVIE_CONFIG.screenplay },
    { label: 'Production / 제작', value: MOVIE_CONFIG.productionCompany },
    { label: 'Distribution / 배급', value: MOVIE_CONFIG.distributionCompany },
    { label: 'Scene / 장면', value: MOVIE_CONFIG.sceneDescription },
    { label: 'YouTube Title', value: MOVIE_CONFIG.youtubeVideoTitle },
    { label: 'Channel / 채널', value: MOVIE_CONFIG.youtubeChannelName },
    {
      label: 'YouTube URL',
      value: MOVIE_CONFIG.youtubeUrl,
      href: MOVIE_CONFIG.youtubeUrl,
    },
    {
      label: 'Practice Range / 구간',
      value: `${formatTimeMSS(MOVIE_CONFIG.rangeStart)} – ${formatTimeMSS(MOVIE_CONFIG.rangeEnd)}`,
    },
    { label: 'Made by / 제작자', value: MOVIE_CONFIG.madeBy },
  ].filter((row) => row.value.trim().toLowerCase() !== 'unknown');

  return (
    <div className="flex flex-col gap-6 px-5 py-7">
      {/* Header / Hero */}
      <header className="space-y-2.5">
        <p className="text-sm font-medium text-red-700">
          Movie-Clip Shadowing · ENG3088
        </p>
        <h1 className="text-[28px] font-bold tracking-tight text-stone-900 leading-tight [text-wrap:balance]">
          {MOVIE_CONFIG.appName}
        </h1>
        <p className="text-[18px] text-stone-600 leading-relaxed">
          {MOVIE_CONFIG.appSubtitle}
        </p>
        {doneCount > 0 && (
          <p className="text-sm text-stone-500 tabular-nums">
            Progress saved · {doneCount} of {sentenceCount} sentences done
          </p>
        )}
      </header>

      {/* Primary Action */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onStartPractice}
          className="flex min-h-[58px] w-full items-center justify-between rounded-xl bg-red-700 px-5 py-3 text-white transition-colors hover:bg-red-800 active:bg-red-900 cursor-pointer"
        >
          <span className="flex flex-col items-start text-left leading-tight">
            <span className="text-[19px] font-semibold">Start Practice</span>
            <span className="text-xs font-normal text-red-100 mt-0.5">연습 시작</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onOpenEdit}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900 cursor-pointer"
        >
          <PencilLine className="h-4 w-4 text-red-700 shrink-0" aria-hidden="true" />
          <span className="flex flex-col items-center leading-tight">
            <span className="text-[16px] font-medium">Edit Sentences</span>
            <span className="text-[11px] text-stone-500">문장 편집</span>
          </span>
        </button>
      </div>

      {/* What is shadowing? */}
      <section className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-[19px] font-semibold text-stone-900">What is shadowing?</h2>
          <p className="text-xs text-stone-500">쉐도잉이란 무엇인가요?</p>
        </div>
        <ol className="space-y-3.5 text-[18px] text-stone-800">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-sm font-semibold text-red-700 tabular-nums shrink-0">
              01.
            </span>
            <div className="space-y-0.5">
              <p className="text-[17px] font-medium text-stone-900 leading-snug">
                Listen carefully to one short line at a time.
              </p>
              <p className="text-sm text-stone-500 leading-snug">
                짧은 영화 대사를 한 문장씩 집중해서 들어요.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-sm font-semibold text-red-700 tabular-nums shrink-0">
              02.
            </span>
            <div className="space-y-0.5">
              <p className="text-[17px] font-medium text-stone-900 leading-snug">
                Repeat right along with the actor, copying rhythm and stress.
              </p>
              <p className="text-sm text-stone-500 leading-snug">
                배우와 거의 동시에 리듬과 강세를 따라 말해요.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-sm font-semibold text-red-700 tabular-nums shrink-0">
              03.
            </span>
            <div className="space-y-0.5">
              <p className="text-[17px] font-medium text-stone-900 leading-snug">
                Record and check comfortably—no grades, just practice.
              </p>
              <p className="text-sm text-stone-500 leading-snug">
                성적 부담 없이 내 목소리를 녹음하고 편하게 점검해요.
              </p>
            </div>
          </li>
        </ol>
      </section>

      {/* Educational Use & Source */}
      <section className="rounded-xl border border-stone-200 bg-stone-50 p-5 space-y-4">
        <div className="space-y-0.5 border-b border-stone-200 pb-3">
          <h2 className="text-base font-semibold text-stone-900">
            Educational Use &amp; Source / 교육용 고지 및 출처
          </h2>
          <p className="text-xs font-medium text-red-700">
            {EDUCATIONAL_NOTICE.headingEn} / {EDUCATIONAL_NOTICE.headingKo}
          </p>
        </div>

        <div className="space-y-2.5 text-[14px] leading-relaxed text-stone-700">
          <p>{EDUCATIONAL_NOTICE.bodyEn}</p>
          <p className="text-stone-600">{EDUCATIONAL_NOTICE.bodyKo}</p>
        </div>

        <dl className="space-y-2 border-t border-stone-200 pt-3 text-[13px]">
          {sourceRows.map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
              <dt className="font-medium text-stone-500 sm:w-36 shrink-0">{row.label}</dt>
              <dd className="text-stone-800 break-words">
                {row.href ? (
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-red-700 underline underline-offset-2 hover:text-red-800 break-all"
                  >
                    <span>{row.value}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
