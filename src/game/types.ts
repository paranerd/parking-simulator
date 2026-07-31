export interface Stufe {
  /** Anzeigename der Ausbaustufe */
  name: string;
  /** Harte Obergrenze an Stellplätzen — zwingt zum Stufensprung */
  max: number;
  /** Qualitätsbasis, verschiebt die Zahlungsbereitschaft */
  qual: number;
  /** Faktor auf die Fixkosten (Schotterplatz = 0, eigener Grund ohne Personal) */
  fix: number;
}

export interface Stadt {
  name: string;
  /** Multiplikator auf das Einzugsgebiet */
  nachfrage: number;
  /** Multiplikator auf die Zahlungsbereitschaft */
  wtp: number;
}

export interface Automatisierung {
  name: string;
  /** Stellplätze je Mitarbeiter (Infinity = kein Personal nötig) */
  proMA: number;
  /** Anteil der Kunden, der tatsächlich zahlt */
  zahlquote: number;
}

export interface Reichweite {
  name: string;
  /** Multiplikator auf die latente Nachfrage */
  faktor: number;
  /** Laufende Kosten für Werbung, Verträge und Provisionen, €/s */
  laufend: number;
}

export interface Stoerung {
  id: string;
  text: string;
  /** Multiplikatoren, solange die Störung aktiv ist */
  kap: number;
  ums: number;
  ruf: number;
}

export interface Config {
  /** Latente Nachfrage der Stufe 0 in Stellplätzen */
  latent: number;
  /** Zahlungsbereitschaft (Median) bei Qualität 0 */
  wtpBasis: number;
  /** Streuung der Zahlungsbereitschaft — kleiner = preissensibler */
  streuung: number;
  /** Umrechnung Spielstunde → Realsekunde bei Zeitraffer 360 */
  sek: number;
  /** Stellplätze je Ebene */
  proEbene: number;
  /** Kostenwachstum je gekauftem Stellplatz */
  r: number;
  /** Amortisationsziel des ersten Stellplatzes einer Stufe, in Sekunden */
  tAmort: number;
  /** Basispreis der Komfortstufen, skaliert mit Stellplatzzahl */
  qualiBasis: number;
  /** Stufensprung in Minuten Bruttoumsatz */
  sprungMin: number;
  /** Reichweiten-Upgrade in Sekunden Bruttoumsatz */
  ezAmort: number;
  /** Kostenwachstum der Reichweiten-Upgrades */
  ezWachstum: number;
  /** Pacht je Ebene, €/s */
  pacht: number;
  /** Wartung je Stellplatz auf Ebene 0, €/s */
  wartung: number;
  /** Lohn je Mitarbeiter, €/s */
  lohn: number;
  /** Wartungsaufschlag je Etage */
  etagenMalus: number;
  stoerungen: boolean;
}

export interface State {
  geld: number;
  stufe: number;
  plaetze: number;
  qualiLevel: number;
  autoLevel: number;
  ezLevel: number;
  preis: number;
  ruf: number;
  stadt: number;
  pp: number;
  gesamtumsatz: number;
  laufzeit: number;
  stoerung: string | null;
  seitStoerung: number;
}

export type Engpass = 'kapazitaet' | 'nachfrage';

export interface Kennzahlen {
  median: number;
  akzeptanz: number;
  nachfrage: number;
  belegt: number;
  abgewiesen: number;
  leerstand: number;
  kapazitaet: number;
  auslastung: number;
  engpass: Engpass;
  umsatz: number;
  fix: number;
  netto: number;
  ebenen: number;
  personal: number;
  stoerung: Stoerung | null;
}
