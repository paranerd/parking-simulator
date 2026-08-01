# Parkhaus-Idler — Design und Übergabe

Stand: 1. August 2026 · Branch `feat/parking-simulator`

Dieses Dokument enthält alles, was zum Weiterarbeiten nötig ist: das
vollständige Ökonomiemodell, die durchgerechneten Balancing-Zahlen, die
Begründung hinter jeder Konstante, die bereits gefundenen und behobenen Fehler
sowie die offenen Punkte. Es ist so geschrieben, dass es ohne den ursprünglichen
Gesprächsverlauf verständlich ist.

---

## 1. Was das Spiel ist

Idle-Game. Der Spieler startet mit einem Stück Land, das er als Schotterplatz
zum Parken vermietet, und baut es über sechs Stufen zum vollautomatischen
Parkhaus aus. Geld wird passiv verdient, der Spieler steuert die Höhe über
Preis, Ausbau, Komfort, Automatisierung und Reichweite.

**Die Kernidee, aus der alles folgt:** Parken hat von Natur aus eine
mehrdimensionale Einnahmenformel, die die meisten Idle-Games künstlich erfinden
müssen.

```
Einnahmen = Plätze × Auslastung × Preis × Zahlquote
```

Vier Hebel, die in Spannung zueinander stehen. Preis hoch bedeutet Auslastung
runter. Das ist eine echte ökonomische Entscheidung statt eines
„+10 % Multiplikator"-Upgrades. Das ganze Spiel ist darauf gebaut.

**Zweite Leitidee:** Die Auslastung wird nirgends gesetzt. Sie *entsteht* aus
Preis und Nachfrage. Kapazität ist eine harte Obergrenze, kein Faktor.

---

## 2. Aktueller Stand

### Repo

- Remote: `https://github.com/paranerd/parking-simulator.git`
- Default-Branch: `main` (enthielt nur ein README)
- Arbeitsbranch: `feat/parking-simulator`, ein Commit, **noch nicht gepusht**

```bash
git push -u origin feat/parking-simulator
```

Der PR wurde noch nicht eröffnet — in der Umgebung, in der das Projekt gebaut
wurde, gab es keine GitHub-Credentials.

### Stack

Vite 6 · React 18 · TypeScript strict · SCSS (`@use`, kein `@import`)

`tsc --noEmit` und `npm run build` laufen sauber durch.

### Dateien

```
src/game/economy.ts      Ökonomie als reine Funktionen, kein React
src/game/config.ts       alle Konstanten und Upgrade-Leitern
src/game/types.ts        Typdefinitionen mit Kommentaren je Feld
src/game/useGameLoop.ts  10-Hz-Tick, cfg per Ref
src/game/format.ts       deutsche Zahlformatierung
src/components/          Leitsystem, Preis, Ausbau, Tuning, Störung, ui/
src/styles/              _tokens, _mixins, _base, _ui, _leitsystem, _spiel
tools/balance.py         Balancing-Rechner, unabhängig vom Spielcode
```

### Architekturregeln, die eingehalten werden sollten

1. **`economy.ts` bleibt rein.** Keine React-Imports, keine Seiteneffekte. Das
   erlaubt Headless-Simulation und Tests.
2. **Tick und Gewinnkurve rufen dieselbe `kennzahlen()`.** Sie können deshalb
   nicht auseinanderlaufen. Diese Regel nicht aufweichen — eine zweite
   Rechnung für die Anzeige ist der klassische Weg in unbemerkte Fehler.
3. **Konstanten nur in `config.ts`.** Keine Magic Numbers in Komponenten.
4. **SCSS: BEM mit `ps-`-Präfix, `@use` statt `@import`.**

---

## 3. Das Ökonomiemodell

### Zeitbasis

Zeitraffer `Z = 360`: eine Realsekunde ist sechs Spielminuten.

```
umsatz[€/Realsekunde] = belegt × preis[€/h] × 0.1
```

Der Faktor `0.1` (`cfg.sek`) ist `Z / 3600`. Wer den Zeitraffer ändert, muss
diesen Faktor mitziehen, sonst stimmen alle Amortisationszeiten nicht mehr.

