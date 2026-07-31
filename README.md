# parking-simulator

Idle-Game: vom Schotterplatz zum vollautomatischen Parkhaus.

```bash
npm install
npm run dev
```

## Stack

Vite · React 18 · TypeScript (strict) · SCSS

## Modell

Die Einnahmen entstehen aus vier Größen statt aus einem Multiplikator:

```
Einnahmen = Plätze × Auslastung × Preis × Zahlquote
```

Die Auslastung wird nicht gesetzt, sondern ergibt sich. Jeder Interessent hat
eine logistisch verteilte Zahlungsbereitschaft; bei `preis === median` akzeptiert
genau die Hälfte. Komfort-Upgrades verschieben den Median nach rechts.

```
akzeptanz = 1 / (1 + e^((preis − median) / σ))
nachfrage = latent × reichweite × stadt × ruf × akzeptanz
belegt    = min(nachfrage, kapazität)
```

Alles in `src/game/economy.ts`, als reine Funktionen. Der Tick und die
Gewinnkurve im Preis-Panel rufen dieselbe `kennzahlen()` auf und können deshalb
nicht auseinanderlaufen.

## Die zwei Achsen

| | Was es tut | Kosten |
|---|---|---|
| **Kapazität** | mehr Stellplätze, Ebenen, Stufen | billig, aber hart gedeckelt |
| **Reichweite** | mehr potenzielle Kunden | teuer, mit laufenden Kosten |

Kapazität ohne Reichweite bedeutet Leerstand bei vollen Fixkosten. Reichweite
ohne Kapazität bedeutet abgewiesene Kunden und sinkenden Ruf. Die
Engpass-Anzeige unter der Preiskurve zeigt jederzeit, welche Seite gerade
limitiert.

## Progression

Sechs Stufen mit harter Kapazitätsobergrenze — Schotterplatz, Parkplatz,
Parkdeck, Parkhaus, Tiefgarage, vollautomatisches Regalsystem. Der Deckel macht
den Stufensprung zwingend statt optional.

Beim Prestige wird das Grundstück verkauft und in einer größeren Stadt neu
angefangen: Beton wird zurückgesetzt, Wissen nicht. Die Automatisierungsstufe
bleibt erhalten.

## Balancing

Alle Konstanten stehen in `src/game/config.ts` und lassen sich im
Tuning-Panel der laufenden App justieren, ohne neu zu bauen.

```bash
python3 tools/balance.py
```

Rechnet das Modell unabhängig vom Spielcode nach und gibt die Zielwerte
für alle Stufen aus.

## Weiterlesen

[DESIGN.md](DESIGN.md) enthält das vollständige Ökonomiemodell mit
Herleitung, die Begründung hinter jeder Konstante, die bereits behobenen
Balance-Fehler, die offenen Punkte und den Backlog.
