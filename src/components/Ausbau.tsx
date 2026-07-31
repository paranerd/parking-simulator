import { AUTOMATISIERUNG, REICHWEITE, STAEDTE, STUFEN } from '../game/config';
import {
  autoKosten,
  platzKosten,
  prestigePunkte,
  qualiKosten,
  reichweiteKosten,
  sprungKosten,
} from '../game/economy';
import { eur, prozent } from '../game/format';
import type { Config, Kennzahlen, State } from '../game/types';
import { Panel } from './ui/Panel';
import { Knopf } from './ui/Knopf';

interface Props {
  s: State;
  k: Kennzahlen;
  cfg: Config;
  onKaufPlatz: (anzahl: number) => void;
  onPatch: (patch: Partial<State>) => void;
  onVerkauf: () => void;
}

export function Ausbau({ s, k, cfg, onKaufPlatz, onPatch, onVerkauf }: Props) {
  const stufe = STUFEN[s.stufe];
  const kPlatz = platzKosten(s, cfg);
  const kQuali = qualiKosten(s, cfg);
  const kAuto = autoKosten(s, cfg);
  const kEz = reichweiteKosten(s, cfg);
  const kSprung = sprungKosten(s, cfg);

  const voll = s.plaetze >= stufe.max;
  const naechsteAuto = AUTOMATISIERUNG[s.autoLevel + 1];
  const naechsteEz = REICHWEITE[s.ezLevel + 1];
  const letzteStufe = s.stufe === STUFEN.length - 1;
  const naechsteStadt = STAEDTE[s.stadt + 1];

  return (
    <Panel className="ps-ausbau">
      <span className="ps-eyebrow">
        Ausbau · {s.plaetze} / {stufe.max} Plätze ·{' '}
        {REICHWEITE[s.ezLevel].name}
      </span>

      <div className="ps-ausbau__zeile">
        <Knopf
          onClick={() => onKaufPlatz(1)}
          disabled={s.geld < kPlatz || voll}
          preis={`${eur(kPlatz)} €`}
        >
          Stellplatz bauen
        </Knopf>
        <div className="ps-ausbau__zehn">
          <Knopf onClick={() => onKaufPlatz(10)} disabled={s.geld < kPlatz || voll}>
            +10
          </Knopf>
        </div>
      </div>

      {naechsteEz && (
        <Knopf
          onClick={() =>
            onPatch({ geld: s.geld - kEz, ezLevel: s.ezLevel + 1 })
          }
          disabled={s.geld < kEz}
          preis={`${eur(kEz)} €`}
        >
          Reichweite: {naechsteEz.name} (×
          {(naechsteEz.faktor / REICHWEITE[s.ezLevel].faktor).toFixed(1)} Kunden)
        </Knopf>
      )}

      <Knopf
        onClick={() =>
          onPatch({ geld: s.geld - kQuali, qualiLevel: s.qualiLevel + 1 })
        }
        disabled={s.geld < kQuali}
        preis={`${eur(kQuali)} €`}
      >
        Komfort {s.qualiLevel + 1} · Toiletten, Licht, Sauberkeit
      </Knopf>

      {naechsteAuto && (
        <Knopf
          onClick={() =>
            onPatch({ geld: s.geld - kAuto, autoLevel: s.autoLevel + 1 })
          }
          disabled={s.geld < kAuto}
          preis={`${eur(kAuto)} €`}
        >
          {naechsteAuto.name} · zahlend {prozent(naechsteAuto.zahlquote)}
        </Knopf>
      )}

      {voll && !letzteStufe && (
        <Knopf
          variante="haupt"
          onClick={() => onPatch({ geld: s.geld - kSprung, stufe: s.stufe + 1 })}
          disabled={s.geld < kSprung}
          preis={`${eur(kSprung)} €`}
        >
          ▲ Ausbau zu {STUFEN[s.stufe + 1].name}
        </Knopf>
      )}

      {voll && letzteStufe && naechsteStadt && (
        <Knopf
          variante="haupt"
          onClick={onVerkauf}
          preis={`+${prestigePunkte(s.gesamtumsatz)} PP`}
        >
          ◆ Verkaufen und in {naechsteStadt.name} neu anfangen
        </Knopf>
      )}

      {k.engpass === 'kapazitaet' && k.abgewiesen > 2 && (
        <span className="ps-eyebrow">
          Zu wenig Plätze — der Ruf sinkt, solange Kunden abgewiesen werden.
        </span>
      )}
      {k.engpass === 'nachfrage' && k.leerstand > 2 && (
        <span className="ps-eyebrow">
          Zu wenig Kunden — Reichweite ausbauen oder Preis senken.
        </span>
      )}
    </Panel>
  );
}