### Nachfrage

Jeder Interessent hat eine Zahlungsbereitschaft. Logistisch verteilt ergibt das
eine saubere Akzeptanzkurve. Bei `preis === median` zahlt genau die Hälfte —
das macht die Kurve intuitiv lesbar und leicht zu balancen.

```
qual      = stufe.qual + qualiLevel × 0.12
median    = cfg.wtpBasis × stadt.wtp × (1 + qual)
akzeptanz = 1 / (1 + e^((preis − median) / σ))

latent    = cfg.latent × reichweite.faktor × stadt.nachfrage × ruf
nachfrage = latent × akzeptanz

belegt     = min(nachfrage, kapazität)
abgewiesen = max(0, nachfrage − kapazität)
leerstand  = max(0, kapazität − nachfrage)
```

`abgewiesen` ist die Zutat, die das Modell rund macht: **abgewiesene Kunden
senken den Ruf.** Damit ist Dauervollauslastung nicht optimal, sondern ein
schleichender Schaden.

### Einnahmen

```
umsatz = belegt × preis × 0.1 × (1 + 0.02 × prestigePunkte)
                × automatisierung.zahlquote
                × störung.ums
```

### Fixkosten

```
ebenen  = ceil(plätze / 48)
wartung = Σ(k=0..ebenen−1) min(48, plätze − 48k) × cfg.wartung × 1.15^k
personal = plätze / automatisierung.proMA

fix = (ebenen × cfg.pacht
       + wartung
       + personal × cfg.lohn
       + reichweite.laufend) × stufe.fix
```

Der Term `1.15^k` ist bewusst gesetzt: reines Höherbauen hört irgendwann auf zu
tragen, weil die Wartung pro Platz auf Ebene 6 schon bei 2,3× liegt. Genau das
macht die Dichte-Upgrades (Regalsystem, halbiert den Platzbedarf) attraktiv.

`stufe.fix` ist 0 für den Schotterplatz — eigener Grund, kein Personal.

### Ruf

```
abweisungsquote = abgewiesen / nachfrage
zielRuf = clamp(0.15, 1.5,
            (0.55 + 0.55 × qualiLevel × 0.12 − 0.8 × abweisungsquote)
            × störung.ruf)
ruf += (zielRuf − ruf) × 0.05 × dt
```

Träge Annäherung statt Sprung, damit kurze Spitzen nicht durchschlagen.

### Kostenformeln

```
referenzUmsatz  = umsatz beim gewinnoptimalen Preis (preisunabhängig)

platzKosten     = cfg.tAmort × max(referenzUmsatz/plätze, 0.05) × cfg.r^n
                  (n = Plätze innerhalb der aktuellen Stufe)
qualiKosten     = cfg.qualiBasis × max(plätze, 4) × 1.6^level
autoKosten      = cfg.qualiBasis × 2.2 × max(plätze, 4) × 1.9^level
reichweiteKosten= cfg.ezAmort × max(referenzUmsatz, 0.4) × cfg.ezWachstum^level
sprungKosten    = cfg.sprungMin × 60 × max(referenzUmsatz, 0.5)
prestigePunkte  = floor(0.02 × √gesamtumsatz)
```

Dass `platzKosten`, `reichweiteKosten` und `sprungKosten` aus dem Umsatz
abgeleitet werden statt aus festen Beträgen, ist Absicht: sie skalieren
automatisch mit Stadt, Qualität, Reichweite und Prestige mit. Sonst müsste jede
Stufe von Hand nachbalanciert werden.

Maßgeblich ist dabei der **Referenzumsatz beim gewinnoptimalen Preis**, nicht
der tatsächlich gefahrene Umsatz. Am aktuellen Umsatz gekoppelt zog der
Preisregler die Baukosten mit, und das nahm ihm die Wirkung:

- Auf Stufe 0 ist `fix = 0`, also `netto = umsatz`. Da auch die Kosten
  proportional zum Umsatz waren, kürzte sich der Preis vollständig heraus —
  die Zeit bis zum nächsten Platz lag bei jedem Preis bei exakt 10,2 s. Der
  Regler war für den Fortschritt reine Dekoration, ausgerechnet dort, wo
  Spieler ihn zum ersten Mal ausprobieren.
