import { useMemo } from 'react';
import { AUTOMATISIERUNG } from '../game/config';
import { kennzahlen, optimalerPreis } from '../game/economy';
import { eur, prozent, zahl } from '../game/format';
import type { Config, Kennzahlen, State } from '../game/types';
import { Panel } from './ui/Panel';
import { Knopf } from './ui/Knopf';

const W = 300;
const H = 110;

function Kurve({ s, cfg }: { s: State; cfg: Config }) {
  const daten = useMemo(() => {
    const pMax = Math.max(kennzahlen(s, cfg).median * 2.6, s.preis * 1.3);
    const punkte = Array.from({ length: 91 }, (_, i) => {
      const p = (pMax * i) / 90;
      return { p, n: kennzahlen(s, cfg, p).netto };
    });
    const werte = punkte.map((q) => q.n);
    return {
      punkte,
      pMax,
      maxN: Math.max(...werte, 0.1),
      minN: Math.min(...werte, 0),
      opt: punkte.reduce((a, b) => (b.n > a.n ? b : a)),
    };
  }, [s, cfg]);

  const { punkte, pMax, maxN, minN, opt } = daten;
  const x = (p: number) => (p / pMax) * W;
  const y = (n: number) => H - ((n - minN) / (maxN - minN || 1)) * H;
  const pfad = punkte
    .map((q, i) => `${i ? 'L' : 'M'}${x(q.p).toFixed(1)},${y(q.n).toFixed(1)}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', display: 'block' }}
      role="img"
      aria-label="Gewinn in Abhängigkeit vom Preis"
    >
      {minN < 0 && (
        <line
          x1="0"
          x2={W}
          y1={y(0)}
          y2={y(0)}
          stroke="#e0483a"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.5"
        />
      )}
      <path d={pfad} fill="none" stroke="#f2c230" strokeWidth="2" />
      <line
        x1={x(opt.p)}
        x2={x(opt.p)}
        y1="0"
        y2={H}
        stroke="#46c46a"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <line
        x1={x(s.preis)}
        x2={x(s.preis)}
        y1="0"
        y2={H}
        stroke="#dcd6c4"
        strokeWidth="1.5"
      />
      <circle
        cx={x(s.preis)}
        cy={y(kennzahlen(s, cfg).netto)}
        r="3.5"
        fill="#dcd6c4"
      />
    </svg>
  );
}

interface Props {
  s: State;
  k: Kennzahlen;
  cfg: Config;
  onPreis: (p: number) => void;
}

export function Preis({ s, k, cfg, onPreis }: Props) {
  const zahlquote = AUTOMATISIERUNG[s.autoLevel].zahlquote;

  return (
    <Panel>
      <div className="ps-preis__kopf">
        <span className="ps-eyebrow">Parkgebühr</span>
        <span className="ps-preis__wert">{s.preis.toFixed(2)} €/h</span>
      </div>

      <input
        type="range"
        min={0.1}
        max={Math.max(k.median * 2.6, 4)}
        step={0.05}
        value={s.preis}
        aria-label="Parkgebühr je Stunde"
        onChange={(e) => onPreis(parseFloat(e.target.value))}
      />

      <Kurve s={s} cfg={cfg} />

      {/* Welche Seite limitiert gerade — Kapazität oder Einzugsgebiet? */}
      <div className="ps-engpass" style={{ marginTop: 8 }}>
        <div
          className={`ps-engpass__seite${k.engpass === 'nachfrage' ? ' ps-engpass__seite--aktiv' : ''}`}
        >
          <span className="ps-engpass__zahl">{zahl(k.leerstand)}</span>
          Plätze leer
        </div>
        <div
          className={`ps-engpass__seite${k.engpass === 'kapazitaet' ? ' ps-engpass__seite--aktiv' : ''}`}
        >
          <span className="ps-engpass__zahl">{zahl(k.abgewiesen)}</span>
          abgewiesen
        </div>
      </div>

      <div className="ps-preis__fuss">
        <div className="ps-preis__daten">
          <div>
            Zahlungsbereitschaft {k.median.toFixed(2)} € · Annahme{' '}
            {prozent(k.akzeptanz)} · zahlend {prozent(zahlquote)}
          </div>
          <div>
            Umsatz {eur(k.umsatz)} · Fix {eur(k.fix)} (
            {prozent(k.fix / Math.max(k.umsatz, 0.01))}) · {k.personal.toFixed(1)} MA
          </div>
          <div>
            Nachfrage {zahl(k.nachfrage)} · Kapazität {zahl(k.kapazitaet)}
          </div>
        </div>
        <Knopf variante="geist" onClick={() => onPreis(optimalerPreis(s, cfg))}>
          OPTIMUM
        </Knopf>
      </div>
    </Panel>
  );
}
