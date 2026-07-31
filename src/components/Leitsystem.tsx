import { STAEDTE, STUFEN } from '../game/config';
import { prozent } from '../game/format';
import type { Config, Kennzahlen, State } from '../game/types';

interface Props {
  s: State;
  k: Kennzahlen;
  cfg: Config;
}

/** Die Anzeigetafel am Einfahrtstor — freie Plätze je Ebene. */
export function Leitsystem({ s, k, cfg }: Props) {
  const frei = Math.max(0, Math.round(s.plaetze - k.belegt));
  const voll = frei === 0;

  const ebenen: { nr: number; kap: number; frei: number }[] = [];
  let rest = k.belegt;
  for (let e = 0; e < k.ebenen; e++) {
    const kap = Math.min(cfg.proEbene, s.plaetze - e * cfg.proEbene);
    const belegt = Math.min(kap, rest);
    rest -= belegt;
    ebenen.push({ nr: e + 1, kap, frei: Math.max(0, Math.round(kap - belegt)) });
  }

  return (
    <section className="ps-leitsystem">
      <div className="ps-leitsystem__kopf">
        <div className="ps-leitsystem__schild" aria-hidden="true">
          P
        </div>
        <div className="ps-leitsystem__mitte">
          <div className="ps-eyebrow">
            {STAEDTE[s.stadt].name} · {STUFEN[s.stufe].name}
          </div>
          <div
            className={`ps-leitsystem__zaehler${voll ? ' ps-leitsystem__zaehler--voll' : ''}`}
            role="status"
          >
            {voll ? 'BESETZT' : String(frei).padStart(3, '0')}
          </div>
        </div>
        <div>
          <div className="ps-eyebrow">Auslastung</div>
          <div className="ps-leitsystem__auslastung">{prozent(k.auslastung)}</div>
        </div>
      </div>

      {k.ebenen > 1 && (
        <div className="ps-leitsystem__ebenen">
          {ebenen.slice(0, 8).map((e) => (
            <div className="ps-leitsystem__ebene" key={e.nr}>
              <span className="ps-leitsystem__ebene-name">EBENE {e.nr}</span>
              <div className="ps-leitsystem__balken">
                <div
                  className={`ps-leitsystem__fuellung${e.frei === 0 ? ' ps-leitsystem__fuellung--voll' : ''}`}
                  style={{ width: `${((e.kap - e.frei) / e.kap) * 100}%` }}
                />
              </div>
              <span
                className={`ps-leitsystem__ebene-frei${e.frei === 0 ? ' ps-leitsystem__ebene-frei--voll' : ''}`}
              >
                {e.frei === 0 ? 'VOLL' : e.frei}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
