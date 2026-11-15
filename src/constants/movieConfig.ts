import type { Sentence, StepId } from '../types';

export const MOVIE_CONFIG = {
  appName: 'Scene Shadow: Stuart Little',
  appSubtitle: 'Listen. Copy. Speak at the same time.',
  movieTitleEn: 'Stuart Little',
  movieTitleKo: '스튜어트 리틀',
  releaseYear: 1999,
  director: 'Rob Minkoff',
  screenplay: 'M. Night Shyamalan, Greg Brooker',
  productionCompany: 'Columbia Pictures',
  distributionCompany: 'Sony Pictures Releasing',
  sceneDescription: "Stuart's first Day with the George family",
  youtubeVideoTitle: 'Stuart Little (1999) - Meeting the Family Scene (1/10) | Movieclips',
  youtubeChannelName: 'Movieclips',
  youtubeUrl: 'https://www.youtube.com/watch?v=-MNpOKICOx8',
  videoId: '-MNpOKICOx8',
  rangeStart: 90,
  rangeEnd: 155,
  madeBy: '안휘정',
} as const;

export const EDUCATIONAL_NOTICE = {
  headingEn: 'Educational use only',
  headingKo: '교육 목적 전용',
  bodyEn:
    'This app was made only for non-commercial English learning in the university course AI and English Language Education (ENG3088, Sungkyunkwan University). The film clip is used only to practice listening and speaking (shadowing). It is not sold, shared for profit, downloaded, or edited. All rights to the film belong to its copyright holders.',
  bodyKo:
    '이 앱은 성균관대학교 「인공지능과 영어교육」(ENG3088) 수업의 비영리 영어 학습 목적으로만 제작되었습니다. 영화 장면은 듣기·말하기(쉐도잉) 연습에만 사용하며, 판매·영리적 배포·다운로드·편집을 하지 않습니다. 영화의 모든 권리는 저작권자에게 있습니다.',
} as const;

export const DEFAULT_SENTENCES: Sentence[] = [
  {
    id: 1,
    speaker: 'Mom',
    text: 'Shall we get to know each other a little?',
    korean: '우리 서로 조금 알아가 볼까?',
    stress: ['know', 'little'],
    start: 100.4,
    end: 102.9,
  },
  {
    id: 2,
    speaker: 'Mom',
    text: "George, don't you have anything you want to ask Stuart?",
    korean: '조지, 스튜어트에게 물어보고 싶은 거 없니?',
    stress: ['ask', 'Stuart'],
    start: 103.2,
    end: 106.2,
  },
  {
    id: 3,
    speaker: 'Stuart',
    text: 'Sure, George. Go Ahead.',
    korean: '그래, 조지. 어서 물어봐.',
    stress: ['sure', 'ahead'],
    start: 106.5,
    end: 107.8,
  },
  {
    id: 4,
    speaker: 'Stuart',
    text: "I'm an open book.",
    korean: '난 뭐든 솔직하게 이야기해 줄 수 있어.',
    stress: ['open', 'book'],
    start: 108.0,
    end: 109.0,
  },
  {
    id: 5,
    speaker: 'Stuart',
    text: 'Ask me anything. The first thing that pops in your head.',
    korean: '뭐든 물어봐. 가장 먼저 떠오르는 질문 말이야.',
    stress: ['ask', 'anything', 'first', 'pops'],
    start: 109.4,
    end: 112.2,
  },
  {
    id: 6,
    speaker: 'George',
    text: 'Could you pass the gravy?',
    korean: '그레이비소스 좀 건네줄 수 있니?',
    stress: ['pass', 'gravy'],
    start: 113.2,
    end: 114.6,
  },
  {
    id: 7,
    speaker: 'Mom',
    text: 'Your new bedroom, Stuart.',
    korean: '스튜어트, 네 새 침실이야.',
    stress: ['new', 'bedroom'],
    start: 119.6,
    end: 121.0,
  },
  {
    id: 8,
    speaker: 'Dad',
    text: 'We hope you like it.',
    korean: '네 마음에 들었으면 좋겠구나.',
    stress: ['hope', 'like'],
    start: 121.3,
    end: 122.2,
  },
  {
    id: 9,
    speaker: 'Stuart',
    text: 'Sure, it is roomy.',
    korean: '물론이죠. 공간이 넓네요.',
    stress: ['sure', 'roomy'],
    start: 123.4,
    end: 124.6,
  },
];

export interface StepGuideItem {
  id: StepId;
  shortTitle: string;
  labelEn: string;
  labelKo: string;
  instructionEn: string;
  instructionKo: string;
  hideTextByDefault: boolean;
}

export const SHADOWING_STEPS: StepGuideItem[] = [
  {
    id: 1,
    shortTitle: 'Step 1',
    labelEn: 'Listen',
    labelKo: '듣기',
    instructionEn: 'Keep the text hidden and listen 2–3 times to feel the rhythm.',
    instructionKo: '문장을 숨기고 리듬과 억양을 느끼며 2~3번 편하게 들어보세요.',
    hideTextByDefault: true,
  },
  {
    id: 2,
    shortTitle: 'Step 2',
    labelEn: 'Mumble',
    labelKo: '따라 웅얼거리기',
    instructionEn: 'Keep text hidden and quietly follow the sounds like humming.',
    instructionKo: '문장을 보지 않고 소리의 흐름을 따라 작게 중얼거려 보세요.',
    hideTextByDefault: true,
  },
  {
    id: 3,
    shortTitle: 'Step 3',
    labelEn: 'Read & Shadow',
    labelKo: '보고 따라 말하기',
    instructionEn: 'Watch the bold stress words and speak together with the actor.',
    instructionKo: '굵은 강세 단어를 보며 배우의 속도에 맞춰 함께 말해보세요.',
    hideTextByDefault: false,
  },
  {
    id: 4,
    shortTitle: 'Step 4',
    labelEn: 'Shadow',
    labelKo: '실전 쉐도잉',
    instructionEn: 'Hide the text, speak at full voice, and tap Record to check!',
    instructionKo: '문장을 숨기고 자신 있게 말한 뒤, 녹음해서 확인해 보세요!',
    hideTextByDefault: true,
  },
];

export const SELF_CHECK_QUESTIONS = [
  {
    id: 0,
    en: 'Did I keep up with the speed?',
    ko: '속도를 잘 따라갔나요?',
  },
  {
    id: 1,
    en: 'Did I stress the bold words?',
    ko: '굵게 표시된 단어에 강세를 주었나요?',
  },
  {
    id: 2,
    en: 'Did my voice go up and down like the actor?',
    ko: '배우처럼 목소리 높낮이(억양)가 오르내렸나요?',
  },
] as const;

export function formatTimeMSS(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
