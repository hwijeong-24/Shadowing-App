import { MOVIE_CONFIG } from '../constants/movieConfig';

interface CreditLineProps {
  className?: string;
}

export function CreditLine({ className = '' }: CreditLineProps) {
  return (
    <p className={`text-[13px] leading-snug text-stone-500 ${className}`}>
      Clip: <em className="italic">{MOVIE_CONFIG.movieTitleEn}</em> ({MOVIE_CONFIG.releaseYear}),{' '}
      {MOVIE_CONFIG.distributionCompany} / {MOVIE_CONFIG.productionCompany} · via YouTube · For
      educational use only
    </p>
  );
}
