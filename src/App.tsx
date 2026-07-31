import { useCallback, useState } from 'react';
import { CONFIG, START, STUFEN } from './game/config';
import { kennzahlen, platzKosten, prestigePunkte } from './game/economy';
import { dauer, eur } from './game/format';
import { useGameLoop } from './game/useGameLoop';
import type { Config, State } from './game/types';
import { Ausbau } from './components/Ausbau';
import { Leitsystem } from './components/Leitsystem';
import { Preis } from './components/Preis';
import { Stellplaetze } from './components/Stellplaetze';
import { Stoerungsmeldung } from './components/Stoerungsmeldung';
import { Tuning } from './components/Tuning';
import { Panel } from './components/ui/Panel';

export function App() {
  const [s, setS] = useState<State>(START);
  const [cfg, setCfg] = useState<Config>(CONFIG);

  useGameLoop(setS, cfg);

  const k = kennzahlen(s, cfg);

  const patch = useCallback(
    (p: Partial<State>) => setS((prev) => ({ ...prev, ...p })),
    [],
  );

  /** Kauft schrittweise, damit jeder Platz seinen eigenen Preis hat. */
  const kaufPlatz = useCallback(
    (anzahl: number) =>
      setS((prev) => {
        let cur = prev;
        for (let i = 0; i < anzahl; i++) {
          const kosten = platzKosten(cur, cfg);
          if (cur.geld < kosten || cur.plaetze >= STUFEN[cur.stufe].max) break;
          cur = { ...cur, geld: cur.geld - kosten, plaetze: cur.plaetze + 1 };
        }
        return cur;
      }),
    [cfg],
  );

  /** Beton wird zurückgesetzt, Wissen nicht: Automatisierung bleibt. */
  const verkaufen = useCallback(
    () =>
      setS((prev) => {
        const pp = prestigePunkte(prev.gesamtumsatz);
        return {
          ...START,
          stadt: prev.stadt + 1,
          pp: prev.pp + pp,
          autoLevel: prev.autoLevel,
          geld: START.geld + pp * 40,
        };
      }),
    [],
  );

  const kennzahlKacheln: [string, string, string][] = [
    ['Kasse', `${eur(s.geld)} €`, ''],
    [
      'Netto',
      `${k.netto >= 0 ? '+' : ''}${eur(k.netto)} €/s`,
      k.netto >= 0 ? 'gut' : 'schlecht',
    ],
    ['Ruf', `${(s.ruf * 5).toFixed(1)} ★`, s.ruf > 0.6 ? 'gut' : 'schlecht'],
    ['Laufzeit', dauer(s.laufzeit), 'still'],
  ];

  return (
    <div className="ps-app">
      <div className="ps-buehne">
        <Leitsystem s={s} k={k} cfg={cfg} />

        <div className="ps-kennzahlen">
          {kennzahlKacheln.map(([label, wert, ton]) => (
            <Panel key={label} variante="kompakt" className="ps-kennzahlen__kachel">
              <div className="ps-eyebrow">{label}</div>
              <div
                className={`ps-kennzahlen__wert${ton ? ` ps-kennzahlen__wert--${ton}` : ''}`}
              >
                {wert}
              </div>
            </Panel>
          ))}
        </div>

        <Stoerungsmeldung
          k={k}
          geld={s.geld}
          onReparieren={(kosten) =>
            patch({ geld: s.geld - kosten, stoerung: null, seitStoerung: 0 })
          }
        />

        <Stellplaetze s={s} k={k} />

        <Preis s={s} k={k} cfg={cfg} onPreis={(preis) => patch({ preis })} />

        <Ausbau
          s={s}
          k={k}
          cfg={cfg}
          onKaufPlatz={kaufPlatz}
          onPatch={patch}
          onVerkauf={verkaufen}
        />

        <Tuning cfg={cfg} onChange={setCfg} onReset={() => setS(START)} />

        <div className="ps-fuss">
          Gesamtumsatz {eur(s.gesamtumsatz)} € · {s.pp} Prestige-Punkte (+
          {s.pp * 2} %)
        </div>
      </div>
    </div>
  );
}