- Oberhalb des Optimums fiel der Umsatz und damit der Kaufpreis: zu teuer
  parken zu lassen ließ Stellplätze *billiger* aussehen.

Mit dem Referenzumsatz ist die Kostenseite preisunabhängig, der Preishebel
wirkt voll auf den Fortschritt (auf Stufe 0 jetzt 20,3 s → 10,2 s Richtung
Optimum), und jenseits des Optimums wird es wieder schlechter — der Zielkonflikt
bleibt also erhalten. Die Zielwerte unten sind ohnehin beim gewinnoptimalen
Preis gerechnet, deshalb ändern sich die Kostenbeträge dort um keinen Cent.

---

## 4. Die Balancing-Grundregel

Der häufigste Fehler ist, Preise direkt hinzuschreiben. Die Umkehrung ist
robuster: **Amortisationszeiten festlegen und die Kosten daraus ableiten.**

```
kosten = t_amort × Δertrag
```

Zeit ist über alle Stufen hinweg vergleichbar. Ein Stellplatz auf Stufe 1 und
eine Ebene auf Stufe 4 lassen sich so auf derselben Skala balancen — genau das
verhindert, dass Stufen sich gegenseitig entwerten.

**Zielkorridor:**

| Kauf | t_amort |
|---|---|
| Erste Käufe einer Stufe | 20–40 s |
| Mitte der Stufe | 1–3 min |
| Letzte Käufe der Stufe | 8–12 min |
| Stufensprung | 15–25 min |

Aus dem Korridor folgt der Wachstumsfaktor direkt. Bei 40 Käufen pro Stufe und
einem Anstieg von 20 s auf 600 s:

```
r = (600/20)^(1/40) = 1.089
```

Landet im bewährten Bereich 1.07–1.15, aber hergeleitet statt geraten. Der
aktuelle Defaultwert `r = 1.055` ist flacher, weil Stufen unterschiedlich viele
Käufe haben.

**Weitere Faustregeln:**

- Stufensprung ≈ 3–5× die Gesamtausbaukosten der Vorstufe
- Fixkosten sollen beim optimalen Preis 35–45 % des Umsatzes fressen
- Multiplikator-Upgrades müssen mit der Stellplatzzahl skalieren, sonst gibt es
  kein Fenster, in dem die Entscheidung interessant ist (ein Toilettenhaus für
  5.000 € ist bei 8 Plätzen unerreichbar und bei 240 Plätzen in Sekunden bezahlt)

---

## 5. Konstanten und ihre Begründung

Alle in `src/game/config.ts`, zur Laufzeit im Tuning-Panel justierbar.

| Konstante | Wert | Warum |
|---|---|---|
| `latent` | 30 | latente Nachfrage auf Stufe 0, in Plätzen |
| `wtpBasis` | 2.0 | Zahlungsbereitschaft bei Qualität 0, €/h |
| `streuung` | 0.8 | Fenster, in dem der Preis interessant ist (siehe unten) |
| `sek` | 0.1 | Z=360 / 3600 |
| `proEbene` | 48 | Plätze je Ebene |
| `r` | 1.055 | Kostenwachstum je Stellplatz |
| `tAmort` | 26 | Amortisation des ersten Platzes einer Stufe, s |
| `qualiBasis` | 110 | Basispreis Komfort, skaliert mit Plätzen |
| `sprungMin` | 12 | Stufensprung in Minuten Bruttoumsatz |
| `ezAmort` | 30 | Reichweiten-Upgrade in Sekunden Bruttoumsatz |
| `ezWachstum` | 1.45 | Kostenwachstum der Reichweitenleiter |
| `pacht` | 0.55 | €/s je Ebene |
| `wartung` | 0.055 | €/s je Platz auf Ebene 0 |
| `lohn` | 1.35 | €/s je Mitarbeiter |
| `etagenMalus` | 1.15 | Wartungsaufschlag je Etage |

**Zu `streuung` (σ):** Bei 0,2 wird die Gewinnkurve zur Klippe statt zum Hügel —
danebenliegen kostet alles. Bei 2,5 ist der Preis fast egal. Das interessante
Fenster liegt zwischen 0,6 und 0,9.

