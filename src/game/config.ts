import type {
  Automatisierung,
  Config,
  Reichweite,
  Stadt,
  State,
  Stoerung,
  Stufe,
} from './types';

export const STUFEN: Stufe[] = [
  { name: 'Schotterplatz', max: 8, qual: -0.5, fix: 0 },
  { name: 'Parkplatz', max: 48, qual: 0.1, fix: 1 },
  { name: 'Parkdeck', max: 96, qual: 0.35, fix: 1 },
  { name: 'Parkhaus', max: 288, qual: 0.6, fix: 1 },
  { name: 'Tiefgarage', max: 384, qual: 0.85, fix: 1 },
  { name: 'Regalsystem', max: 730, qual: 1.1, fix: 1 },
];

export const STAEDTE: Stadt[] = [
  { name: 'Kleinstadt', nachfrage: 1.0, wtp: 1.0 },
  { name: 'Mittelstadt', nachfrage: 2.5, wtp: 1.3 },
  { name: 'Großstadt', nachfrage: 6.0, wtp: 1.7 },
  { name: 'Metropole', nachfrage: 15.0, wtp: 2.2 },
];

export const AUTOMATISIERUNG: Automatisierung[] = [
  { name: 'Blechdose', proMA: Infinity, zahlquote: 0.55 },
  { name: 'Kassierer', proMA: 25, zahlquote: 0.85 },
  { name: 'Kassenautomat', proMA: 40, zahlquote: 0.9 },
  { name: 'Schranke mit Ticket', proMA: 70, zahlquote: 0.97 },
  { name: 'Kennzeichenerkennung', proMA: 130, zahlquote: 1.0 },
  { name: 'App mit Reservierung', proMA: 250, zahlquote: 1.0 },
];

/**
 * Zweite Progressionsachse: das Einzugsgebiet.
 * Kapazität ohne Reichweite bringt Leerstand, Reichweite ohne Kapazität
 * bringt abgewiesene Kunden und Rufverlust.
 */
export const REICHWEITE: Reichweite[] = [
  { name: 'Mundpropaganda', faktor: 1.0, laufend: 0 },
  { name: 'Schild an der Ausfallstraße', faktor: 1.6, laufend: 0.15 },
  { name: 'Eintrag in Kartendiensten', faktor: 2.6, laufend: 0.35 },
  { name: 'Navi-Anbindung', faktor: 4.2, laufend: 0.7 },
  { name: 'Innenstadt-Kooperation', faktor: 6.8, laufend: 1.3 },
  { name: 'Bahnhofs-Zubringer', faktor: 11, laufend: 2.4 },
  { name: 'Park-and-Ride-Vertrag', faktor: 17.5, laufend: 4.0 },
  { name: 'Hotel- und Messeverträge', faktor: 28, laufend: 6.5 },
  { name: 'Stadtwerke-Partnerschaft', faktor: 45, laufend: 11 },
  { name: 'Regionales Parkleitsystem', faktor: 72, laufend: 18 },
];

export const STOERUNGEN: Stoerung[] = [
  { id: 'schranke', text: 'Schranke klemmt', kap: 0.65, ums: 1, ruf: 0.9 },
  { id: 'automat', text: 'Kassenautomat defekt', kap: 1, ums: 0.75, ruf: 0.95 },
  { id: 'oel', text: 'Ölfleck auf Ebene 1', kap: 0.95, ums: 1, ruf: 0.8 },
  { id: 'licht', text: 'Beleuchtung ausgefallen', kap: 1, ums: 1, ruf: 0.7 },
];

export const CONFIG: Config = {
  latent: 30,
  wtpBasis: 2.0,
  streuung: 0.8,
  sek: 0.1,
  proEbene: 48,
  r: 1.055,
  tAmort: 26,
  qualiBasis: 110,
  sprungMin: 12,
  ezAmort: 30,
  ezWachstum: 1.45,
  pacht: 0.55,
  wartung: 0.055,
  lohn: 1.35,
  etagenMalus: 1.15,
  stoerungen: true,
};

export const START: State = {
  geld: 12,
  stufe: 0,
  plaetze: 3,
  qualiLevel: 0,
  autoLevel: 0,
  ezLevel: 0,
  preis: 1.2,
  ruf: 0.75,
  stadt: 0,
  pp: 0,
  gesamtumsatz: 0,
  laufzeit: 0,
  stoerung: null,
  seitStoerung: 0,
};
