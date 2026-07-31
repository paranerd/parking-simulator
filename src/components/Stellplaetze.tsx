import type { Kennzahlen, State } from '../game/types';

const MAX_SICHTBAR = 144;

/** Draufsicht mit Fahrbahnmarkierung. Ab 144 Plätzen übernimmt das Leitsystem. */
export function Stellplaetze({ s, k }: { s: State; k: Kennzahlen }) {
  if (s.plaetze > MAX_SICHTBAR) return null;
  const belegt = Math.round(k.belegt);

  return (
    <div className="ps-stellplaetze" aria-hidden="true">
      {Array.from({ length: s.plaetze }, (_, i) => (
        <div className="ps-stellplaetze__bucht" key={i}>
          <div
            className={`ps-stellplaetze__auto${i < belegt ? ' ps-stellplaetze__auto--belegt' : ''}`}
          />
        </div>
      ))}
    </div>
  );
}