**Zu `pacht`:** Auf 0 gesetzt wird der Netto-Wert nie negativ, egal wie billig
geparkt wird. Ohne Fixkosten ist der Preis-Slider Dekoration.

### Leitern

**Stufen** (harte Kapazitätsobergrenze je Stufe):

| # | Name | max | qual | fix |
|---|---|---|---|---|
| 0 | Schotterplatz | 8 | −0.5 | 0 |
| 1 | Parkplatz | 48 | 0.10 | 1 |
| 2 | Parkdeck | 96 | 0.35 | 1 |
| 3 | Parkhaus | 288 | 0.60 | 1 |
| 4 | Tiefgarage | 384 | 0.85 | 1 |
| 5 | Regalsystem | 730 | 1.10 | 1 |

Die harte Obergrenze ist ein zentraler Baustein: der Spieler rennt gegen eine
Wand statt in Langeweile. Die letzten Plätze sind durch den Exponenten schon
unattraktiv, der Deckel macht den Stufensprung dann **zwingend statt optional**.
Ohne Deckel entsteht die klassische Falle, dass ewiges Grinden auf Stufe 1
irgendwann effizienter ist als der Sprung auf Stufe 2.

**Automatisierung** — Lohnersparnis gegen Zechpreller:

| Stufe | Plätze/MA | zahlend |
|---|---|---|
| Blechdose | ∞ | 55 % |
| Kassierer | 25 | 85 % |
| Kassenautomat | 40 | 90 % |
| Schranke mit Ticket | 70 | 97 % |
| Kennzeichenerkennung | 130 | 100 % |
| App mit Reservierung | 250 | 100 % |

Die Blechdose kostet keinen Lohn, dafür zahlt nur gut die Hälfte. Damit ist die
erste Automatisierung eine echte Rechnung statt eines No-Brainers.

**Reichweite** — die zweite Ausbauachse:

| Stufe | Faktor | laufend €/s |
|---|---|---|
| Mundpropaganda | 1.0 | 0 |
| Schild an der Ausfallstraße | 1.6 | 0.15 |
| Eintrag in Kartendiensten | 2.6 | 0.35 |
| Navi-Anbindung | 4.2 | 0.7 |
| Innenstadt-Kooperation | 6.8 | 1.3 |
| Bahnhofs-Zubringer | 11 | 2.4 |
| Park-and-Ride-Vertrag | 17.5 | 4.0 |
| Hotel- und Messeverträge | 28 | 6.5 |
| Stadtwerke-Partnerschaft | 45 | 11 |
| Regionales Parkleitsystem | 72 | 18 |

Zehn Stufen decken den ganzen Run ab, etwa 1,5–2 pro Ausbaustufe.

**Städte** (Prestige-Ziele):

| Stadt | Nachfrage | WTP |
|---|---|---|
| Kleinstadt | 1.0× | 1.0× |
| Mittelstadt | 2.5× | 1.3× |
| Großstadt | 6.0× | 1.7× |
| Metropole | 15.0× | 2.2× |

---

## 6. Durchgerechnete Zielwerte

Ermittelt mit `tools/balance.py`, jeweils beim gewinnoptimalen Preis.

| Situation | Preis | Netto/s | Ausl. | Fix% |
|---|---|---|---|---|
| Stufe 0, 3 Plätze, Blechdose, EZ0 | 2,50 | +0,41 | 100 % | 0 % |
| Stufe 0 voll, 8 Plätze, EZ0 | 1,65 | +0,71 | 98 % | 0 % |
| Stufe 1, 8 Plätze, Kassierer, EZ1 | 3,30 | +0,67 | 100 % | 70 % |
| Stufe 1 voll, 48 Plätze, EZ3 | 2,45 | +3,50 | 100 % | 65 % |
| Stufe 2 voll, 96 Plätze, EZ4 | 2,65 | +11,26 | 99 % | 50 % |
| Stufe 3 voll, 288 Plätze, EZ7 | 3,60 | +61,20 | 99 % | 39 % |
| Stufe 4 voll, 384 Plätze, EZ8 | 4,30 | +109,49 | 100 % | 34 % |
| Stufe 5 voll, 730 Plätze, EZ9 | 4,60 | +174,97 | 100 % | 48 % |

