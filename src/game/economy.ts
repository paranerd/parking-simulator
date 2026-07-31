import {
  AUTOMATISIERUNG,
  REICHWEITE,
  STAEDTE,
  STOERUNGEN,
  STUFEN,
} from './config';
import type { Config, Kennzahlen, State } from './types';

/**
 * Kernrechnung. Reine Funktion, damit Tick und Preiskurve nachweislich
 * dieselbe Formel benutzen und nie auseinanderlaufen können.
 */
export function kennzahlen(
  s: State,
  cfg: Config,
  preisOverride?: number,
): Kennzahlen {
  const stufe = STUFEN[s.stufe];
  const stadt = STAEDTE[s.stadt];
  const auto = AUTOMATISIERUNG[s.autoLevel];
  const preis = preisOverride ?? s.preis;
  const stoerung = s.stoerung
    ? (STOERUNGEN.find((e) => e.id === s.stoerung) ?? null)
    : null;

  // Zahlungsbereitschaft ist logistisch verteilt: bei preis === median
  // akzeptiert genau die Hälfte der Interessenten.
  const qual = stufe.qual + s.qualiLevel * 0.12;
  const median = cfg.wtpBasis * stadt.wtp * (1 + qual);
  const akzeptanz = 1 / (1 + Math.exp((preis - median) / cfg.streuung));

  const kapazitaet = s.plaetze * (stoerung ? stoerung.kap : 1);
  const latent =
    cfg.latent * REICHWEITE[s.ezLevel].faktor * stadt.nachfrage * s.ruf;
  const nachfrage = latent * akzeptanz;

  const belegt = Math.min(nachfrage, kapazitaet);
  const abgewiesen = Math.max(0, nachfrage - kapazitaet);
  const leerstand = Math.max(0, kapazitaet - nachfrage);

  const bonus = 1 + 0.02 * s.pp;
  const umsatz =
    belegt *
    preis *
    cfg.sek *
    bonus *
    auto.zahlquote *
    (stoerung ? stoerung.ums : 1);

  const ebenen = Math.max(1, Math.ceil(s.plaetze / cfg.proEbene));
  let wartung = 0;
  for (let k = 0; k < ebenen; k++) {
    const n = Math.min(cfg.proEbene, s.plaetze - k * cfg.proEbene);
    wartung += n * cfg.wartung * Math.pow(cfg.etagenMalus, k);
  }
  const personal = s.plaetze / auto.proMA;
  // Reichweite ist keine Einmalzahlung: Werbung und Verträge laufen weiter.
  const reichweite = REICHWEITE[s.ezLevel].laufend;
  const fix =
    (ebenen * cfg.pacht + wartung + personal * cfg.lohn + reichweite) *
    stufe.fix;

  return {
    median,
    akzeptanz,
    nachfrage,
    belegt,
    abgewiesen,
    leerstand,
    kapazitaet,
    auslastung: s.plaetze > 0 ? belegt / s.plaetze : 0,
    engpass: abgewiesen > leerstand ? 'kapazitaet' : 'nachfrage',
    umsatz,
    fix,
    netto: umsatz - fix,
    ebenen,
    personal,
    stoerung,
  };
}

const untergrenze = (stufe: number) =>
  stufe === 0 ? 0 : STUFEN[stufe - 1].max;

export function platzKosten(s: State, cfg: Config): number {
  const n = s.plaetze - untergrenze(s.stufe);
  const k = kennzahlen(s, cfg);
  const proPlatz = s.plaetze > 0 ? k.umsatz / s.plaetze : 0.1;
  return cfg.tAmort * Math.max(proPlatz, 0.05) * Math.pow(cfg.r, n);
}

export const qualiKosten = (s: State, cfg: Config): number =>
  cfg.qualiBasis * Math.max(s.plaetze, 4) * Math.pow(1.6, s.qualiLevel);

export const autoKosten = (s: State, cfg: Config): number =>
  cfg.qualiBasis * 2.2 * Math.max(s.plaetze, 4) * Math.pow(1.9, s.autoLevel);

export const reichweiteKosten = (s: State, cfg: Config): number =>
  cfg.ezAmort *
  Math.max(kennzahlen(s, cfg).umsatz, 0.4) *
  Math.pow(cfg.ezWachstum, s.ezLevel);

export const sprungKosten = (s: State, cfg: Config): number =>
  cfg.sprungMin * 60 * Math.max(kennzahlen(s, cfg).umsatz, 0.5);

export const prestigePunkte = (gesamtumsatz: number): number =>
  Math.floor(0.02 * Math.sqrt(gesamtumsatz));

export function optimalerPreis(s: State, cfg: Config): number {
  const grenze = kennzahlen(s, cfg).median * 3;
  let best = 0.1;
  let bestNetto = -Infinity;
  for (let p = 0.1; p <= grenze; p += 0.05) {
    const netto = kennzahlen(s, cfg, p).netto;
    if (netto > bestNetto) {
      bestNetto = netto;
      best = p;
    }
  }
  return best;
}

/** Ein Simulationsschritt. dt in Realsekunden. */
export function tick(s: State, cfg: Config, dt: number): State {
  const k = kennzahlen(s, cfg);

  const abweisungsquote = k.nachfrage > 0 ? k.abgewiesen / k.nachfrage : 0;
  const stoerungsRuf = k.stoerung ? k.stoerung.ruf : 1;
  const zielRuf = Math.max(
    0.15,
    Math.min(
      1.5,
      (0.55 + 0.55 * (s.qualiLevel * 0.12) - 0.8 * abweisungsquote) *
        stoerungsRuf,
    ),
  );
  const ruf = s.ruf + (zielRuf - s.ruf) * 0.05 * dt;

  let stoerung = s.stoerung;
  let seitStoerung = s.seitStoerung + dt;
  if (cfg.stoerungen && !stoerung && s.stufe >= 1 && seitStoerung > 45) {
    if (Math.random() < 0.012) {
      stoerung = STOERUNGEN[Math.floor(Math.random() * STOERUNGEN.length)].id;
      seitStoerung = 0;
    }
  }

  return {
    ...s,
    geld: Math.max(0, s.geld + k.netto * dt),
    gesamtumsatz: s.gesamtumsatz + Math.max(0, k.umsatz) * dt,
    laufzeit: s.laufzeit + dt,
    ruf,
    stoerung,
    seitStoerung,
  };
}