**Laufzeit erster Run:** rund 2,9 Stunden bis zum ersten Prestige, bei einem
Gesamtumsatz von etwa 684.000 € und daraus 16 Prestige-Punkten (+32 % Ertrag).
Run 2 sollte damit bei etwa 2,2 Stunden landen.

Für einen Browser-Idler ist das eine gute erste Runde: lang genug für Bindung,
kurz genug für einen Wochenendabend.

### Was der Spieler lernen soll

Ohne dass es gescriptet werden muss, ergibt sich aus dem Modell:

- **Immer 100 % voll** → Preis zu niedrig, Geld liegen gelassen *und* Ruf sinkt
  durch abgewiesene Kunden
- **Unter ~60 %** → Preis zu hoch oder Qualität zu schlecht
- **Sweet Spot ~85–90 %**, und der verschiebt sich mit jedem Upgrade

Bei gebundener Kapazität — dem Normalfall — lässt sich das Optimum in einem Satz
zusammenfassen: *So teuer, dass gerade noch alle Plätze voll werden.*

---

## 7. Bereits gefundene und behobene Fehler

Diese vier sind im Laufe der Entwicklung aufgetreten und behoben. **Nicht wieder
einbauen.**

**1. Stufe 0 mit vollen Fixkosten.**
Der Start war dauerhaft defizitär: 0,36 €/s Umsatz gegen 1,05 €/s Fixkosten.
Selbst beim optimalen Preis kam man bei drei Plätzen nur auf etwa 1,05 €/s —
exakt die Fixkosten. Behoben über `stufe.fix = 0` für den Schotterplatz.

**2. Blechdose kostete Lohn.**
`proMA: 12` bedeutete Gehalt für eine Blechdose. Behoben über `proMA: Infinity`
plus `zahlquote: 0.55` als eigentlichen Nachteil.

**3. Latente Nachfrage konstant statt wachsend.**
Der gravierendste Fehler. Ab Stufe 3 überstieg die Kapazität die *gesamte*
Nachfrage der Stadt: 288 Plätze gegen etwa 126 potenzielle Kunden, Auslastung
13 %, Fixkosten bei 455 % des Umsatzes. Die Balancing-Tabelle hatte
stillschweigend „latent = 2× Kapazität" auf jeder Stufe vorausgesetzt, der Code
hatte eine Konstante. Behoben über die Reichweiten-Upgradereihe.

**4. Reichweite ohne laufende Kosten.**
Machte Reichweite zur dominanten Achse. Behoben über `laufend` €/s je Stufe.

---

## 8. Offene Punkte

### 8.1 Reichweite ist stärker als Kapazität, nicht gleichwertig

Der wichtigste offene Balance-Punkt.

| | Netto/s |
|---|---|
| Stufe 3, 288 Plätze, Reichweite zu klein (EZ4) | **−1,8** |
| Stufe 1, 48 Plätze, Reichweite passend (EZ3) | +3,5 |
| Stufe 1, 48 Plätze, Reichweite zu groß (EZ7) | **+5,5** |

Zu wenig Reichweite ruiniert den Betrieb. Zu viel Reichweite ist trotzdem
besser als richtig dosiert, weil der Überschuss über den Preis abgeschöpft
werden kann. Ökonomisch korrekt, aber es macht Reichweite zur dominanten Achse
statt zur echten Alternative.

Die laufenden Kosten haben den Vorsprung von +8,5 auf +2,0 gedrückt. Der
eigentliche Bremsklotz ist derzeit der Anschaffungspreis: die Reichweitenleiter
kostet auf Stufe 1 rund 7.000 € gegenüber 2.200 € für den kompletten
Stellplatzausbau.

**Ehrliche Formulierung:** Reichweite ist die stärkere, aber deutlich teurere
Achse — nicht die gleichwertige.

**Möglicher Ausgleich:** ein Wettbewerber, der bei zu hohem Preis Kunden abzieht
und damit die Preisabschöpfung deckelt. Das wäre ein eigenes System; erst prüfen,
ob sich das Spiel ohne gut anfühlt.

### 8.2 Fixkostenanteil driftet über den Run

Von 70 % auf 34 % statt konstant 35–45 %. Ursache: Preis *und* Kapazität wachsen,
Personal pro Platz sinkt durch Automatisierung — dreifacher Rückenwind. Folge:
Der Preis-Slider verliert im Spätspiel seine Zähne, Fehlentscheidungen kosten
nichts mehr.

**Vorschlag:** Pacht an den Standortwert koppeln statt an die Fläche. Die Stadt
wächst mit dem Ruf, das Grundstück wird teurer. Hält den Anteil im Band und ist
thematisch sauber.

### 8.3 Stufe 1 ist zu hart

70 % Fixkosten bei 0,67 €/s Netto. Der erste Kassierer frisst fast ein Drittel.
Erfahrungsgemäß steigen Spieler genau da aus.

**Vorschlag:** Kassierer erst ab etwa 25 Plätzen erzwingen, oder den Lohn in
Stufe 1 halbieren (Aushilfe, Minijob).

### 8.4 Der Tiefgaragen-Sprung ist die Abbruchstelle

In der ursprünglichen Durchrechnung 137.000 € bei 54 €/s — fast eine Stunde
Sparen ohne sichtbaren Fortschritt, und das kurz vor dem Finale.

**Vorschlag:** in drei Teilzahlungen zerlegen — Baugrube (40k), Rohbau (50k),
Ausbau (47k), jede mit sichtbarem Baufortschritt. Gleiche Gesamtkosten, aber
alle rund 20 Minuten passiert etwas.

### 8.5 Prestige wird zu spät sichtbar

Bis zum ersten Prestige vergehen fast drei Stunden, und der Spieler weiß die
ganze Zeit nicht, dass es das System überhaupt gibt.

**Vorschlag:** ab Stufe 3 einen **Maklerbrief** einblenden — ein ungefragtes
Kaufangebot für das Grundstück, das abgelehnt werden kann. Zeigt das System, ohne
es zu erzwingen, und erklärt die Fantasie in einem Satz: *Du verkaufst nicht dein
Spiel, du verkaufst deine Immobilie.*

---

## 9. Prestige-Design

**Das Prinzip: Angebot zurücksetzen, Nachfrage upgraden.** Zurückgesetzt werden
die Bauten, gewachsen ist der Markt. Damit spielt man dieselbe Leiter, aber jede
Sprosse ist mehr wert — ohne neue Systeme.

**Faustregel: Beton wird zurückgesetzt, Wissen nicht.** Genehmigungen und
Automatisierungsstufen bleiben erhalten. Ein Bauantrag mit 15 Minuten
Echtzeit-Wartezeit ist beim ersten Mal eine nette Pause und beim vierten Mal
reine Schikane. Wer in der Metropole wieder mit einem Kassierer an der Blechdose
anfängt, erlebt Rückschritt statt Progression.

Aktuell umgesetzt: `autoLevel` bleibt, Bauten und Reichweite werden
zurückgesetzt, Startkapital = `12 + prestigePunkte × 40`.

**Der interessante Nebeneffekt:** In der Metropole startet man mit 8 Plätzen bei
15-facher Nachfrage und weist von der ersten Sekunde an massenhaft Kunden ab.
Damit dreht sich das Spielgefühl komplett, ohne neue Mechanik:

- **Run 1:** Nachfrage ist knapp, man kämpft um Auslastung, Qualität ist König
- **Run 4:** Kapazität ist knapp, man kämpft gegen Rufverlust, Preis ist König —
  hochziehen, um die Nachfrage künstlich zu drosseln, bis nachgebaut ist

Derselbe Slider mit umgekehrter Bedeutung. Das merken Spieler ohne Tutorial.

Die Wurzel in `floor(0.02 × √gesamtumsatz)` sorgt dafür, dass ein viermal
längerer Run nur den doppelten Ertrag bringt — jeder Neustart muss also deutlich
weiter kommen als der letzte.

---

## 10. Backlog

Aus dem Brainstorming, bewusst noch nicht umgesetzt.

**Mechanik:**

- **Verweildauer explizit** über Little's Law: `belegte Plätze = Ankunftsrate ×
  Verweildauer`. Im Prototyp ist `latent` direkt in Plätzen gerechnet, was eine
  Einheitenumrechnung spart. Nötig, sobald Kundentypen dazukommen.
- **Kundentypen als Portfolio-Entscheidung:** Kurzparker (hoher Umschlag, hoher
  €/h, unzuverlässig), Dauerparker (stabil, günstiger, blockieren tagsüber),
  Anwohner-Abos (garantiert, aber Platz dauerhaft belegt).
- **Durchsatz als versteckter Flaschenhals:** Ein Parkhaus mit 500 Plätzen und
  *einer* Schranke staut sich. Ein- und Ausfahrten, Schrankengeschwindigkeit und
  Kassenautomaten müssen mitwachsen, sonst sinkt die Auslastung trotz mehr
  Plätzen. Ein Bottleneck, den Spieler nicht kommen sehen und dessen Auflösung
  sich sehr befriedigend anfühlt.
- **Tageszeit-Kurve:** Pendlerspitzen morgens und abends.
- **Nebeneinnahmen** unabhängig von der Auslastung: Ladesäulen, Werbetafeln,
  Waschanlage, Automaten, PV auf dem Dach, Dachterrasse für Events, Filmdrehs.
- **Genehmigungen als Echtzeit-Gate** (Bauantrag, ~15 min). Mechanisch wertvoll,
  weil es einen natürlichen Rückkehrgrund erzeugt, der sich nicht wie Bestrafung
  anfühlt — im Gegensatz zu kaputten Schranken.
- **Deutscher Lokalkolorit** als Gate-Mechanik: Bauamt, Brandschutzauflagen,
  Stellplatzverordnung, TÜV-Abnahme.

**Störungen — Rahmung beachten:**

Das ist der Punkt, an dem solche Spiele meistens kippen. Wenn Wegbleiben
*bestraft* wird, fühlt es sich wie eine Steuer an, nicht wie ein Spiel. Zwei
bessere Rahmungen:

1. **Probleme als Einnahmequelle statt Strafe.** Falschparker blockiert einen
   Platz → Abschleppdienst-Upgrade macht daraus Umsatz. Ölfleck →
   Reinigungsvertrag. Das Problem wird zur Progression.
2. **Weicher Verfall statt harter Ausfall.** Eine Bewertung, die bei
   Vernachlässigung langsam sinkt und die Auslastung multiplikativ beeinflusst.
   Kein Totalausfall, aber spürbar. (Über den Ruf bereits umgesetzt.)

Harte Ausfälle sparsam und dramatisch einsetzen: Schrankenausfall bedeutet
Parkhaus zehn Minuten kostenlos. Das ist eine Geschichte, kein Ärgernis.

**Technik:**

- **Offline-Progress:** Bei dynamischer Auslastung und dynamischem Preis wird
  eine **Steady-State-Rate** gebraucht statt einer Tick-Simulation, sonst wird
  der Nachhol-Rechenaufwand nach langer Abwesenheit unangenehm. Ereignisse
  während der Offline-Zeit nicht simulieren, sondern beim Wiedereinstieg als
  „das ist passiert, während du weg warst"-Zusammenfassung generieren. Billiger
  und liest sich besser.
- **Persistenz:** `localStorage` ist im echten Vite-Projekt problemlos nutzbar.
- **Mobile via Capacitor.**
- **Tests** für `economy.ts` — die reinen Funktionen sind gut testbar, und die
  vier oben dokumentierten Fehler wären mit Regressionstests nicht
  wiedergekommen.

---

## 11. Balancing-Werkzeug

`tools/balance.py` rechnet das Modell unabhängig vom Spielcode nach und gibt die
Tabelle aus Abschnitt 6 aus.

```bash
python3 tools/balance.py
```

Die Doppelimplementierung ist Absicht: Wenn Python und TypeScript
auseinanderlaufen, ist einer von beiden falsch, und das fällt auf. Bei Änderungen
am Modell beide anpassen.
